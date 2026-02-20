const fetch = require("node-fetch");

const MARKET_URL = "https://steamcommunity.com/market/listings/730/Austin%202025%20Train%20Souvenir%20Package";
const CHECK_INTERVAL = 60 * 500; // 30 sec check (if my math is correct :/)

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1474507779061317737/ICWzLxbYjKhgbapcHRc7aei6-jq0PhrjXxVcO-mt16mxFOhl2ZjcouZROoaFRuLUr1Je"; // pls dont spam my shit, thx
const PING_USER_ID = "635009085368172545"; // "" disables ping

let APP_ID = null;
let ITEM_NAME = null;
let itemNameId = null;

let lastSell = null;
let lastBuy = null;

function ping() {
  return PING_USER_ID ? `<@${PING_USER_ID}> ` : "";
}

async function send(msg) {
  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg })
  });
}

function parseMarketUrl() {
  const m = MARKET_URL.match(/listings\/(\d+)\/(.+)$/);
  APP_ID = m[1];
  ITEM_NAME = decodeURIComponent(m[2]);
}

function parsePriceString(str) {
  if (!str) return null;
  return parseFloat(str.replace(/[^\d,.-]/g,"").replace(",","."));
}

function parsePriceInt(v) {
  if (!v) return null;
  return Number(v)/100;
}

async function fetchItemNameId() {
  try {
    const res = await fetch(MARKET_URL, { headers:{ "User-Agent":"Mozilla/5.0"}});
    const html = await res.text();
    const match = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/);
    if (match) itemNameId = match[1];
  } catch {}
}

function priceUrl() {
  return `https://steamcommunity.com/market/priceoverview/?appid=${APP_ID}&currency=3&market_hash_name=${encodeURIComponent(ITEM_NAME)}`;
}

function histogramUrl() {
  if (!itemNameId) return null;
  return `https://steamcommunity.com/market/itemordershistogram?country=SK&language=en&currency=3&item_nameid=${itemNameId}&two_factor=0`;
}

async function check() {
  try {

    // ALWAYS get sell price from overview
    const p = await fetch(priceUrl(), { headers:{ "User-Agent":"Mozilla/5.0"}});
    const overview = await p.json();
    const sell = parsePriceString(overview.lowest_price);

    // TRY histogram for buy orders
    let buy = null;
    if (itemNameId) {
      try {
        const h = await fetch(histogramUrl(), { headers:{ "User-Agent":"Mozilla/5.0"}});
        const hist = await h.json();
        if (hist.success) buy = parsePriceInt(hist.highest_buy_order);
      } catch {}
    }

    // first run → send status always
    if (lastSell === null) {
      lastSell = sell;
      lastBuy = buy;

      await send(
        `${ping()}tracking started\n${MARKET_URL}\n` +
        `sell: ${sell ?? "none"}\n` +
        `buy: ${buy ?? "not available"}`
      );
      return;
    }

    if (sell !== null && lastSell !== null && sell < lastSell) {
      await send(
        `${ping()}sell dropped\nold: ${lastSell}\nnew: ${sell}\nbuy: ${buy ?? "?"}\n${MARKET_URL}`
      );
    }

    if (buy !== null && lastBuy !== null && buy > lastBuy) {
      await send(
        `${ping()}buy increased\nold: ${lastBuy}\nnew: ${buy}\nsell: ${sell ?? "?"}\n${MARKET_URL}`
      );
    }

    lastSell = sell ?? lastSell;
    lastBuy  = buy  ?? lastBuy;

  } catch (e) {
    console.log("err:", e.message);
  }
}

(async () => {
  parseMarketUrl();
  await fetchItemNameId();

  console.log("appid:", APP_ID);
  console.log("item:", ITEM_NAME);
  console.log("item_nameid:", itemNameId ?? "not available");

  setInterval(check, CHECK_INTERVAL);
  check();
})();
