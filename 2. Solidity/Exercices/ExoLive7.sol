// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

abstract contract Ownable {
    address owner;
    constructor() {
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
}

contract Securise is Ownable {
    uint256 number;
    function setNumber(uint256 _number) external onlyOwner {
        number = _number;
    }
}