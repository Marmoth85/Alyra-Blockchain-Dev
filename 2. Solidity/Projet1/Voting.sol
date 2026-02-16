// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.33;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus { 
        RegisteringVoters, 
        ProposalsRegistrationsStarted,
        ProposalsRegistrationsEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }
    
    uint public winningProposalId;

    mapping(address => Voter) _whitelist;
    address[] voterList;
    


    constructor() Ownable(msg.sender) {
        _whitelist[msg.sender] = Voter(true, false, 0);
        voterList.push(msg.sender);
    }


    modifier checkAdding(address _address) {
        require(_address != address(0), "Address can't be null");
        require(!_whitelist[_address].isRegistered, "Address is already registered");
        _;
    }

    function addVoter(address _address) public onlyOwner checkAdding(_address) {
        _whitelist[_address] = Voter(true, false, 0);
        voterList.push(_address);
    }
}