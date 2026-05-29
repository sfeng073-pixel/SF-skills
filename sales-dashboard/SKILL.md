---
name: sales-dashboard
version: 2.0.0
description: "通用销售实时作战大屏技能，支持配置驱动的多团队/多报表场景。当用户需要更新销售仪表盘数据、刷新大屏、导出销售报表、查看业绩排名时使用。触发词：更新大屏、刷新仪表盘、导出销售数据、更新业绩排名、销售大屏、作战大屏、台湾CC业绩等。"
metadata:
  requires:
    bins: ["node", "python3"]
---

# 通用销售实时作战大屏技能 v2.0

> 核心价值：通过 `config.json` 配置驱动，适配不同团队、不同报表的销售大屏场景

## 技能概述

通用化的销售团队实时作战大屏，通过配置文件驱动所有行为：
1. **顶部KPI指标**：GMV达成、单量达成、转化率、ASP、产能等（可配置字段）
2. **销售业绩排名**：按指定指标排名，展示个人业绩（可配置排序字段）
3. **通时通次监控**：通话时长和次数（可选模块）

## 触发条件

本 Skill 应在以下场景**自动触发**：
- 用户提到"更新大屏"、"刷新仪表盘"、"更新销售数据"
- 用户提到"销售大屏"、"作战大屏"、"台湾CC业绩"
- 用户说"帮我导出销售报表"、"更新业绩排名"
- 用户需要查看或修改仪表盘的配置和样式
- 用户需要为**其他团队**创建类似大屏（通过修改 config.json）

## 文件结构

```
sales-dashboard-skill/
├── SKILL.md              # 本文件（技能说明）
├── config.json           # 核心配置文件（适配不同团队/报表）
├── index.html            # 大屏页面（黑金风格）
├── dashboard.js          # 大屏逻辑代码
├── sales-data.json       # 数据文件（从Excel解析生成）
├── parse-sales-data.js   # Excel解析脚本（配置驱动）
├── update-dashboard.js   # 一键更新脚本（配置驱动）
├── start-server.bat      # Windows一键启动
└── start-server.sh       # Mac/Linux一键启动
```

## 核心配置文件 config.json

这是技能的**核心**，所有团队差异、报表差异都通过此文件配置。

### 完整配置结构

```json
{
    "dashboard": {
        "title": "销售实时作战大屏",
        "team": "台湾CC02组",
        "refresh_interval": 30,
        "port": 8080
    },
    "reports": [
        {
            "id": "ranking",
            "name": "益智台湾CC业绩排名",
            "alias": "台湾业绩排名",
            "smartbi_path": "益智_海外前端 → 业绩达成",
            "type": "ranking",
            "description": "销售业绩排名数据"
        },
        {
            "id": "followup",
            "name": "益智CC跟进_台湾",
            "alias": "益智CC跟进_台湾",
            "smartbi_path": "益智_海外前端 → 业绩达成",
            "type": "metrics",
            "description": "CC跟进汇总指标"
        },
        {
            "id": "call",
            "name": "益智CC日通时通次监控",
            "alias": "通时通次",
            "smartbi_path": "益智_海外前端 → 过程跟进",
            "type": "call_data",
            "description": "通时通次监控数据",
            "optional": true
        }
    ],
    "data_mapping": {
        "summary": { "...": "..." },
        "extra_metrics": { "...": "..." },
        "ranking": { "...": "..." },
        "call_data": { "...": "..." }
    },
    "smartbi": {
        "base_url": "https://bi.61info.cn/smartbi",
        "username": "74842",
        "password": "123456",
        "skill_path": "/path/to/smartbi-export-skill",
        "download_dir": "/path/to/download/dir"
    }
}
```

### 配置项详解

#### 1. dashboard（大屏设置）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 大屏标题，显示在页面顶部 |
| team | string | 是 | 团队名称，用于日志和显示 |
| refresh_interval | number | 否 | 自动刷新间隔（秒），默认30 |
| port | number | 否 | HTTP服务端口，默认8080 |

#### 2. reports（报表列表）

