#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台湾销售团队录音下载 Skill 主控流程
整合钉钉花名册获取、CRM查询、录音下载全流程
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# 添加 src 到路径
sys.path.insert(0, str(Path(__file__).parent))

from get_roster import DingTalkRoster


class TaiwanSalesRecordingSkill:
    """台湾销售团队录音下载 Skill"""

    def __init__(self, config_path: Optional[str] = None):
        """初始化 Skill"""
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        self.roster = DingTalkRoster(config_path)
        self.output_dir = Path(self.config['defaults']['output_dir']).expanduser()

    def confirm_params(self, 
                      date_range: str = "today",
                      employee_scope: str = "all",
                      min_duration: int = 30,
                      max_downloads: int = 50,
                      enable_analysis: bool = False) -> Dict:
        """
        确认执行参数（在实际 Skill 中，这里会通过与用户对话确认）
        """
        return {
            "date_range": date_range,
            "employee_scope": employee_scope,
            "min_duration": min_duration,
            "max_downloads": max_downloads,
            "enable_analysis": enable_analysis
        }

    def execute(self, params: Optional[Dict] = None) -> Dict:
        """
        执行完整流程

        Returns:
            执行结果报告
        """
        if params is None:
            params = self.confirm_params()

        print("=" * 60)
        print("台湾销售团队录音下载 Skill")
        print("=" * 60)
        print(f"\n执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"参数配置: {json.dumps(params, ensure_ascii=False, indent=2)}")

        # Phase 1: 获取花名册
        print("\n" + "-" * 60)
        print("Phase 1: 获取钉钉花名册")
        print("-" * 60)

        try:
            if params['employee_scope'] == 'all':
                roster = self.roster.get_taiwan_sales_roster()
            else:
                # 指定员工模式
                names = params['employee_scope'].split(',')
                roster = self.roster.filter_roster(names)

            print(f"✓ 获取到 {len(roster)} 人")
            for m in roster:
                print(f"  - {m['name']}")

        except Exception as e:
            print(f"✗ 获取花名册失败: {e}")
            return {"success": False, "error": str(e)}

        # Phase 2 & 3: CRM查询和录音下载
        print("\n" + "-" * 60)
        print("Phase 2-3: CRM查询与录音下载")
        print("-" * 60)
        print("⚠ 注意: CRM查询需要在本地环境执行（需要浏览器CDP）")
        print("  请在本地运行: python src/query_crm.py")

        # 生成执行计划
        execution_plan = {
            "timestamp": datetime.now().isoformat(),
            "params": params,
            "roster": roster,
            "next_steps": [
                "1. 确保已启动 Chrome: chrome --remote-debugging-port=9222",
                "2. 运行: python src/query_crm.py",
                "3. 查看下载结果"
            ]
        }

        # 保存执行计划
        plan_path = self.output_dir / f"plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        with open(plan_path, 'w', encoding='utf-8') as f:
            json.dump(execution_plan, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 执行计划已保存: {plan_path}")

        return {
            "success": True,
            "roster_count": len(roster),
            "plan_path": str(plan_path),
            "message": "花名册获取成功，请在本地环境继续执行CRM查询"
        }


def main():
    """主入口"""
    skill = TaiwanSalesRecordingSkill()

    # 示例：执行完整流程
    params = {
        "date_range": "today",
        "employee_scope": "all",  # 或指定员工如 "林鸿池,白沧海"
        "min_duration": 30,
        "max_downloads": 50,
        "enable_analysis": False
    }

    result = skill.execute(params)
    print("\n" + "=" * 60)
    print("执行结果:")
    print("=" * 60)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
