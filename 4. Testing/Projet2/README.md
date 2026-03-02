# Project 2

## Project Overview and Context

The smart contract can be found in the `contracts` directory : it is name `Voting.sol`.
The tests are written in typescript in the `test` directory. The file is `Voting.ts`.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```
Alternatively, when any modification of this repo is pushed on the master branch, the tests are automatically launched by the github CI with a coverage metric.
The CI config file is not in this directory but in the root of the whole github directory. It's just a workaround for this project as no separated github repo have been done properly for this project.

Some tests needed to reach values from the evm storage while those attributes were private. That's why we have edited the hardhat config file in order to know what slot was used by the workflowStatus variable particularly.

### Scope

For each function, we tried to realise the tests in that order :
- accessibility errors with `onlyOwner` or `onlyVoters` requirements
- functional raise of errors with the `require()` occurrences
- check the nominal case, checking the values stored
- check the emitted events and their arguments if they have some

There is one failing test on the `getOneProposal` function because the solidity function doesn't check the array's length before trying to access to the requested value.
If `getOneProposal` was a private function used in other function within the smart contract, it wouldn't be an issue since there is some `require()`-like checks before to call it.
Since this method is an external one, a check of this kind should be added in the smart contract.

There is no check of this kind with the `getVoter()` function, but as `voters` is a mapping, no errors and no crash are raised : we just get a default output. So there is no issue in this scenario.

Some accounts in the testing file (account4 is a voter who didn't voted) were added in the spirit to check all values of all kind in a complete scenario at the end of the tests, but finally it has not been done because it looks more like integration tests rather than unitary tests. That's why they are not really usefull, but the tests remains corrects, so they are not deleted.