import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const sourcePath = path.resolve("contracts/XindexBasket.sol");
const source = fs.readFileSync(sourcePath, "utf8");
const input = {
  language: "Solidity",
  sources: { "XindexBasket.sol": { content: source } },
  settings: { optimizer: { enabled: true, runs: 500 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((item) => item.severity === "error");
if (errors.length) {
  console.error(errors.map((item) => item.formattedMessage).join("\n"));
  process.exit(1);
}
fs.mkdirSync("out", { recursive: true });
for (const [name, artifact] of Object.entries(output.contracts["XindexBasket.sol"])) {
  fs.writeFileSync(`out/${name}.json`, JSON.stringify(artifact, null, 2));
}
console.log(`Compiled ${Object.keys(output.contracts["XindexBasket.sol"]).join(", ")}`);
