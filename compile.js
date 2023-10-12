const path = require('path');
const fs = require('fs');
const solc = require('solc');

const eCommercePath = path.resolve(__dirname, 'contracts', 'eCommerce.sol');
const source = fs.readFileSync(eCommercePath, 'utf8');

let input = {
  language: "Solidity",
  sources: {
    "eCommerce.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const contracts = output.contracts["eCommerce.sol"];
const contract = contracts['eCommerce']; // Check if the contract name matches here

console.log(contract);
module.exports = {"abi": contract.abi, "bytecode": contract.evm.bytecode.object};
