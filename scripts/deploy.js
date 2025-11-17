const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying AntiCounterfeit contract...");
  
  // Get signers
  const [deployer, manufacturer, retailer] = await hre.ethers.getSigners();
  
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  
  // Deploy contract
  const AntiCounterfeit = await hre.ethers.getContractFactory("AntiCounterfeit");
  const antiCounterfeit = await AntiCounterfeit.deploy();
  
  await antiCounterfeit.waitForDeployment();
  
  const address = await antiCounterfeit.getAddress();
  console.log("✅ AntiCounterfeit deployed to:", address);
  
  // Add manufacturer (using address directly, not string)
  console.log("\n👨‍🏭 Adding manufacturer:", manufacturer.address);
  const tx1 = await antiCounterfeit.addManufacturer(manufacturer.address);
  await tx1.wait();
  console.log("✅ Manufacturer added successfully");
  
  // Add retailer (using address directly, not string)
  console.log("\n🏪 Adding retailer:", retailer.address);
  const tx2 = await antiCounterfeit.addRetailer(retailer.address);
  await tx2.wait();
  console.log("✅ Retailer added successfully");
  
  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Contract Address:", address);
  console.log("Owner:", deployer.address);
  console.log("Manufacturer:", manufacturer.address);
  console.log("Retailer:", retailer.address);
  console.log("=".repeat(60));
  console.log("\n💡 Save these addresses for your backend configuration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });