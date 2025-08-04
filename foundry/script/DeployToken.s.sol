// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TestToken.sol";

contract DeployTokenScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        TestToken token = new TestToken();
        
        console.log("TestToken deployed at:", address(token));
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        vm.stopBroadcast();
    }
} 