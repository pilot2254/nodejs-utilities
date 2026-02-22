import fetch from "node-fetch";
import * as fs from "fs";

// ---- config ----

interface Config {
  discord_webhook: string;
  ping_user_id: string;
  check_interval_seconds: number;
  items: string[];
}

const config: Config = JSON.parse(fs.readFileSync("config.json", "utf-8"));

// ---- types ----

interface PriceOverview {
  success: boolean;
  lowest_price?: string;
}

interface Histogram {
  success: boolean;
  highest_buy_order?: string;
}

interface ItemState {
  url: string;
  appId: string;
  itemName: string;
  itemNameId: string | null;
  lastSell: number | null;
  lastBuy: number | null;
}

// ---- helpers ----

const headers = { "User-Agent": "Mozilla/5.0" };

function ping(): string {
  return config.ping_user_id ? `<@${config.ping_user_id}> ` : "";
}

async function send(msg: string): Promise<void> {
  await fetch(config.discord_webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg }),
  });
}

function parseMarketUrl(url: string): { appId: string; itemName: string } {
  const m = url.match(/listings\/(\d+)\/(.+)$/);
  if (!m) throw new Error(`Invalid market URL: ${url}`);
  return { appId: m[1], itemName: decodeURIComponent(m[2]) };
}

function parsePriceString(str?: string): number | null {
  if (!str) return null;
  const n = parseFloat(str.replace(/[^\d,.-]/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

function parsePriceInt(v?: string): number | null {
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n / 100;
}

function priceUrl(item: ItemState): string {
  return `https://steamcommunity.com/market/priceoverview/?appid=${item.appId}&currency=3&market_hash_name=${encodeURIComponent(item.itemName)}`;
}

function histogramUrl(item: ItemState): string | null {
  if (!item.itemNameId) return null;
  return `https://steamcommunity.com/market/itemordershistogram?country=SK&language=en&currency=3&item_nameid=${item.itemNameId}&two_factor=0`;
}

// ---- per-item logic ----

async function fetchItemNameId(item: ItemState): Promise<void> {
  try {
    const res = await fetch(item.url, { headers });
    const html = await res.text();
    const match = html.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\)/);
    if (match) item.itemNameId = match[1];
  } catch {
    // non-fatal
  }
}

async function checkItem(item: ItemState): Promise<void> {
  try {
    const res = await fetch(priceUrl(item), { headers });
    const overview = (await res.json()) as PriceOverview;
    const sell = parsePriceString(overview.lowest_price);

    let buy: number | null = null;
    const hUrl = histogramUrl(item);
    if (hUrl) {
      try {
        const hRes = await fetch(hUrl, { headers });
        const hist = (await hRes.json()) as Histogram;
        if (hist.success) buy = parsePriceInt(hist.highest_buy_order);
      } catch {
        // histogram failed, skip
      }
    }

    const label = `[${item.itemName}](<${item.url}>)`;

    if (item.lastSell === null) {
      item.lastSell = sell;
      item.lastBuy = buy;
      await send(
        `${ping()}tracking started — ${label}\n` +
          `sell: ${sell ?? "none"}\n` +
          `buy: ${buy ?? "not available"}`
      );
      return;
    }

    if (sell !== null && item.lastSell !== null && sell < item.lastSell) {
      await send(
        `${ping()}sell dropped — ${label}\nold: ${item.lastSell}\nnew: ${sell}\nbuy: ${buy ?? "?"}`
      );
    }

    if (buy !== null && item.lastBuy !== null && buy > item.lastBuy) {
      await send(
        `${ping()}buy increased — ${label}\nold: ${item.lastBuy}\nnew: ${buy}\nsell: ${sell ?? "?"}`
      );
    }

    item.lastSell = sell ?? item.lastSell;
    item.lastBuy = buy ?? item.lastBuy;
  } catch (e) {
    if (e instanceof Error) console.error(`[${item.itemName}] check failed:`, e.message);
  }
}

// ---- entry ----

(async () => {
  if (!config.items.length) {
    console.error("No items in config.json");
    process.exit(1);
  }

  const items: ItemState[] = config.items.map((url) => {
    const { appId, itemName } = parseMarketUrl(url);
    return { url, appId, itemName, itemNameId: null, lastSell: null, lastBuy: null };
  });

  await Promise.all(items.map(fetchItemNameId));

  for (const item of items) {
    console.log(`tracking: [${item.appId}] ${item.itemName} (nameid: ${item.itemNameId ?? "n/a"})`);
  }

  const run = () => Promise.all(items.map(checkItem));

  run();
  setInterval(run, config.check_interval_seconds * 1000);
})();
