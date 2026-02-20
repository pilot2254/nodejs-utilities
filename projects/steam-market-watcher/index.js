const fetch = require("node-fetch");

const APP_ID = 753;
const ITEM_NAME = "799070-Red Clouds";
const CHECK_INTERVAL = 60 * 1000;

const DISCORD_WEBHOOK = "PUT_WEBHOOK_URL_HERE";
const PING_USER_ID = "PUT_USER_ID_HERE"; // "" disables ping

let lastSell = null;
let lastBuy = null;
let firstRun = true;

function url() {
  return `https://steamcommunity.com/market/priceoverview/?appid=${APP_ID}&currency=3&market_hash_name=${encodeURIComponent(ITEM_NAME)}`;
}

function marketLink() {
  return `https://steamcommunity.com/market/listings/${APP_ID}/${encodeURIComponent(ITEM_NAME)}`;
}

function parsePrice(str) {
  if (!str) return null;
  return parseFloat(str.replace(/[^\d,.-]/g, "").replace(",", "."));
}

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

async function check() {
  try {
    const res = await fetch(url(), {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await res.json();

    if (firstRun) {
      await send(
        `${ping()}watching item\n${ITEM_NAME}\n${marketLink()}\n\`\`\`json\n${
          JSON.stringify(data, null, 2).slice(0,1900)
        }\n\`\`\``
      );
      firstRun = false;
    }

    if (!data.success) return;

    const sell = parsePrice(data.lowest_price);
    const buy  = parsePrice(data.highest_buy_order);

    // init memory
    if (lastSell === null && sell !== null) lastSell = sell;
    if (lastBuy === null && buy !== null) lastBuy = buy;

    // SELL dropped
    if (sell !== null && lastSell !== null && sell < lastSell) {
      await send(
        `${ping()}sell dropped\nold: ${lastSell}\nnew: ${sell}\nbuy: ${buy ?? "none"}\n${marketLink()}`
      );
    }

    // BUY increased (someone bidding higher)
    if (buy !== null && lastBuy !== null && buy > lastBuy) {
      await send(
        `${ping()}buy order increased\nold: ${lastBuy}\nnew: ${buy}\nsell: ${sell ?? "none"}\n${marketLink()}`
      );
    }

    lastSell = sell ?? lastSell;
    lastBuy  = buy  ?? lastBuy;

  } catch (e) {
    console.log("err:", e.message);
  }
}

setInterval(check, CHECK_INTERVAL);
check();
