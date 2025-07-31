// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Counter
/// @notice Minimal test contract to increment a public counter.
///         Used for verifying UserOperation execution via ERC-4337.
/// @dev No access control, no constructor — suitable for sandbox tests.
contract Counter {
    /// @notice The current value of the counter.
    uint256 public count;

    /// @notice Increments the counter by 1.
    /// @dev Callable by any address. Designed for testing via UserOperation.
    function increment() external {
        count += 1;
    }
}
