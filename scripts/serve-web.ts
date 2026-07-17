/**
 * Local development server for the standalone picker.
 */
import { createServer } from "node:http";
import { getPageHtml } from "../worker/src/page.js";

const port = Number(process.env.PORT || 8788);

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const segment = url.pathname.split("/").filter(Boolean)[0];
  const lang = segment || url.searchParams.get("lang") || req.headers["accept-language"] || "en";
  const html = getPageHtml(String(lang), `?lang=${encodeURIComponent(String(lang))}`);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(port, () => {
  console.log(`QPin NL web dev: http://127.0.0.1:${port}/zh-CN/`);
});
