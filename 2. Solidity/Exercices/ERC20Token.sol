// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

import "./Token.sol";

contract Crowdsale {

    Token public token;
    uint public rate = 200;

    constructor(uint supply) {
        token = new Token(supply);
    }

    receive() external payable {
        require(msg.value > 0.1 ether, "The ether amount must be greater than 0.1");
        distribute(msg.value);
    }

    function distribute(uint amount) private {
        uint amountOfTokenToSend = rate * amount;
        token.transfer(msg.sender, amountOfTokenToSend);
    }
}