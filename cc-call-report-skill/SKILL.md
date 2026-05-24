# CC通时通次自动播报技能

> 自动从SmartBI导出通时通次数据，按团队汇总排名，定时推送到钉钉群

## 功能特性

- ✅ 自动调用 smartbi-export 技能导出数据
- ✅ 智能字段检测，兼容不同报表格式
- ✅ 按团队汇总排名，支持自定义TopN
- ✅ 生成美观的Markdown播报消息
- ✅ 推送到钉钉群（支持加签安全验证）
- ✅ 支持定时任务（每天3次：14:00、18:30、21:30）

## 快速开始

### 1. 安装依赖

```bash
cd cc-call-report-skill
npm install
```

### 2. 配置钉钉Webhook

编辑 `config.json`，填入你的钉钉机器人Webhook和密钥：

```json
{
    "dingtalk": {
        "webhook": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN",
        "secret": "YOUR_SECRET"
    }
}
```

### 3. 测试运行

```bash
# 测试模式（不推送到钉钉，只打印消息）
node index.js --test

# 正式运行
node index.js
```

## 配置说明

### config.json 完整配置

```json
{
    "smartbi": {
        "reportName": "益智cc日通时通次监控",
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
        "groupByField": "团队",
        "sortField": "通话次数",
        "sortOrder": "desc",
        "topN": 10
    }
}
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| smartbi.reportName | SmartBI报表名称 | 益智cc日通时通次监控 |
| dingtalk.webhook | 钉钉机器人Webhook地址 | - |
| dingtalk.secret | 钉钉加签密钥（可选） | - |
| schedule.times | 定时推送时间点 | 14:00, 18:30, 21:30 |
| dataProcess.topN | 显示前N个团队 | 10 |

## 创建钉钉机器人

1. 打开钉钉群 → 群设置 → 智能群助手 → 添加机器人
2. 选择"自定义"机器人
3. 设置机器人名称（如：CC通时通次播报）
4. 安全设置选择"加签"，复制密钥
5. 复制Webhook地址
6. 将Webhook和密钥填入 `config.json`

## 定时任务配置

### 使用系统 cron（Linux/Mac）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天14:00、18:30、21:30执行）
0 14 * * * cd /path/to/cc-call-report-skill && node index.js >> logs/cron.log 2>&1
30 18 * * * cd /path/to/cc-call-report-skill && node index.js >> logs/cron.log 2>&1
30 21 * * * cd /path/to/cc-call-report-skill && node index.js >> logs/cron.log 2>&1
```

### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
pm2 init

# 启动
pm2 start index.js --name cc-call-report --cron "0 14,30 18,30 21 * * *"
```

## 消息示例

```markdown
## 📊 CC通时通次播报 (05-24 14:00)

**数据范围**: 今日

### 📈 总体数据

- **总通话次数**: 12,580 次
- **总通话时长**: 456小时30分钟
- **参与人数**: 86 人

### 🏆 团队排名

| 排名 | 团队 | 通话次数 | 通话时长 | 人数 |
|:----:|:----:|:--------:|:--------:|:----:|
| 🥇 | 华南一组 | 2,156 | 78小时20分钟 | 12 |
| 🥈 | 华东二组 | 1,987 | 72小时15分钟 | 10 |
| 🥉 | 华北一组 | 1,856 | 68小时40分钟 | 11 |

---
⏰ 数据更新时间: 2024-05-24 14:00:00

> 数据来源: SmartBI
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
    groupByField: '团队',
    topN: 10
});

const data = processor.process('/path/to/excel.xlsx');
const message = processor.generateMessage(data);
```

### 单独使用钉钉推送模块

```javascript
const DingTalkPusher = require('./dingtalk-pusher');

const pusher = new DingTalkPusher({
    webhook: 'YOUR_WEBHOOK',
    secret: 'YOUR_SECRET'
});

await pusher.sendMarkdown('标题', 'Markdown内容');
```

## 依赖

- **smartbi-export**: SmartBI报表导出技能（需要预先安装）
- **xlsx**: Excel文件解析

## 故障排查

### 导出失败

1. 检查 smartbi-export 技能是否正确安装
2. 检查报表名称是否正确
3. 检查网络连接

### 钉钉推送失败

1. 检查 Webhook 地址是否正确
2. 如果使用加签，检查密钥是否正确
3. 检查消息内容是否超过限制

### 数据处理异常

1. 检查Excel文件是否有数据
2. 检查字段名是否匹配（支持自动检测）

## 更新日志

### v1.0.0 (2024-05-24)

- 初始版本
- 支持SmartBI数据导出
- 支持团队汇总排名
- 支持钉钉Markdown推送
- 支持定时任务配置
