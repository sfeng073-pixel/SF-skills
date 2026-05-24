/**
 * SmartBI 导出速度对比测试
 * 对比 RMI API 快速导出 vs 浏览器导出
 */

const SmartbiFastExporter = require('./smartbi_fast_exporter');
const SmartBIExporter = require('./index');
const fs = require('fs');

// 测试配置
const TEST_REPORTS = [
    '益智CC跟进_台湾',
    '益智CC跟进_新加坡',
    '美术学员流转跟进监控明细',
];

const CONFIG = {
    baseUrl: 'https://bi.61info.cn/smartbi',
    username: '74842',
    password: '123456',
    downloadDir: '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace'
};

async function benchmarkFastExport(reportName) {
    const exporter = new SmartbiFastExporter({
        baseUrl: `${CONFIG.baseUrl}/vision`,
        username: CONFIG.username,
        password: CONFIG.password,
        downloadDir: CONFIG.downloadDir
    });

    const startTime = Date.now();
    const result = await exporter.export(reportName);
    result.totalTime = Date.now() - startTime;
    return result;
}

async function benchmarkBrowserExport(reportName) {
    const exporter = new SmartBIExporter({
        baseUrl: CONFIG.baseUrl,
        username: CONFIG.username,
        password: CONFIG.password,
        downloadDir: CONFIG.downloadDir,
        headless: true
    });

    const startTime = Date.now();
    const result = await exporter.exportWithBrowser(reportName);
    result.totalTime = Date.now() - startTime;
    return result;
}

async function runBenchmark() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       SmartBI 导出速度对比测试 (RMI API vs 浏览器)         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const results = [];

    for (const reportName of TEST_REPORTS) {
        console.log(`\n📊 测试报表: ${reportName}`);
        console.log('─'.repeat(60));

        // 快速导出
        console.log('\n  [RMI API 快速导出]');
        const fastResult = await benchmarkFastExport(reportName);
        console.log(`    状态: ${fastResult.success ? '✅ 成功' : '❌ 失败'}`);
        console.log(`    耗时: ${fastResult.totalTime}ms`);
        if (fastResult.success) {
            const stats = fs.statSync(fastResult.filePath);
            console.log(`    文件: ${fastResult.fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        }

        // 浏览器导出（只测试第一个报表，因为耗时较长）
        let browserResult = null;
        if (reportName === TEST_REPORTS[0]) {
            console.log('\n  [浏览器导出]');
            browserResult = await benchmarkBrowserExport(reportName);
            console.log(`    状态: ${browserResult.success ? '✅ 成功' : '❌ 失败'}`);
            console.log(`    耗时: ${browserResult.totalTime}ms`);
            if (browserResult.success) {
                const stats = fs.statSync(browserResult.filePath);
                console.log(`    文件: ${browserResult.fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
            }

            // 计算速度提升
            if (fastResult.success && browserResult.success) {
                const speedup = (browserResult.totalTime / fastResult.totalTime).toFixed(1);
                console.log(`\n  ⚡ 速度提升: ${speedup}x`);
            }
        }

        results.push({
            reportName,
            fast: fastResult,
            browser: browserResult
        });
    }

    // 汇总
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                       测试汇总                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const fastResults = results.map(r => r.fast);
    const avgFastTime = fastResults.reduce((a, b) => a + b.totalTime, 0) / fastResults.length;
    const successCount = fastResults.filter(r => r.success).length;

    console.log(`\n  RMI API 快速导出:`);
    console.log(`    成功: ${successCount}/${TEST_REPORTS.length}`);
    console.log(`    平均耗时: ${avgFastTime.toFixed(0)}ms`);

    const browserResults = results.filter(r => r.browser).map(r => r.browser);
    if (browserResults.length > 0) {
        const avgBrowserTime = browserResults.reduce((a, b) => a + b.totalTime, 0) / browserResults.length;
        console.log(`\n  浏览器导出:`);
        console.log(`    成功: ${browserResults.filter(r => r.success).length}/${browserResults.length}`);
        console.log(`    平均耗时: ${avgBrowserTime.toFixed(0)}ms`);
        console.log(`\n  ⚡ 平均速度提升: ${(avgBrowserTime / avgFastTime).toFixed(1)}x`);
    }

    console.log('\n');
}

// 运行测试
runBenchmark().catch(console.error);
