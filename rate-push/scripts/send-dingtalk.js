import crypto from "node:crypto";
import { isDirectRun } from "./module-entry.js";

function signWebhook(webhook, secret) {
  const timestamp = Date.now();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = encodeURIComponent(
    crypto.createHmac("sha256", secret).update(stringToSign).digest("base64")
  );

  return `${webhook}&timestamp=${timestamp}&sign=${sign}`;
}

export function buildDingTalkMarkdownBody({ imageUrl, pageUrl }) {
  return {
    msgtype: "markdown",
    markdown: {
      title: "台湾地区课程报价参考",
      text: [
        "### 台湾地区课程报价参考",
        "",
        `![台湾地区课程报价参考](${imageUrl})`,
        "",
        pageUrl ? `[查看原图](${pageUrl})` : "",
        "",
        "> 每日北京时间 12:30 自动更新，实际收款以支付通道、银行实时汇率及手续费为准。"
      ].filter(Boolean).join("\n")
    }
  };
}

export async function sendDingTalkMarkdown({ webhook, secret, imageUrl, pageUrl }) {
  if (!webhook) {
    throw new Error("DINGTALK_WEBHOOK is required");
  }

  if (!secret) {
    throw new Error("DINGTALK_SECRET is required");
  }

  if (!imageUrl) {
    throw new Error("CARD_IMAGE_URL is required");
  }

  const body = buildDingTalkMarkdownBody({ imageUrl, pageUrl });

  if (process.env.DINGTALK_DRY_RUN === "true") {
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const url = signWebhook(webhook, secret);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.text();

  if (!response.ok) {
    throw new Error(`DingTalk request failed: ${response.status} ${result}`);
  }

  const parsed = JSON.parse(result);
  if (parsed.errcode !== 0) {
    throw new Error(`DingTalk returned error: ${result}`);
  }

  console.log(result);
}

if (isDirectRun(import.meta.url)) {
  sendDingTalkMarkdown({
    webhook: process.env.DINGTALK_WEBHOOK,
    secret: process.env.DINGTALK_SECRET,
    imageUrl: process.env.CARD_IMAGE_URL,
    pageUrl: process.env.CARD_PAGE_URL
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
