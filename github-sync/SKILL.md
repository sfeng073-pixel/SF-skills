---
name: github-sync
version: 1.0.0
description: "GitHub 技能同步工具。当用户需要将本地技能推送到 GitHub、同步代码到仓库、更新 GitHub 上的技能时使用。触发词：推送到GitHub、同步到GitHub、更新到仓库、GitHub同步、git push等。"
---

# GitHub Sync — 技能同步到 GitHub

> 自动检测技能变更，一键推送到 GitHub 仓库

## 触发条件

- 用户说"推送到GitHub"、"同步到GitHub"
- 用户说"更新到仓库"、"git push"
- 用户说"同步技能"、"发布技能"

## 技能位置

```
/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/github-sync-skill/
```

## 使用方法

### 方式一：命令行

```bash
cd /sessions/69fc6f10c9b3ac3b7bf544d9/workspace/github-sync-skill

# 检测变更状态
node index.js status

# 同步指定技能
node index.js sync smartbi-export

# 同步并打标签
node index.js sync smartbi-export --tag 2.4

# 同步所有有变更的技能
node index.js sync-all
```

### 方式二：代码调用

```javascript
const GitHubSync = require('/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/github-sync-skill');

const sync = new GitHubSync();

// 检测变更
const changes = sync.detectChanges();

// 同步指定技能
const result = await sync.sync('smartbi-export', { tag: '2.4' });

// 同步所有变更
const allResult = await sync.syncAll();
```

## 工作流程

1. **检测变更** - 对比本地技能和 GitHub 仓库的差异
2. **克隆仓库** - 克隆到临时目录
3. **复制文件** - 将本地技能文件覆盖到仓库对应位置
4. **提交推送** - 自动 commit 并 push 到 GitHub
5. **打标签**（可选）- 创建版本标签

## 配置文件

### config.json

```json
{
    "repo": "https://github.com/sfeng073-pixel/SF-skills.git",
    "branch": "main",
    "author": "sfeng073-pixel",
    "email": "sfeng073-pixel@users.noreply.github.com",
    "skillsRoot": "/mnt/appuserdata/skills",
    "workspaceRoot": "/sessions/69fc6f10c9b3ac3b7bf544d9/workspace"
}
```

### .token

存储 GitHub Personal Access Token（classic 类型，需勾选 repo 权限）

## 示例对话

**用户**: 把 smartbi-export 推送到 GitHub

**AI**: 好的，正在同步 smartbi-export 到 GitHub...

**AI**: 推送成功！commit: 582bb2d

---

**用户**: 检查一下哪些技能有更新

**AI**: 检测结果：
- 修改: smartbi-export
- 新增: github-sync
- 删除: 无

需要我帮你推送吗？
