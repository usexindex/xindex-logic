import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, createWalletClient, custom, formatUnits, getAddress, http, type Address, type EIP1193Provider } from "viem";
import { ArrowRight, Check, ExternalLink, LayoutGrid, Plus, RefreshCw, Search, SlidersHorizontal, Wallet, X } from "lucide-react";
import {
  BASKETS,
  CANONICAL_ADDRESSES,
  USDG_ADDRESS,
  erc20Abi,
  robinhoodMainnet,
  type BasketKey,
} from "@/lib/protocol";

type Asset = {
  symbol: string;
  name: string;
  address: Address;
  multiplier: string;
  decimals: number;
  status: string;
  price: { bid: string; ask: string; asOf: string; halted?: boolean } | null;
};

type Workspace = "explore" | "create" | "portfolio";

declare global {
  interface Window { ethereum?: EIP1193Provider; }
}

const ALL_SYMBOLS = Array.from(new Set(BASKETS.flatMap((basket) => basket.components)));
const STOCK_LOGOS: Record<string, string> = {
  NVDA: "/assets/stock-logos/nvidia.svg",
  AVGO: "/assets/stock-logos/broadcom.svg",
  TSM: "/assets/stock-logos/tsmc.svg",
  AMD: "/assets/stock-logos/amd.svg",
  AAPL: "/assets/stock-logos/apple.svg",
  MSFT: "/assets/stock-logos/microsoft.svg",
  GOOGL: "/assets/stock-logos/google.svg",
  AMZN: "/assets/stock-logos/amazon.svg",
  META: "/assets/stock-logos/meta.svg",
  TSLA: "/assets/stock-logos/tesla.svg",
  GLD: "/assets/stock-logos/gold.svg",
};
const client = createPublicClient({
  chain: robinhoodMainnet,
  transport: http(robinhoodMainnet.rpcUrls.default.http[0]),
});

function apiPath(path: string) { return `/api${path}`; }
function shortAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function price(asset?: Asset) {
  if (!asset?.price) return null;
  return (Number(asset.price.bid) + Number(asset.price.ask)) / 2;
}
function routeFor(workspace: Workspace) {
  return `${import.meta.env.BASE_URL}app/${workspace}`;
}
function AssetLogo({ symbol, className = "" }: { symbol: string; className?: string }) {
  return <span className={`asset-logo ${className}`}><img src={STOCK_LOGOS[symbol]} alt={`${symbol} logo`} /></span>;
}

