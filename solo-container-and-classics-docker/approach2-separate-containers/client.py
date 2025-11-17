#!/usr/bin/env python3
"""
Simple HTTP client that periodically polls the server
"""
import urllib.request
import json
import time
import os
import sys
from datetime import datetime

# Server location - can be configured via environment variable
SERVER_HOST = os.environ.get("SERVER_HOST", "localhost")
SERVER_PORT = os.environ.get("SERVER_PORT", "8080")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "5"))

def fetch_server_info():
    """Fetch information from the server"""
    url = f"http://{SERVER_HOST}:{SERVER_PORT}/"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
            return data, None
    except Exception as e:
        return None, str(e)

if __name__ == "__main__":
    print(f"Client starting...")
    print(f"Server: {SERVER_HOST}:{SERVER_PORT}")
    print(f"Poll interval: {POLL_INTERVAL}s")
    print(f"Hostname: {os.uname().nodename}")
    print("-" * 60)

    while True:
        timestamp = datetime.now().isoformat()
        data, error = fetch_server_info()

        if error:
            print(f"[{timestamp}] ERROR: {error}")
        else:
            print(f"[{timestamp}] SUCCESS: Server responded")
            print(f"  Server hostname: {data.get('hostname')}")
            print(f"  Server message: {data.get('message')}")
            print(f"  Server timestamp: {data.get('timestamp')}")

        time.sleep(POLL_INTERVAL)
