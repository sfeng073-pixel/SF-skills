/**
 * CC通时通次自动播报技能 v2.1
 * 
 * 功能：
 * 1. 调用 smartbi-export 技能下载通时通次数据
 * 2. 筛选台湾CC数据并处理（小组汇总+个人明细）
 * 3. 生成 Markdown 表格消息
 * 4. 推送到钉钉群
 * 
 * 使用方式：
 * - 直接运行: node index.js
 * - 测试模式: node index.js --test
 * - 指定配置: node index.js --config /path/to/config.json
 */
const path = require('path');
const fs = require('fs');

// 内部模块
const DataProcessor = require('./data-processor');
const DingTalkPusher = require('./dingtalk-pusher');

class CCCallReportSkill {
    constructor(options = {}) {
        // 加载配置
        this.config = this._loadConfig(options.configPath);
        
        // 初始化模块
        this.dataProcessor = new DataProcessor(this.config.dataProcess);
        this.dingtalkPusher = new DingTalkPusher(this.config.dingtalk);
        
        // SmartBI导出器（延迟加载）
        this.smartbiExporter = null;
        
        // 工作目录
        this.workDir = options.workDir || process.cwd();
    }

    /**
     * 加载配置文件
     * 环境变量优先级高于配置文件（兼容 GitHub Actions）
     */
    _loadConfig(configPath) {
        const defaultConfigPath = path.join(__dirname, 'config.json');
        const finalPath = configPath || defaultConfigPath;
        
        // 基础默认配置
        const defaultConfig = {
            smartbi: {
                reportName: '益智CC日通时通次监控',
                reportAlias: 'CC通时通次'
            },
            dingtalk: {
                webhook: '',
                secret: ''
            },
            schedule: {
                times: ['14:00', '18:30', '21:30'],
                timezone: 'Asia/Shanghai'
            },
            dataProcess: {
                filterBy: '台湾',
                sortField: '人均通时',
                sortOrder: 'desc'
            }
        };
        
        // 读取配置文件
        let fileConfig = {};
        if (fs.existsSync(finalPath)) {
            const content = fs.readFileSync(finalPath, 'utf8');
            fileConfig = JSON.parse(content);
        }
        
        // 合并配置：默认 < 配置文件 < 环境变量
        const mergedConfig = {
            ...defaultConfig,
            ...fileConfig,
            dingtalk: {
                webhook: process.env.DINGTALK_WEBHOOK || fileConfig.dingtalk?.webhook || defaultConfig.dingtalk.webhook,
                secret: process.env.DINGTALK_SECRET || fileConfig.dingtalk?.secret || defaultConfig.dingtalk.secret
            },
            smartbi: {
                ...defaultConfig.smartbi,
                ...fileConfig.smartbi,
                username: process.env.SMARTBI_USER || fileConfig.smartbi?.username || '',
                password: process.env.SMARTBI_PASS || fileConfig.smartbi?.password || ''
            }
        };
        
        return mergedConfig;
    }

    /**
     * 初始化SmartBI导出器
     * 加载顺序：内置 smartbi-export → 本地 SOLO 技能路径
     * 账号优先从环境变量读取，兼容 GitHub Actions
     */
    async _initSmartBIExporter() {
        if (this.smartbiExporter) {
            return this.smartbiExporter;
        }

        // 按优先级查找 smartbi-export 模块
        const searchPaths = [
            path.join(__dirname, 'smartbi-export'),           // 内置（GitHub Actions 使用）
            '/mnt/appuserdata/skills/smartbi-export'          // 本地 SOLO 技能路径
        ];

        let exporterPath = null;
        for (const p of searchPaths) {
            if (fs.existsSync(path.join(p, 'index.js'))) {
                exporterPath = p;
                break;
            }
        }

        if (!exporterPath) {
            throw new Error('未找到 smartbi-export 模块');
        }

        console.log(`[CCCallReport] 加载 SmartBI 导出器: ${exporterPath}`);
        const SmartBIExporter = require(exporterPath);

        // 账号配置：环境变量优先，config.json 次之
        const smartbiConfig = this.config.smartbi || {};
        this.smartbiExporter = new SmartBIExporter({
            downloadDir: this.workDir,
            username: process.env.SMARTBI_USER || smartbiConfig.username || '',
            password: process.env.SMARTBI_PASS || smartbiConfig.password || ''
        });

        return this.smartbiExporter;
    }

