import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY
        }
      }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  paths: {
    deploy: "deploy",
    deployments: "deployments"
  }
};

export default config;