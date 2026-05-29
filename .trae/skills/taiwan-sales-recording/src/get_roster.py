#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
钉钉花名册获取模块
通过 dws CLI 获取台湾销售团队成员列表
"""

import json
import subprocess
from typing import List, Dict, Optional
from pathlib import Path


class DingTalkRoster:
    """钉钉通讯录花名册获取器"""

    def __init__(self, config_path: Optional[str] = None):
        """
        初始化花名册获取器

        Args:
            config_path: 配置文件路径，默认使用同级目录的 config/config.json
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        self.dws_path = self.config.get('cli_paths', {}).get('dws', 'dws')
        self.dept_ids = self.config.get('dept_ids', {}).get('taiwan', [])

    def _run_dws_command(self, *args) -> Dict:
        """
        执行 dws 命令并返回 JSON 结果

        Args:
            *args: 命令参数

        Returns:
            解析后的 JSON 数据

        Raises:
            RuntimeError: 命令执行失败
        """
        cmd = [self.dws_path] + list(args) + ['-f', 'json']

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=30
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else "未知错误"
            raise RuntimeError(f"dws 命令执行失败: {error_msg}")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"解析 dws 输出失败: {e}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("dws 命令执行超时")

    def search_departments(self, query: str) -> List[Dict]:
        """
        搜索部门

        Args:
            query: 搜索关键词（如"台湾"）

        Returns:
            部门列表，每个部门包含 deptId 和 deptName
        """
        result = self._run_dws_command(
            'contact', 'dept', 'search',
            '--query', query
        )

        return result.get('deptList', [])

    def get_department_members(self, dept_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        获取部门成员列表（花名册）

        Args:
            dept_ids: 部门ID列表，默认使用配置中的台湾部门

        Returns:
            成员列表，每个成员包含 name 和 userId
        """
        if dept_ids is None:
            dept_ids = self.dept_ids

        if not dept_ids:
            raise ValueError("未配置部门ID")

        dept_ids_str = ','.join(dept_ids)

        result = self._run_dws_command(
            'contact', 'dept', 'list-members',
            '--ids', dept_ids_str
        )

        members = []
        for item in result.get('deptUserList', []):
            user_info = item.get('userInfo', {})
            if user_info.get('name') and user_info.get('userId'):
                members.append({
                    'name': user_info['name'],
                    'user_id': user_info['userId']
                })

        return members

    def get_taiwan_sales_roster(self) -> List[Dict]:
        """
        获取台湾销售团队完整花名册

        Returns:
            22人成员列表
        """
        return self.get_department_members()

    def get_user_by_name(self, name: str) -> Optional[Dict]:
        """
        根据姓名查找用户

        Args:
            name: 员工姓名

        Returns:
            用户信息，未找到返回 None
        """
        roster = self.get_taiwan_sales_roster()
        for member in roster:
            if member['name'] == name:
                return member
        return None

    def filter_roster(self, names: List[str]) -> List[Dict]:
        """
        按姓名列表筛选花名册

        Args:
            names: 要筛选的姓名列表

        Returns:
            筛选后的成员列表
        """
        roster = self.get_taiwan_sales_roster()
        return [m for m in roster if m['name'] in names]


def main():
    """测试脚本"""
    print("=" * 50)
    print("钉钉花名册获取测试")
    print("=" * 50)

    try:
        roster = DingTalkRoster()

        # 获取台湾销售团队花名册
        print("\n正在获取台湾销售团队花名册...")
        members = roster.get_taiwan_sales_roster()

        print(f"\n共获取 {len(members)} 人：\n")
        for i, member in enumerate(members, 1):
            print(f"{i}. {member['name']} (userId: {member['user_id']})")

        # 测试按姓名查找
        print("\n" + "=" * 50)
        print("测试按姓名查找")
        print("=" * 50)

        test_name = "林鸿池"
        user = roster.get_user_by_name(test_name)
        if user:
            print(f"\n找到 {test_name}: {user}")
        else:
            print(f"\n未找到 {test_name}")

    except RuntimeError as e:
        print(f"\n错误: {e}")
        print("\n请确保：")
        print("1. dws 已安装并添加到 PATH")
        print("2. 已运行 'dws auth login' 完成授权")
    except Exception as e:
        print(f"\n未知错误: {e}")


if __name__ == '__main__':
    main()
