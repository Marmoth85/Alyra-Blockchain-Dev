// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AlyraToken is ERC20 {

    uint rate = 100;
    address mechant;

    constructor() ERC20("AlyraToken", "ATN") {
        _mint(msg.sender, 10*10**18);
    }

    function buyToken() payable external {
        uint totaltoken = rate * msg.value;
        _mint(msg.sender, totaltoken);
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        require(to != mechant);
        return super.transfer(to, value);
    }
}