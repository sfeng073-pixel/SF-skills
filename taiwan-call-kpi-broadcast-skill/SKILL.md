---
name: taiwan-call-kpi-broadcast-skill
description: 当用户要搭建、运行、排查、预览、封装、共享台湾销售 TL 的 15:00 / 17:00 / 21:30 通时通次播报时，必须使用这个技能。适用于 SmartBI 导数、台湾CC02组通时通次排名、钉钉图片播报、尾部销售艾特提醒、北京时间定时任务、GitHub 共享包整理。
---

# Taiwan Call KPI Broadcast Skill

这个技能只负责一个很明确的专项能力：

- 台湾 `CC02组`
- 每日 `15:00 / 17:00 / 21:30`
- SmartBI 报表 `益智CC日通时通次监控`
- 图片播报全员排名
- 文字播报尾部销售提醒

不要把这个技能扩展成整套 TL 全流程助手。它的边界就是 `通时通次专项播报`。

## 固定业务规则

- 只看 `台湾CC02组`
- 只看 `15:00 / 17:00 / 21:30` 三个时段
- 排名规则：`通时` 降序，`通时` 相同时按 `通次` 降序
- 文字提醒规则：
  - 取 `通时尾部 3 人`
  - 取 `通次尾部 3 人`
  - 同一销售如果同时命中两类尾部，只提醒一行
  - 文案里要保留原因，例如 `通时尾部、通次尾部`
- 图片里只展示数据，不展示提醒文案
- 文字提醒一位销售一行，支持 `@销售`

## 数据来源

- SmartBI 报表：`益智CC日通时通次监控`
- 当前确认字段：
  - `小组`
  - `CC`
  - `通时目标`
  - `通时`
  - `通时达标率`
  - `通次目标`
  - `通次`
  - `通次达标率`

## 运行方式

优先走完整链路：

1. 从 SmartBI 拉取当前时段数据
2. 落地成 `xlsx`
3. 解析出台湾 `CC02组` 销售明细
4. 生成标准化结果 JSON
5. 生成图片海报
6. 发送钉钉图片消息
7. 发送钉钉文字提醒

如果用户只是要预览、调试或共享：

- 可以直接基于已存在的结果 JSON 运行播报
- 也可以使用样例 JSON 做干跑

## 目录提示

核心入口：

- `scripts/run-taiwan-call-kpi-slot.js`
- `scripts/run-taiwan-call-kpi-foundation.js`
- `scripts/run-taiwan-call-kpi-broadcast.js`

核心说明：

- `README.md`
- `docs/rules.md`
- `docs/deployment.md`
- `GITHUB_UPLOAD.md`

## 输出要求

当你使用这个技能帮用户执行时：

- 明确说明当前是哪个北京时间时段
- 明确说明是否为 `dry_run`
- 明确说明数据来自 SmartBI 还是本地已落盘文件
- 若未发送成功，指出卡在：
  - SmartBI 导出
  - 海报生成
  - DingDrive 上传
  - 钉钉机器人发送
- 不要编造销售数据、钉钉 id、SmartBI 返回内容

## 安全要求

绝对不要提交这些内容：

- SmartBI 账号密码
- 钉钉 webhook
- 钉钉 secret
- 钉钉用户映射真表
- 实际导出的原始 xlsx
- 运行生成的真实图片

共享给同事时，优先提交：

- `.env.example`
- `examples/dingtalk-user-mapping.example.csv`
- `examples/sample-slot-1500-result.json`
- 文档和测试
