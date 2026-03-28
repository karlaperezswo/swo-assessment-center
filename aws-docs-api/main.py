"""
AWS Documentation API — Microservicio FastAPI + MCP
Puerto: 8001
Puente entre el backend Node.js y awslabs.aws-documentation-mcp-server
"""

import asyncio
import json
import subprocess
import sys
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AWS Docs API vía MCP",
    description="Microservicio que consulta la documentación oficial de AWS usando el MCP server de AWS Labs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:3005", "http://localhost:3006", "http://127.0.0.1:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── MCP Client helper ─────────────────────────────────────────────────────────

async def call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """
    Lanza el MCP server via uvx y llama a una herramienta usando JSON-RPC 2.0.
    """
    env = {
        "AWS_DOCUMENTATION_PARTITION": "aws",
        "FASTMCP_LOG_LEVEL": "ERROR",
    }
    import os
    full_env = {**os.environ, **env}

    proc = await asyncio.create_subprocess_exec(
        "uvx", "awslabs.aws-documentation-mcp-server@latest",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=full_env,
    )

    # Secuencia JSON-RPC: initialize → tools/call
    init_msg = {
        "jsonrpc": "2.0", "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "swo-aws-docs-api", "version": "1.0.0"},
        },
    }
    tool_msg = {
        "jsonrpc": "2.0", "id": 2,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }

    # Enviar mensajes con separador de línea
    payload = (
        json.dumps(init_msg) + "\n" +
        json.dumps({"jsonrpc": "2.0", "id": 1, "method": "notifications/initialized", "params": {}}) + "\n" +
        json.dumps(tool_msg) + "\n"
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(input=payload.encode()),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        proc.kill()
        raise HTTPException(status_code=504, detail="MCP server timeout (30s)")

    # Parsear respuestas JSON-RPC
    lines = stdout.decode(errors="replace").strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            msg = json.loads(line)
            if msg.get("id") == 2:
                if "error" in msg:
                    raise HTTPException(status_code=500, detail=f"MCP error: {msg['error'].get('message', 'Unknown')}")
                return msg.get("result", {})
        except json.JSONDecodeError:
            continue

    raise HTTPException(status_code=500, detail="No se recibió respuesta válida del MCP server")


def extract_text(result: dict) -> str:
    """Extrae texto plano del resultado MCP."""
    content = result.get("content", [])
    if isinstance(content, list):
        return "\n".join(c.get("text", "") for c in content if isinstance(c, dict))
    return str(content)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "aws-docs-api", "port": 8001}


@app.get("/buscar")
async def buscar(
    query: str = Query(..., description="Nombre del servicio o término a buscar en la documentación de AWS"),
    limit: int = Query(5, description="Número máximo de resultados"),
):
    """
    Busca en la documentación oficial de AWS usando el MCP server.
    Retorna resultados estructurados con título, descripción, URL y contenido.
    """
    result = await call_mcp_tool("search_documentation", {
        "query": query,
        "limit": limit,
    })

    text = extract_text(result)

    # Estructurar la respuesta
    sections = []
    current = {"title": "", "content": "", "url": ""}

    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("# ") or line.startswith("## "):
            if current["content"]:
                sections.append(dict(current))
            current = {"title": line.lstrip("#").strip(), "content": "", "url": ""}
        elif line.startswith("http"):
            current["url"] = line
        elif line:
            current["content"] += line + " "

    if current["content"]:
        sections.append(current)

    return {
        "query": query,
        "raw": text,
        "sections": sections[:limit],
        "total": len(sections),
    }


@app.get("/leer")
async def leer(
    url: str = Query(..., description="URL oficial de AWS Docs a leer en Markdown"),
):
    """
    Lee una página completa de la documentación de AWS en formato Markdown.
    """
    result = await call_mcp_tool("read_documentation", {"url": url})
    text = extract_text(result)

    # Extraer secciones del Markdown
    sections = []
    lines = text.split("\n")
    current_section = {"heading": "", "content": ""}

    for line in lines:
        if line.startswith("#"):
            if current_section["content"].strip():
                sections.append(dict(current_section))
            current_section = {"heading": line.lstrip("#").strip(), "content": ""}
        else:
            current_section["content"] += line + "\n"

    if current_section["content"].strip():
        sections.append(current_section)

    return {
        "url": url,
        "raw": text,
        "sections": sections,
        "word_count": len(text.split()),
    }


