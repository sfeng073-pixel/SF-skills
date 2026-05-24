# CC通时通次自动播报技能

> 自动从SmartBI导出通时通次数据，筛选台湾CC小组及个人数据，定时推送到钉钉群

## 功能特性

- ✅ **自动数据获取** - 调用smartbi-export技能从SmartBI导出报表
- ✅ **智能数据筛选** - 自动筛选台湾CC小组及个人明细数据
- ✅ **Markdown表格推送** - 生成清晰的Markdown表格推送到钉钉
- ✅ **定时任务支持** - 每天3次自动播报（14:00、18:30、21:30）
- ✅ **灵活配置** - 支持自定义报表、筛选条件、推送时间

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/cc-call-report-skill.git
cd cc-call-report-skill
```

### 2. 安装依赖

```bash
npm install
```

**前置依赖**：需要预先安装 [smartbi-export](https://github.com/your-username/smartbi-export) 技能

### 3. 配置钉钉Webhook

编辑 `config.json`，填入你的钉钉机器人Webhook和密钥：

```json
{
    "dingtalk": {
        "webhook": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN",
        "secret": "SECxxxxxxxxxx"
    }
}
```

### 4. 测试运行

```bash
# 测试模式（不推送到钉钉，只打印消息）
node index.js --test

# 正式运行（推送到钉钉群）
node index.js
```

## 配置说明

### config.json 完整配置

```json
{
    "smartbi": {
        "reportName": "益智CC日通时通次监控",
        "reportAlias": "CC通时通次"
    },
    "dingtalk": {
        "webhook": "YOUR_DINGTALK_WEBHOOK_URL",
        "secret": "YOUR_DINGTALK_SECRET"
    },
    "schedule": {
        "times": ["14:00", "18:30", "21:30"],
        "timezone": "Asia/Shanghai"
    },
    "dataProcess": {
        "filterBy": "台湾",
        "sortField": "人均通时",
        "sortOrder": "desc"
    }
}
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `smartbi.reportName` | SmartBI报表名称 | 益智CC日通时通次监控 |
| `dingtalk.webhook` | 钉钉机器人Webhook地址 | - |
| `dingtalk.secret` | 钉钉加签密钥（可选） | - |
| `schedule.times` | 定时推送时间点 | 14:00, 18:30, 21:30 |
| `dataProcess.filterBy` | 数据筛选关键词 | 台湾 |
| `dataProcess.sortField` | 排序字段 | 人均通时 |

## 创建钉钉机器人

1. 打开钉钉群 → 群设置 → 智能群助手 → 添加机器人
2. 选择"自定义"机器人
3. 设置机器人名称（如：CC通时通次播报）
4. 安全设置选择"加签"，复制密钥
5. 复制Webhook地址
6. 将Webhook和密钥填入 `config.json`

## 定时任务配置

### 方式一：使用系统 cron（Linux/Mac）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天14:00、18:30、21:30执行）
0 14 * * * cd /path/to/cc-call-report-skill && node index.js >> logs/cron.log 2>&1
30 18 * * * cd /path/to/cc-call-report-skill && node index.js >> logs/cron.log 2>&1
30 21 * * * cd /path/to/cc-call-report-skill && node index.js >> logs/cron.log 2>&1
```

### 方式二：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 创建配置文件 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
    apps: [{
        name: 'cc-call-report',
        script: './index.js',
        cron_restart: '0 14,30 18,30 21 * * *',
        autorestart: false,
        log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }]
};
EOF

# 启动
pm2 start ecosystem.config.js
```

### 方式三：使用 GitHub Actions

已配置 `.github/workflows/daily-report.yml`，支持GitHub Actions定时执行：

```yaml
name: Daily CC Call Report
on:
  schedule:
    - cron: '0 6 * * *'      # 14:00 CST
    - cron: '30 10 * * *'    # 18:30 CST
    - cron: '30 13 * * *'    # 21:30 CST
  workflow_dispatch:
```

**注意**：需要在GitHub仓库Settings → Secrets中配置：
- `DINGTALK_WEBHOOK`
- `DINGTALK_SECRET`

## 推送消息示例