export default function ProtocolWorkspace() {
  const [location] = useLocationFallback();
  const workspace = (location.split("/")[2] as Workspace) || "explore";
  const currentWorkspace: Workspace = ["explore", "create", "portfolio"].includes(workspace) ? workspace : "explore";
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletError, setWalletError] = useState("");

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiPath(`/protocol/assets?symbols=${ALL_SYMBOLS.join(",")}`));
      if (!response.ok) throw new Error(`Registry request failed (${response.status})`);
      const payload = await response.json() as { assets: Asset[] };
      setAssets(Object.fromEntries(payload.assets.map((asset) => [asset.symbol, asset])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the canonical registry");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!account) return;
    const symbols = [...ALL_SYMBOLS, "USDG"];
    const values = await Promise.all(symbols.map(async (symbol) => {
      const tokenAddress = symbol === "USDG" ? USDG_ADDRESS : CANONICAL_ADDRESSES[symbol];
      try {
        const [raw, decimals] = await Promise.all([
          client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
          client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
        ]);
        return [symbol, Number(formatUnits(raw, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })] as const;
      } catch {
        return [symbol, "Unavailable"] as const;
      }
    }));
    setBalances(Object.fromEntries(values));
  }, [account]);

  useEffect(() => { void loadAssets(); }, [loadAssets]);
  useEffect(() => { void refreshBalances(); }, [refreshBalances]);

  const connectWallet = async () => {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("No injected EVM wallet detected. Install a compatible wallet to read your balances.");
      return;
    }
    try {
      const wallet = createWalletClient({ transport: custom(window.ethereum) });
      const [address] = await wallet.requestAddresses();
      const hex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setAccount(getAddress(address));
      setChainId(Number.parseInt(hex, 16));
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Wallet connection was rejected.");
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1237" }] });
      setChainId(4663);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Unable to switch network.");
    }
  };

  return (
    <main className="workspace-app">
      <header className="workspace-header">
        <a className="workspace-brand" href={import.meta.env.BASE_URL} aria-label="Xindex home">
          <img src="/assets/xindex-logo.png" alt="" />
          <span>XINDEX</span>
        </a>
        <nav className="workspace-nav" aria-label="Protocol workspace">
          {(["explore", "create", "portfolio"] as Workspace[]).map((item) => (
            <a key={item} className={currentWorkspace === item ? "active" : ""} href={routeFor(item)}>
              {item === "explore" && <LayoutGrid size={14} />}
              {item === "create" && <Plus size={14} />}
              {item === "portfolio" && <Wallet size={14} />}
              {item}
            </a>
          ))}
        </nav>
        <div className="workspace-header-actions">
          <span className="workspace-network"><i /> CHAIN 4663 <small>ROBINHOOD</small></span>
          <button className="workspace-connect" onClick={connectWallet}>
            <Wallet size={14} /> {account ? shortAddress(account) : "Connect wallet"}
          </button>
        </div>
      </header>

      {chainId && chainId !== 4663 && (
        <div className="workspace-network-warning">Wallet is connected to chain {chainId}. <button onClick={switchNetwork}>Switch to Robinhood Chain</button></div>
      )}
      {walletError && <div className="workspace-toast error">{walletError}<button onClick={() => setWalletError("")}><X size={14} /></button></div>}
      {error && <div className="workspace-toast error">{error}<button onClick={() => setError("")}><X size={14} /></button></div>}

      {currentWorkspace === "explore" && <ExploreView assets={assets} loading={loading} onRefresh={loadAssets} />}
      {currentWorkspace === "create" && <CreateView assets={assets} loading={loading} />}
      {currentWorkspace === "portfolio" && <PortfolioView assets={assets} balances={balances} account={account} loading={loading} onConnect={connectWallet} onRefresh={refreshBalances} />}
    </main>
  );
}

