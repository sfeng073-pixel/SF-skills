#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书文档报告生成模块
生成飞书文档格式的录音质检报告
"""

import json
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path


class FeishuReportGenerator:
    """飞书文档报告生成器"""

    def __init__(self, config_path: Optional[str] = None):
        """初始化报告生成器"""
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.json"

        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        self.feishu_config = self.config.get('feishu', {})
        self.enabled = self.feishu_config.get('enabled', False)
        self.report_folder = self.feishu_config.get('report_folder', '台湾销售录音报告')

    def generate_markdown_report(self, analysis_results: List[Dict], metadata: Dict) -> str:
        """
        生成Markdown格式的报告（可用于飞书文档）

        Args:
            analysis_results: 分析结果列表
            metadata: 元数据（日期范围、员工范围等）

        Returns:
            Markdown格式的报告内容
        """
        date_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        batch_id = datetime.now().strftime('%Y%m%d_%H%M%S')

        # 计算统计数据
        total_recordings = len(analysis_results)
        total_duration = sum(r.get('duration', 0) for r in analysis_results)
        avg_score = sum(r.get('score', 0) for r in analysis_results) / max(total_recordings, 1)

        # 按员工统计
        employee_stats = {}
        for r in analysis_results:
            employee = r.get('employee_name', '未知')
            if employee not in employee_stats:
                employee_stats[employee] = {'count': 0, 'total_score': 0, 'high_intent': 0}
            employee_stats[employee]['count'] += 1
            employee_stats[employee]['total_score'] += r.get('score', 0)
            if r.get('customer_intent') == '高':
                employee_stats[employee]['high_intent'] += 1

        # 构建Markdown报告
        lines = []
        lines.append("# 台湾销售录音质检报告")
        lines.append("")
        lines.append(f"**生成时间**：{date_str}")
        lines.append(f"**日期范围**：{metadata.get('date_range', 'N/A')}")
        lines.append(f"**员工范围**：{metadata.get('employee_scope', 'N/A')}")
        lines.append(f"**质检批次**：{batch_id}")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 统计概览")
        lines.append("")
        lines.append("| 指标 | 数值 |")
        lines.append("|------|------|")
        lines.append(f"| 总录音数 | {total_recordings}条 |")
        lines.append(f"| 总时长 | {total_duration // 60}分钟{total_duration % 60}秒 |")
        lines.append(f"| 平均评分 | {avg_score:.1f}分 |")
        lines.append(f"| 涉及员工 | {len(employee_stats)}人 |")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 员工排名")
        lines.append("")
        lines.append("| 排名 | 员工姓名 | 录音数 | 平均评分 | 客户高意向率 |")
        lines.append("|------|----------|--------|---------|-------------|")

        sorted_employees = sorted(
            employee_stats.items(),
            key=lambda x: x[1]['total_score'] / x[1]['count'] if x[1]['count'] > 0 else 0,
            reverse=True
        )

        for i, (name, stats) in enumerate(sorted_employees, 1):
            avg = stats['total_score'] / stats['count'] if stats['count'] > 0 else 0
            high_rate = (stats['high_intent'] / stats['count'] * 100) if stats['count'] > 0 else 0
            lines.append(f"| {i} | {name} | {stats['count']} | {avg:.1f} | {high_rate:.0f}% |")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 录音明细")
        lines.append("")

        # 按员工分组显示明细
        current_employee = None
        for r in analysis_results:
            emp = r.get('employee_name', '未知')
            if emp != current_employee:
                current_employee = emp
                lines.append(f"### {emp}")
                lines.append("")
                lines.append("| 学员ID | 学员姓名 | 通话时间 | 时长 | 评分 | 意向 | 话术亮点 |")
                lines.append("|--------|----------|----------|------|------|------|---------|")

            lines.append(f"| {r.get('student_id', 'N/A')} | {r.get('student_name', 'N/A')} | {r.get('call_time', 'N/A')} | {r.get('duration', 0)}秒 | {r.get('score', 0)} | {r.get('customer_intent', 'N/A')} | {r.get('highlight', 'N/A')} |")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## 改进建议")
        lines.append("")

        # 收集优秀话术和问题
        highlights = [r.get('highlight', '') for r in analysis_results if r.get('highlight')]
        improvements = [r.get('improvement', '') for r in analysis_results if r.get('improvement')]

        if highlights:
            lines.append("### 优秀话术")
            lines.append("")
            for h in highlights[:5]:
                lines.append(f"- {h}")
            lines.append("")

        if improvements:
            lines.append("### 常见问题")
            lines.append("")
            for imp in improvements[:5]:
                lines.append(f"- {imp}")
            lines.append("")

        lines.append("---")
        lines.append("")
        lines.append(f"*报告生成时间：{datetime.now().isoformat()}*")

        return '\n'.join(lines)

    def create_feishu_document(self, content: str, title: Optional[str] = None) -> Dict:
        """
        创建飞书文档

        Args:
            content: 文档内容（Markdown格式）
            title: 文档标题

        Returns:
            创建结果，包含文档链接
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "飞书文档功能未启用，请在config.json中配置"
            }

        if title is None:
            title = f"台湾销售录音质检报告_{datetime.now().strftime('%Y%m%d')}"

        # 实际创建需要调用 lark-cli 或飞书 API
        # 这里返回模拟结果，实际使用时需要接入 lark-doc skill
        return {
            "success": True,
            "title": title,
            "content_preview": content[:500],
            "message": f"请在本地环境运行 lark-cli 创建文档，或将以下内容复制到飞书文档：",
            "content": content
        }


def main():
    """测试脚本"""
    # 模拟分析结果
    mock_results = [
        {
            "student_id": "W123456",
            "student_name": "张三",
            "call_time": "2026-05-29 14:30:00",
            "duration": 120,
            "employee_name": "林鸿池",
            "recording_url": "https://crm.vipthink.cn/recording/xxx",
            "score": 92,
            "customer_intent": "高",
            "conversation_quality": "流畅",
            "highlight": "开场白自然，能准确把握客户需求",
            "improvement": "可以在产品介绍环节更详细"
        },
        {
            "student_id": "W234567",
            "student_name": "李四",
            "call_time": "2026-05-29 15:00:00",
            "duration": 90,
            "employee_name": "林鸿池",
            "recording_url": "https://crm.vipthink.cn/recording/yyy",
            "score": 85,
            "customer_intent": "中",
            "conversation_quality": "一般",
            "highlight": "解答客户疑问耐心",
            "improvement": "语速稍快，建议放慢"
        }
    ]

    mock_metadata = {
        "date_range": "2026-05-29",
        "employee_scope": "台湾销售团队全体"
    }

    generator = FeishuReportGenerator()
    report = generator.generate_markdown_report(mock_results, mock_metadata)

    print("=" * 60)
    print("飞书文档报告预览")
    print("=" * 60)
    print(report)


if __name__ == '__main__':
    main()
