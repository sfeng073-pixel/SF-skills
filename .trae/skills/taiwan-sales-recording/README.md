# 台湾销售团队录音下载与质检 Skill

整合钉钉CLI + CC工作台2.0 CLI + 飞书文档，实现台湾销售团队CRM录音自动下载与AI质检分析。

## 功能特性

- ✅ 从钉钉获取销售团队花名册
- ✅ 按员工在CRM中筛选学员
- ✅ 获取学员通话记录
- ✅ 批量下载通话录音到临时目录
- ✅ ASR转写 + AI质检分析
- ✅ 自动生成飞书文档报告
- ✅ 分析完成后自动清理本地录音文件

## 核心流程

```
钉钉花名册 → CRM学员筛选 → 通话记录获取 → 录音批量下载
    → ASR转写 → AI质检 → 飞书文档报告 → 本地录音自动清理
```

## 快速开始

### 1. 环境准备

确保已安装：
- Python 3.8+
- 钉钉 CLI (`dws`) - 已授权
- CC工作台2.0 CLI (`cc-workbench2`) - 已配置CDP
- 飞书 CLI (`lark-cli`) - 已授权

### 2. 克隆项目

```bash
git clone <repository_url>
cd taiwan-sales-recording
```

### 3. 配置

编辑 `config/config.json`：

1. **获取钉钉部门ID**：
```bash
dws contact dept search --query "台湾"
# 记录显示的 deptId
```

2. **配置部门ID**：
```json
{
  "dept_ids": {
    "taiwan": ["你的部门ID"]
  }
}
```

3. **配置API密钥**：
```json
{
  "asr": {
    "api_key": "你的DashScope API Key"
  }
}
```

### 4. 运行

```bash
# 获取花名册测试
python src/get_roster.py

# 执行完整流程
python src/main.py
```

## 触发词

- "下载台湾销售录音"
- "台湾销售团队录音"
- "批量下载台湾CC录音"
- "获取林鸿池的通话录音"
- "台湾团队录音质检"
- "台湾CC录音分析"

## 项目结构

```
taiwan-sales-recording/
├── SKILL.md              # Skill定义文档
├── README.md             # 本文件
├── LICENSE               # MIT License
├── .gitignore           # Git忽略配置
├── config/
│   └── config.json       # 配置文件（需用户填写）
└── src/
    ├── get_roster.py     # 钉钉花名册获取
    ├── query_crm.py      # CRM查询
    ├── download_recordings.py  # 录音下载
    ├── analyze_recordings.py    # ASR+AI质检
    ├── feishu_report.py  # 飞书文档报告
    ├── cleanup.py        # 本地录音清理
    └── main.py           # 主控流程
```

## 开发状态

| 模块 | 状态 |
|------|------|
| Skill框架 | ✅ 完成 |
| 花名册获取 | ✅ 完成 |
| CRM查询 | ⏳ 待本地测试 |
| 录音下载 | ⏳ 待本地测试 |
| 飞书报告 | ✅ 完成 |
| 本地清理 | ✅ 完成 |

## 注意事项

1. **钉钉授权**：首次使用需运行 `dws auth login`
2. **CRM浏览器**：需启动 Chrome `--remote-debugging-port=9222`
3. **飞书授权**：需运行 `lark-cli auth login`
4. **存储策略**：本地录音分析后自动删除，报告保存在飞书

## License

MIT License
