#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
质检检测模块
基于《台灣簽單後sop》标准进行合规性检查
"""

import re
from typing import Dict, List, Tuple
from .config import (
    ENROLLMENT_GUIDE_KEYWORDS,
    CHECKIN_OPERATION_KEYWORDS,
    CHECKIN_QUOTE_KEYWORDS,
    SIGNED_USER_KEYWORDS,
    SIGNED_CONTENT_KEYWORDS,
)


class ComplianceChecker:
    """合规性检查器"""
    
    def __init__(self):
        self.enrollment_guide_keywords = ENROLLMENT_GUIDE_KEYWORDS
        self.checkin_operation_keywords = CHECKIN_OPERATION_KEYWORDS
        self.checkin_quote_keywords = CHECKIN_QUOTE_KEYWORDS
        self.signed_user_keywords = SIGNED_USER_KEYWORDS
        self.signed_content_keywords = SIGNED_CONTENT_KEYWORDS
    
    def check_enrollment_guide(self, staff_text: str) -> bool:
        """
        检查是否发送入学指南
        
        检测逻辑：客服消息中是否包含"入學指南"/"入学指南"关键词
        （图片发送后通常有文字说明）
        
        Args:
            staff_text: 所有客服消息的合并文本
            
        Returns:
            bool: 是否发送入学指南
        """
        return any(kw in staff_text for kw in self.enrollment_guide_keywords)
    
    def check_checkin(self, staff_text: str) -> Tuple[bool, bool]:
        """
        检查是否沟通打卡
        
        检测逻辑：
        1. 区分"方案报价中提及打卡"和"签单后实际带打卡操作沟通"
        2. 只有实际操作沟通才算合规
        
        Args:
            staff_text: 所有客服消息的合并文本
            
        Returns:
            Tuple[bool, bool]: (是否有打卡操作沟通, 是否仅在报价中提及)
        """
        has_operation = False
        has_quote = False
        
        # 检查是否有打卡操作沟通
        for kw in self.checkin_operation_keywords:
            if re.search(kw, staff_text):
                has_operation = True
                break
        
        # 检查是否仅在报价中提及
        for kw in self.checkin_quote_keywords:
            if re.search(kw, staff_text):
                has_quote = True
                break
        
        return has_operation, has_quote
    
    def check_signed_user(self, all_text: str, filename: str) -> bool:
        """
        检查是否为已报名/成交用户
        
        检测逻辑：
        1. 在聊天内容中搜索报名相关关键词
        2. 在文件名中搜索报名标识（字节匹配避免编码问题）
        
        Args:
            all_text: 所有消息的合并文本
            filename: 文件名
            
        Returns:
            bool: 是否为已报名用户
        """
        # 1. 内容关键词匹配
        for kw in self.signed_content_keywords:
            if re.search(kw, all_text):
                return True
        
        # 2. 文件名字节匹配
        try:
            filename_bytes = filename.encode('utf-8', errors='ignore')
            signed_bytes_patterns = [
                b'\xe5\xb7\xb2\xe5\xa0\xb1',  # 已報
                b'\xe5\xb7\xb2\xe6\x8a\xa5',  # 已报
                b'\xe5\xa0\xb1\xe5\x90\x8d',  # 報名
                b'\xe6\x8a\xa5\xe5\x90\x8d',  # 报名
                b'\xe6\x88\x90\xe4\xba\xa4',  # 成交
                b'\xe5\xb7\xb2\xe7\xb0\xbd',  # 已簽
                b'\xe5\xb7\xb2\xe7\xad\xbe',  # 已签
                b'\xe5\xb7\xb2\xe4\xb8\x8a',  # 已上
            ]
            for pattern in signed_bytes_patterns:
                if pattern in filename_bytes:
                    return True
        except:
            pass
        
        return False
    
    def check_compliance(self, staff_text: str, all_text: str, filename: str) -> Dict:
        """
        综合合规性检查
        
        Args:
            staff_text: 客服消息文本
            all_text: 所有消息文本
            filename: 文件名
            
        Returns:
            Dict: 合规检查结果
        """
        is_signed = self.check_signed_user(all_text, filename)
        has_enrollment_guide = self.check_enrollment_guide(staff_text)
        has_checkin, has_checkin_quote = self.check_checkin(staff_text)
        
        # 判断合规状态
        if has_enrollment_guide and has_checkin:
            status = '完全合规'
        elif has_enrollment_guide:
            status = '缺打卡沟通'
        elif has_checkin:
            status = '缺入学指南'
        else:
            status = '两项均缺'
        
        return {
            'is_signed': is_signed,
            'has_enrollment_guide': has_enrollment_guide,
            'has_checkin': has_checkin,
            'has_checkin_quote': has_checkin_quote,
            'compliance_status': status,
        }
    
    def generate_report(self, results: List[Dict]) -> str:
        """
        生成质检报告
        
        Args:
            results: 多个文件的检查结果列表
            
        Returns:
            str: 质检报告文本
        """
        if not results:
            return "没有数据可生成报告"
        
        total = len(results)
        signed_users = [r for r in results if r.get('is_signed', False)]
        
        # 统计数据
        compliant = sum(1 for r in results if r.get('compliance_status') == '完全合规')
        both_missing = sum(1 for r in results if r.get('compliance_status') == '两项均缺')
        only_no_guide = sum(1 for r in results if r.get('compliance_status') == '缺入学指南')
        only_no_checkin = sum(1 for r in results if r.get('compliance_status') == '缺打卡沟通')
        has_guide = sum(1 for r in results if r.get('has_enrollment_guide'))
        has_checkin = sum(1 for r in results if r.get('has_checkin'))
        
        report_lines = [
            "=" * 80,
            "LINE聊天记录质检报告",
            "=" * 80,
            f"\n总检查数: {total}",
            f"已报名/成交用户: {len(signed_users)}",
            "\n" + "=" * 60,
            "合规情况统计",
            "=" * 60,
            f"完全合规（入学指南+打卡沟通）: {compliant} ({compliant/total*100:.1f}%)",
            f"仅缺入学指南: {only_no_guide} ({only_no_guide/total*100:.1f}%)",
            f"仅缺打卡沟通: {only_no_checkin} ({only_no_checkin/total*100:.1f}%)",
            f"两项均缺: {both_missing} ({both_missing/total*100:.1f}%)",
            "\n" + "=" * 60,
            "单项覆盖率",
            "=" * 60,
            f"入学指南: {has_guide}/{total} ({has_guide/total*100:.1f}%)",
            f"打卡沟通: {has_checkin}/{total} ({has_checkin/total*100:.1f}%)",
        ]
        
        return '\n'.join(report_lines)
