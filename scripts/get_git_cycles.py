
import subprocess
import json
import sys
from datetime import datetime, timedelta

def get_git_logs(start_date=None):
    cmd = ["git", "log", "--pretty=format:%as|%s", "--", "."]
    result = subprocess.run(cmd, capture_output=True, text=True)
    lines = result.stdout.strip().split('\n')
    
    parsed = []
    limit_date = None
    if start_date:
        try:
            limit_date = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            print(f"Erro: Data de início inválida {start_date}. Use AAAA-MM-DD.")
            sys.exit(1)

    for line in lines:
        if not line: continue
        try:
            date_str, message = line.split('|', 1)
            date = datetime.strptime(date_str, "%Y-%m-%d")
            if limit_date and date < limit_date:
                continue
            parsed.append({"date": date, "message": message})
        except ValueError:
            continue
            
    # Sort oldest first to build cycles
    parsed.sort(key=lambda x: x["date"])
    return parsed

def build_cycles(logs, cycle_days=15):
    if not logs:
        return []
        
    cycles = []
    first_date = logs[0]["date"]
    current_cycle_start = first_date
    
    current_cycle_data = {
        "start_date": current_cycle_start.strftime("%Y-%m-%d"),
        "commits": []
    }
    
    for log in logs:
        log_date = log["date"]
        
        while log_date >= current_cycle_start + timedelta(days=cycle_days):
            if current_cycle_data["commits"]:
                cycles.append(current_cycle_data)
            
            current_cycle_start += timedelta(days=cycle_days)
            current_cycle_data = {
                "start_date": current_cycle_start.strftime("%Y-%m-%d"),
                "commits": []
            }
            
        current_cycle_data["commits"].append(log["message"])
        
    if current_cycle_data["commits"]:
        cycles.append(current_cycle_data)
        
    # Return newest cycles first
    return cycles[::-1]

if __name__ == "__main__":
    start_date = sys.argv[1] if len(sys.argv) > 1 else None
    logs = get_git_logs(start_date)
    cycles = build_cycles(logs)
    print(json.dumps(cycles, indent=4, ensure_ascii=False))
