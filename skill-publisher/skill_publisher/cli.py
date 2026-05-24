#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CLI 入口 - 命令行工具
"""

import argparse
import sys
from .publisher import SkillPublisher


def main():
    parser = argparse.ArgumentParser(
        description='Skill Publisher - 技能发布工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 配置 GitHub token（只需一次）
  skill-publisher config --token ghp_xxxx

  # 创建新技能
  skill-publisher create my-skill --desc "我的技能描述"

  # 创建并立即发布
  skill-publisher create my-skill --desc "我的技能描述" --publish

  # 推送现有技能
  skill-publisher push ./my-skill
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # config 命令
    config_parser = subparsers.add_parser('config', help='配置 GitHub token')
    config_parser.add_argument('--token', required=True, help='GitHub Personal Access Token')
    config_parser.add_argument('--repo', default='sfeng073-pixel/SF-skills', help='GitHub 仓库')
    
    # create 命令
    create_parser = subparsers.add_parser('create', help='创建新技能')
    create_parser.add_argument('name', help='技能名称')
    create_parser.add_argument('--desc', required=True, help='技能描述')
    create_parser.add_argument('--type', default='python', choices=['python', 'nodejs'], help='技能类型')
    create_parser.add_argument('--output', default='.', help='输出目录')
    create_parser.add_argument('--publish', action='store_true', help='创建后立即发布')
    
    # push 命令
    push_parser = subparsers.add_parser('push', help='推送技能到 GitHub')
    push_parser.add_argument('skill_dir', help='技能目录路径')
    push_parser.add_argument('--msg', help='提交信息')
    
    # readme 命令
    readme_parser = subparsers.add_parser('readme', help='为技能生成 README')
    readme_parser.add_argument('skill_dir', help='技能目录路径')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    publisher = SkillPublisher()
    
    if args.command == 'config':
        publisher.config(args.token)
        return 0
    
    elif args.command == 'create':
        skill_dir = publisher.create(args.name, args.desc, args.type, args.output)
        
        if args.publish:
            success = publisher.push(skill_dir)
            return 0 if success else 1
        return 0
    
    elif args.command == 'push':
        success = publisher.push(args.skill_dir, args.msg)
        return 0 if success else 1
    
    elif args.command == 'readme':
        publisher.generate_readme(args.skill_dir)
        print(f"✅ README 已生成: {args.skill_dir}/README.md")
        return 0
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
