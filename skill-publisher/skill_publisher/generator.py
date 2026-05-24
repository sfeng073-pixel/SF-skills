#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
技能生成器 - 创建标准化技能模板
"""

import os
from pathlib import Path
from typing import Dict


class SkillGenerator:
    """技能模板生成器"""
    
    # 技能类型模板
    TEMPLATES = {
        'python': {
            'dirs': ['{name}', '{name}/skill_publisher'],
            'files': {
                'SKILL.md': '''# {name}

> {description}

## 功能特性

- 特性1
- 特性2
- 特性3

## 使用方法

```python
from {name} import {class_name}

# 初始化
skill = {class_name}()

# 使用
result = skill.run()
```

## 依赖

- Python 3.8+
''',
                '{name}/__init__.py': '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
{name} - {description}
"""

from .{module_name} import {class_name}

__version__ = '1.0.0'
__all__ = ['{class_name}']
''',
                '{name}/{module_name}.py': '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
{name} 核心模块
"""


class {class_name}:
    """
    {description}
    """
    
    def __init__(self):
        pass
    
    def run(self):
        """主入口"""
        pass
''',
                'requirements.txt': '''# 依赖列表
''',
                'example.py': '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用示例
"""

from {name} import {class_name}


def main():
    skill = {class_name}()
    result = skill.run()
    print(result)


if __name__ == '__main__':
    main()
''',
            }
        },
        'nodejs': {
            'dirs': ['{name}'],
            'files': {
                'SKILL.md': '''# {name}

> {description}

## 功能特性

- 特性1
- 特性2
- 特性3

## 使用方法

```javascript
const {class_name} = require('./{name}');

// 初始化
const skill = new {class_name}();

// 使用
const result = skill.run();
```

## 依赖

- Node.js 16+
''',
                'index.js': '''#!/usr/bin/env node
/**
 * {name} - {description}
 */

class {class_name} {{
    constructor() {{
        // 初始化
    }}

    run() {{
        // 主逻辑
        return 'Hello from {name}';
    }}
}}

module.exports = {{ {class_name} }};

// CLI 入口
if (require.main === module) {{
    const skill = new {class_name}();
    console.log(skill.run());
}}
''',
                'package.json': '''{{
  "name": "{name}",
  "version": "1.0.0",
  "description": "{description}",
  "main": "index.js",
  "scripts": {{
    "start": "node index.js"
  }},
  "keywords": [],
  "author": "",
  "license": "MIT"
}}
''',
            }
        },
    }
    
    def generate(self, name: str, description: str, skill_type: str = 'python', 
                 output_dir: str = '.') -> str:
        """
        生成技能模板
        
        Args:
            name: 技能名称
            description: 技能描述
            skill_type: 技能类型 (python/nodejs)
            output_dir: 输出目录
            
        Returns:
            str: 生成的技能目录路径
        """
        if skill_type not in self.TEMPLATES:
            raise ValueError(f"不支持的技能类型: {skill_type}")
        
        template = self.TEMPLATES[skill_type]
        
        # 准备变量
        vars_dict = {
            'name': name,
            'description': description,
            'class_name': self._to_class_name(name),
            'module_name': self._to_module_name(name),
        }
        
        # 创建目录
        skill_dir = Path(output_dir) / name
        for dir_template in template['dirs']:
            dir_path = skill_dir / dir_template.format(**vars_dict)
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # 创建文件
        for file_template, content_template in template['files'].items():
            file_path = skill_dir / file_template.format(**vars_dict)
            content = content_template.format(**vars_dict)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        return str(skill_dir)
    
    def _to_class_name(self, name: str) -> str:
        """转换为类名（驼峰式）"""
        parts = name.replace('-', '_').split('_')
        return ''.join(p.capitalize() for p in parts)
    
    def _to_module_name(self, name: str) -> str:
        """转换为模块名"""
        return name.replace('-', '_').lower()
