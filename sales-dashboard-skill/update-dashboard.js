#!/usr/bin/env node
/**
 * 销售大屏一键更新脚本（通用版）
 * 
 * 用法：
 *   node update-dashboard.js                          # 从SmartBI自动导出并更新
 *   node update-dashboard.js --manual                 # 手动模式（等待上传Excel）
 *   node update-dashboard.js --files a.xlsx b.xlsx c.xlsx  # 指定本地Excel文件
 *   node update-dashboard.js --config my-config.json # 使用自定义配置文件
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const SKILL_DIR = __dirname;
const DEFAULT_CONFIG = path.join(SKILL_DIR, 'config.json');
const DATA_FILE = path.join(SKILL_DIR, 'sales-data.json');

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = { manual: false, files: [], configPath: DEFAULT_CONFIG };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--manual') opts.manual = true;
        else if (args[i] === '--files') opts.files = args.slice(i + 1);
        else if (args[i] === '--config') { opts.configPath = args[i + 1]; i++; }
    }
    return opts;
}

// 加载配置
function loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
        console.log(`  ❌ 配置文件不存在: ${configPath}`);
        process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // 环境变量覆盖（方便不同环境使用不同账号）
    if (process.env.SMARTBI_USERNAME) config.smartbi.username = process.env.SMARTBI_USERNAME;
    if (process.env.SMARTBI_PASSWORD) config.smartbi.password = process.env.SMARTBI_PASSWORD;
    if (process.env.SMARTBI_BASE_URL) config.smartbi.base_url = process.env.SMARTBI_BASE_URL;
    if (process.env.DASHBOARD_PORT) config.dashboard.port = parseInt(process.env.DASHBOARD_PORT);
    
    return config;
}

async function main() {
    const opts = parseArgs();
    const config = loadConfig(opts.configPath);

    console.log('');
    console.log('  ============================================');
    console.log(`    ${config.dashboard.title} - 数据更新`);
    console.log(`    团队: ${config.dashboard.team}`);
    console.log('  ============================================');
    console.log('');

    let excelFiles = {};
    const reports = config.reports;
    const smartbi = config.smartbi;

    if (opts.files.length >= 2) {
        // 指定本地Excel文件
        reports.forEach((r, i) => {
            if (opts.files[i]) excelFiles[r.id] = opts.files[i];
        });
    } else if (!opts.manual) {
        // 自动从SmartBI导出
        console.log('  [1/3] 从SmartBI导出报表...');
        
        for (const report of reports) {
            const isOptional = report.optional || false;
            console.log(`  正在导出: ${report.name}${isOptional ? '（可选）' : ''}...`);
            
            try {
                const skillPath = smartbi.skill_path || '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/smartbi-export-skill';
                execSync(`cd ${skillPath} && node index.js '${report.alias}'`, {
                    timeout: 180000,
                    stdio: 'pipe',
                    env: {
                        ...process.env,
                        SMARTBI_USERNAME: smartbi.username,
                        SMARTBI_PASSWORD: smartbi.password,
                        SMARTBI_BASE_URL: smartbi.base_url
                    }
                });
                
                // 查找下载的文件
                const downloadDir = smartbi.download_dir;
                const expectedFile = path.join(downloadDir, `${report.name}.xlsx`);
                
                if (fs.existsSync(expectedFile)) {
                    excelFiles[report.id] = expectedFile;
                    console.log(`  ✅ ${report.name} 导出成功`);
                } else {
                    // 模糊匹配已有文件
                    const existingFiles = fs.readdirSync(downloadDir)
                        .filter(f => f.endsWith('.xlsx') && (
                            f.includes(report.name.replace('益智', '')) ||
                            f.includes(report.alias)
                        ))
                        .sort((a, b) => {
                            const aTime = fs.statSync(path.join(downloadDir, a)).mtimeMs;
                            const bTime = fs.statSync(path.join(downloadDir, b)).mtimeMs;
                            return bTime - aTime;
                        });
                    
                    if (existingFiles.length > 0) {
                        excelFiles[report.id] = path.join(downloadDir, existingFiles[0]);
                        console.log(`  📁 使用已有文件: ${existingFiles[0]}`);
                    } else if (isOptional) {
                        console.log(`  ⚠️  ${report.name} 未找到（可选，跳过）`);
                    } else {
                        console.log(`  ❌ ${report.name} 导出失败且无已有文件`);
                    }
                }
            } catch (e) {
                if (isOptional) {
                    console.log(`  ⚠️  ${report.name} 导出异常（可选，跳过）: ${e.message.substring(0, 80)}`);
                } else {
                    console.log(`  ❌ ${report.name} 导出异常: ${e.message.substring(0, 80)}`);
                }
            }
        }
    }

    // 检查必需文件
    const requiredReports = reports.filter(r => !r.optional);
    const missingRequired = requiredReports.filter(r => !excelFiles[r.id]);
    if (missingRequired.length > 0) {
        console.log('');
        console.log(`  ❌ 缺少必需的报表文件: ${missingRequired.map(r => r.name).join(', ')}`);
        console.log('  用法:');
        console.log('    node update-dashboard.js                              # 自动从SmartBI导出');
        console.log('    node update-dashboard.js --files 业绩.xlsx 跟进.xlsx  # 指定本地文件');
        console.log('    node update-dashboard.js --config my-config.json      # 自定义配置');
        process.exit(1);
    }

    // 解析Excel并更新JSON
    console.log('');
    console.log('  [2/3] 解析Excel数据...');
    
    const parseScript = path.join(SKILL_DIR, 'parse-sales-data.js');
    if (!fs.existsSync(parseScript)) {
        console.log('  ❌ 解析脚本不存在: parse-sales-data.js');
        process.exit(1);
    }

    try {
        const parseArgs = ['--config', opts.configPath];
        for (const report of reports) {
            if (excelFiles[report.id]) {
                parseArgs.push('--' + report.id, excelFiles[report.id]);
            }
        }
        
        execSync(`node "${parseScript}" ${parseArgs.join(' ')}`, {
            timeout: 30000,
            stdio: 'inherit'
        });
    } catch (e) {
        console.log(`  ❌ 解析失败: ${e.message}`);
        process.exit(1);
    }

    // 验证JSON
    console.log('');
    console.log('  [3/3] 验证数据...');
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        const summary = data.summary || {};
        const ranking = data.sales_ranking || [];
        const callData = data.call_data || [];
        
        console.log(`  ✅ 数据验证通过`);
        console.log(`     - 汇总指标: ${Object.keys(summary).length} 项`);
        console.log(`     - 排名人数: ${ranking.length} 人`);
        console.log(`     - 通时通次: ${callData.length} 人`);
        if (summary.total_gmv_actual) {
            console.log(`     - GMV达成: ¥${summary.total_gmv_actual.toLocaleString()} / ¥${summary.total_gmv_target.toLocaleString()}`);
        }
        if (summary.mtd_rate) {
            console.log(`     - 完成率: ${(summary.mtd_rate * 100).toFixed(1)}%`);
        }
    } catch (e) {
        console.log(`  ❌ JSON验证失败: ${e.message}`);
        process.exit(1);
    }

    console.log('');
    console.log('  ============================================');
    console.log('    ✅ 数据更新完成！');
    console.log(`    大屏将在${config.dashboard.refresh_interval}秒内自动刷新`);
    console.log('  ============================================');
    console.log('');
}

main().catch(e => {
    console.error('更新失败:', e.message);
    process.exit(1);
});
