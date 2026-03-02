import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting tests", function () {

    describe('Deployment', function() {
        it('Should deploy the smart contract', async function() {
            const voting = await ethers.deployContract('Voting');
            expect(await voting.winningProposalID()).to.equal(0n);
        });
    });

});