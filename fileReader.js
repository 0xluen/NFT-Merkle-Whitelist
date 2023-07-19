const { workerData, parentPort } = require('worker_threads');
const fs = require('fs');

function readFromFile(fileName) {
  const addresses = fs.readFileSync(fileName, 'utf-8').split('\n').filter(address => address);
  return addresses;
}

const addresses = readFromFile(workerData);
parentPort.postMessage(addresses);
