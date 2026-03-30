// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting — A single-round, proposal-based on-chain voting system
/// @author Marmoth85
/// @notice Allows a contract owner to run a structured voting session: register voters,
///         collect proposals, run a vote, and tally results. The leading proposal is
///         tracked in real time during the voting phase, so tallying is O(1).
/// @dev Inherits OpenZeppelin `Ownable`. Workflow transitions are strictly sequential
///      and enforced by `require` guards on `workflowStatus`.
///      Proposals are capped at 100 entries (index 0 is always the GENESIS sentinel)
///      to prevent gas-limit attacks on any future iteration over `proposalsArray`.
contract Voting is Ownable {

    /// @notice ID of the proposal currently leading the vote.
    ///         Updated on every call to `setVote`; equals the final winner after `tallyVotes`.
    /// @dev Defaults to 0 (GENESIS) at deployment. Safe to read at any workflow stage.
    uint public winningProposalID;

    /// @notice Represents a registered participant in the voting session.
    /// @dev Packed into a single 32-byte storage slot:
    ///      `isRegistered` (1 byte) + `hasVoted` (1 byte) + `votedProposalId` (1 byte).
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint8 votedProposalId;
    }

    /// @notice Represents a candidate proposal.
    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @notice Describes the current phase of the voting session.
    /// @dev Transitions are one-way and sequential; no phase can be revisited.
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @notice Current phase of the voting session.
    WorkflowStatus public workflowStatus;

    /// @dev Index 0 is always the GENESIS sentinel added in `startProposalsRegistering`.
    ///      Capped at 100 entries total to bound gas cost.
    Proposal[] private proposalsArray;

    /// @dev Maps voter addresses to their `Voter` struct.
    mapping(address => Voter) private voters;


    /// @notice Emitted when a new voter is registered by the owner.
    /// @param voterAddress Address of the newly registered voter.
    event VoterRegistered(address voterAddress);

    /// @notice Emitted on every workflow phase transition.
    /// @param previousStatus The phase before the transition.
    /// @param newStatus      The phase after the transition.
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    /// @notice Emitted when a new proposal is submitted.
    /// @param proposalId Index of the proposal in `proposalsArray`.
    event ProposalRegistered(uint proposalId);

    /// @notice Emitted when a registered voter casts their vote.
    /// @param voter      Address of the voter.
    /// @param proposalId Index of the proposal they voted for.
    event Voted(address voter, uint proposalId);


    constructor() Ownable(msg.sender) {}


    /// @dev Restricts access to addresses that have been registered as voters.
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }


    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Returns the full `Voter` record for a given address.
    /// @dev Callable by registered voters only; returns a zeroed struct for unknown addresses.
    /// @param _addr Address to look up.
    /// @return The `Voter` struct associated with `_addr`.
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    /// @notice Returns a single proposal by its index.
    /// @dev Reverts with a panic (array out-of-bounds) if `_id` is out of range.
    /// @param _id Index of the proposal in `proposalsArray`.
    /// @return The `Proposal` struct at index `_id`.
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }


    // ::::::::::::: REGISTRATION ::::::::::::: //

    /// @notice Registers a new voter.
    /// @dev Only callable by the owner during the `RegisteringVoters` phase.
    ///      Reverts if the address is already registered.
    /// @param _addr Address to register as a voter.
    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }


    // ::::::::::::: PROPOSAL ::::::::::::: //

    /// @notice Submits a new proposal for consideration.
    /// @dev Only callable by registered voters during `ProposalsRegistrationStarted`.
    ///      Empty descriptions are rejected. Capped at 100 proposals total (including GENESIS)
    ///      to prevent unbounded array growth and gas-limit attacks on tallying.
    /// @param _desc Non-empty text description of the proposal.
    function addProposal(string calldata _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer');
        require(proposalsArray.length < 100, 'Max proposals reached');

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length - 1);
    }


    // ::::::::::::: VOTE ::::::::::::: //

    /// @notice Casts the caller's vote for a given proposal.
    /// @dev Only callable by registered voters during `VotingSessionStarted`.
    ///      Each voter may vote exactly once. `winningProposalID` is updated in O(1)
    ///      after each vote so that `tallyVotes` requires no iteration.
    ///      Using `uint8` for `_id` is safe because proposals are capped at 100 (< 256).
    /// @param _id Index of the proposal to vote for.
    function setVote(uint8 _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(!voters[msg.sender].hasVoted, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found');

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;
        if (proposalsArray[_id].voteCount > proposalsArray[winningProposalID].voteCount) {
            winningProposalID = _id;
        }

        emit Voted(msg.sender, _id);
    }


    // ::::::::::::: STATE ::::::::::::: //

    /// @notice Opens the proposal registration phase and inserts the GENESIS sentinel.
    /// @dev Transitions from `RegisteringVoters` to `ProposalsRegistrationStarted`.
    ///      The GENESIS proposal at index 0 acts as a neutral baseline so that
    ///      `winningProposalID` is never uninitialized during the voting phase.
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        Proposal memory proposal;
        proposal.description = "GENESIS";
        proposalsArray.push(proposal);

        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @notice Closes the proposal registration phase.
    /// @dev Transitions from `ProposalsRegistrationStarted` to `ProposalsRegistrationEnded`.
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @notice Opens the voting session.
    /// @dev Transitions from `ProposalsRegistrationEnded` to `VotingSessionStarted`.
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @notice Closes the voting session.
    /// @dev Transitions from `VotingSessionStarted` to `VotingSessionEnded`.
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /// @notice Finalises the vote and publishes the winning proposal.
    /// @dev Transitions from `VotingSessionEnded` to `VotesTallied`.
    ///      No iteration is needed: `winningProposalID` has been maintained up to date
    ///      throughout the voting phase by `setVote`. In case of a tie, the proposal
    ///      that reached the leading vote count first is retained (first-past-the-post).
    function tallyVotes() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}
