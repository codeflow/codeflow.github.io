#!/usr/bin/env python3
"""
Servidor HTTP local simples para testar o Codeflow
Uso: python3 server.py
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import unquote

PORT = 8001

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Adiciona headers CORS para permitir requisições
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Decodifica a URL
        self.path = unquote(self.path)
        return super().do_GET()
    
    def log_message(self, format, *args):
        # Log customizado mais limpo
        print(f"[{self.address_string()}] {format % args}")

def main():
    # Muda para o diretório do script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = CustomHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 60)
        print("🚀 Servidor Codeflow iniciado!")
        print("=" * 60)
        print(f"📡 Servidor rodando em: http://localhost:{PORT}")
        print(f"🌐 Abrindo navegador em: {url}")
        print("=" * 60)
        print("💡 Pressione Ctrl+C para parar o servidor")
        print("=" * 60)
        
        # Tenta abrir o navegador automaticamente
        try:
            webbrowser.open(url)
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Servidor parado pelo usuário")
            httpd.shutdown()

if __name__ == "__main__":
    main()

