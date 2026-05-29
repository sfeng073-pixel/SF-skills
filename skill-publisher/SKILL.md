---
name: skill-publisher
version: 1.1.0
description: "技能发布工具。一键生成技能模板、自动文档化、推送到 GitHub、注册到 SOLO 技能库。支持变更检测、版本标签。触发词：发布技能、创建技能、推送技能、同步到GitHub、更新到仓库。"
metadata:
  requires:
    bins: ["python3", "git"]
---

# Skill Publisher — 技能发布工具 v1.1

> 一键生成技能、自动文档化、推送到 GitHub、注册到 SOLO 技能库

## 功能特性

- **技能模板生成**：标准化目录结构 + 基础代码框架
- **自动 README**：根据技能信息自动生成完整文档
- **GitHub 推送**：自动 commit + push，支持 token 持久化
- **SOLO 注册**：自动注册到本地技能库，立即可用
- **变更检测**：对比本地技能和 GitHub 仓库的差异（合并自 github-sync）
- **版本标签**：推送时可选打 git tag

## 使用方法

### 命令行

```bash
# 创建新技能
skill-publisher create my-skill --desc "我的技能描述" --type python

# 推送现有技能
skill-publisher push ./my-skill

# 推送并打标签
skill-publisher push ./my-skill --tag 2.4

# 检测变更状态
skill-publisher status

# 同步所有有变更的技能
skill-publisher sync-all

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

# 检测变更
changes = publisher.detectChanges()

# 同步指定技能
result = publisher.sync("smartbi-export", tag="2.4")

# 同步所有变更
all_result = publisher.sync_all()
```

## 工作流程

1. **创建技能**（可选）- 使用模板生成标准化目录结构
2. **变更检测** - 对比本地技能和 GitHub 仓库的差异
3. **自动文档** - 根据技能信息生成 README
4. **克隆仓库** - 克隆到临时目录
5. **复制文件** - 将本地技能文件覆盖到仓库对应位置
6. **提交推送** - 自动 commit + push 到 GitHub
7. **打标签**（可选）- 创建版本标签
8. **SOLO 注册** - 注册到本地技能库

## 配置

- Token 存储位置：`~/.skill-publisher/token`
- 仓库配置：`skill-publisher/config.json`（本地文件，不推送到 GitHub）

## 依赖

- Python 3.8+
- Git
