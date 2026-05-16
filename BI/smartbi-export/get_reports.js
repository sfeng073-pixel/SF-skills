const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('=== 获取BI完整报表列表 ===');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // 登录
    console.log('登录...');
    await page.goto('https://bi.61info.cn/smartbi/vision/index.jsp', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('input[type="text"].item-textinput').click();
    await page.keyboard.type('74842', { delay: 50 });
    await page.locator('input[type="password"].item-textinput').click();
    await page.keyboard.type('123456', { delay: 50 });
    await page.waitForTimeout(500);
    await page.locator('input[type="button"].item-submit').click();
    await page.waitForTimeout(5000);
    console.log('登录成功');

    const allReports = new Set();
    const savePath = '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/bi_reports.json';

    // 保存函数
    const saveReports = () => {
        const sorted = [...allReports].sort();
        fs.writeFileSync(savePath, JSON.stringify(sorted, null, 2));
    };

    // 搜索函数（带错误处理）
    const searchKeyword = async (kw) => {
        try {
            // 关闭可能的弹窗
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(500);

            const searchInput = page.locator('input[bofid="searchText"]');
            await searchInput.click({ timeout: 5000 });
            await page.waitForTimeout(200);
            await page.keyboard.press('Control+a');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(200);
            await page.keyboard.type(kw, { delay: 50 });
            await page.waitForTimeout(3000);

            const kwResults = await page.evaluate(() => {
                const labels = document.querySelectorAll('.search-result__item-label');
                const results = [];
                for (const label of labels) {
                    const text = label.textContent.trim();
                    if (text.length > 0 && text !== '高级搜索') {
                        results.push(text);
                    }
                }
                return results;
            });

            const newCount = kwResults.filter(r => !allReports.has(r)).length;
            kwResults.forEach(r => allReports.add(r));
            
            if (newCount > 0) {
                console.log(`  "${kw}": +${newCount}个 (累计${allReports.size})`);
                saveReports();
            }
        } catch (e) {
            console.log(`  "${kw}": 跳过 (${e.message.substring(0, 50)})`);
        }
    };

    // 关键词列表
    const keywords = [
        '益智', '美术', '海外', '直播', '思维', 'TMK', 'LP', 'M0', 'M1', 'M2',
        'CC', '跟进', '播报', '明细', '监控', '报表', '统计', '数据',
        '转化', 'GMV', '到课', '约课', '分发', '续费', '退费',
        '台湾', '新加坡', '港澳', '首课', '新生', '学员', 'follow',
        '升舱', '沉默', '离职', '流转', '目标', '填报', '渠道',
        '专题', '作业', '月度', '日经营', '月经营', '商务', '转介绍'
    ];

    for (const kw of keywords) {
        await searchKeyword(kw);
    }

    // 输出最终结果
    console.log('\n=== 完整报表列表 ===');
    const sortedReports = [...allReports].sort();
    console.log(`共 ${sortedReports.length} 个报表:\n`);
    sortedReports.forEach((r, i) => console.log(`${String(i + 1).padStart(3)}. ${r}`));

    await browser.close();
    console.log('\n=== 完成 ===');
})();
