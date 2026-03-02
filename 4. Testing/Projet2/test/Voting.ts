import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

// Context management fonctions
async function deployVoting() {
    const voting = await ethers.deployContract('Voting');
    const [owner, account2, account3, account4, account5] = await ethers.getSigners();
    return { voting, owner, account2, account3, account4, account5 } ;
}

async function deployVotingWithVoters() {
    const { voting, owner, account2, account3, account4, account5 } = await deployVoting();
    await voting.connect(owner).addVoter(account2.address);
    await voting.connect(owner).addVoter(account3.address);
    await voting.connect(owner).addVoter(account4.address);
    return { voting, owner, account2, account3, account4, account5 };
}

async function deployVotingWithProposals() {
    const { voting, owner, account2, account3, account4, account5 } = await deployVotingWithVoters();
    await voting.connect(owner).startProposalsRegistering();
    
    await voting.connect(account2).addProposal('Proposal 1');
    await voting.connect(account2).addProposal('Proposal 2');
    await voting.connect(account3).addProposal('Proposal 3');

    await voting.connect(owner).endProposalsRegistering();
    return { voting, owner, account2, account3, account4, account5 };
}


// TESTS
describe("Voting tests", function () {

    describe('Deployment test', function() {
        it('Should deploy the smart contract', async function() {
            const { voting } = await networkHelpers.loadFixture(deployVoting);
            expect(await voting.winningProposalID()).to.equal(0n);
            // No need to check the value of the other variables. If this one is correct, then the smart contract is deployed.
        });
    });

    describe('Registration tests', function() {

        let voting: any;
        let owner: any;
        let account2: any;
        let account3: any;

        this.beforeEach(async () => {
            ({voting, owner, account2, account3} = await networkHelpers.loadFixture(deployVoting));
        });

        it('Should emit event when registering a voter', async function() {
            await expect(voting.connect(owner).addVoter(account2.address))
                .to.emit(voting, 'VoterRegistered').withArgs(account2.address);
        });
        
        it('Should revert event when trying to register a voter without being owner', async function() {
            await expect(voting.connect(account2).addVoter(account3.address))
                .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount');
        });

        it('Should revert when trying to register a voter after the registration period is over', async function() {
            await voting.connect(owner).startProposalsRegistering();
            await expect(voting.connect(owner).addVoter(account2.address))
                .to.be.revertedWith('Voters registration is not open yet');
        });

        it('Should revert when trying to register an already registered voter', async function() {
            await voting.connect(owner).addVoter(account2.address);
            await expect(voting.connect(owner).addVoter(account2.address))
                .to.be.revertedWith('Already registered');
        });

        it('Should have correct information in voter attributes when voter is added', async function() {
            await voting.connect(owner).addVoter(account2.address);
            const voter = await voting.connect(account2).getVoter(account2.address);
            expect(voter.isRegistered).to.equal(true);
        });

        it('Should have correct information in voter attributes when voter is not added', async function() {
            await voting.connect(owner).addVoter(account2.address);
            const voter = await voting.connect(account2).getVoter(account3.address);
            expect(voter.isRegistered).to.equal(false);
        });
    });


    describe('Proposal tests', async function() {
        let voting: any;
        let owner: any;
        let account2: any; // is a voter
        let account5: any; // is not a voter

        this.beforeEach(async () => {
            ({voting, owner, account2, account5} = await networkHelpers.loadFixture(deployVotingWithVoters));
        });

        it('Should not add proposal if the sender is not a registered voter', async function() {
            // we should fail before to check the workflow status, so there is no need to set it to the right one
            await expect(voting.connect(account5).addProposal('Proposal 1'))
                .to.be.revertedWith("You're not a voter");
        });

        it('Should not add proposal if the proposal registration period is not opened', async function() {
            await expect(voting.connect(account2).addProposal('Proposal 1'))
                .to.be.revertedWith('Proposals are not allowed yet');
        });

        it('Should not add proposal if the description is empty', async function() {
            await voting.connect(owner).startProposalsRegistering();
            await expect(voting.connect(account2).addProposal(''))
                .to.be.revertedWith('Vous ne pouvez pas ne rien proposer');
        });

        it('Proposal is correctly saved after being added', async function() {
            await voting.connect(owner).startProposalsRegistering();
            await voting.connect(account2).addProposal('Proposal 1');
            const proposal = await voting.connect(account2).getOneProposal(1n); // genesis in 0 achtung!
            expect(proposal.description).to.equal('Proposal 1');
        });

        it('Should add proposal and emit event', async function() {
            await voting.connect(owner).startProposalsRegistering();
            await expect(voting.connect(account2).addProposal('Proposal 1'))
                .to.emit(voting, 'ProposalRegistered').withArgs(1n);
        });
    });

    describe('Voting tests', async function() {
        let voting: any;
        let owner: any;
        let account2: any; // is a voter
        let account3: any; // is a voter
        let account5: any; // is not a voter

        this.beforeEach(async () => {
            ({voting, owner, account2, account3, account5} = await networkHelpers.loadFixture(deployVotingWithProposals));
        });

        it('Should not vote if the sender is not a registered voter', async function() {
            // we should fail before to check the workflow status, so there is no need to set it to the right one
            await expect(voting.connect(account5).setVote(1n))
                .to.be.revertedWith("You're not a voter");
        });

        it('Should not add vote if the voting period is not opened', async function() {
            await expect(voting.connect(account2).setVote(1n))
                .to.be.revertedWith('Voting session havent started yet');
        });

        it('Should not vote if user have already voted', async function() {
            await voting.connect(owner).startVotingSession();
            await voting.connect(account2).setVote(1n);
            await expect(voting.connect(account2).setVote(2n))
                .to.be.revertedWith('You have already voted');
        });

        it('Should raised an error if the proposal does not exist', async function() {
            await voting.connect(owner).startVotingSession();
            await expect(voting.connect(account2).setVote(4n))
                .to.be.revertedWith('Proposal not found');
        });

        it('Should save the correct proposal Id for the voter', async function() {
            await voting.connect(owner).startVotingSession();
            await voting.connect(account2).setVote(1n);
            const voter = await voting.connect(account3).getVoter(account2.address);
            expect(voter.votedProposalId).to.equal(1n);
        });

        it('Should save the right boolean hasVoted value for the voter', async function() {
            await voting.connect(owner).startVotingSession();
            await voting.connect(account2).setVote(1n);
            const voter = await voting.connect(account3).getVoter(account2.address);
            expect(voter.hasVoted).to.equal(true);
        });

        it('Should have the right amount of votes for the proposal', async function() {
            await voting.connect(owner).startVotingSession();
            await voting.connect(account2).setVote(1n);
            const proposal = await voting.connect(account3).getOneProposal(1n);
            expect(proposal.voteCount).to.equal(1n);
        });

        it('Should emit Voted event after voting', async function() {
            await voting.connect(owner).startVotingSession();
            await expect(voting.connect(account2).setVote(1n))
                .to.emit(voting, 'Voted').withArgs(account2.address, 1n);
        });
    });

    describe('Tallying votes tests', async function() {
    });

    describe('State management tests', async function() {
    });

    describe('Getters tests', async function() {
    });

    

});