# Taiwan Call KPI Broadcast Skill

台湾销售 TL 通时通次专项播报技能。

这套包只负责一件事：围绕 `台湾CC02组`，在北京时间 `15:00 / 17:00 / 21:30` 三个时段，自动完成 SmartBI 拉数、排名结果生成、海报图片输出、以及钉钉机器人图片+文字提醒。

## Project Status

- Type: skill
- Status: usable
- Last Updated: 2026-06-14
- Entry File: `scripts/run-taiwan-call-kpi-slot.js`
- Current Usable Output: 台湾 `15:00 / 17:00 / 21:30` 通时通次图片播报与尾部销售提醒
- Recent Changes: 从 TL 大项目中单独提炼出可共享专项技能包，去除了强绑定本机路径的设计
- Known Limitations: SmartBI 导出依赖本地 `smartbi_cli.py` 和账号；正式图片发送依赖 `dws` 已登录
- Next Step: 接入团队统一 GitHub 仓库，给同事分发 `.env` 模板和钉钉映射表模板

## 这套技能解决什么问题

之前通时通次播报能力散落在一个更大的台湾 TL 自动化项目里，同事要复用时需要同时理解很多其他模块。这次把它单独提炼后，就只剩一条清晰链路：

1. 按北京时间时段拉取 SmartBI `益智CC日通时通次监控`
2. 只保留 `台湾CC02组`
3. 生成当时点的全员排名
4. 图片展示全员
5. 文字只提醒尾部销售
6. 一位销售一行，支持 `@销售`

## 业务边界

当前确认只做以下范围：

- 地区：`台湾`
- 小组：`台湾CC02组`
- 报表：`益智CC日通时通次监控`
- 时段：`15:00 / 17:00 / 21:30`
- 提醒逻辑：`通时尾部3人 + 通次尾部3人，去重后逐行提醒`

当前不包含：

- 约课
- 课前 2h
- 课后 3h
- 19:00 业绩
- 19:30 外呼异常
- 22:30 TL 总结

## 目录结构

```text
taiwan-call-kpi-broadcast-skill/
├── SKILL.md
├── README.md
├── GITHUB_UPLOAD.md
├── package.json
├── requirements.txt
├── .env.example
├── examples/
├── docs/
├── scripts/
├── src/
├── test/
└── .github/workflows/
```

## 环境准备

### Node

需要 Node.js `20+`。

### Python

需要 Python `3.10+`，并安装：

```bash
pip install -r requirements.txt
```

### SmartBI

你需要一份可用的 SmartBI CLI，并通过环境变量告诉这个技能在哪里：

```bash
SMARTBI_CLI_PATH=/absolute/path/to/smartbi_cli.py
SMARTBI_CLI_PYTHON_BIN=python3
SMARTBI_BASE_URL=https://bi.61info.cn/smartbi/vision
SMARTBI_USERNAME=xxx
SMARTBI_PASSWORD=xxx
```

### DingTalk

正式发图和发消息需要：

```bash
DINGTALK_WEBHOOK_URL=...
DINGTALK_WEBHOOK_SECRET=...
DINGTALK_DRIVE_SPACE_ID=...
DINGTALK_USER_MAPPING_PATH=./examples/dingtalk-user-mapping.example.csv
```

同时，本机还需要 `dws` 已可用，才能走 DingDrive 图片中转。

## 快速开始

### 1. 配置环境变量

复制模板：

```bash
cp .env.example .env
```

然后把实际配置填进去。

### 2. 跑一个本地预览

只生成结果和图片，不发钉钉：

```bash
node scripts/run-taiwan-call-kpi-slot.js --slot 1500 --dry-run
```

如果你已经有本地工作簿，也可以直接指定：

```bash
node scripts/run-taiwan-call-kpi-slot.js \
  --slot 1500 \
  --date 2026-06-12 \
  --source /absolute/path/to/live-call-duration-2026-06-12-1500.xlsx \
  --no-live-export \
  --dry-run
```

### 3. 做一次“模拟发送”

会组装出钉钉 payload，但不会真正发送：

```bash
node scripts/run-taiwan-call-kpi-slot.js --slot 1500 --dry-run-send
```

### 4. 正式发送

```bash
node scripts/run-taiwan-call-kpi-slot.js --slot 1500
```

如果没有显式传 `--dry-run`，默认会按 `DINGTALK_IMAGE_DELIVERY=drive_markdown` 走正式图片+文字播报。

## 核心命令

只拉数并生成结果 JSON：

```bash
node scripts/run-taiwan-call-kpi-foundation.js --slot 1700
```

只基于结果 JSON 生成图片并播报：

```bash
node scripts/run-taiwan-call-kpi-broadcast.js --slot 1700 --dry-run
```

完整链路：

```bash
node scripts/run-taiwan-call-kpi-slot.js --slot 2130
```

## 产出物说明

默认运行目录：

`runtime/taiwan-call-kpi`

其中会生成：

- `results/YYYY-MM-DD-slot-1500.json`
- `broadcast/YYYY-MM-DD-1500-poster-model.json`
- `broadcast/YYYY-MM-DD-1500-call-duration.png`
- `broadcast/YYYY-MM-DD-1500-call-duration-message.txt`
- `private/live-call-duration-YYYY-MM-DD-1500.xlsx`

## 文字提醒规则

这套技能当前使用的是“过程提醒”规则，而不是“最终达标”规则：

- 通时尾部取 3 人
- 通次尾部取 3 人
- 同一销售命中两种尾部时只保留一行
- 一行里把两个原因合并写出
- 最终文案里每个销售单独一行，方便钉钉阅读和 `@销售`

示例：

```text
@谢启仰 通时尾部、通次尾部，当前通时 1.4，当前通次 5
@温伟杰 通时尾部，当前通时 7.4，当前通次 35
@刘琦 通时尾部，当前通时 10.1，当前通次 18
@张莉红 通次尾部，当前通时 22.6，当前通次 6
@林鸿池 通次尾部，当前通时 11，当前通次 17
```

## 北京时间说明

所有时段都按 `Asia/Shanghai` 处理，也就是北京时间。

这三个固定时段是：

- `15:00`
- `17:00`
- `21:30`

如果后面要接 GitHub Actions，记得把 UTC cron 正确换算，不要直接写本地时间。

## 测试

运行：

```bash
npm test
```

当前测试覆盖：

- 尾部提醒去重
- 一人一行提醒
- `@销售` 映射
- `dry_run_send` payload 组装
- 本地工作簿 -> 结果 JSON -> 图片文案的完整 dry-run 链路

## 共享给同事时建议一起提供

- 本项目代码
- `.env.example`
- `examples/dingtalk-user-mapping.example.csv`
- `docs/rules.md`
- `docs/deployment.md`
- `GITHUB_UPLOAD.md`

真实的 `.env`、真实映射表、真实导出文件不要提交到 GitHub。
