import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

describe('Test Helpers', function() {
  describe('Mine', async function() {
    it('should test the mine function', async function() {
      let timestamp = Math.floor(Date.now() / 1000);
      console.log(timestamp);
      await networkHelpers.mine();
      await networkHelpers.mine(1000);
      await networkHelpers.mine(1000, { interval: 15 });
      let latestBlock = await ethers.provider.getBlock('latest');
      console.log(latestBlock!.number);
    })

    it('should test manipulating accounts functions', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await networkHelpers.setBalance(owner.address, 77);
      let balance = await ethers.provider.getBalance(owner.address);
      console.log(ethers.formatEther(balance));

      await networkHelpers.setBalance(addr1.address, 10n * (10n ** 18n));
      balance = await ethers.provider.getBalance(addr1.address)
      console.log(ethers.formatEther(balance.toString()))

      await networkHelpers.setBalance(addr1.address, 100n * (10n ** 18n));
      balance = await ethers.provider.getBalance(addr1.address)
      console.log(ethers.formatEther(balance.toString()))
    });

    it('should test the time manipulation helpers functions', async function() {
      // latest = Retrieves the timestamp of the latest block.
      console.log(await networkHelpers.time.latest())
      // retrieves the block number of the last block
      console.log(await networkHelpers.time.latestBlock())
      // immediately mine a new block
      await networkHelpers.mine();
      // mines a new block whose timestamp is 60 seconds after the latest block's timestamp.
      await networkHelpers.time.increase(60);
      console.log(await networkHelpers.time.latest())
      console.log(await networkHelpers.time.latestBlock())
    })
  })
})