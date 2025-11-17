// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AntiCounterfeit {
    // Product status enum
    enum ProductStatus {
        Manufactured,
        InRetail,
        Sold
    }

    // Product structure
    struct Product {
        string productId;
        string productName;
        string description;
        string batchNumber;
        uint256 manufactureDate;
        address manufacturer;
        ProductStatus status;
        bool exists;
    }

    // Retailer information structure
    struct RetailerInfo {
        string retailerName;
        string location;
        uint256 receiveDate;
        address retailerAddress;
    }

    // Sale information structure
    struct SaleInfo {
        uint256 saleDate;
        string customerName;
        string verificationKey;
    }

    // Mappings
    mapping(string => Product) public products;
    mapping(string => RetailerInfo) public productRetailers;
    mapping(string => SaleInfo) public productSales;
    mapping(string => string) public verificationKeys; // verificationKey => productId

    // Access control
    mapping(address => bool) public manufacturers;
    mapping(address => bool) public retailers;

    address public owner;

    // Events
    event ProductCreated(
        string productId,
        string productName,
        address manufacturer
    );
    event ProductReceivedByRetailer(
        string productId,
        string retailerName,
        address retailer
    );
    event ProductSold(string productId, string verificationKey);
    event ManufacturerAdded(address manufacturer);
    event RetailerAdded(address retailer);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyManufacturer() {
        require(
            manufacturers[msg.sender],
            "Only manufacturers can perform this action"
        );
        _;
    }

    modifier onlyRetailer() {
        require(
            retailers[msg.sender],
            "Only retailers can perform this action"
        );
        _;
    }

    modifier productExists(string memory _productId) {
        require(products[_productId].exists, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        manufacturers[msg.sender] = true; // Owner is also a manufacturer
    }

    // Add manufacturer (only owner)
    function addManufacturer(address _manufacturer) public onlyOwner {
        manufacturers[_manufacturer] = true;
        emit ManufacturerAdded(_manufacturer);
    }

    // Add retailer (only owner)
    function addRetailer(address _retailer) public onlyOwner {
        retailers[_retailer] = true;
        emit RetailerAdded(_retailer);
    }

    // Create product (only manufacturer)
    function createProduct(
        string memory _productId,
        string memory _productName,
        string memory _description,
        string memory _batchNumber,
        uint256 _manufactureDate
    ) public onlyManufacturer {
        require(!products[_productId].exists, "Product already exists");

        products[_productId] = Product({
            productId: _productId,
            productName: _productName,
            description: _description,
            batchNumber: _batchNumber,
            manufactureDate: _manufactureDate,
            manufacturer: msg.sender,
            status: ProductStatus.Manufactured,
            exists: true
        });

        emit ProductCreated(_productId, _productName, msg.sender);
    }

    // Retailer receives product
    function receiveProduct(
        string memory _productId,
        string memory _retailerName,
        string memory _location,
        uint256 _receiveDate
    ) public onlyRetailer productExists(_productId) {
        require(
            products[_productId].status == ProductStatus.Manufactured,
            "Product not in manufactured state"
        );

        products[_productId].status = ProductStatus.InRetail;

        productRetailers[_productId] = RetailerInfo({
            retailerName: _retailerName,
            location: _location,
            receiveDate: _receiveDate,
            retailerAddress: msg.sender
        });

        emit ProductReceivedByRetailer(_productId, _retailerName, msg.sender);
    }

    // Mark product as sold and generate verification key
    function markProductSold(
        string memory _productId,
        uint256 _saleDate,
        string memory _customerName,
        string memory _verificationKey
    ) public onlyRetailer productExists(_productId) {
        require(
            products[_productId].status == ProductStatus.InRetail,
            "Product not in retail"
        );
        require(
            productRetailers[_productId].retailerAddress == msg.sender,
            "Only the retailer who received the product can mark it as sold"
        );

        products[_productId].status = ProductStatus.Sold;

        productSales[_productId] = SaleInfo({
            saleDate: _saleDate,
            customerName: _customerName,
            verificationKey: _verificationKey
        });

        verificationKeys[_verificationKey] = _productId;

        emit ProductSold(_productId, _verificationKey);
    }

    // Verify product by verification key (public function)
    function verifyProduct(
        string memory _verificationKey
    )
        public
        view
        returns (
            bool isValid,
            string memory productId,
            string memory productName,
            string memory description,
            string memory batchNumber,
            uint256 manufactureDate,
            string memory retailerName,
            string memory location,
            ProductStatus status
        )
    {
        productId = verificationKeys[_verificationKey];

        if (bytes(productId).length == 0) {
            return (
                false,
                "",
                "",
                "",
                "",
                0,
                "",
                "",
                ProductStatus.Manufactured
            );
        }

        Product memory product = products[productId];
        RetailerInfo memory retailer = productRetailers[productId];

        return (
            true,
            product.productId,
            product.productName,
            product.description,
            product.batchNumber,
            product.manufactureDate,
            retailer.retailerName,
            retailer.location,
            product.status
        );
    }

    // Get product details
    function getProduct(
        string memory _productId
    )
        public
        view
        productExists(_productId)
        returns (
            string memory productName,
            string memory description,
            string memory batchNumber,
            uint256 manufactureDate,
            address manufacturer,
            ProductStatus status
        )
    {
        Product memory product = products[_productId];
        return (
            product.productName,
            product.description,
            product.batchNumber,
            product.manufactureDate,
            product.manufacturer,
            product.status
        );
    }

    // Get retailer information
    function getRetailerInfo(
        string memory _productId
    )
        public
        view
        productExists(_productId)
        returns (
            string memory retailerName,
            string memory location,
            uint256 receiveDate,
            address retailerAddress
        )
    {
        RetailerInfo memory retailer = productRetailers[_productId];
        return (
            retailer.retailerName,
            retailer.location,
            retailer.receiveDate,
            retailer.retailerAddress
        );
    }

    // Get sale information
    function getSaleInfo(
        string memory _productId
    )
        public
        view
        productExists(_productId)
        returns (
            uint256 saleDate,
            string memory customerName,
            string memory verificationKey
        )
    {
        SaleInfo memory sale = productSales[_productId];
        return (sale.saleDate, sale.customerName, sale.verificationKey);
    }
}