    /**
     * 生成 Markdown 表格消息
     */
    _generateMarkdown(data) {
        const today = new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        const timestamp = new Date().toLocaleString('zh-CN');
        
        let md = `## 📊 台湾CC通时通次播报\n\n`;
        md += `**数据日期**: ${today} | **数据时间**: ${timestamp}\n\n`;
        
        // 小组汇总
        md += `### 📈 小组汇总\n\n`;
        md += `| 小组 | 通时目标 | 人均通时 | 通时达标率 | 通次目标 | 人均通次 | 通次达标率 |\n`;
        md += `|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
        
        for (const team of data.formattedTeamData) {
            md += `| ${team['小组']} | ${team['通时目标']} | ${team['人均通时']} | ${team['通时达标率']} | ${team['通次目标']} | ${team['人均通次']} | ${team['通次达标率']} |\n`;
        }
        
        md += `\n`;
        
        // 个人明细
        md += `### 👥 个人明细（按个人通时排序）\n\n`;
        md += `| 排名 | 姓名 | 通时目标 | 个人通时 | 通时达标率 | 通次目标 | 个人通次 | 通次达标率 |\n`;
        md += `|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
        
        data.formattedPersonalData.forEach((person, index) => {
            const rank = index + 1;
            let rankEmoji = rank;
            if (rank === 1) rankEmoji = '🥇';
            else if (rank === 2) rankEmoji = '🥈';
            else if (rank === 3) rankEmoji = '🥉';
            
            md += `| ${rankEmoji} | ${person['CC姓名']} | ${person['通时目标']} | ${person['个人通时']} | ${person['通时达标率']} | ${person['通次目标']} | ${person['个人通次']} | ${person['通次达标率']} |\n`;
        });
        
        md += `\n`;
        md += `---\n`;
        md += `⏰ 数据更新时间: ${timestamp} | 数据来源: SmartBI`;
        
        return md;
    }

    /**
     * 执行完整流程
     */
    async run(options = {}) {
        const startTime = Date.now();
        const result = {
            success: false,
            step: null,
            data: null,
            message: '',
            duration: 0
        };

        try {
            // Step 1: 导出数据
            console.log('\n========================================');
            console.log('[CCCallReport] Step 1: 导出SmartBI数据');
            console.log('========================================\n');
            result.step = 'export';

            const exporter = await this._initSmartBIExporter();
            const reportName = this.config.smartbi.reportName;
            
            console.log(`[CCCallReport] 导出报表: ${reportName}`);
            const exportResult = await exporter.exportFast(reportName);

            if (!exportResult.success) {
                throw new Error(`导出失败: ${exportResult.message}`);
            }

            console.log(`[CCCallReport] 导出成功: ${exportResult.filePath}`);
            result.data = { exportResult };

            // Step 2: 处理数据
            console.log('\n========================================');
            console.log('[CCCallReport] Step 2: 处理数据');
            console.log('========================================\n');
            result.step = 'process';

            const processedData = this.dataProcessor.process(exportResult.filePath);
            console.log(`[CCCallReport] 处理完成: ${processedData.filteredTeamCount} 个小组, ${processedData.filteredPersonalCount} 条个人明细`);
            result.data.processedData = processedData;

            if (processedData.filteredTeamCount === 0) {
                throw new Error('未找到台湾CC数据');
            }

            // Step 3: 生成 Markdown 消息
            console.log('\n========================================');
            console.log('[CCCallReport] Step 3: 生成 Markdown 消息');
            console.log('========================================\n');
            result.step = 'generate_markdown';

            const markdownMessage = this._generateMarkdown(processedData);
            result.data.markdownMessage = markdownMessage;
            console.log(`[CCCallReport] Markdown 生成成功`);

            // Step 4: 推送到钉钉
            console.log('\n========================================');
            console.log('[CCCallReport] Step 4: 推送到钉钉');
            console.log('========================================\n');
            result.step = 'push';

            // 检查是否为测试模式
            if (options.test) {
                console.log('[CCCallReport] 测试模式，跳过钉钉推送');
                console.log('\n--- 生成的 Markdown 内容 ---\n');
                console.log(markdownMessage);
                console.log('\n--- Markdown 结束 ---\n');
                result.success = true;
                result.message = '测试模式完成';
            } else {
                const pushResult = await this.dingtalkPusher.sendMarkdown(
                    '台湾CC通时通次播报',
                    markdownMessage
                );

                if (!pushResult.success) {
                    throw new Error(`钉钉推送失败: ${pushResult.error || pushResult.errmsg}`);
                }

                console.log('[CCCallReport] 推送成功！');
                result.success = true;
                result.message = '播报完成';
            }

            // 清理临时文件
            if (exportResult.filePath && fs.existsSync(exportResult.filePath)) {
                fs.unlinkSync(exportResult.filePath);
                console.log(`[CCCallReport] 已清理临时文件: ${exportResult.filePath}`);
            }

        } catch (error) {
            console.error(`[CCCallReport] 执行失败:`, error.message);
            result.success = false;
            result.message = error.message;
            result.error = error.stack;
        }

        result.duration = Date.now() - startTime;
        console.log(`\n[CCCallReport] 总耗时: ${result.duration}ms`);

        return result;
    }

    /**
     * 获取当前时间字符串
     */
    _getCurrentTime() {
        return new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 获取定时任务配置
     */
    getScheduleConfig() {
        return {
            times: this.config.schedule.times,
            timezone: this.config.schedule.timezone
        };
    }
}

// 导出模块
module.exports = CCCallReportSkill;

// 命令行入口
if (require.main === module) {
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const configIndex = args.indexOf('--config');
    const configPath = configIndex >= 0 ? args[configIndex + 1] : null;

    const skill = new CCCallReportSkill({ configPath });
    
    skill.run({ test: testMode }).then(result => {
        console.log('\n========================================');
        console.log('执行结果');
        console.log('========================================');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('执行出错:', error);
        process.exit(1);
    });
}
