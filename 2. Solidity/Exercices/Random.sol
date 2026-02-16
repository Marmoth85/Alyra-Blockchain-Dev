// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

contract Random {
    uint private nonce;

    function random() public returns(uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce++))) % 100;
    }
}