定义数据来源报表，支持任意数量（至少2个必需报表）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 报表唯一标识，用于命令行参数和文件映射 |
| name | string | 是 | SmartBI中的报表全名，用于导出和文件匹配 |
| alias | string | 是 | 报表简称，用于SmartBI搜索 |
| smartbi_path | string | 是 | SmartBI目录路径（用于导航定位） |
| type | string | 是 | 报表类型：ranking / metrics / call_data |
| description | string | 否 | 报表描述 |
| optional | boolean | 否 | 是否为可选报表，默认false。可选报表导出失败不会中断流程 |

#### 3. data_mapping（数据映射）

定义如何从Excel中提取数据，是配置的核心部分。

##### 3.1 summary（汇总指标）

从指定报表的匹配行中提取汇总数据。

```json
{
    "from_report": "ranking",
    "match_row": "台湾益智销售区",
    "fields": {
        "total_gmv_actual": {
            "header_keywords": ["GMV", "实际"],
            "exclude": ["目标"],
            "type": "number"
        }
    }
}
```

| 字段 | 说明 |
|------|------|
| from_report | 数据来源报表的 id |
| match_row | 匹配行关键词，找到包含此文本的行提取数据。设为 "first_data_row" 则取第一行数据 |
| fields | 字段映射（见下方字段配置） |

##### 3.2 extra_metrics（额外指标）

从第二个报表提取补充指标，合并到 summary 中。

```json
{
    "from_report": "followup",
    "match_row": "first_data_row",
    "fields": {
        "分发转化率": {
            "header_keywords": ["分发转化率"],
            "exclude": ["滚动"],
            "type": "percent_raw"
        }
    }
}
```

##### 3.3 ranking（排名列表）

从报表中提取多人排名数据。

```json
{
    "from_report": "ranking",
    "exclude_rows": ["汇总", "合计", "台湾益智销售区"],
    "sort_by": "mtd_rate",
    "sort_order": "desc",
    "fields": {
        "name": { "header_keywords": ["姓名", "销售"], "type": "string" },
        "mtd_rate": { "header_keywords": ["MTD", "达成率"], "exclude": ["单量"], "type": "percent" }
    }
}
```

| 字段 | 说明 |
|------|------|
| exclude_rows | 排除包含这些关键词的行 |
| sort_by | 排序字段名（对应 fields 中的 key） |
| sort_order | 排序方向：desc（降序）/ asc（升序） |

##### 3.4 call_data（通时通次）

结构与 ranking 类似，用于通话监控数据。

##### 字段配置通用规则

每个 field 支持以下配置：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| header_keywords | string[] | 二选一 | 表头必须**同时包含**所有关键词才匹配 |
| header | string | 二选一 | 表头**精确匹配**（优先级高于 header_keywords） |
| exclude | string[] | 否 | 表头包含任一排除词则跳过 |
| type | string | 是 | 值类型：number / percent / percent_raw / string / auto_number |

**type 类型说明：**
- `number`：直接转数字，空值返回0
- `percent`：百分比，自动判断：>1 则除以100（如 70 → 0.70）
- `percent_raw`：百分比原始值，不做转换（如 2.81 → 2.81）
- `string`：文本字符串，自动trim
- `auto_number`：整数，保留原始数值

#### 4. smartbi（SmartBI连接配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| base_url | string | SmartBI服务地址 |
| username | string | 登录账号 |
| password | string | 登录密码 |
| skill_path | string | smartbi-export 技能的路径 |
| download_dir | string | Excel文件下载目录 |

### 环境变量覆盖

支持通过环境变量覆盖配置，方便不同环境使用：

| 环境变量 | 覆盖配置项 |
|----------|-----------|
| SMARTBI_USERNAME | smartbi.username |
| SMARTBI_PASSWORD | smartbi.password |
| SMARTBI_BASE_URL | smartbi.base_url |
| DASHBOARD_PORT | dashboard.port |

## 为新团队创建配置

当需要为其他团队创建大屏时，只需：

