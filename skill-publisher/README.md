# Skill Publisher

技能发布工具 — 一键完成：生成技能 → 创建 README → 推送到 GitHub

## 功能特性

- **技能模板生成**：标准化目录结构 + 基础代码框架（支持 Python/Node.js）
- **自动 README**：根据技能信息自动生成完整文档
- **GitHub 推送**：自动 commit + push，支持 token 持久化存储
- **CLI 工具**：命令行操作，简单易用

## 安装

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 配置 GitHub Token（只需一次）

```bash
python -m skill_publisher.cli config --token ghp_xxxx
```

Token 会安全保存在 `~/.skill-publisher/token`

### 2. 创建新技能

```bash
# 创建 Python 技能
python -m skill_publisher.cli create my-skill --desc "我的技能描述"

# 创建 Node.js 技能
python -m skill_publisher.cli create my-skill --desc "我的技能描述" --type nodejs

# 创建并立即发布到 GitHub
python -m skill_publisher.cli create my-skill --desc "我的技能描述" --publish
```

### 3. 推送现有技能

```bash
python -m skill_publisher.cli push ./my-skill
```

### 4. 生成 README

```bash
python -m skill_publisher.cli readme ./my-skill
```

## 代码调用

```python
from skill_publisher import SkillPublisher

publisher = SkillPublisher()

# 配置 token
publisher.config('ghp_xxxx')

# 创建并发布技能（一键完成）
publisher.create_and_publish(
    name="my-skill",
    description="我的技能描述",
    skill_type="python"
)
```

## 生成的技能结构

```
my-skill/
├── my_skill/           # 技能模块
│   ├── __init__.py
│   └── my_skill.py     # 核心代码
├── SKILL.md            # 技能说明文档
├── README.md           # 使用文档（自动生成）
├── requirements.txt    # 依赖列表
└── example.py          # 使用示例
```

## 依赖

- Python 3.8+
- Git

## 作者

VIPTHINK Tech Team

## 许可证

MIT
