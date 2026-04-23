#!/usr/bin/env python3
"""
Conversor de HTML a Confluence Storage Format
Convierte las páginas HTML de la wiki MAP Assessment a formato Confluence
"""

import os
import re
from pathlib import Path
from html.parser import HTMLParser

class HTMLToConfluenceConverter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.confluence_content = []
        self.current_tag = None
        self.list_stack = []
        self.table_data = []
        self.in_table = False
        self.in_table_header = False
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        if tag == 'h2':
            self.current_tag = 'h2'
        elif tag == 'h3':
            self.current_tag = 'h3'
        elif tag == 'h4':
            self.current_tag = 'h4'
        elif tag == 'p':
            self.current_tag = 'p'
        elif tag == 'ul':
            self.list_stack.append('ul')
        elif tag == 'ol':
            self.list_stack.append('ol')
        elif tag == 'li':
            self.current_tag = 'li'
        elif tag == 'strong' or tag == 'b':
            self.confluence_content.append('<strong>')
        elif tag == 'em' or tag == 'i':
            self.confluence_content.append('<em>')
        elif tag == 'a':
            href = attrs_dict.get('href', '#')
            self.confluence_content.append(f'<ac:link><ri:page ri:content-title="{href}" /><ac:plain-text-link-body><![CDATA[')
        elif tag == 'table':
            self.in_table = True
            self.confluence_content.append('<table><tbody>')
        elif tag == 'thead':
            self.in_table_header = True
        elif tag == 'tr':
            self.confluence_content.append('<tr>')
        elif tag == 'th':
            self.confluence_content.append('<th>')
        elif tag == 'td':
            self.confluence_content.append('<td>')
        elif tag == 'div':
            if 'alert' in attrs_dict.get('class', ''):
                alert_type = 'info'
                if 'alert-warning' in attrs_dict.get('class', ''):
                    alert_type = 'warning'
                elif 'alert-success' in attrs_dict.get('class', ''):
                    alert_type = 'note'
                self.confluence_content.append(f'<ac:structured-macro ac:name="{alert_type}"><ac:rich-text-body>')
    
    def handle_endtag(self, tag):
        if tag == 'h2':
            self.confluence_content.append('</h2>')
            self.current_tag = None
        elif tag == 'h3':
            self.confluence_content.append('</h3>')
            self.current_tag = None
        elif tag == 'h4':
            self.confluence_content.append('</h4>')
            self.current_tag = None
        elif tag == 'p':
            self.confluence_content.append('</p>')
            self.current_tag = None
        elif tag == 'ul' or tag == 'ol':
            if self.list_stack:
                self.list_stack.pop()
        elif tag == 'li':
            self.current_tag = None
        elif tag == 'strong' or tag == 'b':
            self.confluence_content.append('</strong>')
        elif tag == 'em' or tag == 'i':
            self.confluence_content.append('</em>')
        elif tag == 'a':
            self.confluence_content.append(']]></ac:plain-text-link-body></ac:link>')
        elif tag == 'table':
            self.confluence_content.append('</tbody></table>')
            self.in_table = False
        elif tag == 'th':
            self.confluence_content.append('</th>')
        elif tag == 'td':
            self.confluence_content.append('</td>')
        elif tag == 'tr':
            self.confluence_content.append('</tr>')
        elif tag == 'div':
            if '</ac:rich-text-body>' not in ''.join(self.confluence_content[-5:]):
                self.confluence_content.append('</ac:rich-text-body></ac:structured-macro>')
    
    def handle_data(self, data):
        data = data.strip()
        if not data:
            return
            
        if self.current_tag == 'h2':
            self.confluence_content.append(f'<h2>{data}')
        elif self.current_tag == 'h3':
            self.confluence_content.append(f'<h3>{data}')
        elif self.current_tag == 'h4':
            self.confluence_content.append(f'<h4>{data}')
        elif self.current_tag == 'p':
            self.confluence_content.append(f'<p>{data}')
        elif self.current_tag == 'li':
            if self.list_stack and self.list_stack[-1] == 'ul':
                self.confluence_content.append(f'<ul><li>{data}</li></ul>')
            elif self.list_stack and self.list_stack[-1] == 'ol':
                self.confluence_content.append(f'<ol><li>{data}</li></ol>')
        else:
            self.confluence_content.append(data)
    
    def get_confluence_content(self):
        return ''.join(self.confluence_content)

