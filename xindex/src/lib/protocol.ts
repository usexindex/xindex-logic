import { defineChain, type Address } from "viem";

export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export type BasketKey = "ai7" | "mag7" | "gold";

export type BasketDefinition = {
  key: BasketKey;
  symbol: string;
  name: string;
  description: string;
  components: string[];
  targetWeights: number[];
};

export const BASKETS: BasketDefinition[] = [
  {
    key: "ai7",
    symbol: "AI7",
    name: "AI Compute Basket",
    description: "Canonical AI semiconductor references",
    components: ["NVDA", "AVGO", "TSM", "AMD"],
    targetWeights: [35, 25, 25, 15],
  },
  {
    key: "mag7",
    symbol: "MAG7",
    name: "Magnificent Seven",
    description: "Seven canonical mega-cap references",
    components: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"],
    targetWeights: [14.3, 14.3, 14.3, 14.3, 14.3, 14.3, 14.2],
  },
  {
    key: "gold",
    symbol: "GOLD",
    name: "Gold-Linked Basket",
    description: "SPDR Gold Trust Robinhood Token reference",
    components: ["GLD"],
    targetWeights: [100],
  },
];

export const USDG_ADDRESS =
  "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as Address;

export const CANONICAL_ADDRESSES: Record<string, Address> = {
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

export const erc20Abi = [
  {
    type: "function",
    stateMutability: "view",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export const deploymentStatus = {
  chainId: 4663,
  environment: "mainnet",
  status: "not-deployed",
  basketVaults: {
    ai7: null,
    mag7: null,
    gold: null,
  },
  reason:
    "Basket contracts are intentionally not deployed until launch security review.",
} as const;