```markdown
## 📊 台湾CC通时通次播报

**数据日期**: 05/24 | **数据时间**: 2026/5/24 16:11:52

### 📈 小组汇总

| 小组 | 通时目标 | 人均通时 | 通时达标率 | 通次目标 | 人均通次 | 通次达标率 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 台湾CC02组 | 35 | 36.53 | 104.4% | 60 | 48 | 80.0% |

### 👥 个人明细（按个人通时排序）

| 排名 | 姓名 | 通时目标 | 个人通时 | 通时达标率 | 通次目标 | 个人通次 | 通次达标率 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 🥇 | 杨萍 | 35 | 90.65 | 259.0% | 60 | 53 | 88.3% |
| 🥈 | 林鸿池 | 35 | 68.27 | 195.1% | 60 | 24 | 40.0% |
| 🥉 | 林佩盈 | 35 | 62.48 | 178.5% | 60 | 58 | 96.7% |
| ... | ... | ... | ... | ... | ... | ... |

---
⏰ 数据更新时间: 2026/5/24 16:11:52 | 数据来源: SmartBI
```

## 文件结构

```
cc-call-report-skill/
├── index.js              # 主流程入口
├── data-processor.js     # 数据处理模块
├── dingtalk-pusher.js    # 钉钉推送模块
├── image-generator.js    # 图片生成模块（备用）
├── config.json           # 配置文件
├── package.json          # 依赖配置
├── README.md             # 使用说明
├── SKILL.md              # 技能文档
├── LICENSE               # MIT许可证
├── .gitignore            # Git忽略文件
└── .github/
    └── workflows/
        └── daily-report.yml  # GitHub Actions定时任务
```

## API 接口

### 作为模块使用

```javascript
const CCCallReportSkill = require('./index');

const skill = new CCCallReportSkill({
    configPath: '/path/to/config.json'
});

// 执行完整流程
const result = await skill.run();

// 测试模式（不推送）
const result = await skill.run({ test: true });
```

### 单独使用数据处理模块

```javascript
const DataProcessor = require('./data-processor');

const processor = new DataProcessor({
    filterBy: '台湾',
    sortField: '人均通时'
});

const data = processor.process('/path/to/excel.xlsx');
console.log(data.formattedTeamData);      // 小组汇总
console.log(data.formattedPersonalData);  // 个人明细
```

### 单独使用钉钉推送模块

```javascript
const DingTalkPusher = require('./dingtalk-pusher');

const pusher = new DingTalkPusher({
    webhook: 'YOUR_WEBHOOK',
    secret: 'YOUR_SECRET'
});

// 发送Markdown
await pusher.sendMarkdown('标题', 'Markdown内容');

// 发送文本
await pusher.sendText('文本内容');
```

## 依赖

- **Node.js** >= 14.0
- **smartbi-export** - SmartBI报表导出技能（需要预先安装）
- **xlsx** - Excel文件解析

## 故障排查

### 导出失败

1. 检查 smartbi-export 技能是否正确安装
2. 检查报表名称 `config.json` 中的 `smartbi.reportName` 是否正确
3. 检查网络连接和SmartBI访问权限

### 钉钉推送失败

1. 检查 Webhook 地址是否正确
2. 如果使用加签，检查密钥是否正确
3. 检查消息内容是否超过钉钉限制（Markdown消息约20KB）

### 数据处理异常

1. 检查Excel文件是否有数据
2. 检查 `filterBy` 配置是否匹配报表中的小组名称
3. 查看测试模式输出，确认数据解析是否正常

## 更新日志

### v2.1.0 (2024-05-24)

- 改为Markdown表格推送，更清晰易读
- 支持完整个人明细数据展示（19人）
- 优化数据排序和格式化

### v2.0.0 (2024-05-24)

- 支持图片生成和推送
- 支持小组汇总+个人明细双表格
- 支持达标率颜色标识

### v1.0.0 (2024-05-24)

- 初始版本
- 支持SmartBI数据导出
- 支持团队汇总排名
- 支持钉钉Markdown推送
- 支持定时任务配置

## 许可证

MIT License

Copyright (c) 2024 CC Call Report Skill

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
