const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');

const app = express();
app.use(cors());
app.use(express.json());

// Local Hardhat node
const web3 = new Web3('http://localhost:8545');

// Import ABI
const contractJSON = require('../artifacts/contracts/AntiCounterfeit.sol/AntiCounterfeit.json');
const contractABI = contractJSON.abi;

// PASTE YOUR ADDRESSES FROM DEPLOYMENT HERE
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Hardhat default test accounts
const accounts = {
  manufacturer: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  },
  retailer: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
  }
};

const contract = new web3.eth.Contract(contractABI, contractAddress);

// Send transaction helper
async function sendTransaction(method, fromAccount) {
  try {
    const gas = await method.estimateGas({ from: fromAccount.address });
    const gasPrice = await web3.eth.getGasPrice();
    
    const tx = {
      from: fromAccount.address,
      to: contractAddress,
      gas: gas.toString(),
      gasPrice: gasPrice.toString(),
      data: method.encodeABI()
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, fromAccount.privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    return receipt;
  } catch (error) {
    throw error;
  }
}

// Create product
app.post('/api/product/create', async (req, res) => {
  try {
    const { productId, productName, description, batchNumber, manufactureDate } = req.body;
    
    console.log('📦 Creating product:', productId);
    
    const timestamp = Math.floor(new Date(manufactureDate).getTime() / 1000);
    
    const method = contract.methods.createProduct(
      productId,
      productName,
      description,
      batchNumber,
      timestamp
    );
    
    const receipt = await sendTransaction(method, accounts.manufacturer);
    
    console.log('✅ Transaction:', receipt.transactionHash);
    
    res.json({
      success: true,
      productId,
      transactionHash: receipt.transactionHash,
      message: 'Product created on blockchain!'
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Receive product
app.post('/api/product/receive', async (req, res) => {
  try {
    const { productId, retailerName, location, receiveDate } = req.body;
    
    console.log('📥 Receiving product:', productId);
    
    const timestamp = Math.floor(new Date(receiveDate).getTime() / 1000);
    
    const method = contract.methods.receiveProduct(
      productId,
      retailerName,
      location,
      timestamp
    );
    
    const receipt = await sendTransaction(method, accounts.retailer);
    
    console.log('✅ Transaction:', receipt.transactionHash);
    
    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      message: 'Product received on blockchain!'
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mark as sold
app.post('/api/product/sell', async (req, res) => {
  try {
    const { productId, saleDate, customerName, verificationKey } = req.body;
    
    console.log('💰 Marking product as sold:', productId);
    
    const timestamp = Math.floor(new Date(saleDate).getTime() / 1000);
    
    const method = contract.methods.markProductSold(
      productId,
      timestamp,
      customerName || '',
      verificationKey
    );
    
    const receipt = await sendTransaction(method, accounts.retailer);
    
    console.log('✅ Transaction:', receipt.transactionHash);
    
    res.json({
      success: true,
      verificationKey,
      transactionHash: receipt.transactionHash,
      message: 'Product sold on blockchain!'
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verify product
// Verify product
app.get('/api/verify/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    console.log('🔍 Verifying product with key:', key);
    
    // Call the smart contract
    const result = await contract.methods.verifyProduct(key).call();
    
    console.log('Smart contract result:', result);
    
    // Check if valid
    if (!result.isValid || !result[0]) {
      console.log('❌ Product not valid');
      return res.json({
        valid: false,
        message: 'Product not found or counterfeit!'
      });
    }
    
    console.log('✅ Product is valid!');
    
    res.json({
      valid: true,
      product: {
        productId: result.productId || result[1],
        productName: result.productName || result[2],
        description: result.description || result[3],
        batchNumber: result.batchNumber || result[4],
        manufactureDate: new Date(Number(result.manufactureDate || result[5]) * 1000).toISOString().split('T')[0],
        status: ['manufactured', 'in_retail', 'sold'][Number(result.status || result[8])],
        retailer: {
          retailerName: result.retailerName || result[6],
          location: result.location || result[7]
        }
      }
    });
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    res.status(500).json({ 
      error: error.message,
      valid: false,
      message: 'Error verifying product'
    });
  }
});

// Get products (placeholder)
app.get('/api/products', (req, res) => {
  res.json([]);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('✅ Blockchain server running on http://localhost:${PORT}');
  console.log('📝 Contract:', contractAddress);
  console.log('⛓️  Network: Hardhat Local');
});