const fetch = require("node-fetch");

const APP_ID = 753;
const ITEM_NAME = "799070-Red Clouds";
const CHECK_INTERVAL = 60 * 1000;
const DISCORD_WEBHOOK = "PUT_WEBHOOK_URL_HERE";

let lastPrice = null;

function url() {
  return `https://steamcommunity.com/market/priceoverview/?appid=${APP_ID}&currency=3&market_hash_name=${encodeURIComponent(ITEM_NAME)}`;
}

function parsePrice(str) {
  return parseFloat(str.replace(/[^\d,.-]/g, "").replace(",", "."));
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
    if (!data.success || !data.lowest_price) return;

    const price = parsePrice(data.lowest_price);

    if (lastPrice === null) {
      lastPrice = price;
      console.log("start price:", price);
      return;
    }

    if (price < lastPrice) {
      await send(
        `⬇️ lowest sell listing dropped\n**${ITEM_NAME}**\nold: ${lastPrice}\nnew: ${price}`
      );
    }

    lastPrice = price;
    console.log("checked:", price);

  } catch (e) {
    console.log("err:", e.message);
  }
}

setInterval(check, CHECK_INTERVAL);
check();
