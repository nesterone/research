#!/usr/bin/env python3
"""
Simple HTTP server that responds with system information
"""
import http.server
import socketserver
import json
import os
import time
from datetime import datetime

PORT = 8080

class InfoHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        response = {
            "timestamp": datetime.now().isoformat(),
            "hostname": os.uname().nodename,
            "pid": os.getpid(),
            "message": "Hello from the server!",
            "uptime": time.time()
        }

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response, indent=2).encode())

    def log_message(self, format, *args):
        # Custom logging
        print(f"[{datetime.now().isoformat()}] {format % args}")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), InfoHandler) as httpd:
        print(f"Server starting on port {PORT}")
        print(f"Hostname: {os.uname().nodename}")
        httpd.serve_forever()
