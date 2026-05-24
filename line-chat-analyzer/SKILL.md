# LINE Chat Analyzer Skill

## 技能概述

本技能用于分析LINE官方账号的聊天记录，实现：
- 聊天记录检索与解析
- 签单后SOP合规质检（入学指南、打卡沟通等）
- 话术提炼与优秀案例提取
- 用户意向分类与未报名原因分析

## 适用场景

- VIPTHINK台湾区销售团队质检
- 客服话术合规性检查
- 销售培训材料生成
- 用户行为数据分析

## 核心功能

### 1. 聊天记录解析
- 支持LINE官方账号导出的CSV格式
- 自动检测文件编码（UTF-8/GBK/Latin1等）
- 区分客服消息与用户消息
- 支持繁简体中文混合处理

### 2. 质检检测
基于《台灣簽單後sop》标准：
- **入学指南**：检测是否发送入学指南（关键词：入學指南/入学指南）
- **打卡沟通**：检测签单后是否带打卡操作沟通（非方案报价中提及）
- **付款确认**：检测付款成功确认话术
- **入学步骤**：检测是否讲解入学流程

### 3. 话术提炼
- 提取成功说服案例
- 分析用户异议及应对话术
- 生成销售培训文档
- 识别高频问题与标准回复

### 4. 用户分类
- 已报名/成交用户识别
- 仅试听未报名用户分析
- 未报名原因分类统计

## 使用方法

```python
from line_chat_analyzer import LineChatAnalyzer

# 初始化分析器
analyzer = LineChatAnalyzer()

# 分析单个文件
result = analyzer.analyze_file('chat_record.csv')

# 批量分析目录
results = analyzer.analyze_directory('/path/to/chats/')

# 生成质检报告
report = analyzer.generate_compliance_report(results)

# 提取优秀话术
cases = analyzer.extract_success_cases(results)
```

## 配置说明

### 质检关键词配置
```python
CONFIG = {
    'enrollment_guide_keywords': ['入學指南', '入学指南'],
    'checkin_operation_keywords': ['打卡規則', '家長端下載', ...],
    'signed_user_keywords': ['已報', '已报', '成交', ...],
}
```

### 输出格式
- 质检报告：Markdown/TXT格式
- 话术文档：DOCX格式
- 统计数据：JSON/CSV格式

## 依赖要求

- Python 3.8+
- pandas
- chardet
- python-docx（可选，用于生成DOCX）

## 版本历史

- v1.0.0 - 初始版本，支持基础质检和话术提取
