# 蓝凌OA退费数据提取工具

## 功能概述

从蓝凌OA系统自动提取退费审批数据，导出为Excel文件，用于数据复盘和分析。

## 核心功能

1. **Cookie登录**：支持从浏览器复制Cookie进行认证，Cookie自动持久化保存
2. **列表获取**：分页获取蓝凌OA审批列表，支持时间范围过滤
3. **详情提取**：解析HTML详情页，提取学员信息、退费金额、原因等字段
4. **附件获取**：通过附件API获取退费附件文件名列表
5. **Excel导出**：自动格式化导出为Excel文件

## 提取字段

| 字段 | 说明 |
|------|------|
| 申请单编号 | 审批单唯一编号 |
| 申请人姓名 | 提交人姓名 |
| 申请人部门 | 完整部门路径 |
| 申请日期 | 提交日期 |
| 学员姓名 | 退费学员姓名 |
| 豌豆学员ID | 学员唯一标识 |
| 退费订单名称 | 订单描述 |
| 退费金额 | 申请退费金额 |
| 退费原因（一级/二级） | 退费分类 |
| 退费说明 | 详细说明 |
| 退费附件文件 | 附件文件名列表 |

## 安装依赖

### 方式1：使用 requirements.txt（推荐）

```bash
pip install -r requirements.txt
```

### 方式2：手动安装

```bash
# 核心依赖（必须）
pip install requests openpyxl

# 可选：自动Cookie获取（推荐至少安装一个）
pip install browser_cookie3  # 方案1：从已登录浏览器读取
pip install playwright && playwright install chromium  # 方案2：自动打开浏览器
```

## 使用方法

### 1. 配置蓝凌OA域名

修改代码中的 `LANLING_BASE` 或设置环境变量：

```bash
export LANLING_BASE="https://your-lanling-domain.com"
```

### 2. 修改模板名称

根据实际审批模板名称修改代码第485行：

```python
if item.get('fdTemplate.fdName', '') != '【豌豆】退费申请':
```

### 3. 首次运行（自动获取Cookie）

```bash
python main_lanling_api.py --extract --days 7
```

程序会自动尝试获取Cookie：

**自动获取（如果安装了browser_cookie3或Playwright）：**
1. 程序会尝试从已登录的Chrome/Edge浏览器读取Cookie
2. 如果失败，会弹出浏览器窗口让你登录，登录后按回车即可

**手动获取（如果自动获取失败）：**
1. 在Chrome中打开蓝凌OA页面
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 执行：`document.cookie`
5. 复制输出的字符串粘贴到终端

Cookie会自动保存到 `~/.lanling_cookies.json`，下次运行无需重复输入。

### 4. 提取数据

```bash
# 提取最近7天
python main_lanling_api.py --extract --days 7

# 提取最近30天
python main_lanling_api.py --extract --days 30

# 提取最近一年
python main_lanling_api.py --extract --days 365
```

### 5. 查看结果

Excel文件保存在 `~/refund-extractor/output/refund_YYYYMMDD.xlsx`

## 技术要点

### 分页处理
- 使用 `pageno` 和 `rowsize` 参数分页获取
- 每页15条，最多50页安全上限

### 时间过滤
- API参数 `q.docCreateTime`（两个同名参数：开始日期 + 结束日期）
- 在API层面直接过滤，无需下载全量数据
- 支持自然语言时间范围（7天、30天、90天、365天等）

### 去重机制
- 使用 `seen_ids` 集合防止重复提取
- 同一审批单在翻页时不会重复

### 字段映射
- HTML中字段名可能为 `部门` 而非 `申请人部门`
- 支持 `[label1, value1, label2, value2]` 的表格结构

### 附件提取
- 通过 `/sys/attachment/sys_att_main/sysAttMain.do` 接口获取
- 需要 `fdModelName` 和 `fdModelId` 参数

## 已知限制

1. **主管意见**：蓝凌OA审批流程通过前端JS动态渲染，无法通过API直接获取
2. **历史字段缺失**：2025年10月前的记录可能没有"豌豆学员ID"字段（表单升级前）
3. **Cookie有效期**：Cookie过期后需要重新获取

## 文件结构

```
refund-extractor-skill/
├── main_lanling_api.py      # 主程序
├── cookie_helper.py         # Cookie自动获取助手
├── requirements.txt         # Python依赖
├── agent.md                 # 技能定义文件（Trae）
├── README.md                # 项目说明
└── 使用说明书.md             # 详细使用说明
```

## 脱敏说明

本技能已进行以下脱敏处理：
- 蓝凌OA域名：使用占位符，需自行配置
- Cookie数据：不硬编码，运行时输入
- 钉钉配置：已移除（本版本仅提取数据）

## 作者

SOLO
