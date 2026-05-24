#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Token 管理模块 - 安全存储 GitHub Personal Access Token
"""

import os
from pathlib import Path


class TokenManager:
    """GitHub Token 管理器"""
    
    def __init__(self):
        self.config_dir = Path.home() / '.skill-publisher'
        self.token_file = self.config_dir / 'token'
    
    def save_token(self, token: str) -> bool:
        """
        保存 GitHub token
        
        Args:
            token: GitHub Personal Access Token
            
        Returns:
            bool: 是否保存成功
        """
        try:
            # 创建配置目录
            self.config_dir.mkdir(parents=True, exist_ok=True)
            
            # 保存 token（简单明文存储，生产环境建议加密）
            with open(self.token_file, 'w', encoding='utf-8') as f:
                f.write(token)
            
            # 设置文件权限（仅当前用户可读）
            os.chmod(self.token_file, 0o600)
            
            return True
        except Exception as e:
            print(f"保存 token 失败: {e}")
            return False
    
    def load_token(self) -> str:
        """
        加载 GitHub token
        
        Returns:
            str: token 字符串，如果不存在返回空字符串
        """
        try:
            if self.token_file.exists():
                with open(self.token_file, 'r', encoding='utf-8') as f:
                    return f.read().strip()
            return ""
        except Exception as e:
            print(f"加载 token 失败: {e}")
            return ""
    
    def has_token(self) -> bool:
        """检查是否已保存 token"""
        return self.token_file.exists() and self.load_token() != ""
    
    def delete_token(self) -> bool:
        """删除保存的 token"""
        try:
            if self.token_file.exists():
                self.token_file.unlink()
            return True
        except Exception as e:
            print(f"删除 token 失败: {e}")
            return False
