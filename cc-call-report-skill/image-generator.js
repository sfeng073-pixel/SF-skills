/**
 * 图片生成模块
 * 功能：将数据表格渲染为图片（支持小组汇总+个人明细）
 */
const fs = require('fs');
const path = require('path');

class ImageGenerator {
    constructor(options = {}) {
        this.width = options.width || 480;
        this.height = options.height || 320;
        this.format = options.format || 'png';
        this.outputDir = options.outputDir || process.cwd();
    }

    /**
     * 生成数据表格图片
     * @param {Object} data 包含 teamData 和 personalData
     * @param {Object} options 配置选项
     * @returns {string} 生成的图片路径
     */
    async generate(data, options = {}) {
        const title = options.title || '数据报表';
        const subtitle = options.subtitle || '';
        const timestamp = options.timestamp || new Date().toLocaleString('zh-CN');

        // 构建HTML
        const html = this._buildHTML(data, title, subtitle, timestamp);

        // 使用已安装的 Playwright 渲染
        let chromium;
        try {
            const playwright = require('/mnt/appuserdata/skills/smartbi-export/node_modules/playwright');
            chromium = playwright.chromium;
        } catch (e) {
            throw new Error('未找到 Playwright，请确保 smartbi-export 技能已安装');
        }

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({
            viewport: { width: this.width, height: this.height }
        });

        await page.setContent(html, { waitUntil: 'networkidle' });

        // 等待渲染完成
        await page.waitForTimeout(500);

        // 获取实际内容高度
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewportSize({ width: this.width, height: bodyHeight + 20 });

        // 生成图片（使用jpeg格式压缩，降低质量）
        const filename = `report_${Date.now()}.jpg`;
        const filepath = path.join(this.outputDir, filename);

        await page.screenshot({
            path: filepath,
            fullPage: true,
            type: 'jpeg',
            quality: 40  // 进一步降低压缩质量到40%
        });

        await browser.close();

        // 检查文件大小
        const stats = fs.statSync(filepath);
        console.log(`[ImageGenerator] 图片生成成功: ${filepath}, 大小: ${(stats.size / 1024).toFixed(2)}KB`);

        return filepath;
    }

    /**
     * 构建HTML内容
     */
    _buildHTML(data, title, subtitle, timestamp) {
        const { teamData = [], personalData = [] } = data;

        // 构建小组汇总表格
        const teamTable = this._buildTable(teamData, 'team');
        
        // 构建个人明细表格（只显示前3名）
        const topPersonal = personalData.slice(0, 3);
        const personalTable = this._buildTable(topPersonal, 'personal');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
            background: #f5f5f5;
            padding: 8px;
        }
        .container {
            max-width: 460px;
            margin: 0 auto;
            background: white;
            border-radius: 6px;
            overflow: hidden;
        }
        .header {
            background: #1890ff;
            color: white;
            padding: 10px 12px;
            text-align: center;
        }
        .header h1 {
            font-size: 14px;
            font-weight: 600;
        }
        .header .subtitle {
            font-size: 10px;
            opacity: 0.9;
            margin-top: 2px;
        }
        .section {
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
        }
        .section-title {
            font-size: 11px;
            font-weight: 600;
            color: #1890ff;
            margin-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        th {
            padding: 5px 3px;
            background: #1890ff;
            color: white;
            font-weight: 500;
            text-align: center;
        }
        td {
            padding: 4px 3px;
            border-bottom: 1px solid #f0f0f0;
            text-align: center;
        }
        tr:nth-child(even) {
            background: #fafafa;
        }
        .rank {
            font-weight: bold;
            color: #1890ff;
        }
        .footer {
            padding: 6px;
            background: #fafafa;
            text-align: center;
            color: #999;
            font-size: 8px;
        }
        .badge {
            display: inline-block;
            padding: 1px 2px;
            border-radius: 2px;
            font-size: 8px;
        }
        .badge-success { background: #f6ffed; color: #52c41a; }
        .badge-warning { background: #fffbe6; color: #faad14; }
        .badge-error { background: #fff2f0; color: #ff4d4f; }
        .more-info {
            text-align: center;
            color: #999;
            font-size: 9px;
            padding: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        
        <div class="section">
            <div class="section-title">小组汇总</div>
            ${teamTable}
        </div>
        
        <div class="section">
            <div class="section-title">个人明细 TOP3</div>
            ${personalTable}
            <div class="more-info">共 ${personalData.length} 人</div>
        </div>
        
        <div class="footer">
            ${timestamp} | SmartBI
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * 构建表格HTML
     */
    _buildTable(data, type) {
        if (!data || data.length === 0) {
            return '<div style="text-align: center; color: #999; padding: 8px;">暂无数据</div>';
        }

        // 提取表头
        const headers = Object.keys(data[0]);

        // 字段名映射（简化）
        const headerMap = {
            '小组': '小组',
            'CC姓名': '姓名',
            '通时目标': '时目标',
            '人均通时': '均通时',
            '个人通时': '通时',
            '通时达标率': '时达标',
            '通次目标': '次目标',
            '人均通次': '均通次',
            '个人通次': '通次',
            '通次达标率': '次达标'
        };

        // 构建表头
        const headerCells = headers.map(h => 
            `<th>${headerMap[h] || h}</th>`
        ).join('');

        // 构建数据行
        const rows = data.map((row, index) => {
            const cells = headers.map(h => {
                let value = row[h] !== undefined ? row[h] : '-';
                
                // 达标率颜色处理
                if (typeof value === 'string' && value.includes('%')) {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        let badgeClass = 'badge-error';
                        if (num >= 100) badgeClass = 'badge-success';
                        else if (num >= 80) badgeClass = 'badge-warning';
                        value = `<span class="badge ${badgeClass}">${value}</span>`;
                    }
                }
                
                return `<td>${value}</td>`;
            }).join('');

            // 排名
            const rank = index + 1;
            let rankDisplay = rank;
            if (rank === 1) rankDisplay = '🥇';
            else if (rank === 2) rankDisplay = '🥈';
            else if (rank === 3) rankDisplay = '🥉';

            return `
                <tr>
                    <td class="rank">${rankDisplay}</td>
                    ${cells}
                </tr>
            `;
        }).join('');

        return `
            <table>
                <thead>
                    <tr>
                        <th>排名</th>
                        ${headerCells}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }
}

module.exports = ImageGenerator;
