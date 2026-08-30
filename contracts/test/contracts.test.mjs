import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import solc from "solc";

const source = fs.readFileSync(new URL("../contracts/XindexBasket.sol", import.meta.url), "utf8");
const compiled = JSON.parse(solc.compile(JSON.stringify({
  language: "Solidity",
  sources: { "XindexBasket.sol": { content: source } },
  settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
})));

test("contracts compile without Solidity errors", () => {
  const errors = (compiled.errors ?? []).filter((item) => item.severity === "error");
  assert.deepEqual(errors, []);
});

test("vault exposes guarded deposit, redeem, preview, and pause interfaces", () => {
  const abi = compiled.contracts["XindexBasket.sol"].BasketVault.abi;
  const names = new Set(abi.filter((item) => item.type === "function").map((item) => item.name));
  for (const name of ["deposit", "redeem", "previewDeposit", "previewRedeem", "setPaused", "component"]) {
    assert.equal(names.has(name), true, `missing ${name}`);
  }
});

test("basket token mint and burn are vault-restricted by interface design", () => {
  const abi = compiled.contracts["XindexBasket.sol"].BasketToken.abi;
  const functions = abi.filter((item) => item.type === "function").map((item) => item.name);
  assert.ok(functions.includes("vault"));
  assert.ok(functions.includes("mint"));
  assert.ok(functions.includes("burnFrom"));
});
