const fetch = require("node-fetch");

const MARKET_URL = "https://steamcommunity.com/market/listings/730/Austin%202025%20Train%20Souvenir%20Package";
const CHECK_INTERVAL = 60 * 500; // 30 sec check (if my math is correct :/)

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1474507779061317737/ICWzLxbYjKhgbapcHRc7aei6-jq0PhrjXxVcO-mt16mxFOhl2ZjcouZROoaFRuLUr1Je"; // pls dont spam my shit, thx
const PING_USER_ID = "635009085368172545"; // "" disables ping

let itemNameId = null;
let lastSell = null;
let lastBuy = null;
let firstRun = true;

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

function parsePrice(str) {
  if (!str) return null;
  return parseFloat(str.replace(",", "."));
}

// STEP 1: get item_nameid from html
async function fetchItemNameId() {
  const res = await fetch(MARKET_URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await res.text();

  const match = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/);
  if (!match) throw new Error("could not find item_nameid");

  itemNameId = match[1];
}

// STEP 2: poll histogram endpoint
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

    if (firstRun) {
      await send(
        `${ping()}watching item\n${MARKET_URL}\n` +
        `sell: ${sell ?? "none"}\n` +
        `buy: ${buy ?? "none"}`
      );
      firstRun = false;
    }

    if (lastSell === null && sell !== null) lastSell = sell;
    if (lastBuy === null && buy !== null) lastBuy = buy;

    if (sell !== null && lastSell !== null && sell < lastSell) {
      await send(
        `${ping()}sell dropped\nold: ${lastSell}\nnew: ${sell}\nbuy: ${buy ?? "none"}\n${MARKET_URL}`
      );
    }

    if (buy !== null && lastBuy !== null && buy > lastBuy) {
      await send(
        `${ping()}buy increased\nold: ${lastBuy}\nnew: ${buy}\nsell: ${sell ?? "none"}\n${MARKET_URL}`
      );
    }

    lastSell = sell ?? lastSell;
    lastBuy  = buy  ?? lastBuy;

  } catch (e) {
    console.log("err:", e.message);
  }
}

// boot sequence
(async () => {
  try {
    await fetchItemNameId();
    console.log("item_nameid:", itemNameId);

    setInterval(check, CHECK_INTERVAL);
    check();

  } catch (e) {
    console.log("startup err:", e.message);
  }
})();
