/**
 * 销售实时作战大屏 - 黑金风格
 * 三个模块：顶部KPI + 销售业绩排行 + 通时通次监控
 * 数据来源：sales-data.json（从Excel解析）
 */

// ==================== 数据存储 ====================

let KPI_DATA = {};
let RANKING_DATA = [];
let CALL_DATA = [];

// 滚动动画状态
let rankingScrollState = { interval: null, animating: false };
let callScrollState = { interval: null, animating: false };

// ==================== 工具函数 ====================

function formatMoney(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    }
    return num.toLocaleString();
}

function formatMoneyFull(num) {
    return '¥' + Math.round(num).toLocaleString();
}

function getPctClass(pct) {
    if (pct >= 100) return 'high';
    if (pct >= 80) return 'mid';
    return 'low';
}

// ==================== 加载数据 ====================

async function loadData() {
    try {
        const response = await fetch('sales-data.json');
        if (response.ok) {
            const data = await response.json();

            // 解析汇总数据
            if (data.summary) {
                KPI_DATA = {
                    totalGMV: data.summary.total_gmv_actual || 0,
                    gmvTarget: data.summary.total_gmv_target || 0,
                    gmvPct: Math.round((data.summary.mtd_rate || 0) * 100),
                    totalOrders: Math.round(data.summary.order_actual || 0),
                    ordersTarget: data.summary.order_target || 0,
                    ordersPct: Math.round((data.summary.order_rate || 0) * 100),
                    regConversion: data.summary['分发转化率'] || 0,
                    rollConversion: data.summary['分发滚动转化率'] || 0,
                    asp: data.summary['滚动ASP'] || 0,
                    capacityPct: data.summary['产能达成率'] || 0
                };
            }

            // 解析销售排名数据
            if (data.sales_ranking) {
                RANKING_DATA = data.sales_ranking.map(item => ({
                    rank: item.rank,
                    name: item.name,
                    gmv: item.gmv_actual,
                    target: item.gmv_target,
                    ordersWeighted: item.order_actual,
                    ordersTarget: item.order_target,
                    ordersRate: Math.round(item.order_rate * 100),
                    mtdRate: Math.round(item.mtd_rate * 100)
                }));
            }

            // 解析通时通次数据
            if (data.call_data) {
                CALL_DATA = data.call_data.map(item => ({
                    name: item.name,
                    time: item.call_time,
                    count: item.call_count
                }));
            }

            console.log('数据加载成功:', { KPI_DATA, RANKING_DATA, CALL_DATA });
            return true;
        }
    } catch (e) {
        console.error('加载数据失败:', e);
    }
    return false;
}

// ==================== 模块1：渲染顶部KPI ====================

function renderKPI() {
    const container = document.getElementById('module-kpi');
    if (!container) return;

    const gmvPct = KPI_DATA.gmvPct || 0;
    const ordersPct = KPI_DATA.ordersPct || 0;
    const capacityPct = KPI_DATA.capacityPct || 0;

    const row1Items = [
        { label: '总GMV', value: formatMoneyFull(KPI_DATA.totalGMV || 0), isPct: false },
        { label: 'GMV目标', value: formatMoneyFull(KPI_DATA.gmvTarget || 0), isPct: false },
        { label: 'GMV完成度', value: gmvPct + '%', isPct: true, pct: gmvPct },
        { label: '总单量', value: (KPI_DATA.totalOrders || 0) + '单', isPct: false },
        { label: '单量目标', value: (KPI_DATA.ordersTarget || 0) + '单', isPct: false },
        { label: '单量完成度', value: ordersPct + '%', isPct: true, pct: ordersPct }
    ];

    const row2Items = [
        { label: '注册转化率', value: (KPI_DATA.regConversion || 0) + '%', isPct: false },
        { label: '滚动转化率', value: (KPI_DATA.rollConversion || 0) + '%', isPct: false },
        { label: 'ASP', value: '¥' + (KPI_DATA.asp || 0), isPct: false },
        { label: '产能完成度', value: capacityPct + '%', isPct: true, pct: capacityPct }
    ];

    function buildRow(items) {
        const row = document.createElement('div');
        row.className = 'kpi-row';

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'kpi-item';

            let valueHtml = `<div class="kpi-value">${item.value}</div>`;

            if (item.isPct) {
                const pctClass = getPctClass(item.pct);
                valueHtml = `
                    <div class="kpi-value">
                        <span class="kpi-pct ${pctClass}">
                            ${item.value}
                            <div class="kpi-pct-bar">
                                <div class="kpi-pct-fill ${pctClass}" style="width:${Math.min(item.pct, 100)}%"></div>
                            </div>
                        </span>
                    </div>
                `;
            }

            div.innerHTML = `
                <div class="kpi-label">${item.label}</div>
                ${valueHtml}
            `;
            row.appendChild(div);
        });

        return row;
    }

    container.innerHTML = '';
    container.appendChild(buildRow(row1Items));
    container.appendChild(buildRow(row2Items));
}

