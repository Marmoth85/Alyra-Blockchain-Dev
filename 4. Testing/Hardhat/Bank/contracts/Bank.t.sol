// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Bank} from "./Bank.sol";
import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

/// ----------------------
/// Test TransferFailed
/// ----------------------
contract RevertingReceiver {
    receive() external payable {
        revert("I refuse Ether");
    }
}

contract BankTest is Test {
    address owner = makeAddr("user0");
    address addr1 = makeAddr("addr1");
    address addr2 = makeAddr("addr2");

    Bank bank;

    uint256 constant DEPOSIT_AMOUNT = 1.2 ether;

    event etherDeposited(address indexed account, uint256 amount);
    event etherWithdrawn(address indexed account, uint256 amount);

    function setUp() public {
        bank = new Bank();
    }

    /// ----------------------
    /// Deployment
    /// ----------------------
    function test_InitialValue() public view {
        uint256 balanceOfOwner = bank.getBalanceOfUser(owner);
        assertEq(balanceOfOwner, 0);
    }

    /// ----------------------
    /// Deposit
    /// ----------------------
    function test_Deposit_RevertWhen_CannotBeZero() public {
        vm.prank(addr1);
        vm.deal(addr1, 2 ether);
        bytes4 selector = bytes4(keccak256("CannotBeZero()"));
        vm.expectRevert(abi.encodeWithSelector(selector));
        bank.deposit{value: 0 ether}();
    }

    function test_DepositUpdatesBalance() public {
        uint256 balanceOfUserBefore = bank.getBalanceOfUser(owner);
        assertEq(balanceOfUserBefore, 0);

        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        uint256 balanceAfter = bank.getBalanceOfUser(owner);
        assertEq(balanceAfter, DEPOSIT_AMOUNT);
    }

    function test_DepositEmitEvent() public {
        vm.expectEmit(true, true, false, true);
        emit etherDeposited(owner, DEPOSIT_AMOUNT);

        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();
    }

    function testLastDepositTimestamp() public {
        uint256 timestampBefore = block.timestamp;
        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        uint256 lastDeposit = bank.getLastDepositTimestamp(owner);
        // On accepte une différence jusqu'à 5 secondes
        assertTrue(
            lastDeposit >= timestampBefore && lastDeposit <= timestampBefore + 5
        );
    }

    /// ----------------------
    /// Withdraw
    /// ----------------------
    function testCannotWithdrawZero() public {
        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        vm.prank(owner);
        bytes4 selector = bytes4(keccak256("CannotBeZero()"));
        vm.expectRevert(abi.encodeWithSelector(selector));
        bank.withdraw(0);
    }

    function testCannotWithdrawMoreThanBalance() public {
        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        vm.prank(owner);
        bytes4 selector = bytes4(keccak256("NotEnoughFunds()"));
        vm.expectRevert(abi.encodeWithSelector(selector));
        bank.withdraw(DEPOSIT_AMOUNT + 1); // 1 wei de trop
    }

    function testWithdrawPartial() public {
        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        uint256 balanceBefore = bank.getBalanceOfUser(owner);
        assertEq(balanceBefore, DEPOSIT_AMOUNT);

        uint256 withdrawAmount = 0.8 ether;

        vm.expectEmit(true, true, false, true);
        emit etherWithdrawn(owner, withdrawAmount);

        vm.prank(owner);
        bank.withdraw(withdrawAmount);

        uint256 balanceAfter = bank.getBalanceOfUser(owner);
        assertEq(balanceAfter, DEPOSIT_AMOUNT - withdrawAmount);
    }

    function testWithdrawFull() public {
        vm.prank(owner);
        vm.deal(owner, 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        uint256 balanceBefore = bank.getBalanceOfUser(owner);
        assertEq(balanceBefore, DEPOSIT_AMOUNT);

        vm.expectEmit(true, true, false, true); // indexed account, data amount
        emit etherWithdrawn(owner, DEPOSIT_AMOUNT);

        vm.prank(owner);
        bank.withdraw(DEPOSIT_AMOUNT);

        uint256 balanceAfter = bank.getBalanceOfUser(owner);
        assertEq(balanceAfter, 0);
    }

    function testWithdrawRevertWhenTransferFails() public {
        RevertingReceiver badReceiver = new RevertingReceiver();

        vm.prank(address(badReceiver));
        vm.deal(address(badReceiver), 2 ether);
        bank.deposit{value: DEPOSIT_AMOUNT}();

        vm.prank(address(badReceiver));
        bytes4 selector = bytes4(keccak256("TransferFailed()"));
        vm.expectRevert(abi.encodeWithSelector(selector));
        bank.withdraw(DEPOSIT_AMOUNT);
    }

    /// ----------------------
    /// Fuzzing tests
    /// ----------------------
    // Fuzz deposit: montant aléatoire >0 et <= 5 ETH met à jour le solde
    function testFuzz_DepositUpdatesBalance(uint256 amt) public {
        vm.assume(amt > 0 && amt <= 5 ether);
        vm.deal(owner, amt);
        vm.prank(owner);
        bank.deposit{value: amt}();
        assertEq(bank.getBalanceOfUser(owner), amt);
    }

    // Fuzz withdraw: deposit aléatoire >0 <=5 ether, withdraw aléatoire >0 && <= deposit
    // vérifie solde après et event emitted
    function testFuzz_WithdrawWithinBalance(
        uint256 depositAmt,
        uint256 withdrawAmt
    ) public {
        vm.assume(depositAmt > 0 && depositAmt <= 5 ether);
        vm.assume(withdrawAmt > 0 && withdrawAmt <= depositAmt);

        vm.deal(owner, depositAmt);
        vm.prank(owner);
        bank.deposit{value: depositAmt}();

        vm.expectEmit(true, true, false, true);
        emit etherWithdrawn(owner, withdrawAmt);

        vm.prank(owner);
        bank.withdraw(withdrawAmt);

        assertEq(bank.getBalanceOfUser(owner), depositAmt - withdrawAmt);
    }

    // Fuzz withdraw revert when too much: deposit >0 <=5eth, withdraw > deposit (<=10eth)
    function testFuzz_WithdrawRevertsWhenTooMuch(
        uint256 depositAmt,
        uint256 withdrawAmt
    ) public {
        vm.assume(depositAmt > 0 && depositAmt <= 5 ether);
        vm.assume(withdrawAmt > depositAmt && withdrawAmt <= 10 ether);

        vm.deal(owner, depositAmt);
        vm.prank(owner);
        bank.deposit{value: depositAmt}();

        vm.prank(owner);
        bytes4 selector = bytes4(keccak256("NotEnoughFunds()"));
        vm.expectRevert(abi.encodeWithSelector(selector));
        bank.withdraw(withdrawAmt);
    }

    // Fuzz withdraw zero should revert (test targeted)
    function testFuzz_WithdrawZeroReverts(uint256 depositAmt) public {
        vm.assume(depositAmt > 0 && depositAmt <= 5 ether);

        vm.deal(owner, depositAmt);
        vm.prank(owner);
        bank.deposit{value: depositAmt}();

        vm.prank(owner);
        bytes4 selector = bytes4(keccak256("CannotBeZero()"));
        vm.expectRevert(abi.encodeWithSelector(selector));
        bank.withdraw(0);
    }
}