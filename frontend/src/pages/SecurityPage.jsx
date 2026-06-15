import { Activity, Database, ShieldCheck, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CardSkeleton } from '../components/Loading'
import { TransactionHistory } from '../components/TransactionHistory'
import { useAuth } from '../contexts/AuthContext'
import { useLVTToken } from '../hooks/useLVTToken'
import { useSecurityStatus } from '../lib/api'
import { useWallet } from '../context/useWallet'

const SEPOLIA_CHAIN_ID = '0xaa36a7'
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111

function StatusValue({ children, tone = 'default', helper }) {
  return (
    <div className="security-status-group">
      <strong className={`security-stat-value ${tone}`}>{children}</strong>
      {helper ? <span className="security-stat-helper">{helper}</span> : null}
    </div>
  )
}

function MonitoringRow({ label, value, tone = 'default', helper }) {
  return (
    <div className="monitoring-row">
      <span className="monitoring-row-label">{label}</span>
      <div className="monitoring-row-value-wrap">
        <span className={`monitoring-row-value ${tone}`}>{value}</span>
        {helper ? <span className="monitoring-row-helper">{helper}</span> : null}
      </div>
    </div>
  )
}

export function SecurityPage() {
  const { user } = useAuth()
  const securityQuery = useSecurityStatus()
  const security = securityQuery.data?.security
  const { connectedWallet, walletAddress } = useWallet()
  const { contractReachable } = useLVTToken()
  const [walletState, setWalletState] = useState({
    connected: false,
    address: '',
    chainId: ''
  })

  const isSepolia = walletState.chainId === SEPOLIA_CHAIN_ID || Number(walletState.chainId) === SEPOLIA_CHAIN_ID_DECIMAL
  const walletConnected = Boolean(connectedWallet === 'metamask' && walletState.connected && walletState.address && isSepolia)
  const shortAddress = walletConnected ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}` : ''

  useEffect(() => {
    let active = true

    const syncWalletState = async () => {
      if (!window.ethereum?.request) {
        if (active) {
          setWalletState({ connected: false, address: '', chainId: '' })
        }
        return
      }

      try {
        const [accounts, chainId] = await Promise.all([
          window.ethereum.request({ method: 'eth_accounts' }),
          window.ethereum.request({ method: 'eth_chainId' })
        ])

        if (!active) {
          return
        }

        setWalletState({
          connected: Boolean(accounts?.[0]),
          address: accounts?.[0] || walletAddress || '',
          chainId: chainId || ''
        })
      } catch {
        if (active) {
          setWalletState({ connected: false, address: '', chainId: '' })
        }
      }
    }

    syncWalletState()

    if (!window.ethereum?.on) {
      return () => {
        active = false
      }
    }

    const handleAccountsChanged = (accounts) => {
      setWalletState((current) => ({
        ...current,
        connected: Boolean(accounts?.[0]),
        address: accounts?.[0] || ''
      }))
    }

    const handleChainChanged = (chainId) => {
      setWalletState((current) => ({
        ...current,
        chainId: chainId || ''
      }))
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      active = false
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [walletAddress])

  const ipfsConfigured = useMemo(() => security?.ipfsAvailability === 'configured', [security?.ipfsAvailability])
  const contractStatus = walletConnected && contractReachable ? 'Active' : 'Awaiting connection'
  const ipfsValue = ipfsConfigured ? 'Available' : 'Not configured'
  const ipfsTone = ipfsConfigured ? 'success' : 'muted'
  const walletTone = walletConnected ? 'success' : 'warning'
  const contractTone = contractStatus === 'Active' ? 'success' : 'warning'
  const lastCheckIn = security?.lastCheckIn || user?.lastCheckIn || null

  if (securityQuery.isLoading) {
    return (
      <div className="cards-grid three">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="cards-grid three security-stats-grid">
        <article className="glass-panel stat-card security-stat-card">
          <ShieldCheck size={20} />
          <span className="security-stat-label">Vault Health</span>
          <strong className="security-stat-value">{security?.vaultHealth ?? 0}%</strong>
        </article>
        <article className="glass-panel stat-card security-stat-card">
          <Wallet size={20} />
          <span className="security-stat-label">Wallet Auth</span>
          <StatusValue tone={walletTone} helper={walletConnected ? shortAddress : undefined}>
            {walletConnected ? 'Connected' : 'Not connected'}
          </StatusValue>
        </article>
        <article className="glass-panel stat-card security-stat-card">
          <Database size={20} />
          <span className="security-stat-label">IPFS Availability</span>
          <StatusValue
            tone={ipfsTone}
            helper={!ipfsConfigured ? 'IPFS storage is optional. Assets are encrypted in MongoDB by default.' : undefined}
          >
            {ipfsValue}
          </StatusValue>
        </article>
      </div>

      <div className="split-grid two-even">
        <article className="glass-panel">
          <h3>Live Monitoring</h3>
          <div className="security-monitoring-list">
            <MonitoringRow label="Encryption State" value={security?.encryptionState || '0/0 AES-256-GCM'} />
            <MonitoringRow label="Blockchain Sync" value={`${security?.blockchainSync ?? 0}%`} />
            <MonitoringRow label="Smart Contract Status" value={contractStatus} tone={contractTone} />
            <MonitoringRow label="Last Check-In" value={lastCheckIn ? new Date(lastCheckIn).toLocaleString('en-IN') : 'No check-in yet'} />
            <MonitoringRow label="Trusted Contact Coverage" value={`${security?.trustedContactCoverage ?? 0}%`} />
          </div>
        </article>

        <article className="glass-panel">
          <h3>Zero-Trust Controls</h3>
          <div className="security-monitoring-list security-controls-list">
            <div className="monitoring-row with-icon">
              <div className="monitoring-row-inline">
                <Activity size={16} />
                <span className="monitoring-row-label">Session security</span>
              </div>
              <span className="monitoring-row-value">{security?.sessionSecurity}</span>
            </div>
            <div className="monitoring-row with-icon">
              <div className="monitoring-row-inline">
                <Activity size={16} />
                <span className="monitoring-row-label">Emergency pause</span>
              </div>
              <span className="monitoring-row-value">{security?.emergencyPaused ? 'Enabled' : 'Not active'}</span>
            </div>
            <div className="monitoring-row with-icon">
              <div className="monitoring-row-inline">
                <Activity size={16} />
                <span className="monitoring-row-label">Inheritance workflow</span>
              </div>
              <span className="monitoring-row-value">Monitored continuously</span>
            </div>
          </div>
        </article>
      </div>

      <TransactionHistory onRefresh={walletAddress || 'security-history'} />
    </div>
  )
}