// ==================== 通用滚动表格渲染（带向上滑动动画） ====================

/**
 * 渲染带滚动动画的表格
 * 前三名固定，剩余数据向上滑动切换
 */
function renderScrollTable(containerId, headers, top3Data, restData, renderRowFn, scrollState, visibleCount) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 清除之前的滚动定时器
    if (scrollState.interval) {
        clearInterval(scrollState.interval);
        scrollState.interval = null;
    }

    const totalRest = restData.length;

    // 构建表格HTML
    let html = '<table class="data-table"><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    // 前三名固定
    top3Data.forEach((item, index) => {
        html += renderRowFn(item, index, true);
    });

    // 剩余行（全部渲染，通过CSS控制可见性）
    restData.forEach((item, index) => {
        html += renderRowFn(item, index, false);
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // 如果剩余数据不足visibleCount行，全部显示，不滚动
    const scrollRows = container.querySelectorAll('.scroll-row');
    if (totalRest <= visibleCount) return;

    // 初始状态：隐藏超出visibleCount的行
    scrollRows.forEach((row, index) => {
        row.style.display = index < visibleCount ? '' : 'none';
    });

    // 获取行高（用于计算滑动距离）
    function getRowHeight() {
        const firstRow = scrollRows[0];
        if (!firstRow) return 40;
        return firstRow.offsetHeight || 40;
    }

    // 向上滑动动画
    function scrollUp() {
        if (scrollState.animating) return;
        scrollState.animating = true;

        const rowH = getRowHeight();
        const tbody = container.querySelector('tbody');
        if (!tbody) { scrollState.animating = false; return; }

        // 找到当前可见的scroll-row
        const visibleRows = Array.from(scrollRows).filter(r => r.style.display !== 'none');
        const firstVisible = visibleRows[0];
        const lastVisible = visibleRows[visibleRows.length - 1];
        if (!firstVisible || !lastVisible) { scrollState.animating = false; return; }

        // 找到当前第一行在scrollRows中的索引
        const firstIndex = Array.from(scrollRows).indexOf(firstVisible);
        // 下一行要显示的行索引（循环）
        const nextIndex = (firstIndex + visibleCount) % totalRest;

        // 准备：让新行出现在底部（在最后一行下方）
        const newRow = scrollRows[nextIndex];
        newRow.style.display = '';
        newRow.style.opacity = '0';
        newRow.style.transform = 'translateY(' + rowH + 'px)';
        newRow.style.transition = 'none';

        // 强制重排
        void newRow.offsetHeight;

        // 动画：所有可见行向上移动一行高度，新行淡入
        const animDuration = 600; // 毫秒

        // 当前可见行向上滑动并淡出
        visibleRows.forEach((row, i) => {
            row.style.transition = `transform ${animDuration}ms ease, opacity ${animDuration}ms ease`;
            row.style.transform = 'translateY(-' + rowH + 'px)';
            row.style.opacity = '0';
        });

        // 新行从下方滑入并淡入
        newRow.style.transition = `transform ${animDuration}ms ease, opacity ${animDuration}ms ease`;
        newRow.style.transform = 'translateY(0)';
        newRow.style.opacity = '1';

        // 动画结束后清理
        setTimeout(() => {
            // 隐藏滑出去的第一行
            firstVisible.style.display = 'none';
            firstVisible.style.transition = 'none';
            firstVisible.style.transform = '';
            firstVisible.style.opacity = '';

            // 重置其他行的样式
            visibleRows.forEach((row, i) => {
                if (row !== firstVisible) {
                    row.style.transition = 'none';
                    row.style.transform = '';
                    row.style.opacity = '';
                }
            });

            // 重置新行样式
            newRow.style.transition = 'none';
            newRow.style.transform = '';
            newRow.style.opacity = '';

            scrollState.animating = false;
        }, animDuration + 50);
    }

    // 每4秒滚动一次
    scrollState.interval = setInterval(scrollUp, 4000);
}

// ==================== 模块2：渲染销售业绩排行 ====================

function renderRanking() {
    const top3 = RANKING_DATA.slice(0, 3);
    const rest = RANKING_DATA.slice(3);
    const headers = ['排名', '姓名', 'GMV', '目标', '完成度', '加权单量', '单量目标', '单量完成度'];

    function renderRow(item, index, isTop3) {
        const pct = item.mtdRate || 0;
        const pctClass = getPctClass(pct);
        const rankClass = item.rank === 1 ? 'r1' : item.rank === 2 ? 'r2' : item.rank === 3 ? 'r3' : 'rn';
        const rowClass = isTop3 ? 'top3-row' : 'scroll-row';

        return `
            <tr class="${rowClass}">
                <td><span class="rank-num ${rankClass}">${item.rank}</span></td>
                <td class="rank-name">${item.name}</td>
                <td class="rank-gold">${formatMoneyFull(item.gmv)}</td>
                <td>${formatMoneyFull(item.target)}</td>
                <td class="${pctClass}">${pct}%</td>
                <td>${item.ordersWeighted}</td>
                <td>${item.ordersTarget}</td>
                <td class="${getPctClass(item.ordersRate)}">${item.ordersRate}%</td>
            </tr>
        `;
    }

    renderScrollTable('ranking-table', headers, top3, rest, renderRow, rankingScrollState, 9);
}

// ==================== 模块3：渲染通时通次监控 ====================

function renderCallData() {
    const container = document.getElementById('call-table');
    if (!container) return;

    if (!CALL_DATA || CALL_DATA.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">暂无通时通次数据<br>请上传【益智cc日通时通次监控】报表</div>';
        return;
    }

    const sortedData = [...CALL_DATA].sort((a, b) => b.time - a.time);
    const top3 = sortedData.slice(0, 3);
    const rest = sortedData.slice(3);
    const headers = ['排名', '姓名', '通时', '通次'];

    function renderRow(item, index, isTop3) {
        const rank = isTop3 ? (index + 1) : (index + 4);
        const rankClass = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : 'rn';
        const rowClass = isTop3 ? 'top3-row' : 'scroll-row';

        return `
            <tr class="${rowClass}">
                <td><span class="rank-num ${rankClass}">${rank}</span></td>
                <td class="rank-name">${item.name}</td>
                <td class="call-time">${item.time}min</td>
                <td>${item.count}</td>
            </tr>
        `;
    }

    renderScrollTable('call-table', headers, top3, rest, renderRow, callScrollState, 9);
}

// ==================== 时钟 ====================

function updateClock() {
    const now = new Date();
    const str = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
    const timeEl = document.getElementById('header-time');
    if (timeEl) timeEl.textContent = str;
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', async () => {
    const loaded = await loadData();

    renderKPI();
    renderRanking();
    renderCallData();
    updateClock();

    setInterval(updateClock, 1000);
    setInterval(async () => {
        await loadData();
        renderKPI();
        renderRanking();
        renderCallData();
    }, 30000);
});

// 导出供外部调用
window.dashboardAPI = {
    refresh: () => {
        renderKPI();
        renderRanking();
        renderCallData();
    },
    reloadData: async () => {
        await loadData();
        window.dashboardAPI.refresh();
    }
};
