import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDingTalkMarkdownBody } from "../scripts/send-dingtalk.js";

test("builds markdown body with the generated card image url", () => {
  const body = buildDingTalkMarkdownBody({
    imageUrl: "https://example.com/taiwan-course-rate.png",
    pageUrl: "https://example.com/"
  });

  assert.equal(body.msgtype, "markdown");
  assert.match(body.markdown.text, /!\[台湾地区课程报价参考\]\(https:\/\/example\.com\/taiwan-course-rate\.png\)/);
  assert.match(body.markdown.text, /\[查看原图\]\(https:\/\/example\.com\/\)/);
});
