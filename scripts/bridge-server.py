#!/usr/bin/env python3
"""
CentTrade MT5 Remote Bridge Microservice
-----------------------------------------
Lightweight standalone HTTP server for MetaTrader 5 on Windows.
Allows cloud-hosted web apps (e.g. Vercel, AWS, Render) to query local MT5 terminals
via secure REST API using Broker Investor (Read-Only) credentials.

Usage:
  python scripts/bridge-server.py --port 8080 --key YOUR_SECRET_KEY
"""

import sys
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timedelta

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

PORT = 8080
API_KEY = ""

class MT5BridgeHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(200, {"status": "ok"})

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._send_json(200, {
                "status": "online",
                "service": "CentTrade MT5 Remote Bridge",
                "version": "1.0.0",
                "mt5_available": MT5_AVAILABLE,
                "platform": sys.platform
            })
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        if self.path != "/sync":
            self._send_json(404, {"error": "Endpoint not found. Use /sync"})
            return

        # Check API Key if configured
        if API_KEY:
            req_key = self.headers.get("x-api-key") or self.headers.get("Authorization", "").replace("Bearer ", "")
            if req_key != API_KEY:
                self._send_json(401, {"success": False, "error": "Unauthorized: Invalid API Key"})
                return

        # Read JSON body
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            self._send_json(400, {"success": False, "error": "Empty body"})
            return

        try:
            body = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except Exception as e:
            self._send_json(400, {"success": False, "error": f"Invalid JSON: {str(e)}"})
            return

        login_val = body.get("login")
        password_val = body.get("password")
        server_val = body.get("server")
        days = int(body.get("days", 30))

        if not login_val or not password_val or not server_val:
            self._send_json(400, {
                "success": False,
                "error": "Missing required fields: login, password, server"
            })
            return

        if not MT5_AVAILABLE:
            self._send_json(500, {
                "success": False,
                "error": "MetaTrader5 package not available on this host"
            })
            return

        # Initialize and connect to MT5 with target credentials
        try:
            try:
                login_int = int(login_val)
            except ValueError:
                self._send_json(400, {"success": False, "error": "Login must be an integer"})
                return

            init_ok = mt5.initialize(
                login=login_int,
                password=str(password_val),
                server=str(server_val),
                timeout=30000
            )

            if not init_ok:
                fallback_init = mt5.initialize(timeout=30000)
                if fallback_init:
                    authorized = mt5.login(
                        login=login_int,
                        password=str(password_val),
                        server=str(server_val),
                        timeout=30000
                    )
                    if not authorized:
                        err = mt5.last_error()
                        self._send_json(400, {
                            "success": False,
                            "error": f"Authorization failed on server {server_val}: {err}"
                        })
                        return
                else:
                    err = mt5.last_error()
                    self._send_json(500, {
                        "success": False,
                        "error": f"Failed to initialize MT5: {err}"
                    })
                    return

            # Fetch account info
            acc_info = mt5.account_info()
            if acc_info is None:
                err = mt5.last_error()
                self._send_json(500, {
                    "success": False,
                    "error": f"Failed to get account info: {err}"
                })
                return

            account_data = {
                "login": acc_info.login,
                "server": acc_info.server,
                "balance": acc_info.balance,
                "equity": acc_info.equity,
                "floating_pnl": round(acc_info.equity - acc_info.balance, 2),
                "leverage": acc_info.leverage,
                "currency": acc_info.currency,
                "name": acc_info.name,
                "company": acc_info.company
            }

            # Fetch history deals
            date_from = datetime.now() - timedelta(days=days)
            date_to = datetime.now() + timedelta(days=1)
            deals = mt5.history_deals_get(date_from, date_to)

            parsed_deals = []
            if deals is not None:
                in_deals = {}
                out_deals = []

                for d in deals:
                    if not d.symbol or not d.symbol.strip():
                        continue
                    if d.entry == 0:  # ENTRY_IN
                        in_deals[d.position_id] = d
                    elif d.entry in (1, 2, 3) or d.profit != 0:
                        out_deals.append(d)

                for out_d in out_deals:
                    in_d = in_deals.get(out_d.position_id)
                    if in_d:
                        pos_type = "BUY" if in_d.type == 0 else "SELL"
                        open_price = float(in_d.price)
                        open_time = datetime.fromtimestamp(in_d.time).isoformat()
                    else:
                        pos_type = "SELL" if out_d.type == 0 else "BUY"
                        open_price = float(out_d.price)
                        open_time = datetime.fromtimestamp(out_d.time).isoformat()

                    close_price = float(out_d.price)
                    close_time = datetime.fromtimestamp(out_d.time).isoformat()

                    dt_open = datetime.fromtimestamp(in_d.time if in_d else out_d.time)
                    hour = dt_open.hour
                    session = "Asian" if 0 <= hour < 8 else ("London" if 8 <= hour < 14 else "New York")

                    ticket_id = str(out_d.position_id if out_d.position_id != 0 else out_d.ticket)

                    parsed_deals.append({
                        "ticket": ticket_id,
                        "deal_ticket": str(out_d.ticket),
                        "position_id": str(out_d.position_id),
                        "symbol": str(out_d.symbol),
                        "order_type": pos_type,
                        "lots": round(float(out_d.volume), 2),
                        "open_price": round(open_price, 5),
                        "close_price": round(close_price, 5),
                        "open_time": open_time,
                        "close_time": close_time,
                        "profit": round(float(out_d.profit), 2),
                        "commission": round(float(out_d.commission), 2),
                        "swap": round(float(out_d.swap), 2),
                        "strategy": acc_info.name or f"MT5 {acc_info.server}",
                        "session": session,
                        "notes": f"Sync from {server_val} ticket #{ticket_id}"
                    })

            self._send_json(200, {
                "success": True,
                "account": account_data,
                "deals": parsed_deals,
                "total_deals": len(parsed_deals)
            })

        except Exception as e:
            self._send_json(500, {
                "success": False,
                "error": f"Internal bridge error: {str(e)}"
            })
        finally:
            try:
                mt5.shutdown()
            except:
                pass

def main():
    global PORT, API_KEY
    parser = argparse.ArgumentParser(description="CentTrade MT5 Remote Bridge Server")
    parser.add_argument("--port", type=int, default=8080, help="HTTP Port to listen on (default: 8080)")
    parser.add_argument("--key", type=str, default="", help="Optional secret API Key for authentication")
    args = parser.parse_args()

    PORT = args.port
    API_KEY = args.key

    server_address = ("", PORT)
    httpd = HTTPServer(server_address, MT5BridgeHandler)
    print(f"=====================================================")
    print(f"CentTrade MT5 Remote Bridge Server started on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print(f"Sync endpoint: POST http://localhost:{PORT}/sync")
    if API_KEY:
        print(f"Authentication: Enabled (Header: x-api-key: {API_KEY[:4]}***)")
    else:
        print(f"Authentication: Disabled (Open access)")
    print(f"=====================================================")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping bridge server...")
        httpd.server_close()

if __name__ == "__main__":
    main()
