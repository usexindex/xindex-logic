import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  getAddress,
  http,
  type Address,
  type EIP1193Provider,
} from "viem";
import { ArrowLeft, ExternalLink, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import {
  BASKETS,
  CANONICAL_ADDRESSES,
  USDG_ADDRESS,
  deploymentStatus,
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
  price: { bid: string; ask: string; asOf: string } | null;
};

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const publicClient = createPublicClient({
  chain: robinhoodMainnet,
  transport: http(robinhoodMainnet.rpcUrls.default.http[0]),
});

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function apiPath(path: string) {
  return `/api${path}`;
}

export default function AppConsole() {
  const [selectedKey, setSelectedKey] = useState<BasketKey>(() => {
    const value = new URLSearchParams(window.location.search).get("basket");
    return value === "mag7" || value === "gold" ? value : "ai7";
  });
  const [account, setAccount] = useState<Address | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [walletError, setWalletError] = useState("");
  const selected = BASKETS.find((basket) => basket.key === selectedKey)!;
  const homeHref = import.meta.env.BASE_URL;

  const loadAssets = useCallback(async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const symbols = Array.from(new Set(BASKETS.flatMap((basket) => basket.components)));
      const response = await fetch(apiPath(`/protocol/assets?symbols=${symbols.join(",")}`));
      if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
      const payload = (await response.json()) as { assets: Asset[] };
      setAssets(Object.fromEntries(payload.assets.map((asset) => [asset.symbol, asset])));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Unable to load market data");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!account) return;
    const symbols = Array.from(new Set([...selected.components, "USDG"]));
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const address = symbol === "USDG" ? USDG_ADDRESS : CANONICAL_ADDRESSES[symbol];
        try {
          const [balance, decimals] = await Promise.all([
            publicClient.readContract({ address, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
            publicClient.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
          ]);
          return [symbol, Number(formatUnits(balance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })] as const;
        } catch {
          return [symbol, "unavailable"] as const;
        }
      }),
    );
    setBalances(Object.fromEntries(results));
  }, [account, selected.components]);

  useEffect(() => void loadAssets(), [loadAssets]);
  useEffect(() => void refreshBalances(), [refreshBalances]);

  const connectWallet = async () => {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("No injected EVM wallet detected. Install a compatible wallet first.");
      return;
    }
    try {
      const walletClient = createWalletClient({ transport: custom(window.ethereum) });
      const [address] = await walletClient.requestAddresses();
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setAccount(getAddress(address));
      setWalletChainId(Number.parseInt(chainIdHex, 16));
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet connection was rejected.");
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1237" }],
      });
      setWalletChainId(4663);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Unable to switch network.");
    }
  };

  const basketReferenceValue = useMemo(() => {
    let value = 0;
    for (let index = 0; index < selected.components.length; index += 1) {
      const asset = assets[selected.components[index]];
      if (!asset?.price?.bid || !asset.price.ask) return null;
      const midpoint = (Number(asset.price.bid) + Number(asset.price.ask)) / 2;
      value += midpoint * (selected.targetWeights[index] / 100) * Number(asset.multiplier);
    }
    return value;
  }, [assets, selected]);

  return (
    <main className="protocol-app">
      <header className="console-header">
        <a className="console-brand" href={homeHref}>
          <img src="/assets/xindex-logo.png" alt="Xindex" />
          <span>XINDEX / PROTOCOL CONSOLE</span>
        </a>
        <div className="console-header-actions">
          <span className="network-chip"><span /> Robinhood Chain</span>
          <button className="console-wallet-button" onClick={connectWallet}>
            <Wallet size={15} />
            {account ? shortAddress(account) : "Connect wallet"}
          </button>
        </div>
      </header>

      <div className="console-layout">
        <aside className="console-sidebar">
          <a href={homeHref} className="console-back"><ArrowLeft size={15} /> Landing</a>
          <p className="console-label">BASKET REGISTRY</p>
          {BASKETS.map((basket) => (
            <button
              key={basket.key}
              className={`console-basket-nav ${selectedKey === basket.key ? "active" : ""}`}
              onClick={() => setSelectedKey(basket.key)}
            >
              <strong>${basket.symbol}</strong>
              <span>{basket.name}</span>
            </button>
          ))}
          <div className="console-security-note">
            <ShieldCheck size={18} />
            <strong>Execution locked</strong>
            <span>Mainnet contracts are not deployed. No transaction can be fabricated.</span>
          </div>
        </aside>

        <section className="console-workspace">
          <div className="console-command-bar">
            <span>root@xindex:/{selected.key}</span>
            <button onClick={() => { void loadAssets(); void refreshBalances(); }}>
              <RefreshCw size={14} /> Refresh chain state
            </button>
          </div>

          <div className="console-hero-grid">
            <div>
              <p className="console-label">SELECTED PRODUCT</p>
              <h1>${selected.symbol}</h1>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
            </div>
            <div className="console-reference-value">
              <span>REFERENCE VALUE</span>
              <strong>{basketReferenceValue === null ? "—" : `$${basketReferenceValue.toFixed(2)}`}</strong>
              <small>Indicative midpoint, multiplier-adjusted. Not an executable quote.</small>
            </div>
          </div>

          {walletChainId !== null && walletChainId !== 4663 && (
            <div className="console-alert warning">
              Wallet is on chain {walletChainId}. <button onClick={switchNetwork}>Switch to Robinhood Chain</button>
            </div>
          )}
          {walletError && <div className="console-alert error">{walletError}</div>}
          {dataError && <div className="console-alert error">{dataError}</div>}

          <div className="console-panels">
            <section className="console-panel">
              <header><span>01</span><h3>Canonical components</h3><em>{loadingData ? "SYNCING" : "OFFICIAL REGISTRY"}</em></header>
              <div className="component-table">
                <div className="component-row table-head">
                  <span>Asset</span><span>Target</span><span>Bid / Ask</span><span>Wallet</span><span>Contract</span>
                </div>
                {selected.components.map((symbol, index) => {
                  const asset = assets[symbol];
                  const address = CANONICAL_ADDRESSES[symbol];
                  return (
                    <div className="component-row" key={symbol}>
                      <span><strong>{symbol}</strong><small>{asset?.name ?? "Robinhood Token"}</small></span>
                      <span>{selected.targetWeights[index]}%</span>
                      <span>{asset?.price ? `$${asset.price.bid} / $${asset.price.ask}` : "Unavailable"}</span>
                      <span>{account ? (balances[symbol] ?? "Loading") : "Connect"}</span>
                      <a href={`${robinhoodMainnet.blockExplorers.default.url}/address/${address}`} target="_blank" rel="noreferrer">
                        {shortAddress(address)} <ExternalLink size={12} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="console-panel execution-panel">
              <header><span>02</span><h3>Vault execution</h3><em>NOT DEPLOYED</em></header>
              <div className="execution-status">
                <div className="status-code">LOCK / 403</div>
                <h4>Mainnet vault unavailable</h4>
                <p>{deploymentStatus.reason}</p>
                <dl>
                  <div><dt>Chain</dt><dd>4663</dd></div>
                  <div><dt>USDG</dt><dd>{shortAddress(USDG_ADDRESS)}</dd></div>
                  <div><dt>Vault</dt><dd>Not deployed</dd></div>
                  <div><dt>Liquidity route</dt><dd>Not verified</dd></div>
                </dl>
                <button disabled>Mint ${selected.symbol}</button>
                <small>Execution activates only after verified bytecode, a live liquidity route, and security review.</small>
              </div>
            </section>
          </div>

          <section className="console-panel wallet-state-panel">
            <header><span>03</span><h3>Connected account state</h3><em>{account ? "CHAIN READ" : "DISCONNECTED"}</em></header>
            <div className="wallet-state-grid">
              <div><span>ACCOUNT</span><strong>{account ? shortAddress(account) : "No wallet connected"}</strong></div>
              <div><span>NETWORK</span><strong>{walletChainId === 4663 ? "Robinhood Chain" : walletChainId ? `Chain ${walletChainId}` : "—"}</strong></div>
              <div><span>USDG BALANCE</span><strong>{account ? (balances.USDG ?? "Loading") : "—"}</strong></div>
              <div><span>TRANSACTION MODE</span><strong>Read only until deployment</strong></div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
