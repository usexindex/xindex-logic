<div align="center">
  <img src="xindex/public/assets/xindex-logo.png" alt="Xindex logo" width="96" />
  <h1>Xindex</h1>
  <p><strong>Build the index. Own the narrative.</strong></p>
  <p>Tokenized stock-basket infrastructure for Robinhood Chain.</p>
</div>

<div align="center">
  <a href="#vision">Vision</a> ·
  <a href="#products">Products</a> ·
  <a href="#market-registry">Market registry</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#roadmap">Roadmap</a>
</div>

<br />

<div align="center">
  <img src="xindex/public/assets/stock-logos/nvidia.svg" alt="NVIDIA" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/broadcom.svg" alt="Broadcom" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/tsmc.svg" alt="TSMC" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/amd.svg" alt="AMD" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/apple.svg" alt="Apple" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/microsoft.svg" alt="Microsoft" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/google.svg" alt="Alphabet" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/amazon.svg" alt="Amazon" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/meta.svg" alt="Meta" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/tesla.svg" alt="Tesla" width="38" height="38" />
  <img src="xindex/public/assets/stock-logos/gold.svg" alt="Gold" width="38" height="38" />
</div>

> **Status:** Xindex is an actively developed protocol prototype. The current web app is a read-only product workspace: it can inspect live reference data and connected-wallet balances, but basket minting, redemption, USDG routing, and production vault execution are not enabled yet.

## Vision

The next generation of onchain investing will not be defined by another isolated token. It will be defined by **clear, composable exposure**.

Xindex turns recognizable market themes into transparent, programmable baskets. Instead of asking users to manually assemble a group of assets, Xindex is designed to make a basket legible:

- every component is visible;
- every target weight is explicit;
- every reference address is pinned;
- every vault action is intended to be verifiable onchain;
- every unavailable route fails closed rather than pretending to execute.

The ambition is straightforward: make diversified market exposure feel as native, transparent, and composable as any other DeFi primitive.

## Products

### `$AI7` — the intelligence layer

An AI-focused basket built around the infrastructure, semiconductor, platform, and software companies powering the next computing cycle.

| Component | Target |
| --- | ---: |
| <img src="xindex/public/assets/stock-logos/nvidia.svg" alt="NVIDIA" width="20" /> NVDA | 20% |
| <img src="xindex/public/assets/stock-logos/broadcom.svg" alt="Broadcom" width="20" /> AVGO | 15% |
| <img src="xindex/public/assets/stock-logos/amd.svg" alt="AMD" width="20" /> AMD | 15% |
| <img src="xindex/public/assets/stock-logos/microsoft.svg" alt="Microsoft" width="20" /> MSFT | 15% |
| <img src="xindex/public/assets/stock-logos/amazon.svg" alt="Amazon" width="20" /> AMZN | 15% |
| <img src="xindex/public/assets/stock-logos/meta.svg" alt="Meta" width="20" /> META | 10% |
| <img src="xindex/public/assets/stock-logos/tesla.svg" alt="Tesla" width="20" /> TSLA | 10% |

### `$MAG7` — concentrated platform exposure

The familiar mega-cap technology complex in one transparent composition: a high-conviction basket for users who want the major platform companies represented together.

| Component | Target |
| --- | ---: |
| <img src="xindex/public/assets/stock-logos/apple.svg" alt="Apple" width="20" /> AAPL | 14.3% |
| <img src="xindex/public/assets/stock-logos/microsoft.svg" alt="Microsoft" width="20" /> MSFT | 14.3% |
| <img src="xindex/public/assets/stock-logos/google.svg" alt="Alphabet" width="20" /> GOOGL | 14.3% |
| <img src="xindex/public/assets/stock-logos/amazon.svg" alt="Amazon" width="20" /> AMZN | 14.3% |
| <img src="xindex/public/assets/stock-logos/nvidia.svg" alt="NVIDIA" width="20" /> NVDA | 14.3% |
| <img src="xindex/public/assets/stock-logos/meta.svg" alt="Meta" width="20" /> META | 14.3% |
| <img src="xindex/public/assets/stock-logos/tesla.svg" alt="Tesla" width="20" /> TSLA | 14.2% |

### `$GOLD` — a hard-asset counterweight

A simple commodity basket reference built around the SPDR Gold Trust Stock Token reference. It is designed as a visible counterweight to equity-heavy compositions.

| Component | Target |
| --- | ---: |
| <img src="xindex/public/assets/stock-logos/gold.svg" alt="Gold" width="20" /> GLD | 100% |

## Market registry

Xindex currently tracks a pinned registry of canonical Robinhood Stock Token references:

<div align="center">

