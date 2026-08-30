# Xindex contracts

This package contains the non-upgradeable basket token and direct-underlying vault baseline for Xindex.

## Safety boundary

- The vault never claims to swap USDG. It accepts canonical component tokens in fixed units and redeems the vault's actual pro-rata balances.
- A separate, audited adapter must be added before a USDG entry path can exist. The UI must keep USDG execution disabled until a live route is verified.
- Components are immutable per vault. Deposit and redemption fees are capped at 1% at construction.
- The vault deploys and permanently binds its own basket token atomically; there is no later minter assignment.
- Component decimals are checked onchain at deployment. `unitsPerShare` is always expressed in each component's raw base units.
- Deposits measure received balances and reject fee-on-transfer behavior.
- Unsolicited component donations accrue pro-rata to all basket holders and must never be counted as protocol fees.
- Mainnet is intentionally not deployed. Never commit deployer keys.

## Commands

```sh
pnpm --filter @workspace/xindex-contracts build
pnpm --filter @workspace/xindex-contracts test
```

## Launch gate

Before mainnet: add runtime tests on a local EVM, fuzz/invariant tests, static analysis, an independent audit, multisig/timelock ownership, verified liquidity routing, deployment simulation, and published verified source. The checked-in deployment record must only be changed after confirming chain ID, bytecode, transaction hash, and explorer verification.