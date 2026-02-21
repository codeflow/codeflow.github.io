#!/usr/bin/env python3
"""
HTTP Simple Local Server to test Codeflow
Usage: python3 server.py
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import unquote

PORT = 9002

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Decode the URL
        self.path = unquote(self.path)
        return super().do_GET()
    
    def log_message(self, format, *args):
        # Clean log message
        print(f"[{self.address_string()}] {format % args}")

def main():
    # Change to the script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = CustomHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 60)
        print("🚀 Codeflow server started!")
        print("=" * 60)
        print(f"📡 Codeflow server running on: http://localhost:{PORT}")
        print(f"🌐 Opening browser on: {url}")
        print("=" * 60)
        print("💡 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Try to open the browser automatically
        try:
            webbrowser.open(url)
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped by user")
            httpd.shutdown()

if __name__ == "__main__":
    main()

