"""
AWS Documentation API — Microservicio FastAPI + MCP
Puerto: 8001
PROTOCOLO: Solo docs.aws.amazon.com — estructura Well-Architected
"""

import asyncio
import json
import re
import os
from typing import Optional, List

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

async def call_mcp_tool(tool_name: str, arguments: dict, timeout: float = 35.0) -> dict:
    full_env = {
        **os.environ,
        "AWS_DOCUMENTATION_PARTITION": "aws",
        "FASTMCP_LOG_LEVEL": "ERROR",
    }
    proc = await asyncio.create_subprocess_exec(
        "uvx", "awslabs.aws-documentation-mcp-server@latest",
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
    # 1. Buscar en docs.aws.amazon.com
    try:
        search_result = await call_mcp_tool("search_documentation", {
            "query": f"{nombre} User Guide",
            "limit": 5,
        })
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
