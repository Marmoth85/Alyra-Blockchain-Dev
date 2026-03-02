import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

async function deployVoting() {
    const voting = await ethers.deployContract('Voting');
    const [owner, account2, account3] = await ethers.getSigners();
    return { voting, owner, account2, account3 };
}

describe("Voting tests", function () {

    describe('Deployment test', function() {
        it('Should deploy the smart contract', async function() {
            const { voting } = await networkHelpers.loadFixture(deployVoting);
            expect(await voting.winningProposalID()).to.equal(0n);
            // je ne teste pas les autres variables d'état car si celle-ci est bien initialisée, le contrat est déployé et donc les autres le sont aussi.
        });
    });

    describe('Registration tests', function() {
        it('Should emit event when registering a voter', async function() {
            const { voting, owner, account2} = await networkHelpers.loadFixture(deployVoting);
            await expect(voting.connect(owner).addVoter(account2.address))
                .to.emit(voting, 'VoterRegistered')
                .withArgs(account2.address);
        });
        
        it('Should revert event when trying to register a voter without being owner', async function() {
            const { voting, account2, account3} = await networkHelpers.loadFixture(deployVoting);
            await expect(voting.connect(account2).addVoter(account3.address))
                .to.be.revertedWithCustomError(voting, 'OwnableUnauthorizedAccount');
        });

        it('Should revert when trying to register a voter after the registration period is over', async function() {
            const { voting, owner, account2} = await networkHelpers.loadFixture(deployVoting);
            await voting.connect(owner).startProposalsRegistering();
            await expect(voting.connect(owner).addVoter(account2.address))
                .to.be.revertedWith('Voters registration is not open yet');
        });

        it('Should revert when trying to register an already registered voter', async function() {
            const { voting, owner, account2} = await networkHelpers.loadFixture(deployVoting);
            await voting.connect(owner).addVoter(account2.address);
            await expect(voting.connect(owner).addVoter(account2.address))
                .to.be.revertedWith('Already registered');
        });

        it('Should have correct information in voter attributes when voter is added', async function() {
            const { voting, owner, account2} = await networkHelpers.loadFixture(deployVoting);
            await voting.connect(owner).addVoter(account2.address);
            const voter = await voting.connect(account2).getVoter(account2.address);
            expect(voter.isRegistered).to.equal(true);
            expect(voter.hasVoted).to.equal(false);
            expect(voter.votedProposalId).to.equal(0n);
        });
    });

});