function useLocationFallback(): [string] {
  const [location, setLocation] = useState(window.location.pathname);
  useEffect(() => {
    const handle = () => setLocation(window.location.pathname);
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);
  return [location];
}

function WorkspaceIntro({ eyebrow, title, muted, children }: { eyebrow: string; title: React.ReactNode; muted: string; children?: React.ReactNode }) {
  return (
    <div className="workspace-intro">
      <div><span className="workspace-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{muted}</p></div>
      {children}
    </div>
  );
}

function ExploreView({ assets, loading, onRefresh }: { assets: Record<string, Asset>; loading: boolean; onRefresh: () => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => ALL_SYMBOLS.filter((symbol) => {
    const categoryMatch = filter === "all" || (filter === "commodity" ? symbol === "GLD" : symbol !== "GLD");
    const searchMatch = `${symbol} ${assets[symbol]?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [assets, filter, search]);
  const liveCount = Object.values(assets).filter((asset) => asset.price).length;
  const basketValue = (basket: typeof BASKETS[number]) => basket.components.reduce((total, symbol, index) => total + (price(assets[symbol]) ?? 0) * (basket.targetWeights[index] / 100), 0);

  return (
    <div className="workspace-page">
      <WorkspaceIntro eyebrow="THE BOARD" title={<>Every basket on one board.<br /><span>Filter it like a desk.</span></>} muted="Explore the three Xindex products built from canonical Robinhood Stock Token references. Reference values update from the live registry; execution remains separate.">
        <div className="intro-readout"><span>REGISTRY STATUS</span><strong>{loading ? "SYNCING" : "ONLINE"}</strong><small>{liveCount} / {ALL_SYMBOLS.length} references quoted</small></div>
      </WorkspaceIntro>
      <TickerRail assets={assets} />
      <div className="workspace-toolbar">
        <div className="segmented-control">{["all", "equity", "commodity"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className="toolbar-actions"><label><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol or company" /></label><button className="icon-action" onClick={onRefresh} aria-label="Refresh registry"><RefreshCw size={14} /></button><button className="filter-action"><SlidersHorizontal size={14} /> Filters</button></div>
      </div>
      <section className="workspace-summary">
        <div><span>CANONICAL REFERENCES</span><strong>{ALL_SYMBOLS.length}</strong><small>Verified on Robinhood Chain</small></div>
        <div><span>REFERENCE PRICES</span><strong>{liveCount}<small> / {ALL_SYMBOLS.length}</small></strong><small>Fresh within the last 120 seconds</small></div>
        <div><span>EXECUTION ROUTES</span><strong>0</strong><small>No verified basket vault deployed</small></div>
      </section>
      <div className="section-heading"><div><span className="workspace-eyebrow">XINDEX PRODUCTS</span><h2>Core baskets</h2><p>Fixed compositions with transparent references and target weights.</p></div><span className="section-count">{BASKETS.length} PRODUCTS</span></div>
      <div className="basket-board">
        {BASKETS.filter((basket) => filter === "all" || (filter === "commodity" ? basket.key === "gold" : basket.key !== "gold")).map((basket) => <BasketCard key={basket.key} basket={basket} assets={assets} value={basketValue(basket)} />)}
      </div>
      <section className="reference-board">
        <div className="section-heading"><div><span className="workspace-eyebrow">REFERENCE CATALOGUE</span><h2>Underlying board</h2></div><span className="section-count">{filtered.length} MATCHES</span></div>
        <div className="reference-grid">{filtered.map((symbol) => <ReferenceCell key={symbol} symbol={symbol} asset={assets[symbol]} />)}</div>
      </section>
    </div>
  );
}

function TickerRail({ assets }: { assets: Record<string, Asset> }) {
  const tickerSymbols = ALL_SYMBOLS.concat(ALL_SYMBOLS);
  return <div className="ticker-rail" aria-label="Live Robinhood reference prices"><div className="ticker-track">{tickerSymbols.map((symbol, index) => <span key={`${symbol}-${index}`}><AssetLogo symbol={symbol} /><b>{symbol}</b><em>{price(assets[symbol]) ? `$${price(assets[symbol])!.toFixed(2)}` : "—"}</em><small>RHJ REF</small></span>)}</div></div>;
}

function BasketCard({ basket, assets, value }: { basket: typeof BASKETS[number]; assets: Record<string, Asset>; value: number }) {
  return (
    <article className="basket-card">
      <div className="basket-card-top"><div className={`basket-mark ${basket.key}`}>${basket.symbol}</div><span className="asset-tag">INDEX</span><a href={`${routeFor("create")}?basket=${basket.key}`}>Open <ArrowRight size={13} /></a></div>
      <div className="basket-card-title"><div><h3>{basket.name}</h3><p>{basket.description}</p></div><div className="basket-level"><span>REFERENCE LEVEL</span><strong>{value ? `$${value.toFixed(2)}` : "—"}</strong><small>multiplier adjusted</small></div></div>
      <div className="allocation-bar">{basket.components.map((symbol, index) => <i key={symbol} style={{ width: `${basket.targetWeights[index]}%` }} className={`alloc-${index % 6}`} />)}</div>
      <div className="allocation-labels">{basket.components.map((symbol, index) => <span key={symbol}><AssetLogo symbol={symbol} />{symbol} <b>{basket.targetWeights[index]}%</b></span>)}</div>
      <div className="basket-card-footer"><span><small>REFERENCES</small><b>{String(basket.components.length).padStart(2, "0")}</b></span><span><small>QUOTE STATE</small><b>{basket.components.every((symbol) => assets[symbol]?.price) ? "LIVE" : "PARTIAL"}</b></span><span><small>VAULT</small><b className="muted-value">UNDEPLOYED</b></span></div>
    </article>
  );
}

function ReferenceCell({ symbol, asset }: { symbol: string; asset?: Asset }) {
  return <div className="reference-cell"><div className="reference-symbol"><AssetLogo symbol={symbol} className={`reference-icon icon-${symbol.toLowerCase()}`} /><div><strong>{symbol}</strong><small>{asset?.name?.replace(" • Robinhood Token", "") ?? "Canonical reference"}</small></div></div><span className={asset?.price ? "quote-live" : "quote-off"}>{asset?.price ? `$${price(asset)!.toFixed(2)}` : "Unavailable"}</span></div>;
}

function CreateView({ assets, loading }: { assets: Record<string, Asset>; loading: boolean }) {
  const requestedBasket = new URLSearchParams(window.location.search).get("basket") as BasketKey | null;
  const initialBasket = BASKETS.find((basket) => basket.key === requestedBasket) ?? BASKETS[0];
  const [selected, setSelected] = useState<string[]>(() => [...initialBasket.components]);
  const [weights, setWeights] = useState<Record<string, number>>(() => Object.fromEntries(initialBasket.components.map((symbol, index) => [symbol, initialBasket.targetWeights[index]])));
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const visible = ALL_SYMBOLS.filter((symbol) => symbol.toLowerCase().includes(search.toLowerCase()));
  const total = selected.reduce((sum, symbol) => sum + (weights[symbol] ?? 0), 0);
  const value = selected.reduce((sum, symbol) => sum + (price(assets[symbol]) ?? 0) * ((weights[symbol] ?? 0) / 100), 0);
  const toggle = (symbol: string) => {
    if (selected.includes(symbol)) {
      setSelected(selected.filter((item) => item !== symbol));
      return;
    }
    if (selected.length >= 8) return;
    setSelected([...selected, symbol]);
    setWeights({ ...weights, [symbol]: 0 });
  };
  const saveDraft = () => {
    localStorage.setItem("xindex-draft", JSON.stringify({ selected, weights, savedAt: new Date().toISOString() }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };
  return (
    <div className="workspace-page create-page">
      <WorkspaceIntro eyebrow="THE BUILDER" title={<>Build a basket.<br /><span>Make the composition legible.</span></>} muted="Pick canonical Stock Token references, set target weights, and inspect a non-executable reference preview. Deployment and minting are separate launch steps.">
        <div className="builder-progress"><span className="active">01</span><i /><span className="active">02</span><i /><span>03</span></div>
      </WorkspaceIntro>
      <div className="builder-layout">
        <section className="builder-main">
          <div className="step-heading"><span>01</span><div><h2>Choose references</h2><p>{selected.length} / 8 selected · canonical registry only</p></div><label className="builder-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol or company" /></label></div>
          <div className="builder-assets">{visible.map((symbol) => {
            const asset = assets[symbol];
            const isSelected = selected.includes(symbol);
            return <button key={symbol} className={`builder-asset ${isSelected ? "selected" : ""}`} onClick={() => toggle(symbol)}><AssetLogo symbol={symbol} className={`reference-icon icon-${symbol.toLowerCase()}`} /><span><strong>{symbol}</strong><small>{asset?.name?.replace(" • Robinhood Token", "") ?? "Canonical reference"}</small></span><em>{asset?.price ? `$${price(asset)!.toFixed(2)}` : "—"}</em><i>{isSelected ? <Check size={13} /> : <Plus size={13} />}</i></button>;
          })}</div>
          <div className="step-heading weight-heading"><span>02</span><div><h2>Set target weights</h2><p>Weights are a composition preview, not an index level.</p></div><strong className={total === 100 ? "valid" : "invalid"}>{total.toFixed(1)}%</strong></div>
          <div className="weight-list">{selected.map((symbol) => <div className="weight-row" key={symbol}><AssetLogo symbol={symbol} className={`reference-icon icon-${symbol.toLowerCase()}`} /><strong>{symbol}</strong><div className="weight-track"><i style={{ width: `${Math.min(weights[symbol] ?? 0, 100)}%` }} /></div><input type="number" min="0" max="100" step="0.1" value={weights[symbol] ?? 0} onChange={(event) => setWeights({ ...weights, [symbol]: Number(event.target.value) })} /><span>%</span></div>)}</div>
        </section>
        <aside className="builder-preview">
          <div className="preview-head"><span>03 / PREVIEW</span><em>{loading ? "SYNCING" : "REFERENCE ONLY"}</em></div>
          <div className="preview-token"><span>NEW INDEX</span><strong>{selected.length ? "$UNTITLED" : "$—"}</strong><small>{selected.length ? "Composition draft" : "Select references to begin"}</small></div>
          <div className="preview-value"><span>REFERENCE LEVEL</span><strong>{value ? `$${value.toFixed(2)}` : "—"}</strong><small>{total === 100 ? "Weights sum to 100%" : "Weights must sum to 100%"}</small></div>
          <div className="preview-allocation">{selected.map((symbol) => <div key={symbol}><span>{symbol}</span><strong>{(weights[symbol] ?? 0).toFixed(1)}%</strong></div>)}</div>
          <button className={`builder-save ${saved ? "saved" : ""}`} disabled={!selected.length || Math.abs(total - 100) > 0.001} onClick={saveDraft}>{saved ? <><span>Draft saved locally</span><Check size={14} /></> : <><span>Save composition draft</span><ArrowRight size={14} /></>}</button>
          <p className="preview-disclaimer">Saving stores this draft in this browser only. It does not deploy a contract, move funds, or create an onchain index.</p>
        </aside>
      </div>
    </div>
  );
}

function PortfolioView({ assets, balances, account, loading, onConnect, onRefresh }: { assets: Record<string, Asset>; balances: Record<string, string>; account: Address | null; loading: boolean; onConnect: () => void; onRefresh: () => void }) {
  const balanceValue = ALL_SYMBOLS.reduce((sum, symbol) => {
    const raw = balances[symbol]?.replaceAll(",", "");
    return sum + (raw && Number.isFinite(Number(raw)) ? Number(raw) * (price(assets[symbol]) ?? 0) : 0);
  }, 0);
  return (
    <div className="workspace-page portfolio-page">
      <WorkspaceIntro eyebrow="PORTFOLIO" title={<>Your basket desk.<br /><span>Read from the chain.</span></>} muted="Wallet balances are read directly from Robinhood Chain. Xindex transaction history will appear after basket vaults are deployed and events exist.">
        <button className="refresh-large" onClick={account ? onRefresh : onConnect}>{account ? <RefreshCw size={14} /> : <Wallet size={14} />} {account ? "Refresh balances" : "Connect wallet"}</button>
      </WorkspaceIntro>
      {!account ? <div className="portfolio-connect"><div><span className="workspace-eyebrow">ACCOUNT STATE</span><h2>Connect a wallet to inspect balances</h2><p>No custody, no simulated portfolio. The console reads ERC-20 balances only after you approve the connection.</p></div><button onClick={onConnect}>Connect wallet <ArrowRight size={14} /></button></div> : <><section className="portfolio-metrics"><div><span>ACCOUNT</span><strong>{shortAddress(account)}</strong><a href={`${robinhoodMainnet.blockExplorers.default.url}/address/${account}`} target="_blank" rel="noreferrer">View explorer <ExternalLink size={12} /></a></div><div><span>MARKED REFERENCE VALUE</span><strong>{loading ? "Syncing" : `$${balanceValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</strong><small>Indicative only · no basket vault balance</small></div><div><span>USDG BALANCE</span><strong>{balances.USDG ?? "Loading"}</strong><small>Canonical USDG</small></div></section><section className="portfolio-table"><div className="section-heading"><div><span className="workspace-eyebrow">WALLET INVENTORY</span><h2>Canonical positions</h2></div><span className="section-count">{ALL_SYMBOLS.length} REFERENCES</span></div><div className="inventory-head"><span>ASSET</span><span>BALANCE</span><span>REFERENCE</span><span>VALUE</span></div>{ALL_SYMBOLS.map((symbol) => <div className="inventory-row" key={symbol}><ReferenceCell symbol={symbol} asset={assets[symbol]} /><strong>{balances[symbol] ?? "Loading"}</strong><span>{price(assets[symbol]) ? `$${price(assets[symbol])!.toFixed(2)}` : "—"}</span><span>{balances[symbol] && price(assets[symbol]) ? `$${(Number(balances[symbol].replaceAll(",", "")) * price(assets[symbol])!).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}</span></div>)}</section><section className="empty-activity"><span className="workspace-eyebrow">ACTIVITY LOG</span><h2>No Xindex transactions yet</h2><p>There is no deployed basket vault to index. When a verified vault exists, confirmed deposits and redemptions will appear here with explorer links.</p></section></>}
    </div>
  );
}
