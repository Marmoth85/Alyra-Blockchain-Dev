import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingrModule", (m) => {
  const voting = m.contract("Voting");

  return { voting };
});
