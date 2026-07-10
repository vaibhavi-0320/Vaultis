import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, LogOut, Wallet } from 'lucide-react'
import { Modal } from './Modal'
import { useWallet } from '../contexts/useWallet'

function InstallLink({ href, children }) {
  return (
    <a className="wallet-install-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={14} />
    </a>
  )
}

export function WalletConnectButton() {
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { connectedWallet, walletAddress, walletNetwork, isConnecting, connectMetaMask, disconnectWallet } = useWallet()

  const metamaskDetected = Boolean(window.ethereum?.isMetaMask)

  const shortAddress = useMemo(() => {
    if (!walletAddress) {
      return ''
    }

    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
  }, [walletAddress])

  const icon = connectedWallet === 'metamask' ? <span>MM</span> : <Wallet size={16} />

  const handleConnectMetaMask = async () => {
    await connectMetaMask()
    setModalOpen(false)
  }

  if (connectedWallet && walletAddress) {
    return (
      <div className="wallet-dropdown">
        <button className="wallet-pill wallet-pill-connected wallet-pill-metamask" type="button" onClick={() => setMenuOpen((current) => !current)}>
          <span className="wallet-status-dot" />
          <span className="wallet-pill-icon">{icon}</span>
          <span className="wallet-pill-address">{shortAddress}</span>
          <span className="wallet-network-badge blue">
            <span className="wallet-network-dot" />
            {walletNetwork?.includes('Sepolia') ? 'Sepolia' : walletNetwork || 'ETH'}
          </span>
          <ChevronDown size={14} />
        </button>

        {menuOpen ? (
          <div className="wallet-menu">
            <button
              className="wallet-menu-item"
              onClick={() => {
                disconnectWallet()
                setMenuOpen(false)
              }}
            >
              <LogOut size={16} />
              Disconnect
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <button className="wallet-pill" onClick={() => setModalOpen(true)}>
        <Wallet size={16} />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Connect Wallet" width="420px">
        <div className="wallet-modal-copy">
          <p>Connect MetaMask to use VAULTIS on Ethereum Sepolia.</p>
        </div>

        <div className="wallet-options">
          <button className="wallet-option wallet-option-metamask" onClick={handleConnectMetaMask} disabled={isConnecting}>
            <div className="wallet-option-main">
              <span className="wallet-option-icon">MM</span>
              <span>
                <strong>MetaMask</strong>
                <small>Ethereum Sepolia Testnet</small>
              </span>
            </div>
            <span className="wallet-network-badge blue">ETH</span>
          </button>
          {!metamaskDetected ? <InstallLink href="https://metamask.io/download/">Install MetaMask</InstallLink> : null}
        </div>
      </Modal>
    </>
  )
}
