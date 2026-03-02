import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

// Fixture : déploie AlyraToken et récupère plusieurs signers
// getSigners() retourne les comptes de test générés par Hardhat
async function deployAlyraToken() {
  const [owner, buyer, recipient] = await ethers.getSigners();
  const token = await ethers.deployContract("AlyraToken");
  return { token, owner, buyer, recipient };
}

describe("AlyraToken Tests", function () {

  describe("Deployment", function () {

    it("Should have name AlyraToken", async function () {
      const { token } = await networkHelpers.loadFixture(deployAlyraToken);
      expect(await token.name()).to.equal("AlyraToken");
    });

    it("Should have symbol ATN", async function () {
      const { token } = await networkHelpers.loadFixture(deployAlyraToken);
      expect(await token.symbol()).to.equal("ATN");
    });

    // Le constructeur appelle _mint(msg.sender, 10 * 10**18)
    // parseEther("10") est un raccourci pour 10 * 10^18 (10 tokens en unités ETH)
    it("Should mint 10 tokens to owner at deployment", async function () {
      const { token, owner } = await networkHelpers.loadFixture(deployAlyraToken);
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("10"));
    });

    it("Should have a totalSupply of 10 tokens at deployment", async function () {
      const { token } = await networkHelpers.loadFixture(deployAlyraToken);
      expect(await token.totalSupply()).to.equal(ethers.parseEther("10"));
    });

  });

  describe("buyToken", function () {

    // rate = 100 → pour chaque wei envoyé, 100 tokens sont mintés
    // Exemple : envoyer 1 ETH (= 10^18 wei) → 100 * 10^18 tokens mintés
    it("Should mint rate * msg.value tokens to buyer", async function () {
      const { token, buyer } = await networkHelpers.loadFixture(deployAlyraToken);
      const ethAmount = ethers.parseEther("1"); // 1 ETH en wei

      // connect(buyer) envoie la transaction depuis le compte buyer (pas owner)
      await token.connect(buyer).buyToken({ value: ethAmount });

      expect(await token.balanceOf(buyer.address)).to.equal(100n * ethAmount);
    });

    it("Should increase totalSupply after buyToken", async function () {
      const { token, buyer } = await networkHelpers.loadFixture(deployAlyraToken);
      const initialSupply = await token.totalSupply();
      const ethAmount = ethers.parseEther("1");

      await token.connect(buyer).buyToken({ value: ethAmount });

      expect(await token.totalSupply()).to.equal(initialSupply + 100n * ethAmount);
    });

    // changeTokenBalance vérifie la variation de balance d'un compte après une tx
    it("Should emit a Transfer event on buyToken", async function () {
      const { token, buyer } = await networkHelpers.loadFixture(deployAlyraToken);
      const ethAmount = ethers.parseEther("1");

      // _mint émet un Transfer depuis address(0) vers le destinataire
      await expect(token.connect(buyer).buyToken({ value: ethAmount }))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, buyer.address, 100n * ethAmount);
    });

  });

  describe("transfer", function () {

    it("Should transfer tokens between accounts", async function () {
      const { token, owner, recipient } = await networkHelpers.loadFixture(deployAlyraToken);
      const amount = ethers.parseEther("1");

      await token.transfer(recipient.address, amount);

      expect(await token.balanceOf(recipient.address)).to.equal(amount);
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("9"));
    });

    // mechant n'est jamais initialisé → sa valeur par défaut est address(0)
    // Le require(to != mechant) bloque donc les transferts vers address(0)
    // ethers.ZeroAddress est la constante "0x0000...0000"
    it("Should revert when transferring to mechant (address(0))", async function () {
      const { token } = await networkHelpers.loadFixture(deployAlyraToken);

      await expect(
        token.transfer(ethers.ZeroAddress, ethers.parseEther("1"))
      ).to.revert(ethers);
    });

    it("Should emit a Transfer event", async function () {
      const { token, owner, recipient } = await networkHelpers.loadFixture(deployAlyraToken);
      const amount = ethers.parseEther("1");

      await expect(token.transfer(recipient.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, recipient.address, amount);
    });

  });

});
