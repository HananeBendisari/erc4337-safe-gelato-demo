import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying TestToken with account:", deployer);

  const result = await deploy("TestToken", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1
  });

  console.log("TestToken deployed to:", result.address);
};

func.tags = ["TestToken"];
export default func;