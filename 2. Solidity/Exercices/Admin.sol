// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Admin is Ownable {

    mapping (address => bool) public _whitelist;
    mapping (address => bool) public _blacklist;

    address adminAddress;

    event Whitelisted(address _address);
    event Blacklisted(address _address);

    constructor() Ownable(msg.sender) {
        _whitelist[msg.sender] = true;
        adminAddress = msg.sender;
    }

    modifier checkNullAddress(address _address) {
        require(_address != address(0), "You can't do that in a null address");
        _;
    }

    modifier checkAdminAddress(address _address) {
        require(_address != adminAddress, "You can't do that in the admin address");
        _;
    }

    modifier checkWhitelistedAddress(address _address) {
        require(!_whitelist[_address], "This address is already whitelisted");
        _;
    }

    modifier checkBlacklistedAddress(address _address) {
        require(!_blacklist[_address], "This address is already blacklisted");
        _;
    }

    function whitelist(address _address) public onlyOwner checkNullAddress(_address) checkWhitelistedAddress(_address) checkBlacklistedAddress(_address) {
        _whitelist[_address] = true;
        emit Whitelisted(_address);
    }

    function blacklist(address _address) public onlyOwner checkAdminAddress(_address) checkBlacklistedAddress(_address) {
        _blacklist[_address] = true;
        _whitelist[_address] = false;
        emit Blacklisted(_address);
    }

    function isWhitelisted(address _address) public view returns(bool) {
        return _whitelist[_address];
    }

    function isBlacklisted(address _address) public view returns(bool) {
        return _blacklist[_address];
    }

}