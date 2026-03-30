# AWS Docs API — Microservicio FastAPI + MCP

Puente entre el backend Node.js y `awslabs.aws-documentation-mcp-server`.

## Requisitos
- Python 3.9+
- uvx instalado (`pip install uv` o desde https://docs.astral.sh/uv/)

## Instalación
```bash
cd aws-docs-api
pip install -r requirements.txt
```

## Iniciar
```bash
uvicorn main:app --reload --port 8001
```

## Endpoints
- `GET /health` — Estado del servicio
- `GET /buscar?query=Amazon+S3` — Buscar en docs AWS
- `GET /leer?url=https://docs.aws.amazon.com/...` — Leer página completa
- `GET /seccion?url=...&section=Features` — Leer sección específica
- `GET /servicio?nombre=Amazon+S3` — Datos completos para Memoria Técnica

## Docs interactivas
http://localhost:8001/docs
