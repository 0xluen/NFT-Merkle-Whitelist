const { Worker } = require('worker_threads');

const fileNames = ['wallet.txt']; 

fileNames.forEach(fileName => {
  const worker = new Worker('./fileReader.js', { workerData: fileName });

  worker.on('message', function(addresses) {

    const { MerkleTree } = require('merkletreejs');
    const keccak256 = require('keccak256');

    const leafNodes = addresses.map(address => {
      const bufferAddress = Buffer.from(address.replace(/^0x/, ''), 'hex');
      return keccak256(bufferAddress);
    });

    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getHexRoot();

    const fs = require('fs');
    const stream = fs.createWriteStream(`${fileName}_output.json`);

    stream.write('{"rootHash":"' + rootHash + '","wallets":[');

    const totalAddresses = addresses.length;
    let completedCount = 0;

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
      completedCount++;
      const progress = ((completedCount / totalAddresses) * 100).toFixed(2);
      console.log(`Processing : ${progress}%`);
    });

    stream.write(']}');
    stream.end();
  });

  worker.on('error', function(error) {
    console.error(error);
  });
});
