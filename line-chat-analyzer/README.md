# LINE Chat Analyzer

LINE聊天记录分析工具，用于VIPTHINK台湾区销售团队的质检和话术提炼。

## 功能特性

- **聊天记录解析**：支持LINE官方账号导出的CSV格式，自动检测编码
- **签单后SOP质检**：基于《台灣簽單後sop》标准检查合规性
  - 入学指南发送检测
  - 打卡操作沟通检测
  - 已报名/成交用户识别
- **话术提炼**：提取成功说服案例，生成销售培训文档
- **用户分类**：区分已报名、仅试听未报名等用户群体

## 安装

```bash
pip install -r requirements.txt
```

## 使用方法

### 基础用法

```python
from line_chat_analyzer import LineChatAnalyzer

# 初始化分析器
analyzer = LineChatAnalyzer()

# 分析单个文件
result = analyzer.analyze_file('chat_record.csv')
print(result)

# 批量分析目录
results = analyzer.analyze_directory('/path/to/chats/')

# 生成质检报告
report = analyzer.generate_compliance_report(results, 'report.txt')

# 生成培训文档
doc = analyzer.generate_training_document(results, 'training.txt')
```

### 高级用法

```python
# 筛选5月份数据
may_results = analyzer.filter_by_date(results, 2025, 5)

# 筛选已报名用户
signed_users = analyzer.filter_signed_users(results)

# 筛选不合规用户
non_compliant = analyzer.filter_non_compliant(results)

# 自定义过滤
filtered = analyzer.analyze_directory(
    '/path/to/chats/',
    filter_func=lambda f: '202505' in f
)
```

## 质检标准

基于飞书文档《台灣簽單後sop》：

### 入学指南检测
- 检测客服消息中是否包含"入學指南"/"入学指南"关键词
- 图片发送后通常有文字说明

### 打卡沟通检测
- 区分"方案报价中提及打卡"和"签单后实际带打卡操作沟通"
- 只有实际操作沟通才算合规
- 合规标志：打卡规则讲解、家长端下载、豌豆币兑换等

### 已报名用户识别
- 聊天内容关键词：付款成功、欢迎入学、已报名等
- 文件名字节匹配：已報/已报/成交/已成交等繁简体变体

## 项目结构

```
line-chat-analyzer/
├── line_chat_analyzer/
│   ├── __init__.py
│   ├── analyzer.py          # 主分析器
│   ├── parser.py            # 聊天记录解析
│   ├── compliance_checker.py # 质检检测
│   ├── speech_extractor.py  # 话术提取
│   └── config.py            # 配置和关键词
├── README.md
├── requirements.txt
└── example.py               # 使用示例
```

## 依赖要求

- Python 3.8+
- chardet (编码检测)

## 版本历史

- v1.0.0 - 初始版本，支持基础质检和话术提取

## 作者

VIPTHINK Tech Team
