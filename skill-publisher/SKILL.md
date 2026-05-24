# Skill Publisher

技能发布工具 — 一键生成技能、自动文档化、推送到 GitHub、注册到 SOLO 技能库。

## 功能特性

- **技能模板生成**：标准化目录结构 + 基础代码框架
- **自动 README**：根据技能信息自动生成完整文档
- **GitHub 推送**：自动 commit + push，支持 token 持久化
- **SOLO 注册**：自动注册到本地技能库，立即可用

## 使用方法

### 命令行

```bash
# 创建新技能
skill-publisher create my-skill --desc "我的技能描述" --type python

# 推送现有技能
skill-publisher push ./my-skill

# 配置 GitHub token（只需一次）
skill-publisher config --token ghp_xxxx
```

### 代码调用

```python
from skill_publisher import SkillPublisher

publisher = SkillPublisher()

# 创建并发布技能
publisher.create_and_publish(
    name="my-skill",
    description="技能描述",
    skill_type="python",
    github_repo="sfeng073-pixel/SF-skills"
)
```

## 配置

Token 存储位置：`~/.skill-publisher/token`

## 依赖

- Python 3.8+
- Git