|  | Symbol |  | Symbol |  | Symbol |
| --- | --- | --- | --- | --- | --- |
| <img src="xindex/public/assets/stock-logos/nvidia.svg" alt="NVIDIA" width="28" /> | **NVDA** | <img src="artifacts/xindex/public/assets/stock-logos/broadcom.svg" alt="Broadcom" width="28" /> | **AVGO** | <img src="artifacts/xindex/public/assets/stock-logos/tsmc.svg" alt="TSMC" width="28" /> | **TSM** |
| <img src="xindex/public/assets/stock-logos/amd.svg" alt="AMD" width="28" /> | **AMD** | <img src="artifacts/xindex/public/assets/stock-logos/apple.svg" alt="Apple" width="28" /> | **AAPL** | <img src="artifacts/xindex/public/assets/stock-logos/microsoft.svg" alt="Microsoft" width="28" /> | **MSFT** |
| <img src="xindex/public/assets/stock-logos/google.svg" alt="Alphabet" width="28" /> | **GOOGL** | <img src="xindex/public/assets/stock-logos/amazon.svg" alt="Amazon" width="28" /> | **AMZN** | <img src="xindex/public/assets/stock-logos/meta.svg" alt="Meta" width="28" /> | **META** |
| <img src="xindex/public/assets/stock-logos/tesla.svg" alt="Tesla" width="28" /> | **TSLA** | <img src="artifacts/xindex/public/assets/stock-logos/gold.svg" alt="Gold" width="28" /> | **GLD** |  |  |

</div>

Reference prices are indicative market data, not guaranteed execution quotes. Xindex rejects malformed, crossed, stale, or halted data and does not infer contract addresses from ticker symbols.

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         Xindex workspace                     │
│   Explore  ·  Create  ·  Portfolio  ·  reference terminal    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Validated API proxy                       │
│   canonical registry · indicative prices · freshness checks   │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Robinhood Chain / Stock Tokens                │
│              chain ID 4663 · native gas token ETH             │
└──────────────────────────────────────────────────────────────┘
```

The contract package contains a non-upgradeable `BasketToken` and `BasketVault` baseline. The vault architecture is intentionally conservative:

- the vault owns and permanently binds its basket token at deployment;
- components are deposited directly in fixed raw units;
- redemption is pro-rata against the vault's actual component balances;
- deposit and redemption fees are capped at 1%;
- component decimals are checked onchain;
- fee-on-transfer behavior is rejected;
- unsolicited component donations accrue to basket holders, not protocol fees;
- USDG conversion stays disabled until a verified routing adapter and liquidity path exist.

## Current capabilities

### Available now

- Explore `$AI7`, `$MAG7`, and `$GOLD`.
- Search and filter the canonical market registry.
- Inspect reference levels and allocation weights.
- Create and save a browser-local basket draft.
- Connect a wallet and read live ERC-20 balances.
- Inspect Robinhood Chain network state and explorer links.
- Compile the Solidity contract baseline.

### Not enabled yet

- Production vault deployment.
- Basket token mint and redeem transactions.
- USDG deposit routing.
- Approvals, permits, slippage enforcement in the live UI.
- Transaction indexing and activity history.
- Mainnet liquidity execution.

The interface deliberately shows these gates instead of fabricating fills, balances, confirmations, or transaction hashes.

## Roadmap

### Phase 01 — verify the foundation

- Deploy to a controlled Robinhood Chain Testnet environment.
- Use only verified testnet component addresses.
- Add a local EVM runtime for contract execution tests.
- Add unit, fuzz, invariant, reentrancy, rounding, donation, and adversarial tests.
- Run static analysis and independent security review.

### Phase 02 — make the vault executable

- Add secure signer and deployment verification workflows.
- Deploy and verify the basket vaults.
- Implement approval/permit flows.
- Add mint and redeem transactions with quote expiry, slippage, pending, confirmed, and failed states.
- Index confirmed vault events.

### Phase 03 — open the liquidity layer

- Select an audited RFQ, aggregator, or AMM routing strategy.
- Verify USDG liquidity and route health before enabling execution.
- Add independent monitoring, pause controls, multisig ownership, and timelocks.
- Launch only after the full security gate passes.

> Mainnet deployment must never happen automatically. The Xindex fee/governance token is a separate future product and is not part of the current basket contract scope.

## Run locally

This repository uses pnpm workspaces.

```bash
pnpm install

# Xindex web workspace
pnpm --filter @workspace/xindex run dev

# API server
pnpm --filter @workspace/api-server run dev

# Contract compile and interface tests
pnpm --filter @workspace/xindex-contracts build
pnpm --filter @workspace/xindex-contracts test

# Full validation
pnpm run typecheck
pnpm run build
```

The managed Xindex workflow provides the required `PORT` and `BASE_PATH` values for the Vite app.

## Repository map

| Path | Purpose |
| --- | --- |
| `artifacts/xindex/` | React + Vite product workspace |
| `artifacts/xindex/src/pages/protocol-workspace.tsx` | Explore, Create, and Portfolio flows |
| `artifacts/xindex/src/lib/protocol.ts` | Chain configuration and pinned registry metadata |
| `artifacts/xindex/public/assets/stock-logos/` | Local stock and commodity logo assets |
| `artifacts/api-server/` | Validated canonical asset and reference-price proxy |
| `artifacts/contracts/` | Solidity basket token, vault, tests, and deployment records |
| `lib/api-spec/` | Shared OpenAPI contract and generated client types |
| `artifacts/xindex/whitepaper/` | Xindex whitepaper source and downloadable document |

## Risk and disclosure

Xindex is experimental software. Tokenized assets, smart contracts, market references, bridges, liquidity routes, and wallets carry technical, market, counterparty, regulatory, and operational risks. Nothing in this repository is investment advice or a guarantee of performance.

The current app is not a live trading venue. It does not claim custody, execution, or protocol revenue. Do not send funds to undeployed or unverified contracts. Never commit private keys, seed phrases, API keys, or deployer credentials.

## License

This project is under active development. Licensing terms will be published before production protocol launch.
