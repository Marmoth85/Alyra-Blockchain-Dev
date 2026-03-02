import { expect, assert } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

const getTimestampInSeconds = () => {
    return Math.floor(Date.now() / 1000);
}

describe("Bank", function () {

    async function deployBank() {
        const [owner, account2, account3, account4] = await ethers.getSigners();
        const Bank = await ethers.deployContract('Bank');
        return { Bank, owner, account2, account3 }
    }

    async function deployAndDepositBank() {
        const [owner, account2, account3] = await ethers.getSigners();
        const Bank = await ethers.deployContract('Bank');
        const amount = ethers.parseEther('1.2');
        await Bank.deposit({ value: amount });
        return { Bank, owner, account2, account3 }
    }

    describe('Deployment', function() {
        it('Should deploy the smart contract', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployBank);
            const balanceOfOwner = await Bank.getBalanceOfUser(owner.address);
            assert(balanceOfOwner === 0n);
        })
    })

    describe('Deposit', function() {
        it('Should not be possible to deposit 0 wei', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployBank);
            const amount = 0;
            await expect(Bank.deposit({ value: amount })).to.be.revertedWithCustomError(Bank, 'CannotBeZero');
        })

        it('Should update the balance of the user', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployBank);
            const balanceOfUserBefore = await Bank.getBalanceOfUser(owner.address);
            const amount = ethers.parseEther('1.2');
            await expect(Bank.deposit({ value: amount })).to.emit(
                Bank,
                'etherDeposited'
            ).withArgs(
                owner.address,
                amount
            );
            const balanceOfUserAfter = await Bank.getBalanceOfUser(owner.address);
            assert(balanceOfUserBefore === 0n);
            assert(balanceOfUserAfter === amount);
        })

        it('Should get the last Deposit timestamp', async function() {
            const timestampBeforeDeposit = getTimestampInSeconds();
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployAndDepositBank);
            const timestampLastDeposit = await Bank.getLastDepositTimestamp(owner.address);
            expect(Number(timestampLastDeposit)).to.be.closeTo(timestampBeforeDeposit, 5);
        })
    })

    describe('Withdraw', function() {
        it('Should not be possible to withdraw 0 wei', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployAndDepositBank);
            const amount = 0;
            await expect(Bank.withdraw(amount)).to.be.revertedWithCustomError(
                Bank,
                'CannotBeZero'
            )
        })

        it('Should not be possible to withdraw more than what has been deposited', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployAndDepositBank);
            const amount = ethers.parseEther('1.2000000000001');
            await expect(Bank.withdraw(amount)).to.be.revertedWithCustomError(
                Bank,
                'NotEnoughFunds'
            )
        })

        it('Should withdraw if we try to withdraw less that what has been deposited', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployAndDepositBank);
            const balanceOfUserBefore = await Bank.getBalanceOfUser(owner.address);
            const amount = ethers.parseEther('0.8');
            await expect(Bank.withdraw(amount)).to.emit(
                Bank,
                'etherWithdrawn'
            ).withArgs(
                owner.address,
                amount
            )
            const balanceOfUserAfter = await Bank.getBalanceOfUser(owner.address);
            assert(balanceOfUserBefore === ethers.parseEther('1.2'));
            assert(balanceOfUserAfter === ethers.parseEther('0.4'));
        })

        it('Should withdraw if we try to withdraw what has been deposited', async function() {
            const { Bank, owner, account2, account3 } = await networkHelpers.loadFixture(deployAndDepositBank);
            const balanceOfUserBefore = await Bank.getBalanceOfUser(owner.address);
            const amount = ethers.parseEther('1.2');
            await expect(Bank.withdraw(amount)).to.emit(
                Bank,
                'etherWithdrawn'
            ).withArgs(
                owner.address,
                amount
            )
            const balanceOfUserAfter = await Bank.getBalanceOfUser(owner.address);
            assert(balanceOfUserBefore === ethers.parseEther('1.2'));
            assert(balanceOfUserAfter === ethers.parseEther('0'));
        })
    })

});