---
name: smartbi-export
version: 2.3.0
description: "SmartBI 报表导出技能。当用户需要从 SmartBI 导出报表、下载 Excel、导出数据时使用。支持任意报表名称，智能搜索匹配，词汇别名映射。触发词：导出报表、下载Excel、SmartBI导出、BI导出、帮我导出xxx、下载xxx数据等。"
---

# SmartBI Export — 通用报表导出技能 v2.3

> 核心价值：任意报表名/别名 → 自动登录 → 智能搜索 → 导出 Excel

## v2.3 更新内容

- **多界面兼容**：支持3种报表导出界面（工具栏直接导出、工具栏+导出设置弹窗、左侧菜单悬停导出）
- **Excel大小写兼容**：同时匹配 "EXCEL"、"Excel"、"excel"
- **导出设置对话框**：电子表格类型报表点击Excel后弹出"导出设置"对话框，自动点击"在线导出"
- **搜索结果兼容**：兼容首页内嵌加载和新页面打开两种情况
- **模糊匹配增强**：支持124+报表的智能匹配，新增关键词分词匹配
- **别名映射扩展**：新增海外业绩排名、台湾业绩排名等别名

## 触发条件

本 Skill 应在以下场景**自动触发**：

- 用户提到"导出报表"、"下载报表"、"导出Excel"
- 用户提到"SmartBI"、"BI系统"、"bi.61info.cn"
- 用户说"帮我导出xxx"、"下载xxx数据"
- 用户提到具体的报表名称或别名

## 技能位置

```
/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/smartbi-export-skill/
```

## 使用方法

### 方式一：直接调用模块

```javascript
const SmartBIExporter = require('/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/smartbi-export-skill');

const exporter = new SmartBIExporter({
    username: '74842',
    password: '123456',
    downloadDir: '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace'
});

// 使用完整报表名
const result = await exporter.export('益智CC跟进');

// 或使用别名
const result = await exporter.export('台湾跟进');  // 自动映射到 "益智CC跟进_台湾"
const result = await exporter.export('业绩排名');   // 自动映射到 "益智海外CC业绩排名"
```

### 方式二：命令行执行

```bash
cd /sessions/69fc6f10c9b3ac3b7bf544d9/workspace/smartbi-export-skill

# 使用完整报表名
node index.js '益智CC跟进'

# 使用别名
node index.js '台湾跟进'
node index.js '业绩排名'

# 查看可用别名
node index.js
```

## 工作流程

### Step 1: 解析用户需求

从用户输入中提取报表名称或别名：

| 用户输入 | 解析结果 |
|---------|---------|
| "导出益智CC跟进" | 益智CC跟进 |
| "下载台湾跟进" | 台湾跟进 → 益智CC跟进_台湾 |
| "帮我导出业绩排名" | 业绩排名 → 益智海外CC业绩排名 |
| "海外业绩排名" | 海外业绩排名 → 益智海外CC业绩排名 |

### Step 2: 词汇映射 + 模糊匹配

**别名映射表**（优先级最高）：

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
| CC通时通次 | 益智CC通时通次 |

**业务术语映射**（基于BI字段数字字典）：

| 业务术语 | 实际报表名 |
|----------|-----------|
| 广告消耗 / ROI | 海外港澳商务成本监控_日维度 |
| 转化率 / 约课率 | 海外港澳商务转化漏斗_周月维度 |
| 例子数 / 约课数 | 益智海外用户销售明细_末次渠道 |
| GMV / 滚动GMV | 海外港澳商务成本监控_日维度 |
| 通话时长 | 益智CC通时通次 |

**模糊匹配**（别名未命中时）：

1. 精确匹配报表名（置信度100%）
2. 包含匹配（报表名包含关键词，置信度80-90%）
3. 反向匹配（关键词包含报表名，置信度70%）
4. 关键词分词匹配（按空格/下划线拆分后逐词匹配）

### Step 3: 智能搜索

多级搜索策略：

1. **精确搜索** - 使用完整报表名搜索
2. **简化搜索** - 去掉前缀（益智/美术/海外）和后缀（明细/播报/监控）后重试
3. **最佳匹配** - 从搜索结果中选择最匹配的项（精确 > 包含 > 评分排序）

### Step 4: 执行导出（兼容3种界面）

**界面类型A — 工具栏直接导出**（查询报表类型）：
1. 点击工具栏"导出"按钮
2. 点击下拉菜单中的"EXCEL"
3. 直接触发下载

**界面类型B — 工具栏+导出设置弹窗**（电子表格类型）：
1. 点击工具栏"导出"按钮
2. 点击下拉菜单中的"Excel"
3. 弹出"导出设置"对话框
4. 点击"在线导出"按钮
5. 触发下载

**界面类型C — 左侧菜单悬停导出**（旧界面类型）：
1. 点击左侧导出区域
2. 鼠标悬停到"EXCEL"选项上
3. 展开子菜单后点击"在线导出"
4. 触发下载

系统会自动尝试 A → B → C，直到成功。

### Step 5: 返回结果

```javascript
{
    success: true,
    originalName: '业绩排名',
    reportName: '益智海外CC业绩排名',
    matchType: 'alias',
    confidence: 100,
    matchedReport: '益智海外CC业绩排名',
    filePath: '/path/to/益智海外CC业绩排名.xlsx',
    fileName: '益智海外CC业绩排名.xlsx',
    message: '导出成功',
    duration: 43000
}
```

## 扩展词汇映射

### 方式一：代码中添加

```javascript
const exporter = new SmartBIExporter();

// 单个添加
exporter.addVocabulary('新别名', '实际报表名');

// 批量添加
exporter.addVocabularies({
    '别名1': '报表1',
    '别名2': '报表2'
});
```

### 方式二：修改源码

编辑 `index.js` 中的 `vocabularyMap` 对象：

```javascript
this.vocabularyMap = {
    '我的报表': '实际报表名称',
};
```

## 配置选项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| baseUrl | https://bi.61info.cn/smartbi | SmartBI 地址 |
| username | 74842 | 用户名 |
| password | 123456 | 密码 |
| downloadDir | workspace目录 | 下载目录 |
| headless | true | 无头模式 |
| timeout | 60000 | 超时时间(ms) |
| maxRetries | 2 | 最大重试次数 |

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 登录失败 | 用户名密码错误 | 检查配置 |
| 未找到报表 | 关键词不匹配 | 尝试其他关键词或添加别名 |
| 未找到Excel | 页面结构异常 | 检查报表权限 |
| 导出设置弹窗 | 电子表格类型报表 | 已自动处理，点击在线导出 |
| 导出超时 | 数据量大 | 增加超时时间 |

## 依赖

- Node.js
- Playwright（需要安装 Chromium）

```bash
cd /sessions/69fc6f10c9b3ac3b7bf544d9/workspace/smartbi-export-skill
npm install
npx playwright install chromium
```

## 示例对话

**用户**: 帮我导出台湾跟进的报表

**AI**: 好的，正在导出"台湾跟进"报表...
（解析：台湾跟进 → 益智CC跟进_台湾）

**AI**: 导出成功！文件已保存到 `益智CC跟进_台湾.xlsx`

---

**用户**: 导出益智海外cc业绩排名

**AI**: 好的，正在导出"益智海外CC业绩排名"报表...
（精确匹配，工具栏导出 → Excel → 导出设置 → 在线导出）

**AI**: 导出成功！

---

**用户**: 下载续费订单

**AI**: 好的，正在导出"续费订单"报表...
（模糊匹配：续费订单 → 美术续费订单明细，置信度80%）
