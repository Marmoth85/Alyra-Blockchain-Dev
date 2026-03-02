import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "localhost",
});

async function main(): Promise<void> {
    const [voter1, voter2] = await ethers.getSigners();
    console.log("connection en cours");
    const Voting = await ethers.getContractAt("Voting", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    const tx1 = await Voting.addVoter(voter2.address);
    await tx1.wait();

    const tx2 = await Voting.startProposalsRegistering();
    await tx2.wait();

    const tx3 = await Voting.connect(voter1).addProposal("Proposition 1");
    await tx3.wait();

    const tx4 = await Voting.connect(voter2).addProposal("Proposition 2");
    await tx4.wait();

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

