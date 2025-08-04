// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TestToken.sol";

contract DeployTokenWithEnvScript is Script {
    function run() external {
        // Read private key from environment
        string memory privateKey = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(privateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        TestToken token = new TestToken();
        
        console.log("TestToken deployed at:", address(token));
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.stopBroadcast();
    }
} 