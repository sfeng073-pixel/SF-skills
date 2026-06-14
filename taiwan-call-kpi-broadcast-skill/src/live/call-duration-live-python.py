from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


CALL_DURATION_REPORT = {
    "id": "I2c928087019cd752d752b5ad019cd87dfecf2990",
    "path": "分析报表/海外直播业务线/海外前端/益智_海外前端/过程跟进/沟通/益智CC日通时通次监控",
}

SLOT_TO_CUTOFF = {
    "1500": "15:00:00",
    "1700": "17:00:00",
    "2130": "21:30:00",
}

DEFAULT_BASE_URL = "https://bi.61info.cn/smartbi/vision"


def write_config(config_path: Path, date_text: str, slot: str) -> str:
    task_name = f"call_duration_{slot}"
    cutoff = SLOT_TO_CUTOFF[slot]
    config = {
        "version": 1,
        "base_url": os.environ.get("SMARTBI_BASE_URL", DEFAULT_BASE_URL),
        "tasks": {
            task_name: {
                "enabled": True,
                "description": f"台湾TL通时通次播报：{slot}",
                "report": {
                    "id": CALL_DURATION_REPORT["id"],
                    "path": CALL_DURATION_REPORT["path"],
                    "type": "SPREADSHEET_REPORT",
                },
                "filters": {
                    "overrides": [
                        {
                            "key": "开始时间段",
                            "value": f"{date_text} 00:00:00",
                            "displayValue": f"{date_text} 00:00:00",
                        },
                        {
                            "key": "结束时间段",
                            "value": f"{date_text} {cutoff}",
                            "displayValue": f"{date_text} {cutoff}",
                        },
                    ],
                    "extra_params": [],
                },
                "output": {
                    "type": "file",
                    "dir": f"outputs/bi_exports/taiwan_call_kpi/{task_name}",
                },
            }
        },
    }
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    return task_name


def run_task(config_path: Path, task_name: str) -> dict:
    smartbi_cli_path = os.environ.get("SMARTBI_CLI_PATH", "").strip()
    if not smartbi_cli_path:
        raise RuntimeError("SMARTBI_CLI_PATH is required")

    smartbi_python_bin = os.environ.get("SMARTBI_CLI_PYTHON_BIN", sys.executable)
    cmd = [smartbi_python_bin, smartbi_cli_path, "run", "--config", str(config_path), "--task", task_name, "--json"]
    completed = subprocess.run(cmd, check=True, capture_output=True, text=True, env=os.environ.copy())
    return json.loads(completed.stdout)


def main() -> int:
    if len(sys.argv) < 5:
        raise SystemExit("usage: call-duration-live-python.py YYYY-MM-DD SLOT OUTPUT_XLSX CONFIG_JSON")

    date_text = sys.argv[1]
    slot = sys.argv[2]
    output_path = Path(sys.argv[3])
    config_path = Path(sys.argv[4])
    if slot not in SLOT_TO_CUTOFF:
        raise SystemExit(f"unsupported slot: {slot}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    config_path.parent.mkdir(parents=True, exist_ok=True)
    task_name = write_config(config_path, date_text, slot)
    task_run = run_task(config_path, task_name)
    shutil.copyfile(task_run["output"], output_path)

    result = {
        "mode": "live_export",
        "date": date_text,
        "slot": slot,
        "call_duration_path": str(output_path),
        "call_duration_workbook": task_run["output"],
        "warnings": [],
    }
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