def extract_main_content(html_content):
    """Extrae solo el contenido principal del HTML"""
    # Buscar el contenido dentro de <main class="main-content">
    match = re.search(r'<main class="main-content">(.*?)</main>', html_content, re.DOTALL)
    if match:
        content = match.group(1)
        # Remover breadcrumbs
        content = re.sub(r'<div class="breadcrumb">.*?</div>', '', content, flags=re.DOTALL)
        return content
    return html_content

def extract_title(html_content):
    """Extrae el título de la página"""
    match = re.search(r'<title>(.*?)</title>', html_content)
    if match:
        return match.group(1)
    match = re.search(r'<h2>(.*?)</h2>', html_content)
    if match:
        return match.group(1)
    return "Sin título"

def convert_html_to_confluence(html_file_path):
    """Convierte un archivo HTML a formato Confluence"""
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    title = extract_title(html_content)
    main_content = extract_main_content(html_content)
    
    # Simplificar el HTML para Confluence
    # Remover clases y estilos
    main_content = re.sub(r' class="[^"]*"', '', main_content)
    main_content = re.sub(r' style="[^"]*"', '', main_content)
    main_content = re.sub(r' id="[^"]*"', '', main_content)
    
    # Convertir alertas a macros de Confluence
    main_content = re.sub(
        r'<div class="alert alert-info">(.*?)</div>',
        r'<ac:structured-macro ac:name="info"><ac:rich-text-body>\1</ac:rich-text-body></ac:structured-macro>',
        main_content,
        flags=re.DOTALL
    )
    main_content = re.sub(
        r'<div class="alert alert-warning">(.*?)</div>',
        r'<ac:structured-macro ac:name="warning"><ac:rich-text-body>\1</ac:rich-text-body></ac:structured-macro>',
        main_content,
        flags=re.DOTALL
    )
    main_content = re.sub(
        r'<div class="alert alert-success">(.*?)</div>',
        r'<ac:structured-macro ac:name="note"><ac:rich-text-body>\1</ac:rich-text-body></ac:structured-macro>',
        main_content,
        flags=re.DOTALL
    )
    
    # Convertir checkboxes
    main_content = re.sub(
        r'<input type="checkbox"[^>]*>',
        '<ac:task><ac:task-status>incomplete</ac:task-status><ac:task-body>',
        main_content
    )
    main_content = re.sub(r'</label>', '</ac:task-body></ac:task>', main_content)
    
    return title, main_content

def main():
    """Función principal"""
    # Crear directorio de salida
    output_dir = Path('confluence-export/pages')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Procesar index.html
    print("Convirtiendo index.html...")
    title, content = convert_html_to_confluence('index.html')
    with open(output_dir / 'index.confluence', 'w', encoding='utf-8') as f:
        f.write(f"TÍTULO: {title}\n\n")
        f.write(content)
    
    # Procesar páginas en la carpeta pages/
    pages_dir = Path('pages')
    if pages_dir.exists():
        for html_file in pages_dir.glob('*.html'):
            print(f"Convirtiendo {html_file.name}...")
            title, content = convert_html_to_confluence(html_file)
            output_file = output_dir / f"{html_file.stem}.confluence"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"TÍTULO: {title}\n\n")
                f.write(content)
    
    print(f"\n✅ Conversión completada!")
    print(f"📁 Archivos guardados en: {output_dir}")
    print("\nPróximos pasos:")
    print("1. Revisa los archivos .confluence generados")
    print("2. Copia el contenido de cada archivo")
    print("3. Pégalo en el editor de Confluence (modo HTML)")

if __name__ == '__main__':
    main()
