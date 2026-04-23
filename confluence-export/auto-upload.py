#!/usr/bin/env python3
"""
Script de Importación Automática a Confluence
Sube todas las páginas HTML a Confluence automáticamente
"""

import os
import json
import requests
from pathlib import Path
from base64 import b64encode

# CONFIGURACIÓN - Completa estos datos
CONFLUENCE_URL = "https://tuempresa.atlassian.net"  # Tu URL de Confluence
CONFLUENCE_EMAIL = "tu-email@empresa.com"  # Tu email
CONFLUENCE_API_TOKEN = "tu-api-token-aqui"  # Tu API token
CONFLUENCE_SPACE_KEY = "MAP"  # Clave del espacio (ej: MAP, WIKI, etc.)

class ConfluenceUploader:
    def __init__(self, url, email, api_token, space_key):
        self.url = url.rstrip('/')
        self.space_key = space_key
        self.auth = b64encode(f"{email}:{api_token}".encode()).decode()
        self.headers = {
            'Authorization': f'Basic {self.auth}',
            'Content-Type': 'application/json'
        }
        self.page_ids = {}
    
    def create_page(self, title, content, parent_id=None):
        """Crea una página en Confluence"""
        endpoint = f"{self.url}/wiki/rest/api/content"
        
        data = {
            "type": "page",
            "title": title,
            "space": {"key": self.space_key},
            "body": {
                "storage": {
                    "value": content,
                    "representation": "storage"
                }
            }
        }
        
        if parent_id:
            data["ancestors"] = [{"id": parent_id}]
        
        response = requests.post(endpoint, headers=self.headers, json=data)
        
        if response.status_code == 200:
            page_data = response.json()
            print(f"✅ Página creada: {title} (ID: {page_data['id']})")
            return page_data['id']
        else:
            print(f"❌ Error creando página {title}: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return None
    
    def get_page_by_title(self, title):
        """Busca una página por título"""
        endpoint = f"{self.url}/wiki/rest/api/content"
        params = {
            "spaceKey": self.space_key,
            "title": title,
            "expand": "version"
        }
        
        response = requests.get(endpoint, headers=self.headers, params=params)
        
        if response.status_code == 200:
            results = response.json().get('results', [])
            if results:
                return results[0]
        return None
    
    def update_page(self, page_id, title, content, version):
        """Actualiza una página existente"""
        endpoint = f"{self.url}/wiki/rest/api/content/{page_id}"
        
        data = {
            "version": {"number": version + 1},
            "title": title,
            "type": "page",
            "body": {
                "storage": {
                    "value": content,
                    "representation": "storage"
                }
            }
        }
        
        response = requests.put(endpoint, headers=self.headers, json=data)
        
        if response.status_code == 200:
            print(f"✅ Página actualizada: {title}")
            return True
        else:
            print(f"❌ Error actualizando página {title}: {response.status_code}")
            return False
    
    def create_or_update_page(self, title, content, parent_id=None):
        """Crea o actualiza una página"""
        existing_page = self.get_page_by_title(title)
        
        if existing_page:
            version = existing_page['version']['number']
            page_id = existing_page['id']
            self.update_page(page_id, title, content, version)
            return page_id
        else:
            return self.create_page(title, content, parent_id)

def clean_html_for_confluence(html_content):
    """Limpia y adapta HTML para Confluence"""
    import re
    
    # Extraer contenido principal
    match = re.search(r'<main class="main-content">(.*?)</main>', html_content, re.DOTALL)
    if match:
        content = match.group(1)
    else:
        content = html_content
    
    # Remover breadcrumbs
    content = re.sub(r'<div class="breadcrumb">.*?</div>', '', content, flags=re.DOTALL)
    
    # Remover clases y estilos
    content = re.sub(r' class="[^"]*"', '', content)
    content = re.sub(r' style="[^"]*"', '', content)
    
    # Convertir alertas a macros de Confluence
    content = re.sub(
        r'<div[^>]*alert[^>]*alert-info[^>]*>(.*?)</div>',
        r'<ac:structured-macro ac:name="info"><ac:rich-text-body>\1</ac:rich-text-body></ac:structured-macro>',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<div[^>]*alert[^>]*alert-warning[^>]*>(.*?)</div>',
        r'<ac:structured-macro ac:name="warning"><ac:rich-text-body>\1</ac:rich-text-body></ac:structured-macro>',
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'<div[^>]*alert[^>]*alert-success[^>]*>(.*?)</div>',
        r'<ac:structured-macro ac:name="note"><ac:rich-text-body>\1</ac:rich-text-body></ac:structured-macro>',
        content,
        flags=re.DOTALL
    )
    
    return content

def extract_title(html_content):
    """Extrae el título de la página"""
    import re
    match = re.search(r'<title>(.*?)</title>', html_content)
    if match:
        title = match.group(1)
        # Remover sufijos comunes
        title = title.replace(' - MAP Assessment', '')
        title = title.replace(' - Guía Completa', '')
        return title.strip()
    return "Sin título"

def main():
    """Función principal"""
    print("=" * 60)
    print("IMPORTADOR AUTOMÁTICO A CONFLUENCE")
    print("Wiki MAP Assessment - SoftwareONE & AWS")
    print("=" * 60)
    print()
    
    # Verificar configuración
    if "tuempresa" in CONFLUENCE_URL or "tu-email" in CONFLUENCE_EMAIL:
        print("❌ ERROR: Debes configurar tus credenciales primero")
        print()
        print("Edita el archivo auto-upload.py y completa:")
        print("  - CONFLUENCE_URL")
        print("  - CONFLUENCE_EMAIL")
        print("  - CONFLUENCE_API_TOKEN")
        print("  - CONFLUENCE_SPACE_KEY")
        print()
        print("Ver GUIA_EXPORTAR_A_CONFLUENCE.md para más detalles")
        return
    
    uploader = ConfluenceUploader(
        CONFLUENCE_URL,
        CONFLUENCE_EMAIL,
        CONFLUENCE_API_TOKEN,
        CONFLUENCE_SPACE_KEY
    )
    
    # Estructura de páginas
    pages_structure = [
        ("index.html", "Inicio", None),
        ("pages/introduccion-programa.html", "Introducción al Programa MAP", "Inicio"),
        ("pages/map-assessment.html", "MAP Assessment", "Inicio"),
        ("pages/herramientas-colecta.html", "Herramientas de Colecta", "Inicio"),
        ("pages/cloudamize.html", "Cloudamize", "Herramientas de Colecta"),
        ("pages/concierto.html", "Concierto", "Herramientas de Colecta"),
        ("pages/matilda.html", "Matilda", "Herramientas de Colecta"),
        ("pages/cuestionario-infraestructura.html", "Cuestionario de Infraestructura", "Inicio"),
        ("pages/diagrama-infraestructura.html", "Diagrama de Infraestructura", "Inicio"),
        ("pages/immersion-days.html", "Immersion Days", "Inicio"),
        ("pages/checklist-entregables.html", "Checklist de Entregables Finales", "Inicio"),
        ("pages/recursos.html", "Recursos y Descargables", "Inicio"),
        ("pages/faq.html", "Preguntas Frecuentes (FAQ)", "Inicio"),
        ("pages/glosario.html", "Glosario de Términos", "Inicio"),
        ("pages/contacto.html", "Contacto y Soporte", "Inicio"),
    ]
    
    print("Iniciando importación...")
    print()
    
    for file_path, title, parent_title in pages_structure:
        if not os.path.exists(file_path):
            print(f"⚠️  Archivo no encontrado: {file_path}")
            continue
        
        print(f"Procesando: {title}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        content = clean_html_for_confluence(html_content)
        
        parent_id = None
        if parent_title and parent_title in uploader.page_ids:
            parent_id = uploader.page_ids[parent_title]
        
        page_id = uploader.create_or_update_page(title, content, parent_id)
        if page_id:
            uploader.page_ids[title] = page_id
        
        print()
    
    print("=" * 60)
    print("✅ IMPORTACIÓN COMPLETADA")
    print("=" * 60)
    print()
    print(f"Páginas creadas: {len(uploader.page_ids)}")
    print(f"Espacio: {CONFLUENCE_SPACE_KEY}")
    print(f"URL: {CONFLUENCE_URL}/wiki/spaces/{CONFLUENCE_SPACE_KEY}")
    print()

if __name__ == '__main__':
    main()
