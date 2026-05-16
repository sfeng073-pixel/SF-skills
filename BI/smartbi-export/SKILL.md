---
name: smartbi-export
version: 2.0.0
description: "SmartBI 报表导出技能。当用户需要从 SmartBI 导出报表、下载 Excel、导出数据时使用。支持任意报表名称，智能搜索匹配，词汇别名映射。触发词：导出报表、下载Excel、SmartBI导出、BI导出、帮我导出xxx、下载xxx数据等。"
---

# SmartBI Export — 通用报表导出技能

> 核心价值：任意报表名/别名 → 自动登录 → 智能搜索 → 导出 Excel

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
```

### 方式二：命令行执行

```bash
cd /sessions/69fc6f10c9b3ac3b7bf544d9/workspace/smartbi-export-skill

# 使用完整报表名
node index.js '益智CC跟进'

# 使用别名
node index.js '台湾跟进'

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
| "帮我导出美术跟进" | 美术跟进 → 美术拓思维CC跟进 |

### Step 2: 词汇映射

内置词汇映射表（可扩展）：

| 别名 | 实际报表名 |
|------|-----------|
| 台湾跟进 | 益智CC跟进_台湾 |
| 新加坡跟进 | 益智CC跟进_新加坡 |
| 益智跟进 | 益智CC跟进 |
| CC跟进 | 益智CC跟进 |
| 美术跟进 | 美术拓思维CC跟进 |
| 美术CC | 美术拓思维CC跟进 |
| 直播数据 | 直播业务数据报表 |
| 直播报表 | 直播业务数据报表 |
| 海外跟进 | 海外业务跟进 |
| 打卡跟进 | 益智CC打卡跟进明细 |

### Step 3: 智能搜索

多级搜索策略：

1. **精确匹配** - 报表名 === 关键词
2. **包含匹配** - 报表名包含关键词
3. **核心词搜索** - 提取"CC"、"跟进"等核心词
4. **模糊搜索** - 取关键词前半部分
5. **评分排序** - 基于匹配度评分

### Step 4: 执行导出

1. **登录** - 自动填充用户名密码
2. **搜索** - 智能匹配最佳报表
3. **等待加载** - 等待报表数据加载完成
4. **导出** - 点击导出 → 悬停Excel → 点击在线导出
5. **下载** - 保存 Excel 文件

### Step 5: 返回结果

```javascript
{
    success: true,
    originalName: '台湾跟进',      // 用户输入
    reportName: '益智CC跟进_台湾', // 解析后的报表名
    matchType: 'alias',            // 匹配类型: alias/partial/direct
    matchedReport: '益智CC跟进_台湾', // 实际匹配到的报表
    filePath: '/path/to/益智CC跟进_台湾.xlsx',
    fileName: '益智CC跟进_台湾.xlsx',
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
    // 你的别名映射
    '我的报表': '实际报表名称',
    // ...
};
```

## 配置选项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| baseUrl | https://bi.61info.cn/smartbi | SmartBI 地址 |
| username | 74842 | 用户名 |
| password | 123456 | 密码 |
| downloadDir | /tmp/smartbi-exports | 下载目录 |
| headless | true | 无头模式 |
| timeout | 60000 | 超时时间(ms) |

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 登录失败 | 用户名密码错误 | 检查配置 |
| 未找到报表 | 关键词不匹配 | 尝试其他关键词或添加别名 |
| 未找到Excel | 页面结构异常 | 检查报表权限 |
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

**AI**: 导出成功！文件已保存到 `益智CC跟进_台湾.xlsx`，需要我帮你分析这个数据吗？

---

**用户**: 下载美术CC

**AI**: 好的，正在导出"美术CC"报表...
（解析：美术CC → 美术拓思维CC跟进）

**AI**: 导出成功！

---

**用户**: 导出直播数据

**AI**: 好的，正在导出"直播数据"报表...
（解析：直播数据 → 直播业务数据报表）

**AI**: 导出成功！
