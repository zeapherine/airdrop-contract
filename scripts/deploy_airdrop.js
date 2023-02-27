const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
   const airdropAddress = await deployAirdrop();
}

async function deployAirdrop(){
    console.log("deploying airdrop......")
    const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"
    const admin = "";
    const airdropAmount = ethers.utils.parseUnits("50",6); 

    console.log("....");
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log("airdropAmount-------------", airdropAmount)

    console.log("....");
    const Airdrop = await ethers.getContractFactory("Airdrop");
    const airdrop = await Airdrop.deploy(usdtAddress, deployer.address, airdropAmount);
    const airdropAddress = airdrop.address;
    console.log("Airdrop contract deployed at : ", airdropAddress);
    return {
        airdropAddress, deployer};
}

exports.deployAirdrop = deployAirdrop;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});