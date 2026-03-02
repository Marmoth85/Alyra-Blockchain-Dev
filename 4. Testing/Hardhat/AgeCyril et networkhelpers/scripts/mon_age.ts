import { network } from "hardhat";

const { ethers } = await network.connect({
    network: "sepolia",
});

async function main(): Promise<void> {
    const age = await ethers.provider.getStorage("0x96884AD36c89DAc00a4dd63060D238C723a0ab3B", 0);
    // 0x20 = 2 × 16 + 0 = 32  
    console.log(`mon age est de : ${age}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});