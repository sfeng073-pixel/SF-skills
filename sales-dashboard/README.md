# 销售实时作战大屏 (Sales Dashboard)

> 通用销售实时作战大屏技能，支持配置驱动的多团队/多报表场景。黑金风格设计，自动刷新，支持 SmartBI 数据导出。

## 功能特性

- **实时数据展示**：GMV达成、单量达成、转化率、ASP、产能等 KPI 指标
- **销售业绩排名**：按 MTD 完成率自动排序，展示个人业绩
- **通时通次监控**：通话时长和次数实时监控
- **黑金风格设计**：专业的大屏展示效果
- **配置驱动**：通过 `config.json` 适配不同团队/报表
- **自动刷新**：每 30 秒自动更新数据
- **SmartBI 集成**：一键导出报表并解析 Excel

## 快速开始

### 1. 安装依赖

```bash
# Node.js（用于运行解析脚本和 HTTP 服务）
npm install -g http-server

# Python3 + openpyxl（用于 Excel 解析）
pip3 install openpyxl
```

### 2. 配置 SmartBI 连接

编辑 `config.json`：

```json
{
  "smartbi": {
    "base_url": "https://bi.61info.cn/smartbi",
    "username": "你的账号",
    "password": "你的密码"
  }
}
```

### 3. 更新数据

```bash
# 自动从 SmartBI 导出并更新
node update-dashboard.js

# 或手动指定 Excel 文件
node update-dashboard.js --files 业绩.xlsx 跟进.xlsx 通时通次.xlsx
```

### 4. 启动大屏

```bash
# Windows
start-server.bat

# Mac/Linux
./start-server.sh
```

浏览器访问：`http://localhost:8080/index.html`

## 项目结构

```
sales-dashboard/
├── SKILL.md              # 技能说明文档
├── README.md             # 本文件
├── config.json           # 核心配置文件
├── index.html            # 大屏页面（黑金风格）
├── dashboard.js          # 大屏逻辑代码
├── sales-data.json       # 数据文件
├── parse-sales-data.js   # Excel 解析脚本
├── update-dashboard.js   # 一键更新脚本
├── start-server.bat      # Windows 启动脚本
└── start-server.sh       # Mac/Linux 启动脚本
```

## 配置说明

### config.json 结构

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
      "type": "ranking"
    },
    {
      "id": "followup",
      "name": "益智CC跟进_台湾",
      "type": "metrics"
    },
    {
      "id": "call",
      "name": "益智CC日通时通次监控",
      "type": "call_data",
      "optional": true
    }
  ],
  "data_mapping": {
    "summary": { ... },
    "ranking": { ... },
    "call_data": { ... }
  }
}
```

详细配置说明请参考 [SKILL.md](./SKILL.md)。

## 数据格式

### sales-data.json

```json
{
  "summary": {
    "total_gmv_actual": 420680,
    "total_gmv_target": 993730,
    "mtd_rate": 0.423,
    "order_actual": 87.25,
    "order_target": 215,
    "order_rate": 0.406,
    "分发转化率": 36.73,
    "产能达成率": 48.01
  },
  "sales_ranking": [
    {
      "rank": 1,
      "name": "杨萍",
      "team": "台湾CC02组",
      "gmv_actual": 39190,
      "gmv_target": 55464,
      "mtd_rate": 0.707
    }
  ],
  "call_data": [
    {
      "name": "吴世昌",
      "call_time": 43.58,
      "call_count": 61
    }
  ]
}
```

## 自定义配置

为其他团队创建大屏：

1. 复制 `config.json` 为 `config-cc03.json`
2. 修改 `dashboard.team` 为团队名称
3. 调整 `reports` 中的报表名称
4. 修改 `data_mapping` 中的字段匹配规则
5. 运行：`node update-dashboard.js --config config-cc03.json`

## 环境变量

支持通过环境变量覆盖配置：

```bash
export SMARTBI_USERNAME="74842"
export SMARTBI_PASSWORD="123456"
export DASHBOARD_PORT="8080"
```

## 电视部署

### 方案1：电脑直连电视
- 用 HDMI 线连接电脑和电视
- 浏览器全屏打开大屏页面

### 方案2：局域网访问
- 大屏服务运行在电脑 A
- 电视/其他设备访问 `http://<电脑A_IP>:8080`

### 方案3：内网穿透
```bash
# 安装 ngrok
brew install ngrok

# 启动穿透
ngrok http 8080
```

## 依赖

- Node.js 16+
- Python 3.8+
- openpyxl
- http-server (`npm install -g http-server`)

## 触发词

在 SOLO/Trae 中使用以下关键词自动触发本技能：
- "更新大屏"
- "刷新仪表盘"
- "导出销售报表"
- "销售大屏"
- "作战大屏"
- "台湾CC业绩"

## 版本历史

### v2.0.0 (2026-05-21)
- 重构为配置驱动架构
- 支持 config.json 自定义团队/报表
- 新增 SKILL.md 完整文档
- 优化 Excel 解析逻辑

### v1.0.0 (2026-05-20)
- 初始版本
- 支持 SmartBI 自动导出
- 黑金风格大屏展示

## 作者

VIPTHINK Tech Team

## 许可证

MIT
