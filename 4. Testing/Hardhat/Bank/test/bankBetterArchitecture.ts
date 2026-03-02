import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

const getTimestampInSeconds = () => Math.floor(Date.now() / 1000);
const DEPOSIT_AMOUNT = ethers.parseEther('1.2');

describe("Bank", function () {

    async function deployBank() {
        const [owner, account2, account3] = await ethers.getSigners();
        const Bank = await ethers.deployContract('Bank');
        return { Bank, owner, account2, account3 };
    }

    async function deployAndDepositBank() {
        const [owner, account2, account3] = await ethers.getSigners();
        const Bank = await ethers.deployContract('Bank');
        await Bank.deposit({ value: DEPOSIT_AMOUNT });
        return { Bank, owner, account2, account3 };
    }

    describe('Deployment', function() {
        it('Should deploy the smart contract', async function() {
            const { Bank, owner } = await networkHelpers.loadFixture(deployBank);
            const balanceOfOwner = await Bank.getBalanceOfUser(owner.address);
            expect(balanceOfOwner).to.equal(0n);
        });
    });

    describe('Deposit', function() {
        it('Should not be possible to deposit 0 wei', async function() {
            const { Bank } = await networkHelpers.loadFixture(deployBank);
            await expect(Bank.deposit({ value: 0 }))
                .to.be.revertedWithCustomError(Bank, 'CannotBeZero');
        });

        it('Should update the balance of the user and the contract', async function() {
            const { Bank, owner } = await networkHelpers.loadFixture(deployBank);

            const balanceOfUserBefore = await Bank.getBalanceOfUser(owner.address);
            expect(balanceOfUserBefore).to.equal(0n);

            await expect(Bank.deposit({ value: DEPOSIT_AMOUNT }))
                .to.emit(Bank, 'etherDeposited')
                .withArgs(owner.address, DEPOSIT_AMOUNT);

            const balanceOfUserAfter = await Bank.getBalanceOfUser(owner.address);
            expect(balanceOfUserAfter).to.equal(DEPOSIT_AMOUNT);

            const contractBalance = await ethers.provider.getBalance(Bank.target);
            expect(contractBalance).to.equal(DEPOSIT_AMOUNT);
        });

        it('Should get the last deposit timestamp (±5 sec)', async function() {
            const timestampBeforeDeposit = getTimestampInSeconds();
            const { Bank, owner } = await networkHelpers.loadFixture(deployAndDepositBank);

            const timestampLastDeposit = await Bank.getLastDepositTimestamp(owner.address);
            expect(Number(timestampLastDeposit)).to.be.closeTo(timestampBeforeDeposit, 5);
        });
    });

    describe('Withdraw', function() {
        let Bank: any, owner: any, account2: any, account3: any;

        beforeEach(async function() {
            ({ Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployAndDepositBank));
        });

        it('Should not be possible to withdraw 0 wei', async function() {
            await expect(Bank.withdraw(0))
                .to.be.revertedWithCustomError(Bank, 'CannotBeZero');
        });

        it('Should not be possible to withdraw more than deposited', async function() {
            const tooMuch = ethers.parseEther('1.2000000000001');
            await expect(Bank.withdraw(tooMuch))
                .to.be.revertedWithCustomError(Bank, 'NotEnoughFunds');
        });

        it('Should withdraw part of the deposited amount', async function() {
            const balanceBefore = await Bank.getBalanceOfUser(owner.address);
            expect(balanceBefore).to.equal(DEPOSIT_AMOUNT);

            const withdrawAmount = ethers.parseEther('0.8');
            await expect(Bank.withdraw(withdrawAmount))
                .to.emit(Bank, 'etherWithdrawn')
                .withArgs(owner.address, withdrawAmount);

            const balanceAfter = await Bank.getBalanceOfUser(owner.address);
            expect(balanceAfter).to.equal(DEPOSIT_AMOUNT - withdrawAmount);

            const contractBalance = await ethers.provider.getBalance(Bank.target);
            expect(contractBalance).to.equal(DEPOSIT_AMOUNT - withdrawAmount);
        });

        it('Should withdraw the full deposited amount', async function() {
            const balanceBefore = await Bank.getBalanceOfUser(owner.address);
            expect(balanceBefore).to.equal(DEPOSIT_AMOUNT);

            await expect(Bank.withdraw(DEPOSIT_AMOUNT))
                .to.emit(Bank, 'etherWithdrawn')
                .withArgs(owner.address, DEPOSIT_AMOUNT);

            const balanceAfter = await Bank.getBalanceOfUser(owner.address);
            expect(balanceAfter).to.equal(0n);

            const contractBalance = await ethers.provider.getBalance(Bank.target);
            expect(contractBalance).to.equal(0n);
        });
    });
});