const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, chai } = require("chai");
const { BigNumber } = require("ethers");

const { deployAirdrop } = require("../scripts/deploy_airdrop.js");


const winnerAccounts = [
    "0xaaD963485b93aD21A088d0365c410446F2859564",
    "0x2D7aF2D3a439e9e837532076D57576AC8c3B3f13",
    "0x955A466E2c03a83269796e2635A1A86d23bd7fCD",
    "0xCA5CE67a4CC81875F9E687c24ac81d1A6A2eE841",
    "0x5B9e8bDD8B6EA310Fd16230EBc6c093E6A0FB562",
    "0xA1B50FE47e5274ad7Fe3692dECc1878e8D057f6e",
    "0x627afb1341CB1ae3cb3546424709DBA42d88bDE9",
    "0x5ff746d40D2b265C46d6ef2c8e0fC9Cb6E3c0F6D",
    "0xb11AB19aD4CEab01C2b3A085349c824b52132828",
    "0x2D0AF6b7E9202358ead703A35709F55eB2dd4350",
    "0x79fb4ebdd543d0927b809b1e8f552f1bf74dec65",
    "0x844059B6Ffe308073fAAF869c1B50AB2672C34B1",
    "0x07431D0Db9042F8bE2368BbFF98D2879B4E665AB",
]

