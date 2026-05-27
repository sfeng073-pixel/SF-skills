---
name: smartbi-export
version: 2.3.0
description: "SmartBI 报表导出技能。支持任意报表名称，智能搜索匹配，词汇别名映射。触发词：导出报表、下载Excel、SmartBI导出、BI导出、帮我导出xxx、下载xxx数据等。"
metadata:
  requires:
    bins: ["node"]
---

# SmartBI 报表导出技能 v2.3

> 核心价值：任意报表名/别名 → 自动登录 → 智能搜索 → 导出 Excel

## 触发条件

- 用户提到"导出报表"、"下载报表"、"导出Excel"
- 用户提到"SmartBI"、"BI系统"、"bi.61info.cn"
- 用户说"帮我导出xxx"、"下载xxx数据"

## 使用方法

```bash
# 使用完整报表名
node index.js '益智CC跟进'

# 使用别名
node index.js '台湾跟进'
```

## 别名映射

| 别名 | 实际报表名 |
|------|-----------|
| 台湾跟进 | 益智CC跟进_台湾 |
| 新加坡跟进 | 益智CC跟进_新加坡 |
| 益智跟进 | 益智CC跟进 |
| CC跟进 | 益智CC跟进 |
| 美术跟进 | 美术学员流转跟进监控明细 |
| 海外跟进 | 海外益智学员流转跟进明细 |
| 海外业绩排名 | 益智海外CC业绩排名 |
| 台湾业绩排名 | 益智台湾CC业绩排名 |
| 业绩排名 | 益智海外CC业绩排名 |
| 打卡跟进 | 益智CC打卡跟进明细 |
| TMK跟进 | TMK跟进明细 |

## 依赖

- Node.js
- Playwright（需要安装 Chromium）

```bash
npm install
npx playwright install chromium
```
