const fetch = require("node-fetch");

const MARKET_URL = "https://steamcommunity.com/market/listings/730/Austin%202025%20Train%20Souvenir%20Package";
const CHECK_INTERVAL = 60 * 500; // 30 sec check (if my math is correct :/)

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1474507779061317737/ICWzLxbYjKhgbapcHRc7aei6-jq0PhrjXxVcO-mt16mxFOhl2ZjcouZROoaFRuLUr1Je"; // pls dont spam my shit, thx
const PING_USER_ID = "635009085368172545"; // "" disables ping

let itemNameId = null;
let lastSell = null;
let lastBuy = null;

function ping() {
  return PING_USER_ID ? `<@${PING_USER_ID}> ` : "";
}

async function send(msg) {
  const r = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg })
  });

  // 👇 debug if webhook fails
  if (!r.ok) console.log("webhook failed:", await r.text());
}

// histogram returns cents → convert properly
function parsePrice(v) {
  if (!v) return null;
  return Number(v) / 100;
}

async function fetchItemNameId() {
  const res = await fetch(MARKET_URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await res.text();

  const match = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/);
  if (!match) throw new Error("no item_nameid");

  itemNameId = match[1];
}

function histogramUrl() {
  return `https://steamcommunity.com/market/itemordershistogram?country=SK&language=en&currency=3&item_nameid=${itemNameId}&two_factor=0`;
}

async function check() {
  try {
    const res = await fetch(histogramUrl(), {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await res.json();
    if (!data.success) return;

    const sell = parsePrice(data.lowest_sell_order);
    const buy  = parsePrice(data.highest_buy_order);

    // 👇 always log once so we know its alive
    console.log("sell:", sell, "buy:", buy);

    if (lastSell === null && sell !== null) lastSell = sell;
    if (lastBuy === null && buy !== null) lastBuy = buy;

    if (sell !== null && lastSell !== null && sell < lastSell) {
      await send(`${ping()}sell dropped\nold: ${lastSell}\nnew: ${sell}\n${MARKET_URL}`);
    }

    if (buy !== null && lastBuy !== null && buy > lastBuy) {
      await send(`${ping()}buy increased\nold: ${lastBuy}\nnew: ${buy}\n${MARKET_URL}`);
    }

    lastSell = sell ?? lastSell;
    lastBuy  = buy  ?? lastBuy;

  } catch (e) {
    console.log("check err:", e.message);
  }
}

(async () => {
  try {
    await fetchItemNameId();
    console.log("item_nameid:", itemNameId);

    // 👇 FORCE startup webhook so u know it works
    await send(`${ping()}bot started\ntracking:\n${MARKET_URL}\nitem_nameid: ${itemNameId}`);

    setInterval(check, CHECK_INTERVAL);
    check();

  } catch (e) {
    console.log("startup err:", e.message);
  }
})();
