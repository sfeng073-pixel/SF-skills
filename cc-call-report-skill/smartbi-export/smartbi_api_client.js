/**
 * SmartBI RMI API Client
 * 基于 HTTP RMI 的纯 API 导出方式，无需浏览器
 * 参考: smartbi_cli.py 中的 SmartbiClient 实现
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class SmartbiApiClient {
    constructor(baseUrl = 'https://bi.61info.cn/smartbi/vision') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.cookieJar = new Map();
    }

    /**
     * 发送 HTTP 请求
     * @param {string} path - 请求路径或完整 URL
     * @param {Object|null} data - POST 数据
     * @param {string|null} referer - Referer 头
     * @param {boolean} followRedirect - 是否跟随 302 重定向（导出用）
     * @param {number} maxRedirects - 最大重定向次数
     */
    async request(path, data = null, referer = null, followRedirect = false, maxRedirects = 3) {
        const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}/${path.replace(/^\//, '')}`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: data ? 'POST' : 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                'Referer': referer || `${this.baseUrl}/index.jsp`,
            },
            timeout: 120000,
            rejectUnauthorized: false,
        };

        const cookies = Array.from(this.cookieJar.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
        if (cookies) {
            options.headers['Cookie'] = cookies;
        }

        let postData = null;
        if (data) {
            postData = new URLSearchParams(data).toString();
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            options.headers['Content-Length'] = Buffer.byteLength(postData);
            const origin = `${url.protocol}//${url.host}`;
            options.headers['Origin'] = origin;
        }

        return new Promise((resolve, reject) => {
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(options, async (res) => {
                // 处理 Set-Cookie
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    setCookie.forEach(cookie => {
                        const match = cookie.match(/^([^=]+)=([^;]+)/);
                        if (match) {
                            this.cookieJar.set(match[1], match[2]);
                        }
                    });
                }

                // 处理 302 重定向（导出专用）
                if (followRedirect && (res.statusCode === 301 || res.statusCode === 302)) {
                    const location = res.headers['location'];
                    if (location && maxRedirects > 0) {
                        // 构建完整重定向 URL
                        let redirectUrl;
                        if (location.startsWith('http')) {
                            redirectUrl = location;
                        } else if (location.startsWith('/')) {
                            redirectUrl = `${url.protocol}//${url.host}${location}`;
                        } else {
                            redirectUrl = `${this.baseUrl}/${location}`;
                        }
                        
                        // 递归跟随重定向
                        try {
                            const redirectRes = await this.request(
                                redirectUrl, 
                                null, 
                                referer, 
                                true, 
                                maxRedirects - 1
                            );
                            resolve(redirectRes);
                            return;
                        } catch (err) {
                            reject(err);
                            return;
                        }
                    }
                }

                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    const body = Buffer.concat(chunks);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        text: () => body.toString('utf-8'),
                        json: () => JSON.parse(body.toString('utf-8')),
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }

    /**
     * RMI 调用
     */
    async rmi(className, methodName, params) {
        const response = await this.request('RMIServlet', {
            className: className,
            methodName: methodName,
            params: JSON.stringify(params),
        });

        const payload = await response.json();
        if (payload.retCode !== 0 && payload.retCode !== '0') {
            throw new Error(`RMI failed: ${className}.${methodName}: ${payload.retCode}`);
        }
        return payload;
    }

    /**
     * 登录
     */
    async login(username, password) {
        await this.request('index.jsp?time=' + Date.now());
        
        const payload = await this.rmi('UserService', 'clickLogin', [username, password]);
        if (payload.result !== true) {
            throw new Error('SmartBI login failed');
        }
        return true;
    }

    /**
     * 获取根目录元素
     */
    async getRootElements() {
        const payload = await this.rmi('CatalogService', 'getRootElements', []);
        return payload.result || [];
    }

    /**
     * 获取子元素
     */
    async getChildElements(parentId) {
        const payload = await this.rmi('CatalogService', 'getChildElements', [parentId]);
        return payload.result || [];
    }

    /**
     * 打开报表上下文
     */
    async openReportContext(reportId) {
        const reportUrl = `openresource.jsp?isBrowse=true&showLeftTree=default&resid=${reportId}`;
        const response = await this.request(reportUrl, null, `${this.baseUrl}/index.jsp?time=${Date.now()}`);
        const html = await response.text();
        
        const context = this.extractJsObject(html, 'var spreadsheetReportContext =');
        return context;
    }

    /**
     * 导出 SPREADSHEET_REPORT
     */
    async exportSpreadsheetReport(reportId, context, params = null) {
        // 构建参数（参考 Python 实现：params_from_context + merge_output_parameters）
        let effectiveParams;
        if (params) {
            effectiveParams = params;
        } else {
            // 1. 从 userParamInfo 获取基础参数
            const userParamInfo = context.userParamInfo || '';
            const baseParams = JSON.parse(userParamInfo || '[]');
            
            // 2. 合并 outputParameters
            const outputParams = context.outputParameters || [];
            const seenIds = new Set(baseParams.map(p => String(p.id || '')));
            
            effectiveParams = [...baseParams];
            
            for (const param of outputParams) {
                if (!param || typeof param !== 'object') continue;
                const paramId = String(param.id || '');
                if (!paramId || seenIds.has(paramId)) continue;
                
                effectiveParams.push({
                    id: paramId,
                    name: String(param.name || ''),
                    alias: String(param.alias || param.name || ''),
                    value: param.value === null ? '' : String(param.value),
                    displayValue: param.displayValue === null ? '' : String(param.displayValue || ''),
                });
                seenIds.add(paramId);
            }
        }

        const visibleSheets = context.visibleSheetNames || [];
        
        const postData = {
            sheetIndex: String(context.activeSheetIndex || 0),
            resid: reportId,
            clientId: context.clientId,
            refreshType: 'EXCEL2007',
            paramsInfo: JSON.stringify(effectiveParams),
            pageId: '',
            writeBackData: '',
            exportSheetIndexes: visibleSheets.join(','),
            exportFormula: 'true',
            tabControlsState: '',
        };

        const response = await this.request(
            'ssreportServlet',
            postData,
            `${this.baseUrl}/openresource.jsp?isBrowse=true&showLeftTree=default&resid=${reportId}`,
            true  // 跟随重定向获取 Excel 文件
        );

        const contentType = response.headers['content-type'] || '';
        const body = response.body;

        if (!contentType.includes('spreadsheetml.sheet') && !body.toString('hex').startsWith('504b0304')) {
            const preview = body.toString('utf-8', 0, 300);
            throw new Error(`Export did not return an Excel file: ${contentType}: ${preview}`);
        }

        const contentDisposition = response.headers['content-disposition'] || '';
        const filename = this.extractFilename(contentDisposition) || `${context.alias || reportId}.xlsx`;

        return { filename, body };
    }

    extractJsObject(text, marker) {
        const start = text.indexOf(marker);
        if (start < 0) {
            throw new Error(`Cannot find marker: ${marker}`);
        }

        const brace = text.indexOf('{', start + marker.length);
        if (brace < 0) {
            throw new Error(`Cannot find object after marker: ${marker}`);
        }

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let i = brace; i < text.length; i++) {
            const char = text[i];
            
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (char === '\\') {
                    escaped = true;
                } else if (char === '"') {
                    inString = false;
                }
            } else {
                if (char === '"') {
                    inString = true;
                } else if (char === '{') {
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 0) {
                        const jsonStr = text.substring(brace, i + 1);
                        try {
                            return JSON.parse(jsonStr);
                        } catch (e) {
                            throw new Error(`Failed to parse JSON object: ${e.message}`);
                        }
                    }
                }
            }
        }

        throw new Error(`Unterminated object after marker: ${marker}`);
    }

    extractFilename(contentDisposition) {
        if (!contentDisposition) return null;
        
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/);
        if (!match) return null;
        
        return decodeURIComponent(match[1]);
    }

    /**
     * 通过路径查找报表
     */
    async findReportByPath(path) {
        const parts = path.split('/').filter(p => p);
        if (parts.length === 0) {
            throw new Error('Path is required');
        }

        const roots = await this.getRootElements();
        let current = roots.find(e => 
            (e.alias === parts[0]) || (e.name === parts[0]) || (e.id === parts[0])
        );

        if (!current) {
            throw new Error(`Cannot find root: ${parts[0]}`);
        }

        for (let i = 1; i < parts.length; i++) {
            const children = await this.getChildElements(current.id);
            current = children.find(e => 
                (e.alias === parts[i]) || (e.name === parts[i]) || (e.id === parts[i])
            );
            
            if (!current) {
                throw new Error(`Cannot find: ${parts[i]}`);
            }
        }

        return current;
    }
}

module.exports = SmartbiApiClient;
