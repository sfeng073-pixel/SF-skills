#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
聊天记录解析模块
支持LINE官方账号导出的CSV格式
"""

import os
import re
import chardet
from typing import List, Dict, Tuple, Optional


class Message:
    """单条消息对象"""
    
    def __init__(self, sender_type: str, sender_name: str, date: str, time: str, content: str):
        self.sender_type = sender_type  # Account/User
        self.sender_name = sender_name
        self.date = date
        self.time = time
        self.content = content
        self.is_staff = self._check_is_staff()
    
    def _check_is_staff(self) -> bool:
        """判断是否为客服/工作人员消息"""
        return ('Account' in self.sender_type or 
                'Account' in self.sender_name or
                'Staff' in self.sender_type or
                'Staff' in self.sender_name or
                '老師' in self.sender_name or
                '老师' in self.sender_name)
    
    def __repr__(self):
        return f"Message({self.sender_name}: {self.content[:50]}...)"


class ChatParser:
    """LINE聊天记录解析器"""
    
    def __init__(self):
        self.messages: List[Message] = []
        self.metadata: Dict = {}
    
    def detect_encoding(self, file_path: str) -> str:
        """检测文件编码"""
        with open(file_path, 'rb') as f:
            raw_data = f.read(10000)
            result = chardet.detect(raw_data)
            return result['encoding'] or 'utf-8'
    
    def parse_csv(self, file_path: str) -> bool:
        """
        解析CSV文件
        
        Args:
            file_path: CSV文件路径
            
        Returns:
            bool: 解析是否成功
        """
        try:
            encoding = self.detect_encoding(file_path)
            
            with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
                content = f.read()
            
            lines = content.split('\n')
            if len(lines) < 5:
                return False
            
            # 解析头部元数据
            self.metadata = self._parse_header(lines[:4])
            
            # 解析消息内容
            self.messages = []
            for line in lines[4:]:
                message = self._parse_line(line)
                if message:
                    self.messages.append(message)
            
            return True
            
        except Exception as e:
            print(f"解析文件失败 {file_path}: {str(e)}")
            return False
    
    def _parse_header(self, header_lines: List[str]) -> Dict:
        """解析文件头部元数据"""
        metadata = {}
        for line in header_lines:
            if ',' in line:
                key, value = line.split(',', 1)
                metadata[key.strip()] = value.strip().strip("'")
        return metadata
    
    def _parse_line(self, line: str) -> Optional[Message]:
        """解析单行消息"""
        line = line.strip()
        if not line:
            return None
        
        # CSV解析（处理引号内的逗号）
        parts = self._split_csv_line(line)
        
        if len(parts) >= 5:
            sender_type = parts[0].strip()
            sender_name = parts[1].strip()
            date = parts[2].strip()
            time = parts[3].strip()
            content = parts[4].strip().strip('"')
            
            if content and content != 'nan':
                return Message(sender_type, sender_name, date, time, content)
        
        return None
    
    def _split_csv_line(self, line: str) -> List[str]:
        """分割CSV行（处理引号）"""
        parts = []
        current = ''
        in_quotes = False
        
        for ch in line:
            if ch == '"':
                in_quotes = not in_quotes
            elif ch == ',' and not in_quotes:
                parts.append(current)
                current = ''
            else:
                current += ch
        
        parts.append(current)
        return parts
    
    def get_staff_messages(self) -> List[Message]:
        """获取所有客服消息"""
        return [m for m in self.messages if m.is_staff]
    
    def get_user_messages(self) -> List[Message]:
        """获取所有用户消息"""
        return [m for m in self.messages if not m.is_staff]
    
    def get_all_staff_text(self) -> str:
        """获取所有客服消息的合并文本"""
        return '\n'.join(m.content for m in self.get_staff_messages())
    
    def get_all_user_text(self) -> str:
        """获取所有用户消息的合并文本"""
        return '\n'.join(m.content for m in self.get_user_messages())
    
    def get_all_text(self) -> str:
        """获取所有消息的合并文本"""
        return '\n'.join(m.content for m in self.messages)
    
    def extract_date_range(self, filename: str) -> Tuple[str, str]:
        """从文件名提取日期范围"""
        # 文件名格式: ID_开始日期_结束日期_备注.csv
        parts = os.path.basename(filename).split('_')
        if len(parts) >= 3:
            return parts[1], parts[2]
        return '', ''
    
    def is_may_2025(self, filename: str) -> bool:
        """判断是否为2025年5月的数据"""
        start_date, end_date = self.extract_date_range(filename)
        return '202505' in start_date or '202505' in end_date
