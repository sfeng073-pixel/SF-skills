/**
 * CC通时通次数据处理模块
 * 功能：读取Excel、筛选台湾CC数据、解析小组汇总+个人明细
 */
const XLSX = require('xlsx');
const fs = require('fs');

class DataProcessor {
    constructor(config = {}) {
        this.filterBy = config.filterBy || null;
        this.sortField = config.sortField || '人均通时';
        this.sortOrder = config.sortOrder || 'desc';
    }

    /**
     * 处理Excel文件
     * @param {string} filePath Excel文件路径
     * @returns {Object} 处理后的数据
     */
    process(filePath) {
        console.log(`[DataProcessor] 开始处理文件: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`[DataProcessor] 读取到 ${rawData.length} 行原始数据`);
        
        // 打印前10行用于调试
        console.log(`[DataProcessor] 前10行数据预览:`);
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            console.log(`  行${i}: ${JSON.stringify(rawData[i])}`);
        }

        // 解析小组汇总数据
        const teamSummary = this._parseTeamSummary(rawData);
        console.log(`[DataProcessor] 解析到 ${teamSummary.length} 个小组汇总`);
        if (teamSummary.length > 0) {
            console.log(`[DataProcessor] 小组列表: ${teamSummary.map(t => t.小组).join(', ')}`);
        }

        // 解析个人明细数据
        const personalDetails = this._parsePersonalDetails(rawData);
        console.log(`[DataProcessor] 解析到 ${personalDetails.length} 条个人明细`);

        // 筛选台湾CC数据
        let filteredTeams = teamSummary;
        let filteredPersonal = personalDetails;
        
        if (this.filterBy) {
            console.log(`[DataProcessor] 开始筛选关键词: "${this.filterBy}"`);
            filteredTeams = teamSummary.filter(item => {
                const match = item.小组 && item.小组.includes(this.filterBy);
                console.log(`  检查小组 "${item.小组}": ${match ? '匹配' : '不匹配'}`);
                return match;
            });
            filteredPersonal = personalDetails.filter(item => {
                const match = item.所属小组 && item.所属小组.includes(this.filterBy);
                return match;
            });
            console.log(`[DataProcessor] 筛选"${this.filterBy}"后: ${filteredTeams.length} 个小组, ${filteredPersonal.length} 条个人明细`);
        }

        // 排序小组数据
        const sortedTeams = this._sortData(filteredTeams);

        // 格式化小组数据（用于图片展示）
        const formattedTeamData = sortedTeams.map(item => ({
            '小组': item.小组,
            '通时目标': item.通时目标,
            '人均通时': item.人均通时,
            '通时达标率': item.通时达标率 ? (item.通时达标率 * 100).toFixed(1) + '%' : '-',
            '通次目标': item.通次目标,
            '人均通次': item.人均通次,
            '通次达标率': item.通次达标率 ? (item.通次达标率 * 100).toFixed(1) + '%' : '-'
        }));

        // 格式化个人数据（用于图片展示）
        const formattedPersonalData = filteredPersonal.map(item => ({
            'CC姓名': item.姓名,
            '通时目标': item.通时目标,
            '个人通时': item.个人通时,
            '通时达标率': item.通时达标率 ? (item.通时达标率 * 100).toFixed(1) + '%' : '-',
            '通次目标': item.通次目标,
            '个人通次': item.个人通次,
            '通次达标率': item.通次达标率 ? (item.通次达标率 * 100).toFixed(1) + '%' : '-'
        }));

        return {
            success: true,
            teamSummary: sortedTeams,
            personalDetails: filteredPersonal,
            formattedTeamData: formattedTeamData,
            formattedPersonalData: formattedPersonalData,
            filterBy: this.filterBy,
            timestamp: new Date().toISOString(),
            teamCount: teamSummary.length,
            personalCount: personalDetails.length,
            filteredTeamCount: sortedTeams.length,
            filteredPersonalCount: filteredPersonal.length
        };
    }

    /**
     * 解析小组汇总数据（报表上半部分）
     */
    _parseTeamSummary(rawData) {
        const teams = [];
        
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            // 检查是否是小组汇总行：第2列是小组名，包含"组"，第3列没有姓名
            if (row[1] && typeof row[1] === 'string' && 
                row[1].includes('组') && 
                row[1] !== '小组' &&
                !row[2]) {  // 小组汇总行没有第3列（姓名列）
                
                teams.push({
                    小组: row[1],
                    通时目标: row[3] || '-',
                    人均通时: row[4] || 0,
                    通时达标率: row[5] || 0,
                    通次目标: row[6] || '-',
                    人均通次: row[7] || 0,
                    通次达标率: row[8] || 0
                });
            }
        }

        // 去重
        const uniqueTeams = [];
        const seen = new Set();
        for (const team of teams) {
            if (!seen.has(team.小组)) {
                seen.add(team.小组);
                uniqueTeams.push(team);
            }
        }

        return uniqueTeams;
    }

    /**
     * 解析个人明细数据（报表下半部分）
     */
    _parsePersonalDetails(rawData) {
        const persons = [];
        let currentTeam = null;
        
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            
            // 检查是否是小组行（有小组名且有姓名）
            if (row[1] && typeof row[1] === 'string' && 
                row[1].includes('组') && 
                row[2] && typeof row[2] === 'string') {
                currentTeam = row[1];
                
                persons.push({
                    所属小组: currentTeam,
                    姓名: row[2],
                    通时目标: row[3] || '-',
                    个人通时: row[4] || 0,
                    通时达标率: row[5] || 0,
                    通次目标: row[6] || '-',
                    个人通次: row[7] || 0,
                    通次达标率: row[8] || 0
                });
            }
            // 检查是否是无小组名的个人行（延续上一个小组）
            else if (row[2] && typeof row[2] === 'string' && 
                     row[2].length >= 2 && 
                     row[2].length <= 4 &&
                     currentTeam &&
                     !row[1]) {  // 没有小组名，只有姓名
                
                persons.push({
                    所属小组: currentTeam,
                    姓名: row[2],
                    通时目标: row[3] || '-',
                    个人通时: row[4] || 0,
                    通时达标率: row[5] || 0,
                    通次目标: row[6] || '-',
                    个人通次: row[7] || 0,
                    通次达标率: row[8] || 0
                });
            }
        }

        return persons;
    }

    /**
     * 排序数据
     */
    _sortData(data) {
        const sortField = this.sortField;
        
        return data.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            
            return this.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
    }
}

module.exports = DataProcessor;
