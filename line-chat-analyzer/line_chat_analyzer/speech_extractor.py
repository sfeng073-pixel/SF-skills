#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
话术提炼模块
提取成功说服案例、用户异议及应对话术
"""

import re
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
from .config import NOT_SIGNED_REASONS, USER_CONCERN_KEYWORDS


class SpeechCase:
    """话术案例对象"""
    
    def __init__(self, user_concern: str, staff_response: str, context: str = ""):
        self.user_concern = user_concern
        self.staff_response = staff_response
        self.context = context
    
    def __repr__(self):
        return f"SpeechCase({self.user_concern[:30]}... -> {self.staff_response[:30]}...)"


class SpeechExtractor:
    """话术提炼器"""
    
    def __init__(self):
        self.not_signed_reasons = NOT_SIGNED_REASONS
        self.user_concern_keywords = USER_CONCERN_KEYWORDS
    
    def extract_concern_and_response(self, messages: List) -> List[SpeechCase]:
        """
        提取用户疑虑及客服应对话术
        
        Args:
            messages: 消息对象列表
            
        Returns:
            List[SpeechCase]: 话术案例列表
        """
        cases = []
        
        for i, msg in enumerate(messages):
            if not msg.is_staff:
                # 用户消息，检查是否包含疑虑关键词
                has_concern = any(kw in msg.content for kw in self.user_concern_keywords)
                
                if has_concern:
                    # 查找后续的客服回复
                    concern_text = msg.content
                    response_text = ""
                    
                    for j in range(i + 1, min(i + 5, len(messages))):
                        if messages[j].is_staff:
                            response_text = messages[j].content
                            break
                    
                    if response_text:
                        # 提取上下文
                        context_start = max(0, i - 2)
                        context_end = min(len(messages), i + 5)
                        context = '\n'.join([
                            f"{'客服' if m.is_staff else '用户'}: {m.content}"
                            for m in messages[context_start:context_end]
                        ])
                        
                        cases.append(SpeechCase(concern_text, response_text, context))
        
        return cases
    
    def classify_not_signed_reason(self, user_text: str) -> Optional[str]:
        """
        分类未报名原因
        
        Args:
            user_text: 用户消息文本
            
        Returns:
            Optional[str]: 原因分类，如果没有匹配则返回None
        """
        for reason, patterns in self.not_signed_reasons.items():
            for pattern in patterns:
                if re.search(pattern, user_text):
                    return reason
        return None
    
    def extract_success_cases(self, messages: List, is_signed: bool) -> List[Dict]:
        """
        提取成功说服案例
        
        从已报名用户的聊天记录中提取：
        1. 用户表达的疑虑
        2. 客服的应对话术
        3. 最终成交的完整上下文
        
        Args:
            messages: 消息对象列表
            is_signed: 是否已报名
            
        Returns:
            List[Dict]: 成功案例列表
        """
        if not is_signed:
            return []
        
        cases = []
        
        # 提取所有用户疑虑及应对
        speech_cases = self.extract_concern_and_response(messages)
        
        for case in speech_cases:
            # 分类未报名原因
            reason = self.classify_not_signed_reason(case.user_concern)
            
            cases.append({
                'user_concern': case.user_concern,
                'staff_response': case.staff_response,
                'context': case.context,
                'classified_reason': reason or '其他',
            })
        
        return cases
    
    def generate_training_doc(self, success_cases: List[Dict]) -> str:
        """
        生成销售培训文档
        
        Args:
            success_cases: 成功案例列表
            
        Returns:
            str: 培训文档内容
        """
        if not success_cases:
            return "没有成功案例可生成培训文档"
        
        # 按原因分类
        cases_by_reason = defaultdict(list)
        for case in success_cases:
            reason = case.get('classified_reason', '其他')
            cases_by_reason[reason].append(case)
        
        doc_lines = [
            "=" * 80,
            "VIPTHINK 销售话术培训文档",
            "=" * 80,
            f"\n基于 {len(success_cases)} 个成功说服案例分析\n",
            "=" * 80,
        ]
        
        # 按原因分类输出
        for reason, cases in sorted(cases_by_reason.items(), key=lambda x: -len(x[1])):
            doc_lines.extend([
                f"\n【{reason}】",
                "-" * 60,
                f"共 {len(cases)} 个案例\n",
            ])
            
            # 取前3个典型案例
            for i, case in enumerate(cases[:3], 1):
                doc_lines.extend([
                    f"案例 {i}:",
                    f"用户疑虑: {case['user_concern']}",
                    f"客服应对: {case['staff_response']}",
                    "",
                ])
        
        return '\n'.join(doc_lines)
    
    def analyze_not_signed_reasons(self, results: List[Dict]) -> Dict:
        """
        分析未报名原因统计
        
        Args:
            results: 多个文件的检查结果列表
            
        Returns:
            Dict: 原因统计结果
        """
        reason_counts = defaultdict(int)
        
        for result in results:
            if not result.get('is_signed', False):
                # 尝试从文件名或内容推断原因
                # 这里简化处理，实际可以更深入分析
                pass
        
        return dict(reason_counts)
