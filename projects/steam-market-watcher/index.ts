import fetch from "node-fetch";

const MARKET_URL =
  "https://steamcommunity.com/market/listings/730/Austin%202025%20Train%20Souvenir%20Package";
const CHECK_INTERVAL = 30 * 1000; // 30 seconds

const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1474507779061317737/ICWzLxbYjKhgbapcHRc7aei6-jq0PhrjXxVcO-mt16mxFOhl2ZjcouZROoaFRuLUr1Je";
const PING_USER_ID = "635009085368172545"; // set to "" to disable ping

// ---- types ----

interface PriceOverview {
  lowest_price?: string;
  median_price?: string;
  success: boolean;
}

interface Histogram {
  success: boolean;
  highest_buy_order?: string;
}

// ---- state ----

let appId: string;
let itemName: string;
let itemNameId: string | null = null;

let lastSell: number | null = null;
let lastBuy: number | null = null;

// ---- helpers ----

const headers = { "User-Agent": "Mozilla/5.0" };

function ping(): string {
  return PING_USER_ID ? `<@${PING_USER_ID}> ` : "";
}

async function send(msg: string): Promise<void> {
  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg }),
  });
}

function parseMarketUrl(): void {
  const m = MARKET_URL.match(/listings\/(\d+)\/(.+)$/);
  if (!m) throw new Error("Invalid MARKET_URL format");
  appId = m[1];
  itemName = decodeURIComponent(m[2]);
}

function parsePriceString(str?: string): number | null {
  if (!str) return null;
  const cleaned = str.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parsePriceInt(v?: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n / 100;
}

function priceUrl(): string {
  return `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=3&market_hash_name=${encodeURIComponent(itemName)}`;
}

function histogramUrl(): string | null {
  if (!itemNameId) return null;
  return `https://steamcommunity.com/market/itemordershistogram?country=SK&language=en&currency=3&item_nameid=${itemNameId}&two_factor=0`;
}

// ---- core ----

async function fetchItemNameId(): Promise<void> {
  try {
    const res = await fetch(MARKET_URL, { headers });
    const html = await res.text();
    const match = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/);
    if (match) itemNameId = match[1];
  } catch {
    // non-fatal, histogram just won't be available
  }
}

async function check(): Promise<void> {
  try {
    const res = await fetch(priceUrl(), { headers });
    const overview = (await res.json()) as PriceOverview;
    const sell = parsePriceString(overview.lowest_price);

    let buy: number | null = null;
    const hUrl = histogramUrl();
    if (hUrl) {
      try {
        const hRes = await fetch(hUrl, { headers });
        const hist = (await hRes.json()) as Histogram;
        if (hist.success) buy = parsePriceInt(hist.highest_buy_order);
      } catch {
        // histogram failed, skip
      }
    }

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
    lastBuy = buy ?? lastBuy;
  } catch (e) {
    if (e instanceof Error) console.error("check failed:", e.message);
  }
}

// ---- entry ----

(async () => {
  parseMarketUrl();
  await fetchItemNameId();

  console.log("appid:", appId);
  console.log("item:", itemName);
  console.log("item_nameid:", itemNameId ?? "not available");

  check();
  setInterval(check, CHECK_INTERVAL);
})();
