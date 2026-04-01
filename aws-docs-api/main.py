"""
AWS Documentation API — Microservicio FastAPI + MCP
Puerto: 8001
PROTOCOLO: Solo docs.aws.amazon.com — estructura Well-Architected
"""

import asyncio
import json
import re
import os
import warnings
from typing import Optional, List

# Suprimir warnings de SSL en entornos Windows corporativos
warnings.filterwarnings("ignore", message="Unverified HTTPS request")
try:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except ImportError:
    pass

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AWS Docs API vía MCP",
    description="Consulta documentación oficial de AWS. Fuente exclusiva: docs.aws.amazon.com",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ERROR_MSG = "Error de sincronización con la fuente oficial. Por favor, verifica el nombre del servicio."

# ── MCP Client ────────────────────────────────────────────────────────────────

async def call_mcp_tool(tool_name: str, arguments: dict, timeout: float = 35.0, server: str = "awslabs") -> dict:
    """
    Lanza el MCP server via uvx (awslabs) o npx (smithery aws-docs).
    server: "awslabs" | "smithery"
    """
    full_env = {
        **os.environ,
        "AWS_DOCUMENTATION_PARTITION": "aws",
        "FASTMCP_LOG_LEVEL": "ERROR",
    }

    if server == "smithery":
        cmd = ["npx", "-y", "@smithery/aws-docs-mcp-server"]
    else:
        cmd = ["uvx", "awslabs.aws-documentation-mcp-server@latest"]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=full_env,
    )
    init_msg  = {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"swo-aws-docs","version":"2.0.0"}}}
    notif_msg = {"jsonrpc":"2.0","id":1,"method":"notifications/initialized","params":{}}
    tool_msg  = {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":tool_name,"arguments":arguments}}
    payload   = "\n".join([json.dumps(init_msg), json.dumps(notif_msg), json.dumps(tool_msg)]) + "\n"

    try:
        stdout, _ = await asyncio.wait_for(proc.communicate(input=payload.encode()), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        raise HTTPException(status_code=504, detail="MCP server timeout")

    for line in stdout.decode(errors="replace").split("\n"):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            msg = json.loads(line)
            if msg.get("id") == 2:
                if "error" in msg:
                    raise HTTPException(status_code=500, detail=f"MCP: {msg['error'].get('message','Unknown')}")
                return msg.get("result", {})
        except json.JSONDecodeError:
            continue
    raise HTTPException(status_code=500, detail="Sin respuesta válida del MCP server")


def extract_text(result: dict) -> str:
    content = result.get("content", [])
    if isinstance(content, list):
        return "\n".join(c.get("text", "") for c in content if isinstance(c, dict))
    return str(content)


def extract_urls_from_docs(text: str) -> List[str]:
    """Extrae solo URLs de docs.aws.amazon.com del texto."""
    return re.findall(r'https://docs\.aws\.amazon\.com[^\s\)\]"]+', text)


def parse_structured_doc(text: str, service_name: str) -> dict:
    """
    Parsea el Markdown de AWS Docs y extrae la estructura del protocolo:
    - Resumen Técnico
    - Características y Capacidades Clave
    - Consideraciones Well-Architected (Seguridad + Costos)
    - Límites y Cuotas
    """
    lines = text.split("\n")

    title = service_name
    docs_url = ""
    summary = ""
    features: List[str] = []
    security_notes: List[str] = []
    cost_notes: List[str] = []
    quotas: List[str] = []
    advantages: List[str] = []
    disadvantages = [
        "Requiere conocimiento previo de la plataforma AWS para configuración óptima.",
        "Los costos pueden incrementarse con el uso intensivo sin una política de optimización.",
        "La dependencia del proveedor (vendor lock-in) puede ser un factor a considerar.",
    ]
    use_cases: List[str] = []

    current_section = ""
    paragraphs: List[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Título principal
        if stripped.startswith("# ") and title == service_name:
            title = stripped[2:].strip()
            continue

        # URL de docs
        urls = extract_urls_from_docs(stripped)
        if urls and not docs_url:
            docs_url = urls[0]

        # Detectar sección activa
        lower = stripped.lower()
        if stripped.startswith("##"):
            heading = stripped.lstrip("#").strip().lower()
            if any(k in heading for k in ["overview", "what is", "introduction", "resumen", "descripción"]):
                current_section = "summary"
            elif any(k in heading for k in ["feature", "capabilit", "característica", "función"]):
                current_section = "features"
            elif any(k in heading for k in ["security", "seguridad", "iam", "encryption", "cifrado"]):
                current_section = "security"
            elif any(k in heading for k in ["pricing", "cost", "precio", "costo", "billing"]):
                current_section = "cost"
            elif any(k in heading for k in ["quota", "limit", "cuota", "límite", "service quota"]):
                current_section = "quotas"
            elif any(k in heading for k in ["use case", "caso de uso", "when to use", "benefit"]):
                current_section = "usecases"
            else:
                current_section = "other"
            use_cases.append(stripped.lstrip("#").strip()) if current_section == "usecases" else None
            continue

        # Bullets
        is_bullet = stripped.startswith(("- ", "* ", "• ", "+ "))
        bullet_text = stripped[2:].strip() if is_bullet else stripped

        if current_section == "summary" and not is_bullet and len(stripped) > 60:
            if not summary:
                summary = stripped[:600]
        elif current_section == "features" and is_bullet and len(bullet_text) > 15:
            features.append(bullet_text)
        elif current_section == "security" and len(bullet_text) > 15:
            security_notes.append(bullet_text)
        elif current_section == "cost" and len(bullet_text) > 10:
            cost_notes.append(bullet_text)
        elif current_section == "quotas" and len(bullet_text) > 5:
            quotas.append(bullet_text)
        elif current_section == "usecases" and is_bullet:
            use_cases.append(bullet_text)

        # Primer párrafo largo como resumen si no encontramos sección
        if not summary and not stripped.startswith("#") and len(stripped) > 100:
            summary = stripped[:600]

        # Bullets genéricos como ventajas
        if is_bullet and len(bullet_text) > 20 and current_section not in ("security","cost","quotas"):
            advantages.append(bullet_text)

    # Fallbacks
    if not summary:
        summary = f"{title} es un servicio de Amazon Web Services que proporciona capacidades escalables y administradas en la nube."
    if not features:
        features = advantages[:6] if advantages else [
            "Alta disponibilidad y escalabilidad automática.",
            "Integración nativa con otros servicios de AWS.",
            "Modelo de pago por uso sin costos iniciales.",
            "Seguridad gestionada por AWS con certificaciones globales.",
        ]
    if not security_notes:
        security_notes = ["Consulte la documentación oficial para detalles de IAM y cifrado."]
    if not cost_notes:
        cost_notes = ["Modelo de pago por uso. Consulte la calculadora de precios de AWS."]
    if not quotas:
        quotas = ["Consulte Service Quotas en la consola de AWS para límites actualizados."]
    if not use_cases:
        use_cases = ["Proyectos de migración a la nube", "Arquitecturas serverless", "Aplicaciones empresariales escalables"]

    return {
        "title": title,
        "docsUrl": docs_url,
        "summary": summary,
        "features": features[:8],
        "security": security_notes[:4],
        "cost": cost_notes[:4],
        "quotas": quotas[:6],
        "useCases": use_cases[:5],
        # Campos compatibles con AWSServiceEntry del frontend
        "description": summary,
        "advantages": features[:6],
        "disadvantages": disadvantages,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "aws-docs-api", "version": "2.0.0", "port": 8001}


@app.get("/buscar")
async def buscar(
    query: str = Query(..., description="Nombre del servicio AWS a buscar"),
    limit: int = Query(5),
):
    """Busca en docs.aws.amazon.com usando MCP server."""
    result = await call_mcp_tool("search_documentation", {"query": f"site:docs.aws.amazon.com {query} User Guide", "limit": limit})
    text = extract_text(result)
    urls = extract_urls_from_docs(text)
    sections = []
    current = {"title": "", "content": "", "url": ""}
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith(("# ", "## ")):
            if current["content"]:
                sections.append(dict(current))
            current = {"title": line.lstrip("#").strip(), "content": "", "url": ""}
        elif line.startswith("https://docs.aws.amazon.com"):
            current["url"] = line
        elif line:
            current["content"] += line + " "
    if current["content"]:
        sections.append(current)
    return {"query": query, "urls": urls[:5], "sections": sections[:limit], "raw": text}


@app.get("/leer")
async def leer(url: str = Query(..., description="URL de docs.aws.amazon.com")):
    """Lee una página de docs.aws.amazon.com en Markdown."""
    if "docs.aws.amazon.com" not in url:
        raise HTTPException(status_code=400, detail="Solo se aceptan URLs de docs.aws.amazon.com")
    result = await call_mcp_tool("read_documentation", {"url": url})
    text = extract_text(result)
    sections = []
    current = {"heading": "", "content": ""}
    for line in text.split("\n"):
        if line.startswith("#"):
            if current["content"].strip():
                sections.append(dict(current))
            current = {"heading": line.lstrip("#").strip(), "content": ""}
        else:
            current["content"] += line + "\n"
    if current["content"].strip():
        sections.append(current)
    return {"url": url, "sections": sections, "word_count": len(text.split()), "raw": text}


@app.get("/seccion")
async def seccion(
    url: str = Query(...),
    section: str = Query(...),
):
    """Extrae una sección específica de una página de AWS Docs."""
    if "docs.aws.amazon.com" not in url:
        raise HTTPException(status_code=400, detail="Solo se aceptan URLs de docs.aws.amazon.com")
    result = await call_mcp_tool("read_documentation", {"url": url})
    text = extract_text(result)
    lines = text.split("\n")
    found, content = False, []
    for line in lines:
        if line.startswith("#") and section.lower() in line.lower():
            found = True; content = [line]; continue
        if found:
            if line.startswith("#") and content:
                break
            content.append(line)
    if not found:
        available = [l.lstrip("#").strip() for l in lines if l.startswith("#")][:10]
        raise HTTPException(status_code=404, detail=f"Sección '{section}' no encontrada. Disponibles: {available}")
    return {"url": url, "section": section, "content": "\n".join(content)}


@app.get("/servicio")
async def servicio_completo(
    nombre: str = Query(..., description="Nombre del servicio AWS (ej: Amazon S3, AWS Lambda, Amazon RDS)"),
):
    """
    PROTOCOLO OFICIAL:
    - Fuente exclusiva: docs.aws.amazon.com
    - Estructura: Resumen, Características, Well-Architected (Seguridad+Costos), Límites
    - Prioriza documentación 2025-2026
    """
    # 1. Buscar en docs.aws.amazon.com — intentar awslabs primero, luego smithery
    try:
        search_result = await call_mcp_tool("search_documentation", {
            "query": f"{nombre} User Guide",
            "limit": 5,
        }, server="awslabs")
        search_text = extract_text(search_result)
    except Exception:
        try:
            search_result = await call_mcp_tool("search_documentation", {
                "query": f"{nombre} User Guide",
                "limit": 5,
            }, server="smithery")
            search_text = extract_text(search_result)
        except Exception:
            return {"error": ERROR_MSG, "title": nombre}

    if not search_text or len(search_text) < 50:
        return {"error": ERROR_MSG, "title": nombre}

    # 2. Extraer URL de docs.aws.amazon.com (preferir UserGuide, Welcome o what-is)
    doc_url = None
    priority_patterns = ["UserGuide/Welcome", "UserGuide/what-is", "userguide/what-is", "latest/userguide"]
    all_urls = extract_urls_from_docs(search_text)

    for pattern in priority_patterns:
        for url in all_urls:
            if pattern.lower() in url.lower():
                doc_url = url
                break
        if doc_url:
            break

    if not doc_url and all_urls:
        doc_url = all_urls[0]

    # 3. Leer página completa si encontramos URL
    page_text = search_text
    if doc_url:
        try:
            read_result = await call_mcp_tool("read_documentation", {"url": doc_url})
            page_text = extract_text(read_result)
            if len(page_text) < 100:
                page_text = search_text
        except Exception:
            page_text = search_text

    # 4. Parsear con el protocolo estructurado
    parsed = parse_structured_doc(page_text, nombre)
    if doc_url:
        parsed["docsUrl"] = doc_url

    # 5. Validar que tenemos datos reales
    if not parsed.get("summary") or parsed["summary"].startswith(nombre + " es un servicio"):
        if len(page_text) < 200:
            return {"error": ERROR_MSG, "title": nombre}

    return parsed


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

# ── /extraer — extrae cualquier URL, sin restricción de dominio ───────────────

import hashlib
import time

# Cache en memoria (TTL 1 hora)
_url_cache: dict = {}
CACHE_TTL = 3600  # segundos


def _cache_key(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()


def _extract_key_terms(text: str, max_terms: int = 15) -> list:
    """
    Extrae términos clave del texto para alimentar el diccionario.
    Busca: definiciones, acrónimos, términos técnicos en negrita/código.
    """
    terms = []
    seen = set()

    for line in text.split("\n"):
        line = line.strip()
        # Términos en negrita **Término**
        bold = re.findall(r'\*\*([^*]{3,40})\*\*', line)
        for t in bold:
            if t.lower() not in seen and len(t) > 3:
                terms.append({"term": t, "context": line[:200]})
                seen.add(t.lower())
        # Acrónimos (2-6 letras mayúsculas)
        acronyms = re.findall(r'\b([A-Z]{2,6})\b', line)
        for a in acronyms:
            if a.lower() not in seen and a not in ("AWS", "URL", "API", "HTTP", "HTTPS"):
                terms.append({"term": a, "context": line[:200]})
                seen.add(a.lower())
        # Definiciones "X is a ..." o "X es un ..."
        defn = re.match(r'^([A-Z][a-zA-Z\s]{3,30})\s+(?:is|are|es|son)\s+(.{20,200})', line)
        if defn and defn.group(1).lower() not in seen:
            terms.append({"term": defn.group(1).strip(), "context": defn.group(2).strip()[:200]})
            seen.add(defn.group(1).lower())
        if len(terms) >= max_terms:
            break

    return terms[:max_terms]


def _extract_structured(text: str, url: str) -> dict:
    """Extrae estructura completa de cualquier página."""
    lines = text.split("\n")
    title = ""
    description = ""
    sections = []
    key_points = []
    current_section = {"heading": "", "content": ""}

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("# ") and not title:
            title = stripped[2:].strip()
            continue
        if stripped.startswith("##"):
            if current_section["content"].strip():
                sections.append(dict(current_section))
            current_section = {"heading": stripped.lstrip("#").strip(), "content": ""}
            continue
        if not description and len(stripped) > 80 and not stripped.startswith("#"):
            description = stripped[:600]
        if stripped.startswith(("- ", "* ", "• ")) and len(stripped) > 20:
            key_points.append(stripped[2:].strip())
        current_section["content"] += stripped + " "

    if current_section["content"].strip():
        sections.append(current_section)

    key_terms = _extract_key_terms(text)

    return {
        "title": title or url,
        "description": description or "Contenido extraído de la URL.",
        "sections": sections[:20],
        "keyPoints": key_points[:10],
        "keyTerms": key_terms,
        "wordCount": len(text.split()),
        "rawText": text[:5000],  # primeros 5000 chars para edición
        "docsUrl": url,
        "extractedAt": int(time.time()),
    }


@app.get("/extraer")
async def extraer_url(
    url: str = Query(..., description="Cualquier URL a extraer"),
    force: bool = Query(False, description="Forzar re-extracción ignorando cache"),
):
    """
    Extrae contenido de cualquier URL.
    - Soporta docs.aws.amazon.com (via MCP) y cualquier otro sitio (via scraping)
    - Cache en memoria por 1 hora
    - Retorna estructura + términos clave para el diccionario
    """
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="La URL debe comenzar con http:// o https://")

    cache_key = _cache_key(url)

    # Verificar cache
    if not force and cache_key in _url_cache:
        cached = _url_cache[cache_key]
        if time.time() - cached["extractedAt"] < CACHE_TTL:
            return {**cached, "fromCache": True}

    # Extraer según el dominio
    text = ""
    is_aws = "docs.aws.amazon.com" in url or "aws.amazon.com" in url

    if is_aws:
        # Usar MCP para AWS docs — awslabs primero, smithery como fallback
        for srv in ["awslabs", "smithery"]:
            try:
                result = await call_mcp_tool("read_documentation", {"url": url}, timeout=35.0, server=srv)
                text = extract_text(result)
                if text and len(text) > 100:
                    break
            except Exception:
                continue
        if not text:
            text = await _scrape_url_fallback(url)
    else:
        text = await _scrape_url_fallback(url)

    if not text or len(text) < 50:
        raise HTTPException(
            status_code=404,
            detail="Error de sincronización con la fuente oficial. Por favor, verifica el nombre del servicio."
        )

    structured = _extract_structured(text, url)

    # Guardar en cache
    _url_cache[cache_key] = structured

    return {**structured, "fromCache": False}


@app.get("/cache")
async def list_cache():
    """Lista las URLs en cache."""
    now = int(time.time())
    return {
        "cached": [
            {
                "url": v["docsUrl"],
                "title": v["title"],
                "extractedAt": v["extractedAt"],
                "ageMinutes": round((now - v["extractedAt"]) / 60, 1),
                "expired": (now - v["extractedAt"]) > CACHE_TTL,
            }
            for v in _url_cache.values()
        ],
        "total": len(_url_cache),
    }


@app.delete("/cache")
async def clear_cache(url: str = Query(None, description="URL específica a limpiar, o vacío para limpiar todo")):
    """Limpia el cache."""
    if url:
        key = _cache_key(url)
        removed = _url_cache.pop(key, None)
        return {"cleared": bool(removed), "url": url}
    _url_cache.clear()
    return {"cleared": True, "message": "Cache completo limpiado"}


async def _scrape_url_fallback(url: str) -> str:
    """Scraping directo para URLs no-AWS usando httpx, sin verificación SSL."""
    text, _ = await _scrape_with_images(url)
    return text


async def _scrape_with_images(url: str) -> tuple[str, list]:
    """Scraping de URL retornando (texto, lista_de_image_data_urls)."""
    import httpx
    import base64
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, verify=False) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            html = resp.text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"No se pudo acceder a la URL: {str(e)}")

    images = []
    text = ""

    try:
        from bs4 import BeautifulSoup
        import urllib.parse

        soup = BeautifulSoup(html, "html.parser")

        # Extraer imágenes antes de limpiar el HTML
        base_url = f"{urllib.parse.urlparse(url).scheme}://{urllib.parse.urlparse(url).netloc}"
        for img in soup.find_all("img", src=True)[:10]:
            src = img.get("src", "")
            if not src or src.startswith("data:"):
                continue
            # Construir URL absoluta
            if src.startswith("//"):
                src = "https:" + src
            elif src.startswith("/"):
                src = base_url + src
            elif not src.startswith("http"):
                src = base_url + "/" + src
            # Solo imágenes relevantes (no iconos pequeños)
            width = img.get("width", "")
            height = img.get("height", "")
            try:
                if width and int(str(width).replace("px","")) < 50:
                    continue
            except Exception:
                pass
            if any(skip in src.lower() for skip in ["icon", "logo", "favicon", "pixel", "tracking", "1x1"]):
                continue
            images.append(src)

        # Limpiar HTML y extraer texto
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)

    except ImportError:
        text = re.sub(r'<[^>]+>', ' ', html)
        text = re.sub(r'\s+', ' ', text).strip()

    return text[:10000], images[:8]


