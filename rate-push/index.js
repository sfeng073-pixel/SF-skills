const https = require('https');
const crypto = require('crypto');

const WEBHOOK = process.env.DINGTALK_WEBHOOK;
const SECRET = process.env.DINGTALK_SECRET;
const AMOUNTS = [3850, 5280, 8880, 14550];

function getBeijingTime() {
  return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }).replace(/\//g, '-');
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).setTimeout(15000, () => reject(new Error('超时')));
  });
}

async function fetchRate() {
  const sources = [
    { url: 'https://open.er-api.com/v6/latest/CNY', name: 'ExchangeRate-API' },
    { url: 'https://api.exchangerate-api.com/v4/latest/CNY', name: 'ExchangeRate-API(备用)' },
  ];
  for (const s of sources) {
    try {
      const body = await httpGet(s.url);
      const data = JSON.parse(body);
      if (data.rates && data.rates.TWD) {
        const rate = parseFloat(data.rates.TWD.toFixed(4));
        console.log('汇率: 1 CNY = ' + rate + ' TWD (来源: ' + s.name + ')');
        return { rate, source: s.name };
      }
    } catch (e) { console.log(s.name + ' 失败: ' + e.message); }
  }
  throw new Error('所有汇率源均失败');
}

function generateSign(timestamp, secret) {
  return encodeURIComponent(crypto.createHmac('sha256', secret).update(timestamp + '\n' + secret).digest('base64'));
}

async function sendDingTalk(rate, source) {
  const timestamp = Date.now();
  const sign = generateSign(timestamp, SECRET);
  const url = WEBHOOK + '&timestamp=' + timestamp + '&sign=' + sign;
  let rows = '';
  AMOUNTS.forEach(cny => {
    rows += '| ' + cny.toLocaleString() + ' | ' + rate + ' | ' + (cny * rate).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' |\n';
  });
  const text = '## 💱 每日汇率播报\n\n**更新时间**：' + getBeijingTime() + '\n\n**当前汇率**：1 CNY ≈ ' + rate + ' TWD\n\n| 人民币(CNY) | 汇率 | 新台币(TWD) |\n|:-----------:|:----:|:-----------:|\n' + rows + '> 数据来源：' + source;
  const data = JSON.stringify({ msgtype: 'markdown', markdown: { title: '每日汇率播报', text } });
  for (let i = 0; i <= 3; i++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => { const r = JSON.parse(body); r.errcode === 0 ? resolve(r) : reject(new Error(r.errmsg)); });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
      });
      console.log('✅ 推送成功');
      return result;
    } catch (e) {
      if (i < 3) { console.log('5秒后重试...'); await new Promise(r => setTimeout(r, 5000)); }
      else throw e;
    }
  }
}

(async () => {
  try {
    const { rate, source } = await fetchRate();
    await sendDingTalk(rate, source);
  } catch (e) {
    console.error('失败:', e.message);
    process.exit(1);
  }
})();