1. **复制 config.json** 为新文件（如 `config-cc03.json`）
2. **修改以下字段**：
   - `dashboard.team` → 新团队名称
   - `reports[].name` / `alias` → 新团队的报表名称
   - `data_mapping.*.match_row` → 新团队的汇总行关键词
   - `data_mapping.*.exclude_rows` → 新团队的排除行关键词
   - `data_mapping.*.fields` → 根据新报表的表头调整关键词匹配规则
3. **运行更新**：
   ```bash
   node update-dashboard.js --config config-cc03.json
   ```

### 配置适配要点

- **表头变了**：调整 `header_keywords` 和 `exclude`，确保能唯一匹配到目标列
- **汇总行关键词变了**：调整 `match_row`
- **新增/减少报表**：在 `reports` 数组中增减条目，同步调整 `data_mapping`
- **不需要通时通次**：将对应报表的 `optional` 设为 true，或直接从 reports 中移除
- **字段名不同**：调整 fields 的 key 名，同时需要对应修改 index.html 和 dashboard.js 中的显示逻辑

## 使用方法

### 方式一：一键更新数据（推荐）

```bash
cd <skill目录>
node update-dashboard.js                          # 使用默认 config.json
node update-dashboard.js --config my-config.json # 使用自定义配置
```

该脚本会：
1. 调用 SmartBI 导出技能下载报表
2. 解析 Excel 提取数据（根据 config.json 的 data_mapping 规则）
3. 更新 sales-data.json
4. 大屏自动在配置的刷新间隔内刷新

### 方式二：手动上传Excel更新

```bash
cd <skill目录>
node update-dashboard.js --files 业绩.xlsx 跟进.xlsx [通时通次.xlsx]
```

### 方式三：启动大屏服务

```bash
# Windows
start-server.bat

# Mac/Linux
chmod +x start-server.sh
./start-server.sh
```

启动后：
- 本机访问：http://localhost:8080/index.html
- 局域网访问：http://<电脑IP>:8080/index.html

## sales-data.json 数据结构

```json
{
  "summary": {
    "total_gmv_actual": 359670,
    "total_gmv_target": 993730,
    "mtd_rate": 0.3619,
    "order_actual": 76.05,
    "order_target": 215,
    "order_rate": 0.3537,
    "分发转化率": 2.81,
    "分发滚动转化率": 5.70,
    "滚动ASP": 5145.7,
    "产能达成率": 65.58
  },
  "sales_ranking": [
    {
      "rank": 1,
      "name": "刘琦",
      "team": "台湾CC02组",
      "gmv_actual": 16170,
      "gmv_target": 23110,
      "mtd_rate": 0.70,
      "order_actual": 4.25,
      "order_target": 5,
      "order_rate": 0.85
    }
  ],
  "call_data": [
    {
      "name": "林鸿池",
      "call_time": 71,
      "call_count": 9
    }
  ]
}
```

> **注意**：以上字段名是台湾CC02组的默认配置。其他团队可通过 config.json 的 data_mapping 自定义字段名，但需同步修改 index.html 和 dashboard.js 中的字段引用。

## 大屏设计规格

- **风格**：黑金风格（深色背景 + 金色强调）
- **配色**：
  - 背景：#0a0a1a → #1a1a2e 渐变
  - 金色主色：#d4af37
  - 文字：#e0e0e0（主）、#888（辅）
  - 排名徽章：金 #ffd700 / 银 #c0c0c0 / 铜 #cd7f32
- **布局**：顶部KPI卡片 → 中间两列（排名+通时通次）
- **动效**：排名表格自动滚动、数字跳动动画
- **刷新**：每30秒自动重新加载 sales-data.json（可通过 config.json 调整）

## 依赖

- Node.js（运行解析脚本和HTTP服务）
- Python3 + openpyxl（Excel解析，脚本会自动安装）
- http-server（npm全局包，用于启动HTTP服务）

```bash
npm install -g http-server
```

## 接口对接（未来）

当后端提供API接口后，只需修改 dashboard.js 中的一行代码：

```javascript
// 当前：从本地JSON文件读取
const response = await fetch('sales-data.json');

// 改为：从API接口读取
const response = await fetch('https://your-api.com/api/dashboard/sales-data');
```

接口返回格式与 sales-data.json 完全一致即可。
