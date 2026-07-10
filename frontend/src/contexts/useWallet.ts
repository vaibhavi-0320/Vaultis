import { useContext } from 'react'
import { WalletContext } from './walletContextCore'

export function useWallet() {
  const value = useContext(WalletContext)
  if (!value) {
    throw new Error('useWallet must be used inside WalletProvider')
  }

  return value
}
