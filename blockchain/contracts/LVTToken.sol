// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LVTToken is ERC20, Ownable {
    uint256 public constant CHECKIN_REWARD = 10 * 10**18;
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    uint256 public checkInCooldown = 1 days;

    mapping(address => uint256) public lastCheckIn;

    event CheckInRewarded(address indexed user, uint256 amount);

    constructor() ERC20("Legacy Vault Token", "LVT") Ownable(msg.sender) {
        _mint(msg.sender, 10_000 * 10**18);
    }

    function checkInAndEarn() external {
        require(
            block.timestamp >= lastCheckIn[msg.sender] + checkInCooldown,
            "Cooldown active: already checked in"
        );
        require(
            totalSupply() + CHECKIN_REWARD <= MAX_SUPPLY,
            "Max supply reached"
        );

        lastCheckIn[msg.sender] = block.timestamp;
        _mint(msg.sender, CHECKIN_REWARD);
        emit CheckInRewarded(msg.sender, CHECKIN_REWARD);
    }

    function mintReward(address to, uint256 amount) external onlyOwner {
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "Exceeds max supply"
        );
        _mint(to, amount);
    }

    function rewardCheckIn(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid user");
        require(
            block.timestamp >= lastCheckIn[to] + checkInCooldown,
            "Cooldown active: already checked in"
        );
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "Exceeds max supply"
        );

        lastCheckIn[to] = block.timestamp;
        _mint(to, amount);
        emit CheckInRewarded(to, amount);
    }

    function canUserCheckIn(address user) external view returns (bool) {
        return block.timestamp >= lastCheckIn[user] + checkInCooldown;
    }

    function getTimeUntilNextCheckIn(address user) external view returns (uint256) {
        uint256 next = lastCheckIn[user] + checkInCooldown;
        if (block.timestamp >= next) return 0;
        return next - block.timestamp;
    }
}
