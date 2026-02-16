// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

error InsufficientBalance();

contract SendEther {
    
    address myAddress;

    modifier minimumEther() {
        require(msg.value > 0, InsufficientBalance());
        _;
    }
    
    function setMyAddress(address _myAddress) external {
        myAddress = _myAddress;
    }
    
    function getBalance() external view returns(uint) {
        return myAddress.balance;
    }
    
    function getBalanceOfAddress(address _myAddress) external view returns(uint) {
        return _myAddress.balance;
    }

    // J'envoie de l'argent (7ETH) via "0xfaf45819"
    function sendViaTransfer(address payable _to) external payable minimumEther {
        // Transfer n'est plus recommandé
        _to.transfer(msg.value);
    }
    
    function sendViaSend(address payable _to) external payable minimumEther {
        // Send n'est pas recommandé
        bool sent = _to.send(msg.value);
        require(sent, "Failed to send Ether");
    }
    
    function sendViaCall(address payable _to) external payable minimumEther {
        // C'est la méthode call() la meilleure selon la documentation
        (bool sent,) = _to.call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    function sendIfEnoughEthers(uint256 _minBalance) external payable minimumEther {
        // option 1
        // require(myAddress.balance > _minBalance, "Not enough funds");
        // option 2
        // if(myAddress.balance <= _minBalance) {
        //     revert InsufficientBalance();
        // }
        // option 3
        require(myAddress.balance > _minBalance, InsufficientBalance());
        (bool sent,) = payable(myAddress).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    receive() external payable {

    }

    fallback() external payable {

    }

    // fundMe() => "0xfa56bc67"
    // sendIfEnoughEthers() => "0xbc4d5691"
}