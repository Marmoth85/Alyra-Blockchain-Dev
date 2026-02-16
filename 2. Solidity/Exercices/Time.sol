// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

contract Time {
    function getTime() external view returns (uint) {
        return block.timestamp;
    }
}