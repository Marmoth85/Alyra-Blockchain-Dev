// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

contract Bank {
    mapping (address => uint) _balances;

    modifier checkAmount(uint _amount) {
        require(_balances[msg.sender] >= _amount, "Balance is too low in order to send this amount of money");
        _;
    }

    modifier checkAddress(address _address) {
        require(_address != address(0), "You can't burn tokens");
        _;
    }

    function deposit(uint _amount) external {
        _balances[msg.sender] += _amount;
    }

    function transfer(address _recipient, uint _amount) external checkAmount(_amount) checkAddress(_recipient) {
        _balances[msg.sender] -= _amount;
        _balances[_recipient] += _amount;
    }

    function balanceOf(address _address) external view returns(uint) {
        return _balances[_address];
    }
}