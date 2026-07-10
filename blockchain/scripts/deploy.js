const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const LVTToken = await hre.ethers.getContractFactory('LVTToken');
  const token = await LVTToken.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  const network = hre.network.name;

  console.log(`LVTToken deployed to ${address} on ${network}`);
  console.log('Update these env vars with the new address:');
  console.log(`  backend/.env      -> VAULTIS_TOKEN_ADDRESS=${address}`);
  console.log(`  frontend/.env     -> VITE_LVT_CONTRACT_ADDRESS=${address}`);

  const artifact = await hre.artifacts.readArtifact('LVTToken');
  const abiOutputPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'contracts', 'LVTToken.json');
  const abiOutput = {
    contractName: artifact.contractName,
    abi: artifact.abi
  };
  fs.writeFileSync(abiOutputPath, JSON.stringify(abiOutput, null, 2));
  console.log(`ABI written to ${abiOutputPath}`);

  if (network === 'sepolia' && process.env.ETHERSCAN_API_KEY) {
    console.log('Waiting for block confirmations before verification...');
    await token.deploymentTransaction().wait(5);
    try {
      await hre.run('verify:verify', { address, constructorArguments: [] });
      console.log('Contract verified on Etherscan.');
    } catch (error) {
      console.warn(`Etherscan verification skipped/failed: ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