let usdtAddress;

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    let airdrop;
    let bepUsdt;

    let {airdropAddress, deployer} = await deployAirdrop();

    usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"

    airdropInstance = await ethers.getContractAt("Airdrop", airdropAddress);
    bepUsdtInstance = await ethers.getContractAt("BEP20Token", usdtAddress);
    
    console.log("usdt balance pre impersonate 2", await bepUsdtInstance.balanceOf(deployer.address));
    await impersonateAccount(deployer, bepUsdtInstance, airdropAddress);
    console.log("usdt balance post impersonate 2", await bepUsdtInstance.balanceOf(deployer.address));

    return { airdropAddress, deployer, usdtAddress, airdropInstance, bepUsdtInstance };
  }

  async function impersonateAccount (account, tokenInstance, airdropAddress) {
    const amountTo = ethers.utils.parseUnits("5000", await bepUsdtInstance.decimals()); 
    // impersonate account; replace with an address that actually has your token
      const addressWithTokens = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"; //USDC.t
      await hre.ethers.provider.send("hardhat_impersonateAccount", [addressWithTokens]);
      const impersonatedSigner = await ethers.getSigner(addressWithTokens);
      const transaction = account.sendTransaction({
        from: account.address,
        to: impersonatedSigner.address,
        value: ethers.utils.parseUnits("100000000", await tokenInstance.decimals()),
      });

      await tokenInstance.connect(impersonatedSigner).transfer(account.address, amountTo);
  }

  describe("Deployment", function () {
    it("Airdrop Deposit USDT", async function () {
        const { airdropAddress, deployer, airdropInstance, bepUsdtInstance } = await loadFixture(deployContracts);

        console.log("airdropAddress::::", airdropAddress);
        console.log("airdrop deployer address::::", deployer.address);

        const totalAirdropToDeposit = ethers.utils.parseUnits("650", await bepUsdtInstance.decimals()); 
        const airdropAmount = ethers.utils.parseUnits("50", await bepUsdtInstance.decimals()); 
        console.log("airdropAmount*********", airdropAmount)

        let tx = await airdropInstance.connect(deployer).setAddressesToAirdrop(winnerAccounts, { gasLimit: 30000000 });
        let res = await tx.wait();

        const preDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress)
        await bepUsdtInstance.connect(deployer).approve(airdropAddress, totalAirdropToDeposit);
        let tx1 = await airdropInstance.connect(deployer).depositERC20(totalAirdropToDeposit, { gasLimit: 30000000 });
        let res1 = await tx1.wait();
        const postDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress);
        
        
        
        expect(postDepositContractBal).to.equal(preDepositContractBal + totalAirdropToDeposit);
        
        const preWinnerBal = [];
        for(i=0; i < winnerAccounts.length; i++) {
          preWinnerBal.push(await bepUsdtInstance.balanceOf(winnerAccounts[i]));
        }
        
        let tx2 = await airdropInstance.connect(deployer).sendBatch();
        let res2 = await tx2.wait();
        
        for(i=0; i < winnerAccounts.length; i++){
            console.log(`${winnerAccounts[i]} : PRE Balance :`, preWinnerBal[i])
            console.log(`${winnerAccounts[i]} : POST Balance :`, await bepUsdtInstance.balanceOf(winnerAccounts[i]))

            expect(await bepUsdtInstance.balanceOf(winnerAccounts[i])).to.equal(preWinnerBal[i].add(airdropAmount))
        }
        console.log("contract balance after airdrop", await bepUsdtInstance.balanceOf(airdropAddress));
    }); 

    it("Withdraw excess USDT after airdrop", async function () {
        const { airdropAddress, deployer, airdropInstance, bepUsdtInstance } = await loadFixture(deployContracts);
        console.log("airdropAddress::::", airdropAddress);
        console.log("airdrop deployer address::::", deployer.address);

        const totalAirdropToDeposit = ethers.utils.parseUnits("700", await bepUsdtInstance.decimals()); 
        const airdropAmount = ethers.utils.parseUnits("50", await bepUsdtInstance.decimals()); 
        console.log("airdropAmount*********", airdropAmount)

        let tx = await airdropInstance.connect(deployer).setAddressesToAirdrop(winnerAccounts, { gasLimit: 30000000 });
        let res = await tx.wait();


        const preDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress)
        await bepUsdtInstance.connect(deployer).approve(airdropAddress, totalAirdropToDeposit);
        let tx1 = await airdropInstance.connect(deployer).depositERC20(totalAirdropToDeposit, { gasLimit: 30000000 });
        let res1 = await tx1.wait();
        const postDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress);

        expect(postDepositContractBal).to.equal(preDepositContractBal + totalAirdropToDeposit);

        const preWinnerBal = [];
        for(i=0; i < winnerAccounts.length; i++) {
            // console.log(`${winnerAccounts[i]} : PRE Balance :`, await bepUsdtInstance.balanceOf(winnerAccounts[i]) )
            preWinnerBal.push(await bepUsdtInstance.balanceOf(winnerAccounts[i]));
        }        
        let tx2 = await airdropInstance.connect(deployer).sendBatch();
        let res2 = await tx2.wait();

        for(i=0; i < winnerAccounts.length; i++){
            console.log(`${winnerAccounts[i]} : PRE Balance :`, preWinnerBal[i])
            console.log(`${winnerAccounts[i]} : POST Balance :`, await bepUsdtInstance.balanceOf(winnerAccounts[i]))

            expect(await bepUsdtInstance.balanceOf(winnerAccounts[i])).to.equal(preWinnerBal[i].add(airdropAmount))
        }
        const deployerBalancebeforeWithdrawAll =  await bepUsdtInstance.balanceOf(deployer.address)
        console.log("before withdrawal deployerBalancebeforeWithdrawAll", deployerBalancebeforeWithdrawAll);
        const remainingAirdropContractBal =  await bepUsdtInstance.balanceOf(airdropAddress)
        console.log("contract balance after airdrop | before withdraw all", remainingAirdropContractBal);

        const preWithdrawAllAdminBal = await bepUsdtInstance.balanceOf(deployer.address);
        let tx3 = await airdropInstance.connect(deployer).withdrawAllERC20(usdtAddress, {gasLimit : 30000000});
        expect(await bepUsdtInstance.balanceOf(airdropAddress)).to.equal(0);
        expect(await bepUsdtInstance.balanceOf(deployer.address)).to.equal(preWithdrawAllAdminBal.add(remainingAirdropContractBal));

        const deployerBalanceAfterWithdrawAll =  await bepUsdtInstance.balanceOf(deployer.address)
        console.log("after withdrawal deployerBalanceAfterWithdrawAll", deployerBalanceAfterWithdrawAll);
        const remainingAirdropContractBalafterWithdrawAll =  await bepUsdtInstance.balanceOf(airdropAddress)
        console.log("after withdrawal remainingAirdropContractBal", remainingAirdropContractBalafterWithdrawAll);
    });

    it("Airdrop Fail if Deposited USDT is less than enough", async function () {
        const { airdropAddress, deployer, airdropInstance, bepUsdtInstance } = await loadFixture(deployContracts);

        console.log("airdropAddress::::", airdropAddress);
        console.log("airdrop deployer address::::", deployer.address);

        const totalAirdropToDeposit = ethers.utils.parseUnits("600", await bepUsdtInstance.decimals()); 
        const airdropAmount = ethers.utils.parseUnits("50", await bepUsdtInstance.decimals()); 
        console.log("airdropAmount*********", airdropAmount)

        let tx = await airdropInstance.connect(deployer).setAddressesToAirdrop(winnerAccounts, { gasLimit: 30000000 });
        let res = await tx.wait();

        const preDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress)
        await bepUsdtInstance.connect(deployer).approve(airdropAddress, totalAirdropToDeposit);
        let tx1 = await airdropInstance.connect(deployer).depositERC20(totalAirdropToDeposit, { gasLimit: 30000000 });
        let res1 = await tx1.wait();
        const postDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress);

        expect(postDepositContractBal).to.equal(preDepositContractBal + totalAirdropToDeposit);
        await expect( airdropInstance.connect(deployer).sendBatch( { gasLimit: 30000000 }))
            .to.be.revertedWith("Insufficient Balance for airdrop in contract");

        console.log("contract balance after airdrop", await bepUsdtInstance.balanceOf(airdropAddress));
    });

    it("Fail Withdraw excess USDT after airdrop, if not autorised", async function () {
        const { airdropAddress, deployer,  airdropInstance, bepUsdtInstance } = await loadFixture(deployContracts);

        const account = await ethers.getSigners();
        const account2 = account[2];
        console.log("airdropAddress::::", airdropAddress);
        console.log("airdrop deployer address::::", deployer.address);

        const totalAirdropToDeposit = ethers.utils.parseUnits("700", await bepUsdtInstance.decimals()); 
        const airdropAmount = ethers.utils.parseUnits("50", await bepUsdtInstance.decimals()); 
        console.log("airdropAmount*********", airdropAmount)

        let tx = await airdropInstance.connect(deployer).setAddressesToAirdrop(winnerAccounts, { gasLimit: 30000000 });
        let res = await tx.wait();

        const preDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress)
        await bepUsdtInstance.connect(deployer).approve(airdropAddress, totalAirdropToDeposit);
        let tx1 = await airdropInstance.connect(deployer).depositERC20(totalAirdropToDeposit, { gasLimit: 30000000 });
        let res1 = await tx1.wait();
        const postDepositContractBal = await bepUsdtInstance.balanceOf(airdropAddress);

        expect(postDepositContractBal).to.equal(preDepositContractBal + totalAirdropToDeposit);

        const preWinnerBal = [];
        for(i=0; i < winnerAccounts.length; i++) {
            // console.log(`${winnerAccounts[i]} : PRE Balance :`, await bepUsdtInstance.balanceOf(winnerAccounts[i]) )
            preWinnerBal.push(await bepUsdtInstance.balanceOf(winnerAccounts[i]));
        }
       
        await expect(airdropInstance.connect(account2).sendBatch( { gasLimit: 30000000 }))
          .to.be.revertedWith("ERROR: Not authorized");
    });    

  }); 
});
