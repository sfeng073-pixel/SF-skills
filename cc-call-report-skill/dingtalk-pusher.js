/**
 * 钉钉消息推送模块
 * 功能：发送Markdown消息、图片到钉钉群
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

class DingTalkPusher {
    constructor(config = {}) {
        this.webhook = config.webhook || '';
        this.secret = config.secret || '';
    }

    /**
     * 发送图片消息（使用Markdown方式嵌入base64图片）
     * @param {string} imagePath 图片文件路径
     * @param {string} title 图片标题
     * @returns {Object} 发送结果
     */
    async sendImage(imagePath, title = '数据报表') {
        console.log(`[DingTalk] 准备发送图片: ${imagePath}`);
        
        if (!this.webhook) {
            throw new Error('钉钉Webhook未配置');
        }

        if (!fs.existsSync(imagePath)) {
            throw new Error(`图片文件不存在: ${imagePath}`);
        }

        // 读取图片并转为base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // 构建data URL
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        // 构建请求URL（如果有密钥则签名）
        let url = this.webhook;
        if (this.secret) {
            const sign = this._generateSign();
            url = `${this.webhook}&timestamp=${sign.timestamp}&sign=${encodeURIComponent(sign.sign)}`;
        }

        // 构建Markdown消息体（嵌入图片）
        const markdownContent = `## ${title}\n\n![报表](${dataUrl})`;
        
        const message = {
            msgtype: 'markdown',
            markdown: {
                title: title,
                text: markdownContent
            }
        };

        try {
            const result = await this._post(url, message);
            console.log(`[DingTalk] 发送结果:`, result);
            return {
                success: result.errcode === 0,
                errcode: result.errcode,
                errmsg: result.errmsg
            };
        } catch (error) {
            console.error(`[DingTalk] 发送失败:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送Markdown消息
     * @param {string} title 消息标题
     * @param {string} content Markdown内容
     * @returns {Object} 发送结果
     */
    async sendMarkdown(title, content) {
        console.log(`[DingTalk] 准备发送消息: ${title}`);
        
        if (!this.webhook) {
            throw new Error('钉钉Webhook未配置');
        }

        // 构建请求URL（如果有密钥则签名）
        let url = this.webhook;
        if (this.secret) {
            const sign = this._generateSign();
            url = `${this.webhook}&timestamp=${sign.timestamp}&sign=${encodeURIComponent(sign.sign)}`;
        }

        // 构建消息体
        const message = {
            msgtype: 'markdown',
            markdown: {
                title: title,
                text: content
            }
        };

        try {
            const result = await this._post(url, message);
            console.log(`[DingTalk] 发送结果:`, result);
            return {
                success: result.errcode === 0,
                errcode: result.errcode,
                errmsg: result.errmsg
            };
        } catch (error) {
            console.error(`[DingTalk] 发送失败:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送文本消息
     */
    async sendText(content, atMobiles = [], atAll = false) {
        if (!this.webhook) {
            throw new Error('钉钉Webhook未配置');
        }

        let url = this.webhook;
        if (this.secret) {
            const sign = this._generateSign();
            url = `${this.webhook}&timestamp=${sign.timestamp}&sign=${encodeURIComponent(sign.sign)}`;
        }

        const message = {
            msgtype: 'text',
            text: {
                content: content
            },
            at: {
                atMobiles: atMobiles,
                isAtAll: atAll
            }
        };

        try {
            const result = await this._post(url, message);
            return {
                success: result.errcode === 0,
                errcode: result.errcode,
                errmsg: result.errmsg
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 生成签名
     */
    _generateSign() {
        const timestamp = Date.now();
        const stringToSign = `${timestamp}\n${this.secret}`;
        const hmac = crypto.createHmac('sha256', this.secret);
        hmac.update(stringToSign);
        const sign = hmac.digest('base64');
        
        return { timestamp, sign };
    }

    /**
     * 发送HTTPS POST请求
     */
    _post(url, data) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        reject(new Error(`解析响应失败: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify(data));
            req.end();
        });
    }
}

module.exports = DingTalkPusher;