async def _web_search(query: str) -> tuple[str, list]:
    """
    Búsqueda web usando DuckDuckGo (no requiere API key, no bloquea scraping).
    Retorna (texto_combinado, lista_de_urls).
    """
    import httpx
    import urllib.parse

    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query + ' site:aws.amazon.com OR site:docs.aws.amazon.com')}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, verify=False) as client:
            resp = await client.get(search_url, headers=headers)
            html = resp.text
    except Exception as e:
        return f"Error de búsqueda: {str(e)}", []

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")

        results = []
        urls = []

        # Extraer resultados de DuckDuckGo HTML
        for result in soup.select(".result")[:5]:
            title_el = result.select_one(".result__title")
            snippet_el = result.select_one(".result__snippet")
            link_el = result.select_one(".result__url")

            title = title_el.get_text(strip=True) if title_el else ""
            snippet = snippet_el.get_text(strip=True) if snippet_el else ""
            link = link_el.get_text(strip=True) if link_el else ""

            if title or snippet:
                results.append(f"## {title}\n{snippet}\n{link}")
                if link and link.startswith("http"):
                    urls.append(link)

        combined = "\n\n".join(results)
        return combined or "Sin resultados encontrados.", urls

    except ImportError:
        text = re.sub(r'<[^>]+>', ' ', html)
        return re.sub(r'\s+', ' ', text).strip()[:3000], []


