#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主分析器模块
整合解析、质检、话术提取功能
"""

import os
from typing import List, Dict, Optional
from .parser import ChatParser
from .compliance_checker import ComplianceChecker
from .speech_extractor import SpeechExtractor


class LineChatAnalyzer:
    """
    LINE聊天记录分析器
    
    整合功能：
    - 聊天记录解析
    - 签单后SOP合规质检
    - 话术提炼与优秀案例提取
    """
    
    def __init__(self):
        self.parser = ChatParser()
        self.compliance_checker = ComplianceChecker()
        self.speech_extractor = SpeechExtractor()
    
    def analyze_file(self, file_path: str) -> Dict:
        """
        分析单个聊天记录文件
        
        Args:
            file_path: CSV文件路径
            
        Returns:
            Dict: 分析结果
        """
        # 1. 解析文件
        success = self.parser.parse_csv(file_path)
        if not success:
            return {
                'filename': os.path.basename(file_path),
                'error': '解析失败',
            }
        
        # 2. 获取文本内容
        staff_text = self.parser.get_all_staff_text()
        all_text = self.parser.get_all_text()
        filename = os.path.basename(file_path)
        
        # 3. 合规性检查
        compliance_result = self.compliance_checker.check_compliance(
            staff_text, all_text, filename
        )
        
        # 4. 话术提取
        success_cases = self.speech_extractor.extract_success_cases(
            self.parser.messages,
            compliance_result.get('is_signed', False)
        )
        
        # 5. 组装结果
        result = {
            'filename': filename,
            'metadata': self.parser.metadata,
            'message_count': len(self.parser.messages),
            'staff_message_count': len(self.parser.get_staff_messages()),
            'user_message_count': len(self.parser.get_user_messages()),
            'compliance': compliance_result,
            'success_cases': success_cases,
            'success_case_count': len(success_cases),
        }
        
        return result
    
    def analyze_directory(self, directory: str, filter_func: Optional[callable] = None) -> List[Dict]:
        """
        批量分析目录中的所有CSV文件
        
        Args:
            directory: 目录路径
            filter_func: 可选的文件过滤函数
            
        Returns:
            List[Dict]: 所有文件的分析结果
        """
        results = []
        
        for filename in os.listdir(directory):
            if not filename.endswith('.csv'):
                continue
            
            if filter_func and not filter_func(filename):
                continue
            
            file_path = os.path.join(directory, filename)
            result = self.analyze_file(file_path)
            results.append(result)
        
        return results
    
    def generate_compliance_report(self, results: List[Dict], output_file: Optional[str] = None) -> str:
        """
        生成质检报告
        
        Args:
            results: 分析结果列表
            output_file: 可选的输出文件路径
            
        Returns:
            str: 报告内容
        """
        # 过滤掉解析失败的
        valid_results = [r for r in results if 'error' not in r]
        
        # 提取合规检查结果
        compliance_results = [r['compliance'] for r in valid_results if 'compliance' in r]
        
        # 生成报告
        report = self.compliance_checker.generate_report(compliance_results)
        
        # 添加详细列表
        report += '\n\n' + '=' * 80 + '\n'
        report += '详细检查结果\n'
        report += '=' * 80 + '\n'
        
        for i, result in enumerate(valid_results, 1):
            comp = result.get('compliance', {})
            report += f"\n{i}. {result['filename']}\n"
            report += f"   已报名: {'是' if comp.get('is_signed') else '否'}\n"
            report += f"   入学指南: {'✓' if comp.get('has_enrollment_guide') else '✗'}\n"
            report += f"   打卡沟通: {'✓' if comp.get('has_checkin') else '✗'}\n"
            report += f"   状态: {comp.get('compliance_status', '未知')}\n"
        
        # 保存到文件
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)
        
        return report
    
    def generate_training_document(self, results: List[Dict], output_file: Optional[str] = None) -> str:
        """
        生成销售培训文档
        
        Args:
            results: 分析结果列表
            output_file: 可选的输出文件路径
            
        Returns:
            str: 培训文档内容
        """
        # 收集所有成功案例
        all_success_cases = []
        for result in results:
            cases = result.get('success_cases', [])
            all_success_cases.extend(cases)
        
        # 生成培训文档
        doc = self.speech_extractor.generate_training_doc(all_success_cases)
        
        # 保存到文件
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(doc)
        
        return doc
    
    def filter_by_date(self, results: List[Dict], year: int, month: int) -> List[Dict]:
        """
        按日期筛选结果
        
        Args:
            results: 分析结果列表
            year: 年份
            month: 月份
            
        Returns:
            List[Dict]: 筛选后的结果
        """
        date_prefix = f"{year}{month:02d}"
        return [r for r in results if date_prefix in r.get('filename', '')]
    
    def filter_signed_users(self, results: List[Dict]) -> List[Dict]:
        """
        筛选已报名用户
        
        Args:
            results: 分析结果列表
            
        Returns:
            List[Dict]: 已报名用户的结果
        """
        return [
            r for r in results
            if r.get('compliance', {}).get('is_signed', False)
        ]
    
    def filter_non_compliant(self, results: List[Dict]) -> List[Dict]:
        """
        筛选不合规的用户
        
        Args:
            results: 分析结果列表
            
        Returns:
            List[Dict]: 不合规用户的结果
        """
        return [
            r for r in results
            if r.get('compliance', {}).get('compliance_status') != '完全合规'
        ]
