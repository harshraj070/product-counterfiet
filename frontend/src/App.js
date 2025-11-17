import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Package, Store, User, CheckCircle, XCircle, Shield } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const App = () => {
  const [activeTab, setActiveTab] = useState('manufacturer');
  const [products, setProducts] = useState([]);
  const [notification, setNotification] = useState(null);

  // Manufacturer form state
  const [manufacturerForm, setManufacturerForm] = useState({
    productName: '',
    description: '',
    batchNumber: '',
    manufactureDate: ''
  });

  // Retailer form state
  const [retailerForm, setRetailerForm] = useState({
    productId: '',
    retailerName: '',
    receiveDate: '',
    location: ''
  });

  // Sale form state
  const [saleForm, setSaleForm] = useState({
    productId: '',
    saleDate: '',
    customerName: ''
  });

  // Verification form state
  const [verificationKey, setVerificationKey] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Store last created product ID and verification key
  const [lastProductId, setLastProductId] = useState('');
  const [lastVerificationKey, setLastVerificationKey] = useState('');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 8000); // Increased from 3 to 8 seconds
  };

  const generateProductId = () => {
    return 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const generateVerificationKey = (productId) => {
    return 'VK-' + productId + '-' + Math.random().toString(36).substr(2, 12).toUpperCase();
  };

  // Load all products
  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    // Refresh products every 5 seconds
    const interval = setInterval(loadProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manufacturer: Create Product
  const handleManufacturerSubmit = async () => {
    if (!manufacturerForm.productName || !manufacturerForm.description || 
        !manufacturerForm.batchNumber || !manufacturerForm.manufactureDate) {
      showNotification('Please fill all fields', 'error');
      return;
    }
    
    try {
      const productId = generateProductId();
      await axios.post(`${API_URL}/product/create`, {
        productId,
        ...manufacturerForm
      });
      
      setLastProductId(productId); // Save the product ID
      showNotification(`Product created! ID: ${productId}`);
      setManufacturerForm({
        productName: '',
        description: '',
        batchNumber: '',
        manufactureDate: ''
      });
      loadProducts();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error creating product', 'error');
    }
  };

  // Retailer: Receive Product
  const handleRetailerSubmit = async () => {
    if (!retailerForm.productId || !retailerForm.retailerName || 
        !retailerForm.receiveDate || !retailerForm.location) {
      showNotification('Please fill all fields', 'error');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/product/receive`, retailerForm);
      
      showNotification('Product received by retailer successfully!');
      setRetailerForm({
        productId: '',
        retailerName: '',
        receiveDate: '',
        location: ''
      });
      loadProducts();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error receiving product', 'error');
    }
  };

  // Retailer: Mark as Sold
  const handleSaleSubmit = async () => {
    if (!saleForm.productId || !saleForm.saleDate) {
      showNotification('Please fill required fields', 'error');
      return;
    }
    
    try {
      const verificationKey = generateVerificationKey(saleForm.productId);
      await axios.post(`${API_URL}/product/sell`, {
        ...saleForm,
        verificationKey
      });
      
      setLastVerificationKey(verificationKey); // Save the verification key
      showNotification(`Product sold! Verification Key: ${verificationKey}`);
      setSaleForm({
        productId: '',
        saleDate: '',
        customerName: ''
      });
      loadProducts();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error marking product as sold', 'error');
    }
  };

  // Customer: Verify Product
  const handleVerification = async () => {
    if (!verificationKey) {
      showNotification('Please enter verification key', 'error');
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/verify/${verificationKey}`);
      
      setVerificationResult(response.data);
      if (response.data.valid) {
        showNotification('Product verified as genuine!', 'success');
      } else {
        showNotification('Warning: Product not found or counterfeit!', 'error');
      }
    } catch (error) {
      setVerificationResult({ valid: false });
      showNotification('Error verifying product', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Anti-Counterfeiting Tracker</h1>
                <p className="text-indigo-100">Blockchain-Powered Product Authentication</p>
              </div>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`p-4 ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} border-l-4 ${notification.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{notification.message}</span>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('manufacturer')}
              className={`flex-1 p-4 font-semibold transition-colors ${activeTab === 'manufacturer' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Package className="w-5 h-5 inline mr-2" />
              Manufacturer
            </button>
            <button
              onClick={() => setActiveTab('retailer')}
              className={`flex-1 p-4 font-semibold transition-colors ${activeTab === 'retailer' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Store className="w-5 h-5 inline mr-2" />
              Retailer
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex-1 p-4 font-semibold transition-colors ${activeTab === 'customer' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <User className="w-5 h-5 inline mr-2" />
              Customer
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Manufacturer Tab */}
            {activeTab === 'manufacturer' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Product</h2>
                
                {/* Show last created product ID */}
                {lastProductId && (
                  <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-green-800">✅ Last Product Created:</p>
                        <p className="text-lg font-mono font-bold text-green-900">{lastProductId}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lastProductId);
                          showNotification('Product ID copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={manufacturerForm.productName}
                      onChange={(e) => setManufacturerForm({...manufacturerForm, productName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={manufacturerForm.description}
                      onChange={(e) => setManufacturerForm({...manufacturerForm, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Product description"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={manufacturerForm.batchNumber}
                      onChange={(e) => setManufacturerForm({...manufacturerForm, batchNumber: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Batch number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacture Date</label>
                    <input
                      type="date"
                      value={manufacturerForm.manufactureDate}
                      onChange={(e) => setManufacturerForm({...manufacturerForm, manufactureDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleManufacturerSubmit}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Create Product
                  </button>
                </div>
              </div>
            )}

            {/* Retailer Tab */}
            {activeTab === 'retailer' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Receive Product & Mark Sale</h2>
                
                {/* Receive Product Form */}
                <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Receive Product from Manufacturer</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                      <input
                        type="text"
                        value={retailerForm.productId}
                        onChange={(e) => setRetailerForm({...retailerForm, productId: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter product ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Retailer Name</label>
                      <input
                        type="text"
                        value={retailerForm.retailerName}
                        onChange={(e) => setRetailerForm({...retailerForm, retailerName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Your store name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receive Date</label>
                      <input
                        type="date"
                        value={retailerForm.receiveDate}
                        onChange={(e) => setRetailerForm({...retailerForm, receiveDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={retailerForm.location}
                        onChange={(e) => setRetailerForm({...retailerForm, location: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Store location"
                      />
                    </div>
                    <button
                      onClick={handleRetailerSubmit}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Receive Product
                    </button>
                  </div>
                </div>

                {/* Mark as Sold Form */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Mark Product as Sold</h3>
                  
                  {/* Show last verification key */}
                  {lastVerificationKey && (
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-800">🔑 Last Verification Key Generated:</p>
                          <p className="text-base font-mono font-bold text-yellow-900 break-all">{lastVerificationKey}</p>
                          <p className="text-xs text-yellow-700 mt-1">⚠️ Give this key to the customer for product verification</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lastVerificationKey);
                            showNotification('Verification Key copied to clipboard!');
                          }}
                          className="ml-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm whitespace-nowrap"
                        >
                          Copy Key
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                      <input
                        type="text"
                        value={saleForm.productId}
                        onChange={(e) => setSaleForm({...saleForm, productId: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter product ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                      <input
                        type="date"
                        value={saleForm.saleDate}
                        onChange={(e) => setSaleForm({...saleForm, saleDate: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
                      <input
                        type="text"
                        value={saleForm.customerName}
                        onChange={(e) => setSaleForm({...saleForm, customerName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Customer name"
                      />
                    </div>
                    <button
                      onClick={handleSaleSubmit}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Mark as Sold & Generate Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Tab */}
            {activeTab === 'customer' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Verify Product Authenticity</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Key</label>
                    <input
                      type="text"
                      value={verificationKey}
                      onChange={(e) => setVerificationKey(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter verification key from receipt"
                    />
                  </div>
                  <button
                    onClick={handleVerification}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Verify Product
                  </button>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <div className={`mt-6 p-6 rounded-lg ${verificationResult.valid ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      {verificationResult.valid ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <h3 className="text-xl font-bold text-green-800">Genuine Product ✓</h3>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 text-red-600" />
                          <h3 className="text-xl font-bold text-red-800">Counterfeit Warning!</h3>
                        </>
                      )}
                    </div>

                    {verificationResult.valid && verificationResult.product && (
                      <div className="space-y-3 text-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold">Product Name:</p>
                            <p>{verificationResult.product.productName}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Product ID:</p>
                            <p className="text-sm font-mono">{verificationResult.product.productId}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Batch Number:</p>
                            <p>{verificationResult.product.batchNumber}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Manufacture Date:</p>
                            <p>{verificationResult.product.manufactureDate}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Retailer:</p>
                            <p>{verificationResult.product.retailer?.retailerName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Sale Date:</p>
                            <p>{verificationResult.product.sale?.saleDate || 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold">Description:</p>
                          <p className="text-sm">{verificationResult.product.description}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Status:</p>
                          <p className="text-sm uppercase font-semibold">{verificationResult.product.status}</p>
                        </div>
                      </div>
                    )}

                    {!verificationResult.valid && (
                      <p className="text-red-700">This verification key is not registered in our system. The product may be counterfeit. Please contact the retailer or manufacturer.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Products List */}
          {products.length > 0 && (
            <div className="p-6 bg-gray-50 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Registered Products ({products.length})</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.productId} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{product.productName}</p>
                        <p className="text-sm text-gray-600 font-mono">{product.productId}</p>
                        <p className="text-xs text-gray-500 mt-1">Batch: {product.batchNumber}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'manufactured' ? 'bg-blue-100 text-blue-800' :
                        product.status === 'in_retail' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {product.sale?.verificationKey && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">Verification Key:</p>
                        <p className="text-xs font-mono text-green-800">{product.sale.verificationKey}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;