@app.get("/seccion")
async def seccion(
    url: str = Query(..., description="URL oficial de AWS Docs"),
    section: str = Query(..., description="Nombre de la sección a extraer"),
):
    """
    Obtiene una sección específica de una página de documentación de AWS.
    """
    result = await call_mcp_tool("read_documentation", {"url": url})
    text = extract_text(result)

    # Buscar la sección solicitada
    lines = text.split("\n")
    found = False
    section_content = []
    section_lower = section.lower()

    for line in lines:
        if line.startswith("#") and section_lower in line.lower():
            found = True
            section_content = [line]
            continue
        if found:
            if line.startswith("#") and line not in section_content:
                break  # Nueva sección — parar
            section_content.append(line)

    if not found:
        raise HTTPException(
            status_code=404,
            detail=f"Sección '{section}' no encontrada en {url}. Secciones disponibles: {[l.lstrip('#').strip() for l in lines if l.startswith('#')][:10]}"
        )

    return {
        "url": url,
        "section": section,
        "content": "\n".join(section_content),
        "lines": len(section_content),
    }


@app.get("/servicio")
async def servicio_completo(
    nombre: str = Query(..., description="Nombre del servicio AWS (ej: Amazon S3, AWS Lambda)"),
):
    """
    Endpoint combinado: busca el servicio, lee su página principal y
    retorna datos estructurados listos para la Memoria Técnica.
    """
    # 1. Buscar
    search_result = await call_mcp_tool("search_documentation", {
        "query": nombre,
        "limit": 3,
    })
    search_text = extract_text(search_result)

    # Extraer URL del primer resultado
    doc_url = None
    for line in search_text.split("\n"):
        if "docs.aws.amazon.com" in line or "aws.amazon.com" in line:
            import re
            urls = re.findall(r'https?://[^\s\)]+', line)
            if urls:
                doc_url = urls[0]
                break

    # 2. Leer página si encontramos URL
    page_text = ""
    if doc_url:
        try:
            read_result = await call_mcp_tool("read_documentation", {"url": doc_url})
            page_text = extract_text(read_result)
        except Exception:
            page_text = search_text

    combined = page_text or search_text

    # 3. Estructurar para Memoria Técnica
    title = nombre
    description = ""
    advantages = []
    use_cases = []

    lines = combined.split("\n")
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        # Título
        if line.startswith("# ") and title == nombre:
            title = line[2:].strip()
        # Descripción: primer párrafo largo
        if not description and len(line) > 80 and not line.startswith("#"):
            description = line[:500]
        # Ventajas: items de lista
        if line.startswith(("- ", "* ", "• ")) and len(line) > 20:
            advantages.append(line[2:].strip())
        # Casos de uso: subtítulos
        if line.startswith("## ") and len(advantages) < 3:
            use_cases.append(line[3:].strip())

    return {
        "title": title,
        "description": description or f"{nombre} es un servicio de Amazon Web Services.",
        "advantages": advantages[:6] if advantages else [
            "Alta disponibilidad y escalabilidad automática.",
            "Integración nativa con otros servicios de AWS.",
            "Modelo de pago por uso sin costos iniciales.",
            "Seguridad gestionada por AWS con certificaciones globales.",
        ],
        "disadvantages": [
            "Requiere conocimiento previo de la plataforma AWS para configuración óptima.",
            "Los costos pueden incrementarse con el uso intensivo sin una política de optimización.",
            "La dependencia del proveedor (vendor lock-in) puede ser un factor a considerar.",
        ],
        "useCases": use_cases[:5] if use_cases else ["Proyectos de migración a la nube", "Arquitecturas serverless"],
        "docsUrl": doc_url or f"https://aws.amazon.com/{nombre.lower().replace(' ', '-').replace('amazon ', '').replace('aws ', '')}/",
        "rawContent": combined[:2000],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
