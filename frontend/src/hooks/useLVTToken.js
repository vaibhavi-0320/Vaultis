import { useCallback, useEffect, useMemo, useState } from 'react'
import * as ethers from 'ethers'
import toast from 'react-hot-toast'
import { useWallet } from '../contexts/useWallet'
import { checkInApi } from '../lib/api'

const DEMO_OVERRIDE_KEY = 'vaultis_demo_checkin_override'
const DEMO_FORCE_ZERO_BALANCE_KEY = 'vaultis_demo_force_zero_balance'
const LVT_MINIMAL_ABI = [
  'function checkInAndEarn() external',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function canUserCheckIn(address user) view returns (bool)',
  'function getTimeUntilNextCheckIn(address user) view returns (uint256)',
  'event CheckInRewarded(address indexed user, uint256 amount)'
]

function getErrorMessage(error) {
  if (!error) {
    return 'Unable to reach the LVT contract.'
  }

  return error.shortMessage || error.reason || error.message || 'Unable to reach the LVT contract.'
}

function toWholeUnits(value) {
  return Math.round(Number(ethers.formatUnits(value || 0n, 18)))
}

function formatBalance(value) {
  return Number(ethers.formatUnits(value || 0n, 18)).toFixed(2)
}

function getProvider() {
  if (!window.ethereum) {
    return null
  }

  if (typeof ethers.BrowserProvider === 'function') {
    return new ethers.BrowserProvider(window.ethereum)
  }

  const legacyProviders = Reflect.get(ethers, 'providers')
  if (legacyProviders?.Web3Provider) {
    return new legacyProviders.Web3Provider(window.ethereum)
  }

  return null
}

function getLegacyWeb3Provider() {
  const legacyProviders = Reflect.get(ethers, 'providers')
  return legacyProviders?.Web3Provider || null
}

function formatEtherCompat(value) {
  if (typeof ethers.formatEther === 'function') {
    return ethers.formatEther(value)
  }

  const legacyUtils = Reflect.get(ethers, 'utils')
  if (legacyUtils?.formatEther) {
    return legacyUtils.formatEther(value)
  }

  throw new Error('Unable to format token balance with the installed ethers version.')
}

// Demo-mode overrides are dev-only tooling for local demos/screenshots — never active in a production build.
function readDemoOverride() {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(DEMO_OVERRIDE_KEY) === 'true'
}

function shouldForceZeroBalance() {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(DEMO_FORCE_ZERO_BALANCE_KEY) === 'true'
}

