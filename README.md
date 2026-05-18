# SF-Skills

> 个人 AI Agent 技能库 — 自动化办公、数据导出、销售辅助

## 技能列表

| 分类 | Skill | 功能说明 |
|------|-------|---------|
| 📊 数据导出 | smartbi-export | SmartBI 报表导出，支持别名映射和智能搜索 |
| 🤖 自动化审批 | refund-approval | 退费审批自动化，支持钉钉 OA 审批处理 |差cli接口，目前采用playwrite方式实现
| 🎨 营销海报 | marketing-poster-generator | 营销海报生成，支持市场调研、文案优化、视觉设计 |
| 📈 销售作战大屏 | sales-dashboard | 销售实时作战大屏，支持多团队多报表配置 |数据库get接口未配，需定时任务从BI抓数据
| 🤖 销售助手 | vipthink-sales-bot | VIPTHINK 销售助手机器人，管理销售话术知识库 |知识库待丰富完全
| 🔊 语音识别 | voice-polish | 语音转写文本优化，修复错别字、删除语气词 |
| 🔄 github同步 | github-sync | GitHub 技能同步工具，一键推送本地技能到 GitHub |
| 🔄 汇率推送 | rate-push | 通过github定时推送台湾汇率 |避开tare定时任务时区问题
## 快速安装

npx skills add sfeng073-pixel/SF-skills
