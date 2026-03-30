# Project 3 — Backend

## Project Overview and Context

The smart contract can be found in the `contracts` directory : it is name `Voting.sol`.
The tests are written in typescript in the `test` directory. The file is `Voting.ts`.

## Installation

### Prerequisites

- Node.js ≥ 18
- npm

### Install dependencies

```shell
cd backend
npm install
```

> **SSL issues behind a corporate proxy?** Disable strict SSL before installing, then re-enable it afterwards:
> ```shell
> npm config set strict-ssl false
> npm install
> npm config set strict-ssl true
> ```

## Usage

### Local development node

Start a local Hardhat node (keep this terminal open):

```shell
npx hardhat node
```

### Deploy the contract

**Locally (Hardhat):**

```shell
npx hardhat ignition deploy ignition/modules/Voting.ts --network localhost
```

**On Sepolia:**

First, store your credentials securely using the Hardhat keystore (run once):

```shell
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set ETHERSCAN_API_KEY
```

Then deploy:

```shell
npx hardhat ignition deploy ignition/modules/Voting.ts --network sepolia
```

> **SSL issues?** Prefix with `NODE_TLS_REJECT_UNAUTHORIZED=0`.

Deployed addresses are saved automatically under `ignition/deployments/`.

### Verify the contract on Etherscan

```shell
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```

> **SSL issues?** Prefix with `NODE_TLS_REJECT_UNAUTHORIZED=0`.

Known deployed addresses:
- **Sepolia:** `0xc5848F895C9b6c47aBF3BdD24C30b50F9be283F5`
- **Hardhat local:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

To run tests with coverage report:

```shell
npx hardhat test --coverage
```

Alternatively, when any modification of this repo is pushed on the master branch, the tests are automatically launched by the GitHub CI with a coverage metric.
The CI config file is not in this directory but in the root of the whole github directory. It's just a workaround for this project as no separated github repo have been done properly for this project.

Some tests needed to reach values from the evm storage while those attributes were private. That's why we have edited the hardhat config file in order to know what slot was used by the workflowStatus variable particularly.

### Scope

For each function, we tried to realise the tests in that order :
- accessibility errors with `onlyOwner` or `onlyVoters` requirements
- functional raise of errors with the `require()` occurrences
- check the nominal case, checking the values stored
- check the emitted events and their arguments if they have some

The `getOneProposal` function does not check the array length before accessing the requested index, so an out-of-bounds access triggers a Solidity panic (`0x32`) rather than a custom revert message. The test handles this correctly by asserting `revertedWithPanic(0x32)`. If `getOneProposal` were a private function called internally, this would not be an issue since other guards are in place before reaching it — but as an external function, the panic is the expected and tested behaviour.

There is no equivalent issue with `getVoter()`: since `voters` is a mapping, an unknown address simply returns a zeroed struct with no revert or crash.

Some accounts in the testing file (account4 is a voter who didn't voted) were added in the spirit to check all values of all kind in a complete scenario at the end of the tests, but finally it has not been done because it looks more like integration tests rather than unitary tests. That's why they are not really usefull, but the tests remains corrects, so they are not deleted.