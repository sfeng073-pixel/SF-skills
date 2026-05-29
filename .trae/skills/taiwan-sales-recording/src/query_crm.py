#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CRM学员和通话查询模块
通过 cc-workbench2 CLI 查询CRM中的学员和通话记录

注意：此模块需要在本地环境运行（需要浏览器CDP）
"""

import json
from typing import List, Dict, Optional


class CRMQuery:
    """CRM查询器"""

    def __init__(self, config_path: Optional[str] = None):
        """
        初始化CRM查询器

        Args:
            config_path: 配置文件路径
        """
        if config_path is None:
            from pathlib import Path
            config_path = Path(__file__).parent.parent / "config" / "config.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        self.cli_path = self.config.get('cli_paths', {}).get('cc_workbench', 'cc-workbench2')

    def get_students_by_employee(self, employee_name: str) -> List[Dict]:
        """
        根据员工姓名获取其负责的学员列表

        Args:
            employee_name: 员工姓名

        Returns:
            学员列表
        """
        # TODO: 实现调用 cc-workbench2 student-followup list
        # 命令示例：cc-workbench2 student-followup list --page cc-private --student "{employee_name}"
        raise NotImplementedError("需要在本地环境运行，调用 cc-workbench2 CLI")

    def get_students_by_group(self, group_name: str) -> List[Dict]:
        """
        根据组织架构获取学员列表

        Args:
            group_name: 组织名称（如"台湾CC02组"）

        Returns:
            学员列表
        """
        # TODO: 实现调用 cc-workbench2 student-followup list
        # 命令示例：cc-workbench2 student-followup list --page cc-private --group "{group_name}"
        raise NotImplementedError("需要在本地环境运行，调用 cc-workbench2 CLI")

    def get_call_records(self, wandou_id: str, limit: int = 50) -> List[Dict]:
        """
        获取学员的通话记录

        Args:
            wandou_id: 学员ID
            limit: 返回记录数量限制

        Returns:
            通话记录列表
        """
        # TODO: 实现调用 cc-workbench2 student-records
        # 命令示例：cc-workbench2 student-records --wandou-id {wandou_id} --type calls --limit {limit}
        raise NotImplementedError("需要在本地环境运行，调用 cc-workbench2 CLI")

    def filter_valid_calls(self, call_records: List[Dict], min_duration: int = 30) -> List[Dict]:
        """
        筛选有效通话记录

        Args:
            call_records: 原始通话记录
            min_duration: 最短通话时长（秒）

        Returns:
            有效通话记录
        """
        valid = []
        for record in call_records:
            duration = record.get('duration', 0)
            status = record.get('status', '')
            has_recording = record.get('has_recording', False)

            if duration >= min_duration and status == '已接通' and has_recording:
                valid.append(record)

        return valid


def main():
    """测试脚本"""
    print("=" * 50)
    print("CRM查询模块")
    print("=" * 50)
    print("\n此模块需要在本地环境运行")
    print("需要先启动 Chrome: chrome --remote-debugging-port=9222")
    print("\n示例命令：")
    print("  cc-workbench2 student-followup list --page cc-private --student '林鸿池'")
    print("  cc-workbench2 student-records --wandou-id <id> --type calls")


if __name__ == '__main__':
    main()
