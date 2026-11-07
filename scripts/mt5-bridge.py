"""
CentTrade PRO - Real MetaTrader 5 Investor Bridge
-------------------------------------------------
Connects directly to real broker servers (Exness, HFM, Valetax, etc.)
using investor (read-only) credentials via the official MetaTrader 5 API.
Includes automated zombie process cleanup and LiveUpdate lock prevention.
"""

import sys
import os
import glob
import json
import argparse
import subprocess
from datetime import datetime, timedelta

def get_terminal_pids():
    """Returns set of active terminal64.exe process IDs."""
    try:
        cmd = ['powershell', '-NoProfile', '-Command', '(Get-Process -Name terminal64 -ErrorAction SilentlyContinue).Id']
        out = subprocess.check_output(cmd, text=True, timeout=4)
        return set(int(x.strip()) for x in out.strip().split() if x.strip().isdigit())
    except Exception:
        return set()

def cleanup_stuck_liveupdate():
    """Cleans up pending MT5 LiveUpdate files that trigger Error 32 UAC restart loops."""
    try:
        appdata = os.environ.get('APPDATA', '')
        pattern = os.path.join(appdata, 'MetaQuotes', 'Terminal', '*', 'liveupdate', '*')
        for f in glob.glob(pattern):
            try:
                if os.path.isfile(f):
                    os.remove(f)
            except Exception:
                pass
    except Exception:
        pass

def kill_new_pids(initial_pids):
    """Terminates any newly spawned terminal64.exe processes that failed to connect."""
    current_pids = get_terminal_pids()
    new_pids = current_pids - initial_pids
    for pid in new_pids:
        try:
            subprocess.run(
                ['powershell', '-NoProfile', '-Command', f'Stop-Process -Id {pid} -Force -ErrorAction SilentlyContinue'],
                timeout=3
            )
        except Exception:
            pass

def connect_and_sync(login, password, server, days=30):
    try:
        import MetaTrader5 as mt5
    except ImportError:
        return {
            "success": False,
            "error": "MetaTrader5 package not installed. Run: pip install MetaTrader5"
        }

    try:
        login_int = int(login)
    except (ValueError, TypeError):
        return {
            "success": False,
            "error": f"Nomor login MT5 harus berupa integer: '{login}'"
        }

    # Step 0: Clear any stuck LiveUpdate files that would trigger infinite restart loops
    cleanup_stuck_liveupdate()

    # Track pre-existing terminal processes
    initial_pids = get_terminal_pids()
    initialized = False

    try:
        # Step 1: Initialize MT5 terminal directly with target account credentials.
        # Timeout 10 seconds (sufficient for local IPC connection)
        init_ok = mt5.initialize(
            login=login_int,
            password=str(password),
            server=str(server),
            timeout=10000
        )

        if init_ok:
            initialized = True
        else:
            # Fallback attempt with login() call
            fallback_init = mt5.initialize(timeout=8000)
            if fallback_init:
                initialized = True
                authorized = mt5.login(
                    login=login_int,
                    password=str(password),
                    server=str(server),
                    timeout=10000
                )
                if not authorized:
                    err = mt5.last_error()
                    mt5.shutdown()
                    initialized = False
                    kill_new_pids(initial_pids)
                    return {
                        "success": False,
                        "error": f"Gagal otorisasi ke server '{server}' untuk akun #{login}. Error: {err}. Pastikan nomor akun, kata sandi investor, dan nama server broker sesuai."
                    }
            else:
                err = mt5.last_error()
                kill_new_pids(initial_pids)
                return {
                    "success": False,
                    "error": f"Gagal menginisialisasi terminal MT5: {err}. Pastikan aplikasi MetaTrader 5 terinstal di komputer ini."
                }

        # Step 3: Verify and retrieve real account information
        acc = mt5.account_info()
        if acc is None:
            err = mt5.last_error()
            mt5.shutdown()
            initialized = False
            kill_new_pids(initial_pids)
            return {
                "success": False,
                "error": f"Gagal mengambil informasi akun dari broker: {err}"
            }

        # Step 4: Fetch closed deals history
        from_date = datetime.now() - timedelta(days=days)
        to_date = datetime.now() + timedelta(days=1)
        deals = mt5.history_deals_get(from_date, to_date)
        
        parsed_deals = []
        if deals is not None:
            in_deals = {}
            out_deals = []

            for d in deals:
                if not d.symbol or not d.symbol.strip():
                    continue
                if d.entry == 0:  # ENTRY_IN
                    in_deals[d.position_id] = d
                elif d.entry in (1, 2, 3) or d.profit != 0:  # ENTRY_OUT or non-zero profit close
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
                    "strategy": acc.name or f"MT5 {acc.server}",
                    "session": session,
                    "notes": f"Real deal synced from {server} #{login} (Ticket #{ticket_id})"
                })

        result = {
            "success": True,
            "account": {
                "login": str(acc.login),
                "name": acc.name or f"{acc.company} #{acc.login}",
                "server": acc.server,
                "broker": acc.company,
                "balance": round(float(acc.balance), 2),
                "equity": round(float(acc.equity), 2),
                "floating_pnl": round(float(acc.profit), 2),
                "currency": acc.currency,
                "leverage": int(acc.leverage),
                "status": "connected"
            },
            "deals_count": len(parsed_deals),
            "deals": parsed_deals
        }

        return result

    except Exception as exc:
        kill_new_pids(initial_pids)
        return {
            "success": False,
            "error": f"Kesalahan bridge MT5: {str(exc)}"
        }
    finally:
        if initialized:
            try:
                mt5.shutdown()
            except Exception:
                pass
        # Always verify no zombie terminals are left hanging
        kill_new_pids(initial_pids)

def main():
    parser = argparse.ArgumentParser(description="Real MT5 Investor Sync Bridge")
    parser.add_argument("--login", required=True, help="MT5 Account Number / Login")
    parser.add_argument("--password", required=True, help="Investor Password (Read-Only)")
    parser.add_argument("--server", required=True, help="Broker MT5 Server Name")
    parser.add_argument("--days", type=int, default=30, help="Days of history to fetch")

    args = parser.parse_args()
    res = connect_and_sync(args.login, args.password, args.server, args.days)
    print(json.dumps(res))

if __name__ == "__main__":
    main()
