/**
 * 测试 SmartBI 快速导出功能
 * 对比 RMI API 导出 vs 浏览器导出速度
 */

const SmartbiFastExporter = require('./smartbi_fast_exporter');
const SmartBIExporter = require('./index');
const fs = require('fs');

async function testFastExport() {
    console.log('=== SmartBI 快速导出测试 ===\n');

    // 测试报表（使用一个常见的报表）
    const testReport = '益智CC跟进_台湾';

    // 1. 测试 RMI API 快速导出
    console.log('【测试1】RMI API 快速导出');
    console.log('------------------------');

    const fastExporter = new SmartbiFastExporter({
        baseUrl: 'https://bi.61info.cn/smartbi/vision',
        username: '74842',
        password: '123456',
        downloadDir: '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace'
    });

    try {
        const fastResult = await fastExporter.export(testReport);
        console.log('\n结果:');
        console.log(`  成功: ${fastResult.success}`);
        console.log(`  报表: ${fastResult.reportName}`);
        console.log(`  文件: ${fastResult.fileName}`);
        console.log(`  耗时: ${fastResult.duration}ms`);
        console.log(`  消息: ${fastResult.message}`);

        if (fastResult.success && fastResult.filePath) {
            const stats = fs.statSync(fastResult.filePath);
            console.log(`  文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        }
    } catch (error) {
        console.error('快速导出失败:', error.message);
    }

    console.log('\n');
}

async function testBrowserExport() {
    const testReport = '益智CC跟进_台湾';

    // 2. 测试浏览器导出（用于对比）
    console.log('【测试2】浏览器导出（对比）');
    console.log('------------------------');

    const browserExporter = new SmartBIExporter({
        baseUrl: 'https://bi.61info.cn/smartbi',
        username: '74842',
        password: '123456',
        downloadDir: '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace',
        headless: true
    });

    try {
        const browserResult = await browserExporter.exportWithBrowser(testReport);
        console.log('\n结果:');
        console.log(`  成功: ${browserResult.success}`);
        console.log(`  报表: ${browserResult.reportName}`);
        console.log(`  文件: ${browserResult.fileName}`);
        console.log(`  耗时: ${browserResult.duration}ms`);
        console.log(`  消息: ${browserResult.message}`);

        if (browserResult.success && browserResult.filePath) {
            const stats = fs.statSync(browserResult.filePath);
            console.log(`  文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        }
    } catch (error) {
        console.error('浏览器导出失败:', error.message);
    }
}

async function testApiClient() {
    console.log('【测试3】API 客户端基础功能');
    console.log('------------------------');

    const SmartbiApiClient = require('./smartbi_api_client');
    const client = new SmartbiApiClient('https://bi.61info.cn/smartbi/vision');

    try {
        // 测试登录
        console.log('1. 测试登录...');
        await client.login('74842', '123456');
        console.log('   登录成功 ✓');

        // 测试获取根目录
        console.log('2. 测试获取根目录...');
        const roots = await client.getRootElements();
        console.log(`   获取到 ${roots.length} 个根节点 ✓`);

        // 测试查找报表
        console.log('3. 测试查找报表...');
        const report = await client.findReportByPath('CC报表/益智CC跟进_台湾');
        console.log(`   找到报表: ${report.alias || report.name} (${report.id}) ✓`);

        console.log('\nAPI 客户端测试全部通过！');
    } catch (error) {
        console.error('API 客户端测试失败:', error.message);
    }
}

// 运行测试
(async () => {
    // 先测试 API 客户端基础功能
    await testApiClient();

    console.log('\n\n');

    // 测试快速导出
    await testFastExport();

    // 可选：测试浏览器导出（耗时较长，默认注释掉）
    // await testBrowserExport();
})();
