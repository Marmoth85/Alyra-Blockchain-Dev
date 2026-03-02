// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

contract ERC20Alyra is ERC20 {
    
    constructor(uint _initSupply) ERC20("Alyra", "ALY") {
        _mint(msg.sender, _initSupply);
    }

}