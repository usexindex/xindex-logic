import { Router, type IRouter } from "express";

const router: IRouter = Router();
const ROBINHOOD_API = "https://api.robinhood.com/rhj";
const ALLOWED_SYMBOLS = new Set([
  "NVDA", "AVGO", "TSM", "AMD", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "GLD",
]);
const CANONICAL_ADDRESSES: Record<string, string> = {
  NVDA: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
  AVGO: "0x156E175DD063a8cE274C50654eF40e0032b3fbcF",
  TSM: "0x58FfE4a942d3885bAa22D7520691F611EF09e7AA",
  AMD: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC",
  AAPL: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
  MSFT: "0xe93237C50D904957Cf27E7B1133b510C669c2e74",
  GOOGL: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3",
  AMZN: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
  META: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35",
  TSLA: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
  GLD: "0xC9a981FEE1F9DEc688bb123ccDeCc63D0deBFC4e",
};
const cache = new Map<string, { expiresAt: number; value: unknown }>();
const requests = new Map<string, { windowStart: number; count: number }>();

type RobinhoodAsset = {
  tokenSymbol: string;
  tokenName: string;
  deployments: Array<{ contractAddress: string; chainId: number }>;
  currentMultiplier: string;
  tokenDecimals: number;
  status: string;
};

type RobinhoodQuote = {
  tokenSymbol: string;
  bid: string;
  ask: string;
  generatedAt: string;
  isTradingHalt: boolean;
};

function rateLimited(key: string) {
  const now = Date.now();
  const current = requests.get(key);
  if (!current || now - current.windowStart > 60_000) {
    requests.set(key, { windowStart: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

async function getJson<T>(url: string, ttlMs: number): Promise<T> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "xindex-protocol/0.1" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Robinhood upstream returned ${response.status}`);
  const value = await response.json() as T;
  cache.set(url, { expiresAt: Date.now() + ttlMs, value });
  return value;
}

router.get("/protocol/assets", async (req, res) => {
  if (rateLimited(req.ip || "unknown")) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }
  const symbols = String(req.query.symbols ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
  if (symbols.length === 0 || symbols.length > ALLOWED_SYMBOLS.size || symbols.some((symbol) => !ALLOWED_SYMBOLS.has(symbol))) {
    res.status(400).json({ error: "Unsupported or missing symbols query" });
    return;
  }
  try {
    const assetPayload = await getJson<{ assets: RobinhoodAsset[] }>(`${ROBINHOOD_API}/assets`, 300_000);
    const assetBySymbol = new Map(assetPayload.assets.map((asset) => [asset.tokenSymbol, asset]));
    const assets = await Promise.all(symbols.map(async (symbol) => {
      const asset = assetBySymbol.get(symbol);
      if (!asset) throw new Error(`Canonical asset ${symbol} was not returned`);
      const deployment = asset.deployments.find((item) => item.chainId === 4663);
      if (!deployment) throw new Error(`No Robinhood Chain deployment for ${symbol}`);
      const pinnedAddress = CANONICAL_ADDRESSES[symbol];
      if (!/^0x[a-fA-F0-9]{40}$/.test(deployment.contractAddress) ||
          deployment.contractAddress.toLowerCase() !== pinnedAddress.toLowerCase()) {
        throw new Error(`Canonical address verification failed for ${symbol}`);
      }
      let price: { bid: string; ask: string; asOf: string; halted: boolean } | null = null;
      try {
        const quotePayload = await getJson<{ quotes: RobinhoodQuote[] }>(`${ROBINHOOD_API}/prices/${symbol}`, 15_000);
        const quote = quotePayload.quotes.find((item) => item.tokenSymbol === symbol);
        if (quote) {
          const bid = Number(quote.bid);
          const ask = Number(quote.ask);
          const age = Date.now() - Date.parse(quote.generatedAt);
          if (
            Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask >= bid &&
            age >= 0 && age <= 120_000 && !quote.isTradingHalt
          ) {
            price = { bid: quote.bid, ask: quote.ask, asOf: quote.generatedAt, halted: false };
          }
        }
      } catch {
        price = null;
      }
      return {
        symbol,
        name: asset.tokenName,
        address: pinnedAddress,
        multiplier: asset.currentMultiplier,
        decimals: asset.tokenDecimals,
        status: asset.status,
        price,
      };
    }));
    res.setHeader("Cache-Control", "public, max-age=10, stale-while-revalidate=20");
    res.json({ source: "Robinhood Stock Token API", chainId: 4663, fetchedAt: new Date().toISOString(), assets });
  } catch (error) {
    req.log.error({ err: error }, "protocol market data request failed");
    res.status(502).json({ error: error instanceof Error ? error.message : "Market data unavailable" });
  }
});

export default router;
