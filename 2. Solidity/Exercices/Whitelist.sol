// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

contract Whitelist {

    mapping (address => bool) whitelistedUsers;

    event Authorized(address _address);

    constructor() {
        whitelistedUsers[msg.sender] = true;
    }

    modifier check() {
        require(whitelistedUsers[msg.sender], "The address sender is not whitelisted");
        _;
    }

    function authorize(address _address) external check {
        whitelistedUsers[_address] = true;
        emit Authorized(_address);
    }

}