export function useLVTToken() {
  const { walletAddress, connectedWallet } = useWallet()
  const [lvtBalance, setLvtBalance] = useState(() => {
    if (shouldForceZeroBalance()) {
      return '0.00'
    }
    const cached = window.localStorage.getItem('vaultis_lvt_balance')
    return cached ? Number(cached).toFixed(2) : '0.00'
  })
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [hoursUntilNextCheckIn, setHoursUntilNextCheckIn] = useState(0)
  const [contractReachable, setContractReachable] = useState(false)
  const [totalSupply, setTotalSupply] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoOverrideActive, setDemoOverrideActive] = useState(() => readDemoOverride())
  const [lastCheckIn, setLastCheckIn] = useState(null)

  const contractAddress = useMemo(() => import.meta.env.VITE_LVT_CONTRACT_ADDRESS?.trim() || '', [])
  const contractAbi = useMemo(() => LVT_MINIMAL_ABI, [])
  const hasContractConfig = Boolean(contractAddress)

  const storeTxHistoryBackup = useCallback((txData) => {
    const stored = JSON.parse(window.localStorage.getItem('vaultis_tx_history') || '[]')
    stored.unshift(txData)
    window.localStorage.setItem('vaultis_tx_history', JSON.stringify(stored.slice(0, 50)))
  }, [])

  const persistBalance = useCallback((nextBalance) => {
    const normalized = parseFloat(nextBalance || 0).toFixed(2)
    setLvtBalance(normalized)
    window.localStorage.setItem('vaultis_lvt_balance', normalized)
  }, [])

  const fetchBalance = useCallback(async () => {
    if (!hasContractConfig) {
      setContractReachable(false)
      setError('')
      setCanCheckIn(false)
      setHoursUntilNextCheckIn(0)
      setTotalSupply('0')
      return
    }

    if (!window.ethereum) {
      setContractReachable(false)
      setError('')
      setCanCheckIn(false)
      setHoursUntilNextCheckIn(0)
      if (!walletAddress) {
        setLvtBalance(0)
      }
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const provider = getProvider()
      if (!provider) {
        throw new Error('Wallet provider is unavailable.')
      }

      const contract = new ethers.Contract(contractAddress, contractAbi, provider)
      const supply = await contract.totalSupply()

      setContractReachable(true)
      setTotalSupply(toWholeUnits(supply).toLocaleString())

      if (connectedWallet !== 'metamask' || !walletAddress) {
        setCanCheckIn(false)
        setHoursUntilNextCheckIn(0)
        return
      }

      const [balance, eligible, timeUntilNext] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.canUserCheckIn(walletAddress),
        contract.getTimeUntilNextCheckIn(walletAddress)
      ])

      if (shouldForceZeroBalance()) {
        setLvtBalance('0.00')
      } else {
        persistBalance(formatBalance(balance))
      }
      if (demoOverrideActive) {
        setCanCheckIn(true)
        setHoursUntilNextCheckIn(0)
      } else {
        setCanCheckIn(Boolean(eligible))
        setHoursUntilNextCheckIn(Math.ceil(Number(timeUntilNext || 0n) / 3600))
      }
    } catch (nextError) {
      setContractReachable(false)
      setError(getErrorMessage(nextError))
    } finally {
      setIsLoading(false)
    }
  }, [connectedWallet, contractAbi, contractAddress, demoOverrideActive, hasContractConfig, persistBalance, walletAddress])

  const checkInAndEarn = useCallback(async () => {
    const contractAddr = import.meta.env.VITE_LVT_CONTRACT_ADDRESS

    // Step 1: Always record locally first
    const now = new Date()
    setLastCheckIn(now)
    localStorage.setItem('vaultis_last_checkin', now.toISOString())

    // Step 2: Check if contract is configured
    if (!contractAddr || contractAddr.trim() === '') {
      toast('Check-in recorded locally. Deploy contract to earn LVT on-chain.', { icon: '⚠️' })
      return { success: false, reason: 'no_contract' }
    }

    // Step 3: Check MetaMask
    if (!window.ethereum) {
      toast.error('MetaMask not found. Please install it.')
      return { success: false, reason: 'no_wallet' }
    }

    try {
      setIsLoading(true)

      // Step 4: Create provider and signer
      // Auto-detect ethers v5 vs v6
      let provider, signer

      if (typeof ethers.BrowserProvider === 'function') {
        // ethers v6
        provider = new ethers.BrowserProvider(window.ethereum)
        signer = await provider.getSigner()
      } else {
        // ethers v5
        const LegacyWeb3Provider = getLegacyWeb3Provider()
        if (!LegacyWeb3Provider) {
          throw new Error('Wallet provider is unavailable.')
        }
        provider = new LegacyWeb3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        signer = provider.getSigner()
      }

      // Step 5: Verify correct network (Sepolia = 11155111)
      const network = await provider.getNetwork()
      const chainId = typeof network.chainId === 'bigint'
        ? Number(network.chainId)  // ethers v6
        : network.chainId          // ethers v5

      if (chainId !== 11155111) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }]
          })
        } catch (switchErr) {
          toast.error('Please switch MetaMask to Sepolia testnet')
          return { success: false, reason: 'wrong_network' }
        }
      }

      // Step 6: Create contract instance
      const abi = [
        'function checkInAndEarn() external',
        'function balanceOf(address owner) view returns (uint256)',
        'function canUserCheckIn(address user) view returns (bool)',
        'function getTimeUntilNextCheckIn(address user) view returns (uint256)',
        'function lastCheckIn(address user) view returns (uint256)',
        'event CheckInRewarded(address indexed user, uint256 amount)'
      ]

      const contract = new ethers.Contract(contractAddr, abi, signer)

      // Step 7: Check cooldown before calling
      const userAddress = await signer.getAddress()

      let canDoCheckIn = true
      try {
        canDoCheckIn = await contract.canUserCheckIn(userAddress)
      } catch {
        // If canUserCheckIn fails, proceed and let the contract call itself fail/succeed
      }

      if (!canDoCheckIn) {
        let secondsLeft = 0
        try {
          const raw = await contract.getTimeUntilNextCheckIn(userAddress)
          secondsLeft = typeof raw === 'bigint'
            ? Number(raw) : raw.toNumber()
        } catch {}

        const hoursLeft = Math.ceil(secondsLeft / 3600)
        setCanCheckIn(false)
        setHoursUntilNextCheckIn(hoursLeft)
        toast(`Cooldown active. Next check-in in ${hoursLeft} hours.`, { icon: '⏳' })
        return { success: false, reason: 'cooldown', hoursLeft }
      }

      // Step 8: THIS IS THE KEY LINE — triggers MetaMask popup
      toast.loading('Waiting for MetaMask approval...', { id: 'checkin' })

      const tx = await contract.checkInAndEarn()

      toast.loading('Transaction submitted — confirming...', { id: 'checkin' })

      // Step 9: Wait for confirmation
      const receipt = await tx.wait()

      // Step 10: Read new balance
      let newBalance = '0'
      try {
        const rawBal = await contract.balanceOf(userAddress)
        newBalance = formatEtherCompat(rawBal)
        const formatted = parseFloat(newBalance).toFixed(2)
        setLvtBalance(formatted)
        localStorage.setItem('vaultis_lvt_balance', formatted)
      } catch {
        const cached = parseFloat(
          localStorage.getItem('vaultis_lvt_balance') || '0'
        )
        const newBal = (cached + 10).toFixed(2)
        setLvtBalance(newBal)
        localStorage.setItem('vaultis_lvt_balance', newBal)
      }

      // Step 11: Save TX to backend
      const txData = {
        txHash: receipt.hash || receipt.transactionHash,
        blockNumber: typeof receipt.blockNumber === 'bigint'
          ? Number(receipt.blockNumber)
          : receipt.blockNumber,
        status: 'confirmed',
        network: 'Ethereum Sepolia',
        etherscanUrl: `https://sepolia.etherscan.io/tx/${receipt.hash || receipt.transactionHash}`
      }

      // Save to localStorage immediately
      storeTxHistoryBackup({
        ...txData,
        lvtRewarded: 10,
        timestamp: new Date().toISOString()
      })

      // Save to backend (non-blocking) — reward amount is determined server-side
      checkInApi.saveTx(txData).catch(() => {})

      setCanCheckIn(false)
      setHoursUntilNextCheckIn(24)

      // Re-sync balance from the chain to confirm the on-chain state
      setTimeout(() => fetchBalance(), 3000)

      const shortHash = (txData.txHash || '').slice(0, 10)
      toast.success(
        `✅ +10 LVT earned! TX: ${shortHash}...`,
        { id: 'checkin', duration: 5000 }
      )

      return {
        success: true,
        txHash: txData.txHash,
        receipt,
        newBalance
      }

    } catch (err) {
      toast.dismiss('checkin')

      // User rejected in MetaMask
      if (err.code === 4001 ||
          err.code === 'ACTION_REJECTED' ||
          err.message?.includes('user rejected') ||
          err.message?.includes('User denied')) {
        toast.error('Transaction rejected in MetaMask')
        return { success: false, reason: 'user_rejected' }
      }

      // Contract execution error
      if (err.message?.includes('execution reverted')) {
        toast.error('Contract error: ' + err.message)
        return { success: false, reason: 'contract_error', error: err.message }
      }

      // Generic error
      console.error('Check-in error:', err)
      toast.error('Check-in failed: ' + err.message)
      return { success: false, reason: 'unknown', error: err.message }

    } finally {
      setIsLoading(false)
    }
  }, [storeTxHistoryBackup, fetchBalance])

  const addLVTToMetaMask = useCallback(async () => {
    if (!hasContractConfig) {
      return { success: false, reason: 'no_contract' }
    }

    if (!window.ethereum?.request) {
      return { success: false, reason: 'no_wallet' }
    }

    try {
      const added = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: contractAddress,
            symbol: 'LVT',
            decimals: 18,
            image: ''
          }
        }
      })
      return { success: Boolean(added) }
    } catch (nextError) {
      if (nextError?.code === 4001) {
        return { success: false, reason: 'user_rejected' }
      }

      return { success: false, reason: 'failed', error: getErrorMessage(nextError) }
    }
  }, [contractAddress, hasContractConfig])

  const resetCooldownForDemo = useCallback(() => {
    if (!import.meta.env.DEV) {
      return { success: false, message: 'Demo mode is only available in development builds.' }
    }
    window.localStorage.setItem(DEMO_OVERRIDE_KEY, 'true')
    setDemoOverrideActive(true)
    setCanCheckIn(true)
    setHoursUntilNextCheckIn(0)
    window.localStorage.removeItem('vaultis_last_checkin')
    window.localStorage.setItem(DEMO_FORCE_ZERO_BALANCE_KEY, 'true')
    setLvtBalance('0.00')
    return {
      success: true,
      message: 'Demo mode: cooldown reset. You can check in again.'
    }
  }, [])

  const applyDemoReward = useCallback((amount = 10) => {
    const nextBalance = Number(lvtBalance || 0) + Number(amount || 0)
    persistBalance(nextBalance.toFixed(2))
  }, [lvtBalance, persistBalance])

  // Fetch balance when wallet/contract state changes
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // On mount: read cached balance, then try to read from contract
  useEffect(() => {
    const cached = localStorage.getItem('vaultis_lvt_balance')
    if (cached && parseFloat(cached) > 0) {
      setLvtBalance(cached)
    }

    const loadFromContract = async () => {
      const contractAddr = import.meta.env.VITE_LVT_CONTRACT_ADDRESS
      if (!contractAddr || !window.ethereum) return

      try {
        let provider
        if (typeof ethers.BrowserProvider === 'function') {
          provider = new ethers.BrowserProvider(window.ethereum)
        } else {
          const LegacyWeb3Provider = getLegacyWeb3Provider()
          if (!LegacyWeb3Provider) {
            return
          }
          provider = new LegacyWeb3Provider(window.ethereum)
        }

        const accounts = await provider.listAccounts()
        if (!accounts || accounts.length === 0) return

        const userAddress = typeof accounts[0] === 'string'
          ? accounts[0]
          : accounts[0].address

        const abi = [
          'function balanceOf(address) view returns (uint256)',
          'function canUserCheckIn(address) view returns (bool)',
          'function getTimeUntilNextCheckIn(address) view returns (uint256)'
        ]

        const contract = new ethers.Contract(contractAddr, abi, provider)

        const rawBal = await contract.balanceOf(userAddress)
        const formatted = formatEtherCompat(rawBal)
        const display = parseFloat(formatted).toFixed(2)
        setLvtBalance(display)
        localStorage.setItem('vaultis_lvt_balance', display)

        const can = await contract.canUserCheckIn(userAddress)
        setCanCheckIn(can)

        if (!can) {
          const raw = await contract.getTimeUntilNextCheckIn(userAddress)
          const secs = typeof raw === 'bigint'
            ? Number(raw) : raw.toNumber()
          setHoursUntilNextCheckIn(Math.ceil(secs / 3600))
        }

        setContractReachable(true)

      } catch {
        setContractReachable(false)
      }
    }

    loadFromContract()
  }, [])

  // Listen for on-chain CheckInRewarded events
  useEffect(() => {
    if (!window.ethereum?.on || !hasContractConfig || !walletAddress) {
      return undefined
    }

    const provider = getProvider()
    if (!provider) {
      return undefined
    }

    const contract = new ethers.Contract(contractAddress, contractAbi, provider)

    const handleReward = (userAddress) => {
      if (String(userAddress || '').toLowerCase() === walletAddress.toLowerCase()) {
        fetchBalance()
      }
    }

    contract.on('CheckInRewarded', handleReward)

    return () => {
      contract.off('CheckInRewarded', handleReward)
    }
  }, [contractAbi, contractAddress, fetchBalance, hasContractConfig, walletAddress])

  return {
    lvtBalance,
    isLoading,
    error,
    canCheckIn,
    hoursUntilNextCheckIn,
    contractReachable,
    contractConfigured: hasContractConfig,
    totalSupply,
    lastCheckIn,
    isDemoOverrideActive: demoOverrideActive,
    checkInAndEarn,
    fetchBalance,
    addLVTToMetaMask,
    resetCooldownForDemo,
    applyDemoReward
  }
}
