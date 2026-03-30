
pra
contract LinearBondedCurve {
    mapping(address => uint) public balances;
    uint public totalSupply;
    
    /// @dev Buy token. The price is linear to the total supply.
    function buy() public payable {
        uint tokenToReceive =  (1e18 * msg.value) / (1e18 + totalSupply);
        balances[msg.sender] += tokenToReceive;
        totalSupply += tokenToReceive;
    }
    
    /// @dev Sell token. The price of it is linear to the supply.
    /// @param _amount The amount of tokens to sell.
    function sell(uint _amount) public {
        uint ethToReceive = ((1e18 + totalSupply) * _amount) / 1e18;
        balances[msg.sender] -= _amount;
        totalSupply -= _amount;
        payable(msg.sender).transfer(ethToReceive);
    }
    
    /** @dev Send token.
     *  @param _recipient The recipient.
     *  @param _amount The amount to send.
     */
    function sendToken(address _recipient, uint _amount) public {
        balances[msg.sender]-=_amount;
        balances[_recipient]+=_amount;
    }
    
}