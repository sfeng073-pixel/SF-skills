# SF-Skills

> 个人 AI Agent 技能库 — 自动化办公、数据导出、销售辅助、质检分析

## 技能列表

| 分类 | Skill | 功能说明 | 状态 |
|------|-------|---------|------|
| 📊 数据导出 | [smartbi-export](smartbi-export/) | SmartBI 报表导出，支持别名映射和智能搜索 | ✅ 可用 |
| 📊 数据导出 | [BI/smartbi-export](BI/smartbi-export/) | SmartBI 报表导出（备用版本） | ✅ 可用 |
| 🤖 自动化审批 | [refund-approval](automation/retund-approval/) | 退费审批自动化，支持钉钉 OA 审批处理 | ⚠️ Playwright 实现 |
| 🎨 营销海报 | [marketing-poster-generator](marketing-poster-generator/) | 营销海报生成，支持市场调研、文案优化、视觉设计 | ✅ 可用 |
| 📈 销售大屏 | [sales-dashboard](sales-dashboard-skill/) | 销售实时作战大屏，支持多团队多报表配置 | ⚠️ 需配置数据源 |
| 🤖 销售助手 | [vipthink-sales-bot](vipthink-sales-bot/) | VIPTHINK 销售助手机器人，管理销售话术知识库 | ⚠️ 知识库待完善 |
| 🔊 语音优化 | [voice-polish](vioce/vioce-polish/) | 语音转写文本优化，修复错别字、删除语气词 | ✅ 可用 |
| 🔄 GitHub 同步 | [github-sync](github-sync/) | GitHub 技能同步工具，一键推送本地技能到 GitHub | ✅ 可用 |
| 💱 汇率推送 | [rate-push](rate-push/) | 定时推送人民币兑新台币汇率到钉钉 | ✅ 可用 |
| 📋 LINE 质检 | [line-chat-analyzer](line-chat-analyzer/) | LINE 聊天记录质检与话术提炼工具 | ✅ 可用 |

## 快速安装

```bash
npx skills add sfeng073-pixel/SF-skills
```

## 技能详情

### 📋 line-chat-analyzer — LINE 聊天记录质检

基于《台灣簽單後sop》标准，对 LINE 官方账号导出的聊天记录进行自动化质检。

**核心功能：**
- **聊天记录解析**：支持 LINE 官方账号导出的 CSV 格式，自动检测编码
- **签单后 SOP 质检**：入学指南发送检测、打卡操作沟通检测、已报名用户识别
- **话术提炼**：提取成功说服案例，分类用户异议，生成销售培训文档
- **用户分类**：区分已报名、仅试听未报名等用户群体

**使用示例：**
```python
from line_chat_analyzer import LineChatAnalyzer

analyzer = LineChatAnalyzer()

# 批量分析目录
results = analyzer.analyze_directory('/path/to/line_chats/')

# 筛选5月份已报名用户
may_signed = analyzer.filter_signed_users(
    analyzer.filter_by_date(results, 2025, 5)
)

# 生成质检报告
analyzer.generate_compliance_report(may_signed, 'report.txt')

# 生成培训文档
analyzer.generate_training_document(may_signed, 'training.txt')
```

**依赖：** Python 3.8+、chardet

---

### 📊 smartbi-export — SmartBI 报表导出

智能搜索并导出 SmartBI 报表为 Excel 文件。

**特性：**
- 模糊匹配报表名称
- 词汇别名映射（如"台湾周会" → "台灣週會"）
- 自动下载并保存为 .xlsx 文件

---

### 🤖 vipthink-sales-bot — VIPTHINK 销售助手

钉钉群销售助手机器人，根据用户问题自动匹配最佳回复话术。

**特性：**
- 基于知识库的智能话术匹配
- 支持繁体中文
- 多场景覆盖（课程咨询、异议处理、报名引导）

---

## 贡献指南

1. Fork 本仓库
2. 创建新技能目录，包含 `SKILL.md` 说明文档
3. 提交 PR 并描述技能用途

## 许可证

MIT
