// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

contract Storage {
    uint256  number;

    function set(uint256 num) public {
        number=num;
    }

    function get() public view returns (uint256){
        return number;
    }
}

contract CallStorage {

    Storage stockage;

    constructor(address _stockage) {
        stockage = Storage(_stockage);
    }

    function callGet() public view returns (uint256){
        return stockage.get();
    }

    function callSet(uint256 num) public {
        stockage.set(num);
    }
}