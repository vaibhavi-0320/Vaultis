const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('LVTToken', () => {
  async function deployFixture() {
    const [owner, user, other] = await ethers.getSigners();
    const LVTToken = await ethers.getContractFactory('LVTToken');
    const token = await LVTToken.deploy();
    await token.waitForDeployment();
    return { token, owner, user, other };
  }

  it('mints the initial supply to the deployer', async () => {
    const { token, owner } = await deployFixture();
    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseUnits('10000', 18));
  });

  it('rewards a check-in and enforces the cooldown', async () => {
    const { token, user } = await deployFixture();

    await expect(token.connect(user).checkInAndEarn())
      .to.emit(token, 'CheckInRewarded')
      .withArgs(user.address, ethers.parseUnits('10', 18));

    expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits('10', 18));
    expect(await token.canUserCheckIn(user.address)).to.equal(false);

    await expect(token.connect(user).checkInAndEarn()).to.be.revertedWith(
      'Cooldown active: already checked in'
    );
  });

  it('allows check-in again after the cooldown elapses', async () => {
    const { token, user } = await deployFixture();

    await token.connect(user).checkInAndEarn();
    await time.increase(24 * 60 * 60 + 1);

    expect(await token.canUserCheckIn(user.address)).to.equal(true);
    await expect(token.connect(user).checkInAndEarn()).to.not.be.reverted;
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseUnits('20', 18));
  });

  it('restricts mintReward and rewardCheckIn to the owner', async () => {
    const { token, user, other } = await deployFixture();

    await expect(
      token.connect(user).mintReward(other.address, ethers.parseUnits('5', 18))
    ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');

    await expect(
      token.connect(user).rewardCheckIn(other.address, ethers.parseUnits('5', 18))
    ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');

    await expect(token.mintReward(other.address, ethers.parseUnits('5', 18))).to.not.be.reverted;
    expect(await token.balanceOf(other.address)).to.equal(ethers.parseUnits('5', 18));
  });

  it('never mints past MAX_SUPPLY', async () => {
    const { token, owner } = await deployFixture();
    const maxSupply = await token.MAX_SUPPLY();
    const currentSupply = await token.totalSupply();
    const remaining = maxSupply - currentSupply;

    await expect(token.mintReward(owner.address, remaining + 1n)).to.be.revertedWith(
      'Exceeds max supply'
    );
    await expect(token.mintReward(owner.address, remaining)).to.not.be.reverted;
    expect(await token.totalSupply()).to.equal(maxSupply);
  });
});
