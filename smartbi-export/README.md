# SmartBI Export Skill

基于 RMI API 的 SmartBI 报表高速导出工具，支持 124+ 报表的智能匹配，无需浏览器即可导出 Excel。

## 特性

- **RMI API 快速导出** - 纯 HTTP 协议，速度比浏览器模式快 5-10 倍
- **智能报表匹配** - 支持别名映射、模糊匹配、关键词分词匹配
- **浏览器回退** - 不支持的报表类型自动回退到 Playwright 浏览器模式
- **零外部依赖** - 快速导出模式仅需 Node.js 内置模块

## 快速开始

### 1. 安装依赖

```bash
cd smartbi-export
npm install
```

### 2. 配置环境变量

```bash
export SMARTBI_USER="your_username"
export SMARTBI_PASS="your_password"
```

或创建 `.env` 文件：

```
SMARTBI_USER=your_username
SMARTBI_PASS=your_password
```

### 3. 使用

```javascript
const SmartbiFastExporter = require('./smartbi_fast_exporter');

const exporter = new SmartbiFastExporter({
    baseUrl: 'https://bi.61info.cn/smartbi/vision',
    username: 'your_username',
    password: 'your_password',
    downloadDir: './downloads'
});

const result = await exporter.export('益智CC跟进_台湾');
console.log(result);
// { success: true, fileName: '益智CC跟进_台湾.xlsx', duration: 22000 }
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `smartbi_api_client.js` | RMI API 客户端，负责登录、目录遍历、报表导出 |
| `smartbi_fast_exporter.js` | 快速导出器，自动识别报表类型并导出 |
| `index.js` | 主入口，包含浏览器回退模式和智能匹配 |
| `bi_reports.json` | 报表名称列表（124+ 报表） |
| `get_reports.js` | 报表列表抓取工具 |

## 支持的报表类型

| 类型 | 导出方式 | 说明 |
|------|---------|------|
| SPREADSHEET_REPORT | RMI API（快速） | 电子表格类型，推荐 |
| SIMPLE_REPORT | 浏览器回退 | 简单报表类型 |
| INSIGHT / COMBINED_QUERY | 暂不支持 | 自助仪表盘/组合分析 |

## 别名映射

支持常用别名快速匹配：

| 别名 | 实际报表名 |
|------|-----------|
| 台湾跟进 | 益智CC跟进_台湾 |
| 新加坡跟进 | 益智CC跟进_新加坡 |
| 美术跟进 | 美术学员流转跟进监控明细 |
| 海外跟进 | 海外益智学员流转跟进明细 |
| 业绩排名 | 益智海外CC业绩排名 |
| TMK跟进 | TMK跟进明细 |
| CC通时通次 | 益智CC通时通次 |

## 技术原理

```
登录 (RMI API) → 查找报表 (目录遍历) → 获取上下文 → 导出 Excel (ssreportServlet)
                                                        ↓
                                                  302 重定向
                                                        ↓
                                                  下载 Excel 文件
```

- 使用 SmartBI RMI Servlet 进行登录和目录操作
- 通过 `openresource.jsp` 获取报表上下文（clientId、参数等）
- 调用 `ssreportServlet` 触发导出，自动跟随 302 重定向获取 Excel

## 性能对比

| 模式 | 耗时 | 资源占用 |
|------|------|---------|
| RMI API 快速导出 | ~20 秒 | 低 |
| Playwright 浏览器导出 | ~190 秒 | 高 |

## 注意事项

- 账号密码通过环境变量 `SMARTBI_USER` / `SMARTBI_PASS` 传入，不要硬编码在代码中
- 首次使用浏览器回退模式需安装 Chromium：`npx playwright install chromium`
- 导出的 Excel 默认保存到 `downloadDir` 指定目录

## License

ISC
