#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主发布器 - 整合所有功能
"""

import os
import shutil
from pathlib import Path
from typing import Optional

from .token_manager import TokenManager
from .generator import SkillGenerator
from .readme_generator import ReadmeGenerator
from .github_pusher import GitHubPusher


class SkillPublisher:
    """
    技能发布器
    
    一键完成：生成技能 → 创建 README → 推送到 GitHub
    """
    
    def __init__(self, github_repo: str = None):
        """
        初始化发布器
        
        Args:
            github_repo: GitHub 仓库地址，如 "sfeng073-pixel/SF-skills"
        """
        self.token_manager = TokenManager()
        self.generator = SkillGenerator()
        self.readme_generator = ReadmeGenerator()
        self.github_repo = github_repo or "sfeng073-pixel/SF-skills"
        self.github_url = f"https://github.com/{self.github_repo}"
    
    def create(self, name: str, description: str, skill_type: str = 'python',
               output_dir: str = '.') -> str:
        """
        创建新技能
        
        Args:
            name: 技能名称
            description: 技能描述
            skill_type: 技能类型 (python/nodejs)
            output_dir: 输出目录
            
        Returns:
            str: 技能目录路径
        """
        # 1. 生成技能模板
        skill_dir = self.generator.generate(name, description, skill_type, output_dir)
        
        # 2. 生成 README
        self.readme_generator.generate_for_skill(skill_dir)
        
        print(f"✅ 技能创建成功: {skill_dir}")
        return skill_dir
    
    def push(self, skill_dir: str, commit_msg: str = None) -> bool:
        """
        推送技能到 GitHub
        
        Args:
            skill_dir: 技能目录路径
            commit_msg: 提交信息
            
        Returns:
            bool: 是否推送成功
        """
        # 加载 token
        token = self.token_manager.load_token()
        if not token:
            print("⚠️ 未配置 GitHub token，请先调用 config() 方法配置")
            return False
        
        # 克隆仓库到临时目录
        import tempfile
        import subprocess
        
        with tempfile.TemporaryDirectory() as tmpdir:
            repo_path = Path(tmpdir) / 'repo'
            
            # 克隆仓库
            auth_url = f"https://{token}@github.com/{self.github_repo}.git"
            result = subprocess.run(
                f"git clone {auth_url} {repo_path}",
                shell=True,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"克隆仓库失败: {result.stderr}")
                return False
            
            # 使用 GitHubPusher 推送
            pusher = GitHubPusher(token)
            success = pusher.push_to_existing(skill_dir, str(repo_path), commit_msg)
            
            if success:
                skill_name = Path(skill_dir).name
                print(f"✅ 推送成功: {self.github_url}/tree/main/{skill_name}")
            
            return success
    
    def create_and_publish(self, name: str, description: str, 
                           skill_type: str = 'python',
                           output_dir: str = '.') -> bool:
        """
        创建并发布技能（一键完成）
        
        Args:
            name: 技能名称
            description: 技能描述
            skill_type: 技能类型
            output_dir: 输出目录
            
        Returns:
            bool: 是否成功
        """
        # 1. 创建技能
        skill_dir = self.create(name, description, skill_type, output_dir)
        
        # 2. 推送到 GitHub
        return self.push(skill_dir, f"feat: add {name} skill v1.0.0")
    
    def config(self, token: str = None) -> bool:
        """
        配置 GitHub token
        
        Args:
            token: GitHub Personal Access Token，如果不传则尝试加载已保存的
            
        Returns:
            bool: 是否配置成功
        """
        if token:
            if self.token_manager.save_token(token):
                print("✅ GitHub token 已保存")
                return True
            return False
        else:
            if self.token_manager.has_token():
                print("✅ GitHub token 已配置")
                return True
            else:
                print("⚠️ 未配置 GitHub token")
                return False
    
    def generate_readme(self, skill_dir: str) -> str:
        """
        为技能生成 README
        
        Args:
            skill_dir: 技能目录路径
            
        Returns:
            str: README 内容
        """
        return self.readme_generator.generate_for_skill(skill_dir)
