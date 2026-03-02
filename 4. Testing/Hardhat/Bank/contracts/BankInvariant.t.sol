// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Bank} from "./Bank.sol";
import {Test} from "forge-std/Test.sol";

contract BankInvariantTest is Test {
    Bank bank;

    address owner = makeAddr("user0");
    address addr1 = makeAddr("user1");
    address addr2 = makeAddr("user2");

    // On met une limite dans les opérations aléatoires
    uint256 constant MAX_OP_AMOUNT = 2 ether;

    function setUp() public {
        bank = new Bank();
    }

    /// Ici on veut exécuter 'steps' opérations pseudo-aléatoires déterminées par 'seed'
    /// Après chaque opération, on vérifie que address(bank).balance == sum(balances known actors)
    function testInvariant_RandomizedSequence(uint256 seed) public {
        // évite les seeds triviaux
        vm.assume(seed != 0);

        address[3] memory actors = [owner, addr1, addr2];
        uint256 steps = 60; // nombre d'opérations par run; augmente si tu veux plus de couverture

        for (uint256 i = 0; i < steps; i++) {
            // nombre pseudo random à partir du seed + index
            uint256 rnd = uint256(
                keccak256(abi.encodePacked(seed, i, block.timestamp))
            );

            // on choisit une opération : 0=deposit, 1=withdraw, 2=depositZeroAttempt, 3=withdrawTooMuchAttempt
            uint8 op = uint8(rnd % 4);
            // on choisit un acteur au hasard
            address actor = actors[rnd % actors.length];

            if (op == 0) {
                // deposit d'un montant non nul
                uint256 amt = bound(rnd, 1 wei, MAX_OP_AMOUNT); //bound a de meilleures performances que 'assume' dans certains scénarios
                vm.deal(actor, amt);
                vm.prank(actor);
                bank.deposit{value: amt}();
            } else if (op == 1) {
                // withdraw d'un montant ≤ solde courant (si solde>0)
                uint256 bal = bank.getBalanceOfUser(actor);
                if (bal == 0) {
                    // rien à retirer, on saute l'opération
                    continue;
                }
                // choisis un montant aléatoire entre 1 et bal
                uint256 rnd2 = uint256(
                    keccak256(abi.encodePacked(seed, i, rnd))
                );
                uint256 withdrawAmt = bound(rnd2, 1 wei, bal);
                vm.prank(actor);
                bank.withdraw(withdrawAmt);
            } else if (op == 2) {
                // tentative de deposit à zéro -> doit revert CannotBeZero()
                vm.prank(actor);
                bytes4 sel = bytes4(keccak256("CannotBeZero()"));
                vm.expectRevert(abi.encodeWithSelector(sel));
                bank.deposit{value: 0}();
            } else {
                // tentative de withdrawal > solde -> doit revert NotEnoughFunds()
                uint256 bal = bank.getBalanceOfUser(actor);
                // si bal est déjà très grand, borne le tooMuch pour éviter overflow
                uint256 tooMuch = bal + bound(rnd, 1 wei, MAX_OP_AMOUNT);
                vm.prank(actor);
                bytes4 sel = bytes4(keccak256("NotEnoughFunds()"));
                vm.expectRevert(abi.encodeWithSelector(sel));
                bank.withdraw(tooMuch);
            }

            // ---- invariant check ----
            uint256 sumBalances = bank.getBalanceOfUser(owner) +
                bank.getBalanceOfUser(addr1) +
                bank.getBalanceOfUser(addr2);

            // Dans ton contrat, la seule manière que le contrat reçoive de l'Ether
            // est via deposit(), donc l'égalité doit tenir.
            assertEq(
                address(bank).balance,
                sumBalances,
                "Invariant violated: contract balance != sum of tracked balances"
            );
        }
    }
}