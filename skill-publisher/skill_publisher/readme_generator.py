#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
README 生成器 - 自动创建技能文档
"""

from pathlib import Path
from typing import List, Optional


class ReadmeGenerator:
    """README 文档生成器"""
    
    def generate(self, name: str, description: str, features: List[str] = None,
                 usage_example: str = None, dependencies: List[str] = None,
                 output_path: str = None) -> str:
        """
        生成 README.md 内容
        
        Args:
            name: 技能名称
            description: 技能描述
            features: 功能特性列表
            usage_example: 使用示例代码
            dependencies: 依赖列表
            output_path: 输出文件路径（可选）
            
        Returns:
            str: README 内容
        """
        lines = [
            f"# {name}",
            "",
            f"> {description}",
            "",
        ]
        
        # 功能特性
        if features:
            lines.extend([
                "## 功能特性",
                "",
            ])
            for feature in features:
                lines.append(f"- {feature}")
            lines.append("")
        
        # 使用方法
        lines.extend([
            "## 使用方法",
            "",
        ])
        
        if usage_example:
            lines.extend([usage_example, ""])
        else:
            lines.extend([
                "```python",
                f"from {name} import Skill",
                "",
                "skill = Skill()",
                "result = skill.run()",
                "```",
                "",
            ])
        
        # 安装
        lines.extend([
            "## 安装",
            "",
            "```bash",
            f"pip install -r requirements.txt",
            "```",
            "",
        ])
        
        # 依赖
        if dependencies:
            lines.extend([
                "## 依赖",
                "",
            ])
            for dep in dependencies:
                lines.append(f"- {dep}")
            lines.append("")
        
        # 作者和许可证
        lines.extend([
            "## 作者",
            "",
            "VIPTHINK Tech Team",
            "",
            "## 许可证",
            "",
            "MIT",
            "",
        ])
        
        content = '\n'.join(lines)
        
        # 保存到文件
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        return content
    
    def generate_for_skill(self, skill_dir: str) -> str:
        """
        为现有技能生成 README
        
        Args:
            skill_dir: 技能目录路径
            
        Returns:
            str: README 内容
        """
        skill_path = Path(skill_dir)
        name = skill_path.name
        
        # 尝试从 SKILL.md 读取描述
        skill_md = skill_path / 'SKILL.md'
        description = f"{name} 技能"
        if skill_md.exists():
            with open(skill_md, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for line in lines[:5]:
                    if line.strip() and not line.startswith('#'):
                        description = line.strip().strip('>').strip()
                        break
        
        # 检查是否有 requirements.txt
        requirements = skill_path / 'requirements.txt'
        dependencies = []
        if requirements.exists():
            with open(requirements, 'r', encoding='utf-8') as f:
                dependencies = [l.strip() for l in f if l.strip() and not l.startswith('#')]
        
        # 生成 README
        output_path = skill_path / 'README.md'
        return self.generate(
            name=name,
            description=description,
            dependencies=dependencies,
            output_path=output_path
        )
