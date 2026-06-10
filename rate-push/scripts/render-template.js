export function formatMoney(value) {
  return Math.round(value).toLocaleString("en-US");
}

export function formatDecimal(value, digits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function renderRateCardHtml({ updatedLabel, rates }) {
  const rowsHtml = rates.rows.map((row, index) => `
  <article class="rate-row">
    <div class="row-index">0${index + 1}</div>
    <div class="row-main">
      <div class="row-title"><span>${row.label}</span><strong>¥${formatMoney(row.cny)}</strong></div>
      <div class="row-sub">人民币标价 · 约 US$${formatDecimal(row.usd)}</div>
    </div>
    <div class="row-price">NT$${formatMoney(row.twdRound)}</div>
  </article>`).join("");

  return `<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>台湾课程价格参考</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1440px;
    height: 1080px;
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
    color: #17211d;
    background:
      linear-gradient(120deg, rgba(239, 232, 218, .88), rgba(245, 247, 243, .96) 42%, rgba(219, 232, 225, .9)),
      #f7f4ee;
  }
  .canvas {
    position: relative;
    width: 1440px;
    height: 1080px;
    padding: 70px;
    overflow: hidden;
  }
  .grain {
    position: absolute;
    inset: 0;
    opacity: .18;
    background-image:
      linear-gradient(90deg, rgba(23,33,29,.035) 1px, transparent 1px),
      linear-gradient(rgba(23,33,29,.028) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .arc {
    position: absolute;
    width: 760px;
    height: 760px;
    right: -230px;
    top: -260px;
    border-radius: 50%;
    border: 1px solid rgba(94, 122, 111, .24);
  }
  .arc.two {
    width: 480px;
    height: 480px;
    left: -180px;
    bottom: -160px;
    top: auto;
    right: auto;
    border-color: rgba(173, 127, 68, .22);
  }
  .panel {
    position: relative;
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 48px;
    width: 100%;
    height: 100%;
    padding: 54px;
    border-radius: 40px;
    background: rgba(255, 254, 250, .82);
    box-shadow: 0 36px 130px rgba(35, 46, 42, .16), inset 0 1px 0 rgba(255,255,255,.86);
    outline: 1px solid rgba(255,255,255,.72);
  }
  .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }
  .kicker {
    display: inline-flex;
    width: max-content;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(27, 78, 65, .08);
    color: #1b4e41;
    font-size: 18px;
    font-weight: 700;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #b88745;
  }
  h1 {
    margin: 34px 0 0;
    font-size: 64px;
    line-height: 1.05;
    letter-spacing: 0;
    font-weight: 860;
    color: #14201c;
  }
  .title-mark {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 22px;
    color: #9a6a2c;
    font-size: 20px;
    font-weight: 760;
  }
  .title-mark::before {
    content: "";
    width: 74px;
    height: 2px;
    border-radius: 999px;
    background: #b88745;
  }
  .desc {
    margin: 28px 0 0;
    color: #66756f;
    font-size: 26px;
    line-height: 1.5;
    font-weight: 540;
  }
  .mini-card {
    padding: 28px;
    border-radius: 28px;
    background: #15231f;
    color: #f8f4ea;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
  }
  .mini-label {
    margin: 0 0 18px;
    color: #aac6ba;
    font-size: 18px;
    font-weight: 760;
  }
  .mini-rate {
    display: grid;
    gap: 12px;
    font-size: 25px;
    line-height: 1.28;
    font-weight: 800;
  }
  .mini-note {
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,.14);
    color: rgba(248,244,234,.7);
    font-size: 17px;
    line-height: 1.5;
  }
  .right {
    min-width: 0;
    padding: 12px 0 4px;
    display: flex;
    flex-direction: column;
  }
  .topline {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0 8px 26px;
    border-bottom: 1px solid rgba(93, 108, 101, .18);
  }
  .topline h2 {
    margin: 0;
    font-size: 30px;
    color: #26332e;
    letter-spacing: 0;
  }
  .updated {
    color: #7d8a84;
    font-size: 20px;
    font-weight: 650;
  }
  .list {
    display: grid;
    gap: 18px;
    margin-top: 24px;
  }
  .rate-row {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    align-items: center;
    gap: 24px;
    padding: 30px 32px;
    border-radius: 30px;
    background: rgba(255,255,255,.7);
    border: 1px solid rgba(107, 123, 116, .16);
    box-shadow: 0 14px 48px rgba(64, 78, 72, .07), inset 0 1px 0 rgba(255,255,255,.76);
  }
  .row-index {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: #edf3ef;
    color: #527164;
    font-size: 20px;
    font-weight: 840;
  }
  .row-main { min-width: 0; }
  .row-title {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 28px;
    font-weight: 790;
    color: #26332e;
  }
  .row-title strong {
    font-size: 34px;
    color: #15231f;
  }
  .row-sub {
    margin-top: 9px;
    color: #778780;
    font-size: 19px;
    font-weight: 620;
  }
  .row-price {
    color: #9a5d1f;
    font-size: 52px;
    line-height: 1;
    font-weight: 880;
    letter-spacing: 0;
    white-space: nowrap;
  }
  .foot {
    margin-top: auto;
    padding: 24px 8px 0;
    color: #76847e;
    font-size: 18px;
    line-height: 1.45;
    border-top: 1px solid rgba(93, 108, 101, .16);
  }
</style>
</head>
<body>
  <main class="canvas">
    <div class="grain"></div>
    <div class="arc"></div>
    <div class="arc two"></div>
    <section class="panel">
      <aside class="left">
        <div>
          <div class="kicker"><span class="dot"></span>台湾地区课程报价参考</div>
          <h1>台币价格<br/>参考</h1>
          <div class="title-mark">TWD Reference · Daily</div>
          <p class="desc">按实时汇率先折算美元，再折算新台币。适合销售沟通前快速对齐价格口径。</p>
        </div>
        <div class="mini-card">
          <p class="mini-label">今日换算口径</p>
          <div class="mini-rate">
            <div>1 CNY ≈ US$${formatDecimal(rates.usdPerCny, 6)}</div>
            <div>1 USD ≈ NT$${formatDecimal(rates.usdTwd, 3)}</div>
            <div>1 CNY ≈ NT$${formatDecimal(rates.cnyToTwd, 3)}</div>
          </div>
          <div class="mini-note">数据源：ExchangeRate-API。实际收款以支付通道、银行实时汇率及手续费为准。</div>
        </div>
      </aside>
      <section class="right">
        <div class="topline">
          <h2>四档课程方案</h2>
          <div class="updated">${updatedLabel}</div>
        </div>
        <div class="list">${rowsHtml}</div>
        <div class="foot">金额四舍五入到 NT$10；此图用于群内播报和沟通参考，不作为最终结算凭证。</div>
      </section>
    </section>
  </main>
</body>
</html>`;
}
