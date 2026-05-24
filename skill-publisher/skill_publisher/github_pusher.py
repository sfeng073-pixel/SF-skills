#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub 推送模块 - 自动 commit 和 push
"""

import os
import subprocess
from pathlib import Path
from typing import Optional


class GitHubPusher:
    """GitHub 推送器"""
    
    def __init__(self, token: str = None):
        self.token = token
    
    def push(self, skill_dir: str, repo_url: str, commit_msg: str = None) -> bool:
        """
        推送技能到 GitHub
        
        Args:
            skill_dir: 技能目录路径
            repo_url: GitHub 仓库 URL
            commit_msg: 提交信息
            
        Returns:
            bool: 是否推送成功
        """
        skill_path = Path(skill_dir)
        if not skill_path.exists():
            print(f"错误: 技能目录不存在 {skill_dir}")
            return False
        
        # 初始化 git 仓库
        git_dir = skill_path / '.git'
        if not git_dir.exists():
            if not self._run_git_command(skill_path, 'init'):
                return False
        
        # 配置远程仓库
        if self.token:
            # 使用 token 认证
            auth_url = repo_url.replace('https://', f'https://{self.token}@')
            self._run_git_command(skill_path, f'remote add origin {auth_url}')
        else:
            self._run_git_command(skill_path, f'remote add origin {repo_url}')
        
        # 添加所有文件
        if not self._run_git_command(skill_path, 'add .'):
            return False
        
        # 提交
        msg = commit_msg or f"feat: add {skill_path.name} skill"
        if not self._run_git_command(skill_path, f'commit -m "{msg}"'):
            # 可能没有变更需要提交
            pass
        
        # 推送
        if not self._run_git_command(skill_path, 'push -u origin main'):
            # 尝试 master 分支
            if not self._run_git_command(skill_path, 'push -u origin master'):
                return False
        
        return True
    
    def push_to_existing(self, skill_dir: str, repo_path: str, 
                         commit_msg: str = None) -> bool:
        """
        推送到已克隆的仓库
        
        Args:
            skill_dir: 技能目录路径
            repo_path: 本地仓库路径
            commit_msg: 提交信息
            
        Returns:
            bool: 是否推送成功
        """
        skill_path = Path(skill_dir)
        repo = Path(repo_path)
        
        # 复制技能到仓库
        target_dir = repo / skill_path.name
        if target_dir.exists():
            # 删除旧版本
            import shutil
            shutil.rmtree(target_dir)
        
        # 复制新技能
        import shutil
        shutil.copytree(skill_path, target_dir, ignore=shutil.ignore_patterns('.git'))
        
        # 提交并推送
        msg = commit_msg or f"feat: add {skill_path.name} skill"
        
        self._run_git_command(repo, 'add .')
        self._run_git_command(repo, f'commit -m "{msg}"')
        self._run_git_command(repo, 'push origin main')
        
        return True
    
    def _run_git_command(self, cwd: Path, command: str) -> bool:
        """执行 git 命令"""
        try:
            full_cmd = f'git {command}'
            result = subprocess.run(
                full_cmd,
                cwd=cwd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode != 0:
                # 忽略某些错误（如 remote 已存在、没有变更等）
                if 'already exists' in result.stderr or 'nothing to commit' in result.stderr:
                    return True
                print(f"Git 命令失败: {full_cmd}")
                print(f"错误: {result.stderr}")
                return False
            return True
        except Exception as e:
            print(f"执行 git 命令出错: {e}")
            return False
