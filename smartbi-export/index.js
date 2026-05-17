/**
 * SmartBI 报表导出技能 v2.3
 * 支持124+报表的模糊匹配，兼容多种报表界面类型
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

class SmartBIExporter {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://bi.61info.cn/smartbi';
        this.username = options.username || '74842';
        this.password = options.password || '123456';
        this.downloadDir = options.downloadDir || '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace';
        this.viewport = options.viewport || { width: 1920, height: 1080 };
        this.headless = options.headless !== false;
        this.timeout = options.timeout || 60000;
        this.maxRetries = options.maxRetries || 2;

        // 加载报表列表
        this.reportList = this._loadReportList();

        // 常用别名映射（用户习惯用语 → 报表名）
        this.vocabularyMap = {
            // 益智系列
            '台湾跟进': '益智CC跟进_台湾',
            '新加坡跟进': '益智CC跟进_新加坡',
            '益智跟进': '益智CC跟进',
            'CC跟进': '益智CC跟进',
            '打卡跟进': '益智CC打卡跟进明细',
            '沟通明细': '益智CC沟通明细',
            'follow跟进': '益智follow跟进明细',
            
            // 美术系列
            '美术跟进': '美术学员流转跟进监控明细',
            '美术LP监控': '美术LP到课率监控明细',
            '美术续费': '美术续费订单明细',
            
            // 海外系列
            '海外跟进': '海外益智学员流转跟进明细',
            '港澳商务': '港澳商务',
            '海外业绩排名': '益智海外CC业绩排名',
            '台湾业绩排名': '益智台湾CC业绩排名',
            '业绩排名': '益智海外CC业绩排名',
            
            // TMK
            'TMK跟进': 'TMK跟进明细',
            'TMK播报': 'TMK老数据提点播报',
        };

        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    _loadReportList() {
        const listPath = '/sessions/69fc6f10c9b3ac3b7bf544d9/workspace/bi_reports.json';
        try {
            if (fs.existsSync(listPath)) {
                return JSON.parse(fs.readFileSync(listPath, 'utf8'));
            }
        } catch (e) {}
        return [];
    }

    addVocabulary(alias, reportName) { this.vocabularyMap[alias] = reportName; }
    addVocabularies(map) { Object.assign(this.vocabularyMap, map); }
    listVocabularies() { return this.vocabularyMap; }
    listReports() { return this.reportList; }

    /**
     * 智能匹配报表名
     * 1. 先检查别名映射表
     * 2. 再在报表列表中模糊匹配
     */
    _resolveReportName(input) {
        // 1. 精确匹配别名
        if (this.vocabularyMap[input]) {
            return { original: input, resolved: this.vocabularyMap[input], matched: 'alias', confidence: 100 };
        }

        // 2. 在报表列表中精确匹配
        const exactMatch = this.reportList.find(r => r === input);
        if (exactMatch) {
            return { original: input, resolved: exactMatch, matched: 'exact', confidence: 100 };
        }

        // 3. 模糊匹配（包含关系）
        const containsMatches = this.reportList.filter(r => r.includes(input));
        if (containsMatches.length === 1) {
            return { original: input, resolved: containsMatches[0], matched: 'contains', confidence: 90 };
        }
        if (containsMatches.length > 1) {
            // 多个匹配，选最短的（更精确）
            const best = containsMatches.sort((a, b) => a.length - b.length)[0];
            return { original: input, resolved: best, matched: 'contains', confidence: 80, alternatives: containsMatches.slice(1, 4) };
        }

        // 4. 反向匹配（输入包含报表名）
        const reverseMatch = this.reportList.find(r => input.includes(r));
        if (reverseMatch) {
            return { original: input, resolved: reverseMatch, matched: 'reverse', confidence: 70 };
        }

        // 5. 关键词分词匹配
        const keywords = input.split(/[\s_\-]+/).filter(k => k.length >= 2);
        if (keywords.length > 0) {
            const scored = this.reportList.map(report => {
                let score = 0;
                for (const kw of keywords) {
                    if (report.includes(kw)) score += 20;
                }
                return { report, score };
            }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

            if (scored.length > 0) {
                return { 
                    original: input, 
                    resolved: scored[0].report, 
                    matched: 'keywords', 
                    confidence: scored[0].score,
                    alternatives: scored.slice(1, 4).map(s => s.report)
                };
            }
        }

        // 6. 无匹配
        return { original: input, resolved: input, matched: 'none', confidence: 0 };
    }

    async _ensureBrowser() {
        console.log('[SmartBI] 检查浏览器环境...');
        try {
            const { chromium } = require('playwright');
            await chromium.launch({ headless: true, args: ['--no-sandbox'] }).then(b => b.close());
            console.log('[SmartBI] 浏览器就绪');
            return true;
        } catch (e) {
            if (e.message.includes("doesn't exist")) {
                console.log('[SmartBI] 正在安装浏览器...');
                try {
                    execSync('npx playwright install chromium 2>&1', { stdio: 'pipe', timeout: 120000 });
                    console.log('[SmartBI] 浏览器安装完成');
                    return true;
                } catch (err) {
                    console.error('[SmartBI] 浏览器安装失败');
                    return false;
                }
            }
            throw e;
        }
    }

    async export(reportName, options = {}) {
        const startTime = Date.now();
        const resolved = this._resolveReportName(reportName);
        
        console.log(`[SmartBI] 解析: "${resolved.original}" → "${resolved.resolved}"`);
        console.log(`[SmartBI] 匹配方式: ${resolved.matched} (置信度: ${resolved.confidence}%)`);
        
        if (resolved.alternatives && resolved.alternatives.length > 0) {
            console.log(`[SmartBI] 其他候选: ${resolved.alternatives.join(', ')}`);
        }

        const result = {
            success: false, originalName: resolved.original, reportName: resolved.resolved,
            matchType: resolved.matched, confidence: resolved.confidence,
            alternatives: resolved.alternatives || [],
            filePath: null, fileName: null, message: '', duration: 0
        };

        if (resolved.matched === 'none') {
            result.message = `未找到匹配的报表，请检查报表名称。可用报表: ${this.reportList.slice(0, 5).join(', ')}...`;
            result.duration = Date.now() - startTime;
            return result;
        }

        const browserReady = await this._ensureBrowser();
        if (!browserReady) {
            result.message = '浏览器环境不可用';
            result.duration = Date.now() - startTime;
            return result;
        }

        let lastError = null;
        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
            if (attempt > 1) console.log(`[SmartBI] 第 ${attempt} 次重试...`);
            try {
                const browser = await chromium.launch({ headless: this.headless, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] });
                const context = await browser.newContext({ acceptDownloads: true, viewport: this.viewport });
                const page = await context.newPage();
                page.setDefaultTimeout(this.timeout);

                await this._login(page);
                const searchResult = await this._searchAndOpen(page, resolved.resolved);
                if (!searchResult.success) throw new Error(searchResult.message);
                result.matchedReport = searchResult.matchedName;
                await this._waitForReportLoad(page);
                const exportResult = await this._exportExcel(page);

                if (exportResult.success) {
                    result.success = true;
                    result.filePath = exportResult.filePath;
                    result.fileName = exportResult.fileName;
                    result.message = '导出成功';
                } else {
                    throw new Error(exportResult.message || '导出失败');
                }

                await context.close();
                await browser.close();
                lastError = null;
                break;
            } catch (error) {
                lastError = error;
                console.error(`[SmartBI] 失败 (第 ${attempt} 次): ${error.message.substring(0, 100)}`);
            }
        }

        if (lastError) result.message = lastError.message;
        result.duration = Date.now() - startTime;
        console.log(`[SmartBI] 耗时: ${result.duration}ms`);
        return result;
    }

    async _login(page) {
        console.log('[SmartBI] 登录...');
        await page.goto(`${this.baseUrl}/vision/index.jsp`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.locator('input[type="text"].item-textinput').click();
        await page.keyboard.type(this.username, { delay: 50 });
        await page.waitForTimeout(200);
        await page.locator('input[type="password"].item-textinput').click();
        await page.keyboard.type(this.password, { delay: 50 });
        await page.waitForTimeout(500);
        await page.locator('input[type="button"].item-submit').click();
        await page.waitForTimeout(5000);
        const loggedIn = await page.evaluate(() => !document.body.innerText.includes('登录失败'));
        if (!loggedIn) throw new Error('登录失败');
        console.log('[SmartBI] 登录成功');
    }

    async _searchAndOpen(page, keyword) {
        console.log(`[SmartBI] 搜索: ${keyword}`);
        const result = { success: false, matchedName: null, message: '' };

        let match = await this._doSearch(page, keyword);
        
        // 如果搜索结果被截断，尝试使用更短的关键词
        if (!match.found && match.retryWithSimplified) {
            // 尝试提取核心关键词（去掉前缀和后缀）
            const coreKeywords = [
                keyword.replace(/^(益智|美术|海外|思维)/, '').replace(/(明细|播报|监控|报表|排名)$/, '').trim(),
                keyword.split('_').pop(),  // 取最后一部分
                keyword.split('_').slice(1).join('_'),  // 去掉第一部分
            ].filter(k => k && k.length >= 3 && k !== keyword);
            
            for (const simplified of [...new Set(coreKeywords)]) {
                console.log(`[SmartBI] 尝试简化关键词: ${simplified}`);
                match = await this._doSearch(page, simplified);
                if (match.found) break;
            }
        }
        
        // 最后尝试简化版本
        if (!match.found) {
            const simplified = keyword.replace(/^(益智|美术|海外|思维)/, '').replace(/(明细|播报|监控|报表)$/, '').trim();
            if (simplified && simplified !== keyword) {
                console.log(`[SmartBI] 尝试简化: ${simplified}`);
                match = await this._doSearch(page, simplified);
            }
        }
        
        if (!match.found) { result.message = `未找到 "${keyword}"`; return result; }

        console.log(`[SmartBI] 匹配: ${match.label}`);
        try {
            // 使用双击打开报表（电子表格类型报表需要双击）
            await page.locator(`text=${match.label}`).first().dblclick({ timeout: 5000 });

            // 等待报表加载（兼容新页面和当前页面内嵌加载）
            await page.waitForTimeout(3000);
            const allPages = page.context().pages();
            if (allPages.length > 1) {
                const newPage = allPages[allPages.length - 1];
                await newPage.bringToFront();
                await newPage.waitForLoadState('networkidle').catch(() => {});
            }
            await page.waitForTimeout(5000);

            result.success = true;
            result.matchedName = match.label;
        } catch (e) { result.message = `点击失败: ${e.message}`; }
        return result;
    }

    async _doSearch(page, keyword) {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
        
        const searchInput = page.locator('input[bofid="searchText"]');
        await searchInput.click({ timeout: 5000 });
        await page.waitForTimeout(200);
        await page.keyboard.press('Control+a');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(200);
        await page.keyboard.type(keyword, { delay: 50 });
        await page.waitForTimeout(5000);

        const items = await page.evaluate(() => {
            const labels = document.querySelectorAll('.search-result__item-label');
            const results = [];
            for (const label of labels) {
                const text = label.textContent.trim();
                if (text.length > 0 && text !== '高级搜索') results.push({ label: text });
            }
            return results;
        });
        if (items.length === 0) return { found: false };
        
        const match = this._selectBestMatch(items, keyword);
        if (match.label) {
            return { found: true, label: match.label };
        }
        
        // 没有找到有效匹配，尝试简化关键词
        console.log(`[SmartBI] 未找到匹配，尝试简化关键词...`);
        return { found: false, retryWithSimplified: true };
    }

    _selectBestMatch(items, keyword) {
        const exact = items.find(i => i.label === keyword);
        if (exact) return exact;
        const contains = items.find(i => i.label.includes(keyword));
        if (contains) return contains;
        
        // 评分匹配，但要求最低分数
        const scored = items.map(item => {
            let score = 0;
            keyword.split(/[_\s]+/).forEach(part => { 
                if (part.length >= 2 && item.label.includes(part)) score += 20; 
            });
            if (item.label.includes('_V2') && !keyword.includes('V2')) score -= 10;
            return { ...item, score };
        });
        scored.sort((a, b) => b.score - a.score);
        
        // 如果最高分低于阈值，说明搜索结果不包含目标报表
        if (scored[0].score < 20) {
            return { label: null, score: scored[0].score };
        }
        return scored[0];
    }

    async _waitForReportLoad(page) {
        console.log('[SmartBI] 等待报表加载...');
        try {
            await page.waitForFunction(() => {
                const t = document.body.innerText || '';
                return !t.includes('点击图标取消查询') && !t.includes('查询中');
            }, { timeout: this.timeout });
        } catch (e) {}
        await page.waitForTimeout(5000);
    }

    async _exportExcel(page) {
        console.log('[SmartBI] 导出Excel...');
        const result = { success: false, filePath: null, fileName: null, message: '' };

        const allPages = page.context().pages();
        let activePage = page;
        if (allPages.length > 1) {
            activePage = allPages[allPages.length - 1];
            await activePage.bringToFront();
            await this._waitForReportLoad(activePage);
        }

        // 方法1: 尝试工具栏导出（新界面类型）
        const toolbarExport = await this._tryToolbarExport(activePage);
        if (toolbarExport.success) {
            return toolbarExport;
        }

        // 方法2: 尝试左侧直接导出（新界面：左侧显示HTML/PNG/PDF/Word/Excel）
        const leftPanelExport = await this._tryLeftPanelExport(activePage);
        if (leftPanelExport.success) {
            return leftPanelExport;
        }

        // 方法3: 尝试左侧导出菜单（旧界面类型）
        const menuExport = await this._tryMenuExport(activePage);
        if (menuExport.success) {
            return menuExport;
        }

        result.message = '未找到Excel选项';
        return result;
    }

    // 工具栏导出方式（点击导出按钮 → 点击Excel/EXCEL → 可能弹出导出设置对话框）
    async _tryToolbarExport(page) {
        const result = { success: false, filePath: null, fileName: null, message: '' };
        
        // 查找工具栏中的导出按钮
        const exportBtn = await page.evaluate(() => {
            const toolbar = document.querySelector('._trToolbar, .queryview-toolbar, .toolbarBg');
            if (!toolbar) return null;
            const allElements = toolbar.querySelectorAll('*');
            for (const el of allElements) {
                const rect = el.getBoundingClientRect();
                const title = el.getAttribute('title') || '';
                if (title === '导出' && rect.width > 10 && rect.height > 10) {
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
            }
            return null;
        });

        if (!exportBtn) {
            result.message = '未找到工具栏导出按钮';
            return result;
        }

        console.log('[SmartBI] 找到工具栏导出按钮');
        await page.mouse.click(exportBtn.x, exportBtn.y);
        await page.waitForTimeout(1500);

        // 查找下拉菜单中的Excel/EXCEL选项（兼容大小写）
        const excelOption = await page.evaluate(() => {
            for (const el of document.querySelectorAll('*')) {
                const text = (el.textContent || '').trim();
                const rect = el.getBoundingClientRect();
                if (['EXCEL', 'Excel', 'excel'].includes(text) && rect.width > 20 && rect.height > 10 && rect.height < 50) {
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
            }
            return null;
        });

        if (!excelOption) {
            result.message = '未找到Excel菜单项';
            return result;
        }

        console.log('[SmartBI] 点击Excel选项');
        await page.mouse.click(excelOption.x, excelOption.y);
        await page.waitForTimeout(2000);

        // 检查是否弹出"导出设置"对话框（电子表格类型报表）
        const hasDialog = await page.locator('text=导出设置').count().catch(() => 0);
        if (hasDialog > 0) {
            console.log('[SmartBI] 检测到导出设置对话框，点击在线导出');
            try {
                const onlineBtn = page.locator('text=在线导出').first();
                await onlineBtn.click({ timeout: 5000 });
            } catch (e) {
                result.message = '未找到在线导出按钮';
                return result;
            }
        }

        // 等待下载
        const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
        const download = await downloadPromise;

        if (download) {
            const fileName = download.suggestedFilename();
            const filePath = path.join(this.downloadDir, fileName);
            await download.saveAs(filePath);
            result.success = true;
            result.fileName = fileName;
            result.filePath = filePath;
            console.log(`[SmartBI] 已保存: ${filePath}`);
        } else {
            result.message = '未检测到下载事件';
        }
        return result;
    }

    // 菜单导出方式（旧界面：悬停Excel → 点击在线导出）
    async _tryMenuExport(page) {
        const result = { success: false, filePath: null, fileName: null, message: '' };
        
        // 点击左侧导出区域
        await page.mouse.click(150, 85);
        await page.waitForTimeout(1500);

        // 查找Excel选项
        const excelCoords = await page.evaluate(() => {
            for (const el of document.querySelectorAll('*')) {
                const text = (el.textContent || '').trim();
                const rect = el.getBoundingClientRect();
                if (['EXCEL', 'Excel', 'excel'].includes(text) && rect.width > 0 && rect.height > 0 && rect.height < 50) {
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
            }
            return null;
        });

        if (!excelCoords) {
            result.message = '未找到Excel选项';
            return result;
        }

        await page.mouse.move(excelCoords.x, excelCoords.y);
        await page.waitForTimeout(2000);

        // 查找在线导出选项
        const onlineCoords = await page.evaluate(() => {
            for (const el of document.querySelectorAll('*')) {
                const text = (el.textContent || '').trim();
                const rect = el.getBoundingClientRect();
                if (text === '在线导出' && rect.width > 0 && rect.height > 0 && rect.height < 50) {
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
            }
            return null;
        });

        if (onlineCoords) {
            const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
            await page.mouse.click(onlineCoords.x, onlineCoords.y);
            const download = await downloadPromise;
            if (download) {
                const fileName = download.suggestedFilename();
                const filePath = path.join(this.downloadDir, fileName);
                await download.saveAs(filePath);
                result.success = true;
                result.fileName = fileName;
                result.filePath = filePath;
                console.log(`[SmartBI] 已保存: ${filePath}`);
            } else {
                result.message = '未检测到下载事件';
            }
        } else {
            result.message = '未找到在线导出选项';
        }
        return result;
    }

    // 左侧直接导出方式（新界面：左侧显示HTML/PNG/PDF/Word/Excel → 点击Excel → 弹出导出设置对话框）
    async _tryLeftPanelExport(page) {
        const result = { success: false, filePath: null, fileName: null, message: '' };
        
        // 查找左侧导出面板中的Excel选项（直接在左侧显示HTML/PNG/PDF/Word/Excel的界面）
        const excelOption = await page.evaluate(() => {
            for (const el of document.querySelectorAll('*')) {
                const text = (el.textContent || '').trim();
                const rect = el.getBoundingClientRect();
                // 在左侧区域查找Excel（x < 200 认为是左侧）
                if (['Excel', 'EXCEL', 'excel'].includes(text) && rect.width > 20 && rect.height > 10 && rect.x < 200) {
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                }
            }
            return null;
        });

        if (!excelOption) {
            result.message = '未找到左侧Excel选项';
            return result;
        }

        console.log('[SmartBI] 找到左侧Excel选项，点击...');
        await page.mouse.click(excelOption.x, excelOption.y);
        await page.waitForTimeout(2000);

        // 检查是否弹出"导出设置"对话框
        const hasDialog = await page.locator('text=导出设置').count().catch(() => 0);
        if (hasDialog > 0) {
            console.log('[SmartBI] 检测到导出设置对话框');
            
            // 查找并点击"在线导出"按钮
            const onlineBtn = await page.evaluate(() => {
                for (const el of document.querySelectorAll('button, span, div')) {
                    const text = (el.textContent || '').trim();
                    if (text === '在线导出') {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 30 && rect.height > 15) {
                            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                        }
                    }
                }
                return null;
            });

            if (onlineBtn) {
                console.log('[SmartBI] 点击在线导出按钮');
                const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
                await page.mouse.click(onlineBtn.x, onlineBtn.y);
                
                const download = await downloadPromise;
                if (download) {
                    const fileName = download.suggestedFilename();
                    const filePath = path.join(this.downloadDir, fileName);
                    await download.saveAs(filePath);
                    result.success = true;
                    result.fileName = fileName;
                    result.filePath = filePath;
                    console.log(`[SmartBI] 已保存: ${filePath}`);
                } else {
                    result.message = '未检测到下载事件';
                }
            } else {
                result.message = '未找到在线导出按钮';
            }
        } else {
            // 没有弹出对话框，可能直接下载
            const downloadPromise = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
            const download = await downloadPromise;
            if (download) {
                const fileName = download.suggestedFilename();
                const filePath = path.join(this.downloadDir, fileName);
                await download.saveAs(filePath);
                result.success = true;
                result.fileName = fileName;
                result.filePath = filePath;
                console.log(`[SmartBI] 已保存: ${filePath}`);
            } else {
                result.message = '未检测到下载事件，也未找到导出设置对话框';
            }
        }
        return result;
    }
}

module.exports = SmartBIExporter;

if (require.main === module) {
    const exporter = new SmartBIExporter();
    const reportName = process.argv[2];
    
    if (!reportName) {
        console.log('用法: node index.js <报表名称或关键词>');
        console.log(`\n当前已加载 ${exporter.listReports().length} 个报表`);
        console.log('\n常用别名:');
        Object.entries(exporter.listVocabularies()).slice(0, 10).forEach(([k, v]) => console.log(`  "${k}" → "${v}"`));
        process.exit(1);
    }
    
    exporter.export(reportName).then(r => {
        console.log('\n=== 导出结果 ===');
        console.log(JSON.stringify(r, null, 2));
        process.exit(r.success ? 0 : 1);
    });
}
