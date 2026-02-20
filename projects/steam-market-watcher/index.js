const fetch = require("node-fetch");

const APP_ID = 730;
const ITEM_NAME = "Austin 2025 Train Souvenir Package";
const CHECK_INTERVAL = 60 * 1000;

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1474507779061317737/ICWzLxbYjKhgbapcHRc7aei6-jq0PhrjXxVcO-mt16mxFOhl2ZjcouZROoaFRuLUr1Je";
const PING_USER_ID = "635009085368172545"; // leave "" to disable ping

let lastPrice = null;
let firstRun = true;

function priceUrl() {
  return `https://steamcommunity.com/market/priceoverview/?appid=${APP_ID}&currency=3&market_hash_name=${encodeURIComponent(ITEM_NAME)}`;
}

function marketLink() {
  return `https://steamcommunity.com/market/listings/${APP_ID}/${encodeURIComponent(ITEM_NAME)}`;
}

function parsePrice(str) {
  return parseFloat(str.replace(/[^\d,.-]/g, "").replace(",", "."));
}

function pingPrefix() {
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
    const res = await fetch(priceUrl(), {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await res.json();

    // first run → send json + link + ping
    if (firstRun) {
      await send(
        `${pingPrefix()}first steam response\n${marketLink()}\n\`\`\`json\n${
          JSON.stringify(data, null, 2).slice(0,1900)
        }\n\`\`\``
      );
      firstRun = false;
    }

    if (!data.success || !data.lowest_price) return;

    const price = parsePrice(data.lowest_price);

    if (lastPrice === null) {
      lastPrice = price;
      return;
    }

    if (price < lastPrice) {
      await send(
        `${pingPrefix()}price dropped\n${ITEM_NAME}\nold: ${lastPrice}\nnew: ${price}\n${marketLink()}`
      );
    }

    lastPrice = price;

  } catch (e) {
    console.log("err:", e.message);
  }
}

setInterval(check, CHECK_INTERVAL);
check();
