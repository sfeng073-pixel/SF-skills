---
name: rate-push
version: 2.0.0
description: "台湾地区课程台币价格参考图自动播报。每天北京时间 12:30 获取汇率，按人民币→美元→新台币计算四档课包价格，生成美化图片并推送到钉钉群。"
metadata:
  requires:
    bins: ["node"]
---

# 台湾课程台币价格参考图

每天北京时间 12:30 自动生成台湾地区课程价格参考图，并通过钉钉机器人发送到群里。

## 价格档位

- 3850
- 5280
- 8880
- 14550

## 计算方式

1. 从 ExchangeRate-API 获取 USD/CNY 与 USD/TWD。
2. 人民币价格先除以 USD/CNY，得到美元价格。
3. 美元价格再乘以 USD/TWD，得到新台币价格。
4. 新台币金额四舍五入到 NT$10。

## GitHub Actions

工作流文件：`.github/workflows/daily-rate.yml`

- 定时：北京时间每天 12:30
- 手动：支持 `workflow_dispatch`
- 输出：GitHub Pages 图片 `taiwan-course-rate.png`
- 推送：钉钉机器人 markdown 图片消息

## 必需 Secrets

- `DINGTALK_WEBHOOK`
- `DINGTALK_SECRET`