# ── /consulta — consulta en lenguaje natural usando MCP servers ───────────────

@app.get("/consulta")
async def consulta_libre(
    q: str = Query(..., description="Consulta en lenguaje natural sobre AWS"),
    fuente: str = Query("aws", description="Fuente: 'aws' para docs oficiales, 'web' para búsqueda general"),
):
    """
    Consulta en lenguaje natural — trae TODO el contenido disponible.
    - fuente=aws: busca en docs.aws.amazon.com via MCP, lee páginas completas
    - fuente=web: DuckDuckGo + scraping de las páginas encontradas, incluye imágenes
    """
    result_text = ""
    sources = []
    images = []      # URLs de imágenes encontradas (solo fuente=web)
    all_sections = []
    error_msg = None

    if fuente == "aws":
        # 1. Buscar con MCP
        for srv in ["awslabs", "smithery"]:
            try:
                res = await call_mcp_tool("search_documentation", {"query": q, "limit": 8}, server=srv)
                result_text = extract_text(res)
                if result_text and len(result_text) > 100:
                    break
            except Exception:
                continue

        # 2. Leer TODAS las páginas encontradas (hasta 3)
        if result_text:
            all_urls = extract_urls_from_docs(result_text)
            sources = all_urls[:5]
            full_texts = [result_text]

            for url in all_urls[:3]:
                try:
                    read_res = await call_mcp_tool("read_documentation", {"url": url}, server="awslabs")
                    page = extract_text(read_res)
                    if page and len(page) > 200:
                        full_texts.append(page)
                except Exception:
                    continue

            result_text = "\n\n---\n\n".join(full_texts)

    else:
        # Búsqueda web via DuckDuckGo
        try:
            result_text, sources = await _web_search(q)
        except Exception as e:
            error_msg = str(e)
            result_text = ""

        # Scraping de las primeras páginas encontradas para más contenido e imágenes
        if sources:
            extra_texts = []
            for url in sources[:2]:
                try:
                    page_text, page_images = await _scrape_with_images(url)
                    if page_text:
                        extra_texts.append(f"## Fuente: {url}\n{page_text}")
                    images.extend(page_images)
                except Exception:
                    continue
            if extra_texts:
                result_text = result_text + "\n\n" + "\n\n".join(extra_texts)

    if not result_text and not error_msg:
        return {
            "query": q, "error": ERROR_MSG,
            "content": "", "summary": "", "keyPoints": [],
            "codeExamples": [], "sources": [], "images": [],
            "sections": [], "allContent": "",
        }

    # Extraer estructura completa
    summary = ""
    code_examples = []
    key_points = []
    in_code = False
    current_code = []
    code_lang = ""

    lines = result_text.split("\n")
    current_section = {"heading": "Contenido", "content": ""}

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                if current_code:
                    code_examples.append({"language": code_lang or "text", "code": "\n".join(current_code)})
                current_code = []; code_lang = ""; in_code = False
            else:
                in_code = True; code_lang = stripped[3:].strip() or "text"
            continue

        if in_code:
            current_code.append(line)
            continue

        if stripped.startswith("##"):
            if current_section["content"].strip():
                all_sections.append(dict(current_section))
            current_section = {"heading": stripped.lstrip("#").strip(), "content": ""}
            continue

        if not summary and len(stripped) > 80 and not stripped.startswith("#"):
            summary = stripped[:600]

        if stripped.startswith(("- ", "* ", "• ")) and len(stripped) > 20:
            key_points.append(stripped[2:].strip())

        current_section["content"] += stripped + " "

    if current_section["content"].strip():
        all_sections.append(current_section)

    # JSON inline
    json_matches = re.findall(r'\{[^{}]{20,800}\}', result_text)
    for jm in json_matches[:3]:
        try:
            import json as _json
            _json.loads(jm)
            if not any(ex["code"] == jm for ex in code_examples):
                code_examples.append({"language": "json", "code": jm})
        except Exception:
            pass

    # Deduplicar imágenes
    images = list(dict.fromkeys(images))[:8]

    return {
        "query": q,
        "fuente": fuente,
        "summary": summary or result_text[:400],
        "keyPoints": key_points[:12],
        "codeExamples": code_examples[:5],
        "sources": sources,
        "images": images,
        "sections": all_sections[:20],
        "allContent": result_text[:8000],  # contenido completo para el diccionario
        "error": error_msg,
    }
