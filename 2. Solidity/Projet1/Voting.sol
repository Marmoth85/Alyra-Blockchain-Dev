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

    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);

    address _adminAddress;
    
    uint public winningProposalId;
    WorkflowStatus public workflowStatus;

    mapping(address => Voter) _whitelist;
    address[] _voterList;
    uint256 _numberOfProposals;
    mapping(uint => Proposal) _proposals;

    
    constructor() Ownable(msg.sender) {
        _whitelist[msg.sender] = Voter(true, false, 0);
        _voterList.push(msg.sender);
        _adminAddress = msg.sender;
    }

    modifier checkAddressAdding(address _address) {
        require(_address != address(0), "Address can't be null");
        require(!_whitelist[_address].isRegistered, "Address is already registered");
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registering voters is not possible anymore.");
        _;
    }

    modifier isWhitelisted() {
        require(_whitelist[msg.sender].isRegistered, "This operation is allowed only for whitelisted address.");
        _;
    }

    function addVoter(address _address) public onlyOwner checkAddressAdding(_address) {
        _whitelist[_address] = Voter(true, false, 0);
        _voterList.push(_address);
        emit VoterRegistered(_address);
    }

    function startProposalsRegistering() public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registering proposals is only authorized just after the voters registration step : you can't rollback a step in the voting process");
        workflowStatus = WorkflowStatus.ProposalsRegistrationsStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationsStarted);
    }

    function addProposal(string memory _proposition) public isWhitelisted {
        string memory errorMessage;
        if (workflowStatus < WorkflowStatus.ProposalsRegistrationsStarted) {
            errorMessage = "The registering proposals session is not yet opened.";
        } else if (workflowStatus > WorkflowStatus.ProposalsRegistrationsStarted) {
            errorMessage = "The registering proposals is already closed.";
        }
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationsStarted, errorMessage);
        require(isProposalExists(_proposition), "You can't add an already existing proposal.");
        _proposals[_numberOfProposals] = Proposal(_proposition, 0);
        _numberOfProposals++;
        emit ProposalRegistered(_numberOfProposals);
    }

    function isProposalExists(string memory _proposition) private view returns(bool) {
        for(uint i = 0; i < _numberOfProposals; i++) {
            if (keccak256(abi.encodePacked(_proposition)) == keccak256(abi.encodePacked(_proposals[i].description))) {
                return true;
            }
        }
        return false;
    }

}