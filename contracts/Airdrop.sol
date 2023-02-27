// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

// import "hardhat/console.sol";

interface IERC20 {
    function totalSupply() external view returns (uint);

    function balanceOf(address account) external view returns (uint);

    function transfer(address recipient, uint256 amount) external;

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external;

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}


contract Airdrop  {

  // This declares a state variable that would store the contract address
  address tokenAddress;
  address admin;
  uint256 airDropAmount;
  address[] recipients;

  /*
    constructor function to set token address
   */
  constructor(address _tokenAddress, address _admin, uint256 _airdropAmount)  {
    tokenAddress = _tokenAddress;
    admin = _admin;
    airDropAmount = _airdropAmount;
  }

// Setter function for the airdrop token and airdrop amount.
  function changeAirdropDetails(address _tokenAddress, uint256 _airdropAmount) auth external returns (bool){
    tokenAddress = _tokenAddress;
    airDropAmount = _airdropAmount;
    return true;
  }

// depositing erc20 token to the contract.
  function depositERC20(uint256 _amount) auth external returns (bool) {
    IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
    return true;
  }

// withdraw all function for the given er20 token
  function withdrawAllERC20(address _tokenAddress) auth external returns (bool){
    uint256 totalAmount = IERC20(_tokenAddress).balanceOf(address(this));
    require(totalAmount > 0, "Contract balance is zero.");
    IERC20(_tokenAddress).transfer(admin, totalAmount); 
    return true;

  } 

  function setAddressesToAirdrop(address[] memory _recipients) auth external returns (bool){
    recipients  = _recipients;
    return true;
  }

  /*
    Airdrop function which take up a array of address.
   */
   function sendBatch() auth external returns (bool) {
         uint256 totalAmount = IERC20(tokenAddress).balanceOf(address(this));

         require(totalAmount >=  recipients.length * airDropAmount, "Insufficient Balance for airdrop in contract");
         for (uint i = 0; i < recipients.length; i++) {
             IERC20(tokenAddress).transfer(recipients[i], airDropAmount);
         }
         return true;
   }



        // modifier nonReentrant() {
        //       require(isReentrant == false, "ERROR: Re-entrant");
        //       isReentrant = true;
        //       _;
        //       isReentrant = false;
        //   }

    modifier auth() {
        require(msg.sender == admin, "ERROR: Not authorized");
        _;
    }

    fallback() external {}


}
