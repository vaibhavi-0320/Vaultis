import { useEffect, useMemo, useRef, useState } from 'react'
import { getAddress } from 'ethers'
import { useToast } from '../contexts/ToastContext'
import { authApi, getToken } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { WalletContext } from './walletContextCore'

const STORAGE_KEY = 'vaultis_wallet_session'
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const SEPOLIA_CHAIN_ID = '0xaa36a7'
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'

function readStoredWallet() {
  if (typeof window === 'undefined') {
    return {
      connectedWallet: null,
      walletAddress: null,
      walletNetwork: null
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        connectedWallet: null,
        walletAddress: null,
        walletNetwork: null
      }
    }

    return JSON.parse(raw)
  } catch {
    return {
      connectedWallet: null,
      walletAddress: null,
      walletNetwork: null
    }
  }
}

export function WalletProvider({ children }) {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const storedWallet = readStoredWallet()
  const [connectedWallet, setConnectedWallet] = useState(storedWallet.connectedWallet)
  const [walletAddress, setWalletAddress] = useState(storedWallet.walletAddress)
  const [walletNetwork, setWalletNetwork] = useState(storedWallet.walletNetwork)
  const [isConnecting, setIsConnecting] = useState(false)
  const listenersRef = useRef({ accountsChanged: null, chainChanged: null })

  useEffect(() => {
    const payload = JSON.stringify({
      connectedWallet,
      walletAddress,
      walletNetwork
    })

    window.localStorage.setItem(STORAGE_KEY, payload)
  }, [connectedWallet, walletAddress, walletNetwork])

  useEffect(() => {
    if (!walletAddress && user?.walletAddress) {
      setWalletAddress(user.walletAddress)
      setConnectedWallet(user.walletType === 'metamask' ? 'metamask' : null)
      setWalletNetwork(user.walletType === 'metamask' ? 'Ethereum Sepolia' : null)
    }
  }, [user?.walletAddress, user?.walletType, walletAddress])

  useEffect(() => {
    return () => {
      if (window.ethereum?.removeListener && listenersRef.current.accountsChanged) {
        window.ethereum.removeListener('accountsChanged', listenersRef.current.accountsChanged)
      }

      if (window.ethereum?.removeListener && listenersRef.current.chainChanged) {
        window.ethereum.removeListener('chainChanged', listenersRef.current.chainChanged)
      }
    }
  }, [])

  const syncMetaMaskState = async () => {
    if (!window.ethereum?.request) {
      setConnectedWallet((current) => (current === 'metamask' ? null : current))
      setWalletNetwork((current) => (current === 'Ethereum Sepolia' ? null : current))
      return
    }

    try {
      const [accounts, chainId] = await Promise.all([
        window.ethereum.request({ method: 'eth_accounts' }),
        window.ethereum.request({ method: 'eth_chainId' })
      ])

      const normalizedAddress = accounts?.[0] ? getAddress(accounts[0]) : null
      const isSepolia = chainId === SEPOLIA_CHAIN_ID || Number(chainId) === SEPOLIA_CHAIN_ID_DECIMAL

      if (normalizedAddress && ETHEREUM_ADDRESS_REGEX.test(normalizedAddress) && isSepolia) {
        setWalletAddress(normalizedAddress)
        setConnectedWallet('metamask')
        setWalletNetwork('Ethereum Sepolia')
        return
      }

      if (connectedWallet === 'metamask') {
        setWalletAddress(normalizedAddress)
        setWalletNetwork(isSepolia ? 'Ethereum Sepolia' : 'Ethereum')
        if (!normalizedAddress) {
          setConnectedWallet(null)
        }
      }
    } catch {
      // Keep the current session state if MetaMask is temporarily unavailable.
    }
  }

  useEffect(() => {
    syncMetaMaskState()
  }, [])

  const persistWallet = async (address, walletType) => {
    if (!getToken()) {
      return
    }

    await authApi.updateWallet({ walletAddress: address, walletType })
  }

  const disconnectWallet = () => {
    setConnectedWallet(null)
    setWalletAddress(null)
    setWalletNetwork(null)
    window.localStorage.removeItem(STORAGE_KEY)
    pushToast({
      type: 'info',
      title: 'Wallet disconnected',
      message: 'The wallet session was removed from this browser.'
    })
  }

  const connectMetaMask = async () => {
    try {
      setIsConnecting(true)

      if (!window.ethereum || !window.ethereum.isMetaMask) {
        pushToast({
          type: 'error',
          title: 'MetaMask not found',
          message: 'Install MetaMask to connect an Ethereum wallet.'
        })
        window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer')
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        pushToast({
          type: 'error',
          title: 'No accounts found',
          message: 'MetaMask did not return any available accounts.'
        })
        return
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' })

      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }]
          })
          pushToast({
            type: 'success',
            title: 'Switched network',
            message: 'MetaMask is now connected to Ethereum Sepolia.'
          })
        } catch (switchError) {
          if (switchError?.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Ethereum Sepolia',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: [SEPOLIA_RPC_URL],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            })
          } else {
            throw switchError
          }
        }
      }

      const address = getAddress(accounts[0])
      if (!ETHEREUM_ADDRESS_REGEX.test(address)) {
        pushToast({
          type: 'error',
          title: 'Invalid address',
          message: 'MetaMask returned an invalid Ethereum address.'
        })
        return
      }

      setWalletAddress(address)
      setConnectedWallet('metamask')
      setWalletNetwork('Ethereum Sepolia')

      await persistWallet(address, 'metamask')

      pushToast({
        type: 'success',
        title: 'MetaMask connected',
        message: `${address.slice(0, 6)}...${address.slice(-4)} linked to VAULTIS.`
      })

      const handleAccountsChanged = async (nextAccounts) => {
        if (!nextAccounts.length) {
          disconnectWallet()
          return
        }

        const nextAddress = getAddress(nextAccounts[0])
        if (!ETHEREUM_ADDRESS_REGEX.test(nextAddress)) {
          disconnectWallet()
          return
        }

        setWalletAddress(nextAddress)
        await persistWallet(nextAddress, 'metamask')
        await syncMetaMaskState()
      }

      const handleChainChanged = async () => {
        await syncMetaMaskState()
      }

      if (window.ethereum.removeListener && listenersRef.current.accountsChanged) {
        window.ethereum.removeListener('accountsChanged', listenersRef.current.accountsChanged)
      }

      if (window.ethereum.removeListener && listenersRef.current.chainChanged) {
        window.ethereum.removeListener('chainChanged', listenersRef.current.chainChanged)
      }

      listenersRef.current.accountsChanged = handleAccountsChanged
      listenersRef.current.chainChanged = handleChainChanged

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    } catch (error) {
      if (error?.code === 4001) {
        pushToast({
          type: 'warning',
          title: 'Connection rejected',
          message: 'MetaMask connection was rejected by the user.'
        })
      } else {
        pushToast({
          type: 'error',
          title: 'MetaMask connection failed',
          message: 'VAULTIS could not connect to MetaMask.'
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const value = useMemo(() => ({
    connectedWallet,
    walletAddress,
    walletNetwork,
    isConnecting,
    connectMetaMask,
    disconnectWallet
  }), [connectedWallet, walletAddress, walletNetwork, isConnecting])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
