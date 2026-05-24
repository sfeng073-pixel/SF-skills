# GitHub 上传指南

## 方式一：命令行上传（推荐）

### 1. 在 GitHub 创建新仓库

1. 登录 GitHub: https://github.com
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - Repository name: `cc-call-report-skill`
   - Description: `CC通时通次自动播报技能 - 从SmartBI导出数据，定时推送到钉钉群`
   - 选择 "Public" 或 "Private"
   - 勾选 "Add a README file"（可选，我们已有README）
   - 点击 "Create repository"

### 2. 本地初始化并上传

```bash
# 进入技能目录
cd /path/to/cc-call-report-skill

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: CC通时通次自动播报技能 v2.1.0

- 自动从SmartBI导出通时通次数据
- 筛选台湾CC小组及个人明细数据
- Markdown表格格式推送到钉钉群
- 支持定时任务（每天14:00、18:30、21:30）
- 完整文档和配置说明"

# 添加远程仓库（替换 YOUR_USERNAME 为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/cc-call-report-skill.git

# 推送到 GitHub
git push -u origin main
```

### 3. 验证上传

访问 `https://github.com/YOUR_USERNAME/cc-call-report-skill` 查看仓库

---

## 方式二：GitHub Desktop 上传

1. 下载安装 GitHub Desktop: https://desktop.github.com
2. 打开 GitHub Desktop
3. File → Add local repository
4. 选择 `cc-call-report-skill` 文件夹
5. 填写提交信息，点击 "Commit to main"
6. 点击 "Publish repository"
7. 填写仓库名称，选择 Public/Private，点击 "Publish Repository"

---

## 方式三：直接上传文件（最简单）

1. 在 GitHub 创建新仓库（不要初始化README）
2. 进入仓库页面
3. 点击 "uploading an existing file" 链接
4. 拖拽或选择 `cc-call-report-skill` 文件夹中的所有文件
5. 填写提交信息
6. 点击 "Commit changes"

---

## 配置 GitHub Actions（可选）

上传后，需要在 GitHub 配置 Secrets 才能使用 GitHub Actions 定时任务：

1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加以下 Secrets：
   - Name: `DINGTALK_WEBHOOK`
   - Value: 你的钉钉Webhook地址
   
   - Name: `DINGTALK_SECRET`
   - Value: 你的钉钉加签密钥

---

## 上传前检查清单

- [ ] 已删除敏感信息（config.json 中的 webhook 和 secret 已改为占位符）
- [ ] 已删除临时文件（.png, .jpg, .xlsx 等）
- [ ] README.md 内容完整
- [ ] 本地测试通过（`node index.js --test`）
- [ ] .gitignore 配置正确

---

## 上传后的仓库地址

上传成功后，你的仓库地址将是：
```
https://github.com/YOUR_USERNAME/cc-call-report-skill
```

可以分享给他人使用！
