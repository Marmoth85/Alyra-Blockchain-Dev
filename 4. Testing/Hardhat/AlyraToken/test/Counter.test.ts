// import { expect } from "chai";
// import { network } from "hardhat";

// // network.connect() retourne ethers (interactions contrat) et networkHelpers (manipulation EVM)
// const { ethers, networkHelpers } = await network.connect();

// // --- FIXTURES ---
// // Une fixture déploie le contrat une fois, prend un snapshot EVM, puis restaure
// // ce snapshot avant chaque test → plus rapide qu'un redéploiement à chaque fois.
// // Règle : toujours passer une fonction nommée, jamais une lambda.

// async function setUpSmartContract() {
//   const counter = await ethers.deployContract("Counter");
//   const [owner] = await ethers.getSigners();
//   return { counter, owner };
// }

// // Fixture composée : part de setUpSmartContract puis effectue une action supplémentaire.
// // Les tests qui en ont besoin partiront directement avec x = 1.
// async function setUpAndInc() {
//   const { counter, owner } = await networkHelpers.loadFixture(setUpSmartContract);
//   await counter.inc();
//   return { counter, owner };
// }


// describe("Counter contract", function () {
//   describe("Tests tel fonction", function () {

//     it("Should deploy with x = 0", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       expect(await counter.x()).to.equal(0n); // 0n = BigInt(0), ethers v6 retourne des bigint
//     });

//     it("inc Should increment x = 1", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       await counter.inc();
//       expect(await counter.x()).to.equal(1n);
//     });

//     // getStorage lit directement le stockage brut de l'EVM (slot 0 = variable x)
//     it("get storage at 1", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       await counter.inc();
//       expect(await ethers.provider.getStorage(counter.target, 0)).to.equal(1n);
//     });

//     // Solidity ne stocke pas les mappings à un slot fixe.
//     // La valeur de balances[addr] est stockée au slot :
//     //   keccak256(abi.encode(addr, position_du_mapping))
//     //
//     // Dans Counter.sol, les variables sont déclarées dans cet ordre :
//     //   slot 0 → uint public x
//     //   slot 1 → mapping(address => uint) public balances   ← position = 1
//     //   slot 2 → uint public blocknumber
//     //
//     // Donc pour lire balances[owner.address] :
//     //   slot = keccak256( abi.encode(owner.address, 1) )
//     //                      ↑ la clé              ↑ position du mapping
//     it("get storage de ma balance", async function () {
//       const { counter, owner } = await networkHelpers.loadFixture(setUpSmartContract);
//       await counter.inc();
//       const calculslot = ethers.keccak256(
//         ethers.AbiCoder.defaultAbiCoder().encode(
//           ["address", "uint256"],
//           [owner.address, 1n], // clé = owner.address, position du mapping = 1
//         ),
//       );
//       expect(await ethers.provider.getStorage(counter.target, calculslot)).to.equal(100n);
//     });

//     // revertedWith vérifie que la transaction échoue avec le bon message require()
//     it("should revert on triple inc", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       await counter.inc();
//       await counter.inc();
//       await expect(counter.inc()).to.be.revertedWith("pas trop haut");
//     });

//     // emit + withArgs vérifie qu'un événement a bien été émis avec les bons paramètres
//     it("Should emit the Increment event when calling the inc() function", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       await expect(counter.inc()).to.emit(counter, "Increment").withArgs(1n);
//     });

//     it("Should get blocknumber", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       const blocknumber = await ethers.provider.getBlockNumber();
//       await counter.putBlockNumber(blocknumber);
//       expect(await counter.blocknumber()).to.equal(blocknumber);
//     });

//     // mine() et time.increase() permettent de simuler le passage du temps et de blocs
//     it("Should increment blocknumber", async function () {
//       const { counter } = await networkHelpers.loadFixture(setUpSmartContract);
//       const blocknumber = await ethers.provider.getBlockNumber();
//       console.log("Current block number:", blocknumber);

//       await counter.putBlockNumber(blocknumber);
//       const testblocknumber = await ethers.provider.getBlockNumber();
//       console.log("Current block number:", testblocknumber);
//       expect(await counter.blocknumber()).to.equal(blocknumber);

//       await networkHelpers.mine(5);           // mine 5 blocs
//       await networkHelpers.time.increase(600); // avance de 600 secondes
//       const newblocknumber = await ethers.provider.getBlockNumber();
//       console.log("new block number:", newblocknumber);

//       await counter.putBlockNumber(newblocknumber);
//       expect(await counter.blocknumber()).to.equal(blocknumber + 7);
//     });

//   });

//   describe("Complexe fonction", function () {

//     // Les événements sont la mémoire historique d'un contrat : une fois émis,
//     // ils sont stockés dans les logs de la blockchain et requêtables à tout moment.
//     //
//     // Ce test vérifie la cohérence entre l'état actuel (x) et l'historique (événements) :
//     // si on additionne tous les "by" des événements Increment, on doit retrouver x.
//     it("The sum of the Increment events should match the current value", async function () {
//       const counter = await ethers.deployContract("Counter");
//       // On note le bloc de déploiement pour ne récupérer que les événements
//       // émis APRÈS le déploiement (et non ceux d'autres contrats ou tests)
//       const deploymentBlockNumber = await ethers.provider.getBlockNumber();

//       // incBy(i) émet un événement Increment(by = i) à chaque appel
//       // total incrémenté = 1+2+...+10 = 55
//       for (let i = 1; i <= 10; i++) {
//         await counter.incBy(i);
//       }

//       // queryFilter(filtre, fromBlock, toBlock) retourne tous les événements
//       // qui correspondent au filtre dans la plage de blocs donnée.
//       // counter.filters.Increment() construit le filtre pour l'événement Increment.
//       const events = await counter.queryFilter(
//         counter.filters.Increment(),
//         deploymentBlockNumber,
//         "latest",
//       );

//       // Chaque event.args contient les paramètres de l'événement tels que
//       // définis dans le contrat : event Increment(uint by) → event.args.by
//       let total = 0n;
//       for (const event of events) {
//         total += event.args.by;
//       }

//       expect(await counter.x()).to.equal(total); // 55n === 55n
//     });
//   });
// });
