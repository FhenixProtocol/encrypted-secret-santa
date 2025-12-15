import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySecretSanta: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying SecretSanta with account:", deployer);

  const result = await deploy("SecretSanta", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network
  });

  console.log("SecretSanta deployed to:", result.address);

  // Verify on block explorer if not local
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    // Wait for a few confirmations before verifying
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: result.address,
        constructorArguments: [],
      });
      console.log("Contract verified!");
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message.includes("Already Verified")) {
        console.log("Contract already verified!");
      } else {
        console.error("Verification failed:", err.message);
      }
    }
  }
};

export default deploySecretSanta;
deploySecretSanta.tags = ["SecretSanta", "all"];
