const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const { createWriteStream } = require('fs');

const addresses = fs.readFileSync('walletList.txt', 'utf-8')
  .split(/\r?\n/)  // Unix ve Windows uyumlu satır ayırma
  .filter(address => address.trim());  // Boşlukları ve boş satırları temizle

const leafNodes = addresses.map(address => {
  const bufferAddress = Buffer.from(address.replace(/^0x/, ''), 'hex');
  return keccak256(bufferAddress);
});

const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHash = merkleTree.getHexRoot();

const stream = createWriteStream('wallet_output.json');

stream.write('{"rootHash":"' + rootHash + '","wallets":[');

const totalAddresses = addresses.length;
addresses.forEach((address, index) => {
  const bufferAddress = Buffer.from(address.replace(/^0x/, ''), 'hex');
  const leaf = keccak256(bufferAddress);
  const proof = merkleTree.getHexProof(leaf);
  const wallet = {
    address: address,
    proof: proof
  };

  const suffix = (index !== addresses.length - 1) ? ',' : '';

  stream.write(JSON.stringify(wallet) + suffix);
});

stream.write(']}');
stream.end();
