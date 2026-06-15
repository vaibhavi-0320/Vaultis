import { Fingerprint, LoaderCircle, RefreshCw, ShieldAlert, ShieldCheck, TimerReset, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardSkeleton } from '../components/Loading'
import { TransactionHistory } from '../components/TransactionHistory'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../context/useWallet'
import { useLVTToken } from '../hooks/useLVTToken'
import { API_BASE, useCheckInMutation, useCheckInStatus, useOverview, useSecurityStatus } from '../lib/api'

function calculateCountdown(lastCheckIn, intervalDays = 45) {
  if (!lastCheckIn) {
    return { days: intervalDays, hours: 0, minutes: 0, seconds: 0, daysLeft: intervalDays }
  }

  const checkInTime = new Date(lastCheckIn).getTime()
  if (Number.isNaN(checkInTime)) {
    return { days: intervalDays, hours: 0, minutes: 0, seconds: 0, daysLeft: intervalDays }
  }

  const nextCheckIn = checkInTime + (intervalDays * 24 * 60 * 60 * 1000)
  const remaining = Math.max(0, nextCheckIn - Date.now())
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, daysLeft: days }
}

function formatCheckInDate(dateValue) {
  if (!dateValue) return 'Never'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Never'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function Countdown({ lastCheckIn, intervalDays = 45 }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const { days: remainingDays, hours: remainingHours, minutes: remainingMinutes, seconds: remainingSeconds, daysLeft } = calculateCountdown(lastCheckIn, intervalDays)
  const days = String(remainingDays).padStart(2, '0')
  const hours = String(remainingHours).padStart(2, '0')
  const minutes = String(remainingMinutes).padStart(2, '0')
  const seconds = String(remainingSeconds).padStart(2, '0')
  const urgencyClass = daysLeft > 10 ? 'timer-normal' : daysLeft > 3 ? 'timer-warning' : 'timer-danger'

  return (
    <div className={`timer-card ${urgencyClass}`}>
      <span className={`days ${urgencyClass}`}>{days} Days</span>
      <span className={`clock ${urgencyClass}`}>{hours}:{minutes}:{seconds}</span>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const { connectedWallet, walletAddress } = useWallet()
  const status = useCheckInStatus()
  const overview = useOverview()
  const security = useSecurityStatus()
  const checkInMutation = useCheckInMutation()
  const {
    lvtBalance,
    isLoading: lvtLoading,
    error: lvtError,
    canCheckIn,
    hoursUntilNextCheckIn,
    contractReachable,
    contractConfigured,
    isDemoOverrideActive,
    checkInAndEarn,
    fetchBalance,
    addLVTToMetaMask,
    resetCooldownForDemo,
    applyDemoReward
  } = useLVTToken()
  const [isChainConfirming, setIsChainConfirming] = useState(false)
  const [addedToMetaMask, setAddedToMetaMask] = useState(() => window.localStorage.getItem('lvt_added_to_metamask') === 'true')
  const [optimisticLastCheckIn, setOptimisticLastCheckIn] = useState(null)
  const [txRefresh, setTxRefresh] = useState(0)

  const summary = overview.data?.summary
  const securityState = security.data?.security
  const loading = status.isLoading || overview.isLoading || security.isLoading
  const walletConnected = Boolean(connectedWallet === 'metamask' && walletAddress)
  const effectiveLastCheckIn = optimisticLastCheckIn || status.data?.lastCheckIn
  const daysUntilWarning = effectiveLastCheckIn
    ? Math.max(0, 45 - Math.floor((Date.now() - new Date(effectiveLastCheckIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 45

  useEffect(() => {
    if (status.data?.lastCheckIn) {
      setOptimisticLastCheckIn(status.data.lastCheckIn)
    } else if (status.data && !status.data.lastCheckIn) {
      setOptimisticLastCheckIn(null)
    }
  }, [status.data?.lastCheckIn])

  useEffect(() => {
    const handleDemoReset = async (event) => {
      if (!event.ctrlKey || !event.shiftKey || event.key.toLowerCase() !== 'd') {
        return
      }
      event.preventDefault()

      try {
        pushToast({
          type: 'info',
          title: 'Resetting demo state...',
          message: 'Clearing cooldown, history, and local demo data.'
        })

        const response = await fetch(`${API_BASE}/api/checkin/demo-reset`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('vaultis_token') || sessionStorage.getItem('vaultis_token') || ''}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message)
        }

        localStorage.removeItem('vaultis_last_checkin')
        localStorage.removeItem('vaultis_tx_history')
        localStorage.removeItem('vaultis_lvt_balance')

        resetCooldownForDemo()
        setOptimisticLastCheckIn(null)
        setTxRefresh((current) => current + 1)

        pushToast({
          type: 'success',
          title: 'Demo reset complete!',
          message: 'Ready to check in again.'
        })

        window.setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (error) {
        pushToast({
          type: 'error',
          title: 'Reset failed',
          message: error.message
        })
      }
    }

    window.addEventListener('keydown', handleDemoReset)
    return () => window.removeEventListener('keydown', handleDemoReset)
  }, [pushToast, resetCooldownForDemo])

  const runCheckIn = async () => {
    if (walletConnected && contractConfigured && !isDemoOverrideActive && !canCheckIn) {
      pushToast({
        type: 'warning',
        title: 'Cooldown active',
        message: 'Cooldown active. Press Ctrl+Shift+D to reset for the demo.'
      })
      return
    }

    try {
      const result = await checkInMutation.mutateAsync()
      localStorage.setItem('vaultis_lvt_balance', String(result.lvtBalance ?? 0))
      setOptimisticLastCheckIn(new Date().toISOString())
      setTxRefresh((current) => current + 1)

      if (isDemoOverrideActive) {
        applyDemoReward(result.reward || 10)
        pushToast({
          type: 'success',
          title: 'Demo heartbeat confirmed',
          message: `+${result.reward || 10} LVT recorded for the demo without waiting for the on-chain cooldown.`
        })
        return
      }

      if (!contractConfigured) {
        await fetchBalance()
        pushToast({
          type: 'warning',
          title: 'Heartbeat confirmed',
          message: 'Contract not deployed yet — check-in recorded locally only.'
        })
        return
      }

      if (walletConnected && contractReachable && result.blockchainStatus !== 'confirmed' && canCheckIn) {
        setIsChainConfirming(true)
        const chainResult = await checkInAndEarn()

        if (chainResult.success) {
          setTxRefresh((current) => current + 1)
          pushToast({
            type: 'success',
            title: 'Heartbeat confirmed',
            message: `+10 LVT earned! TX: ${chainResult.txHash.slice(0, 10)}...`
          })
        } else if (chainResult.reason === 'user_rejected') {
          pushToast({
            type: 'warning',
            title: 'Transaction rejected',
            message: 'MetaMask transaction was rejected by the user.'
          })
        } else if (chainResult.reason === 'cooldown') {
          pushToast({
            type: 'warning',
            title: 'Cooldown active',
            message: 'Check-in cooldown active. Wait 24 hours between check-ins.'
          })
        } else if (chainResult.reason === 'no_contract') {
          pushToast({
            type: 'warning',
            title: 'Heartbeat confirmed',
            message: 'Contract not deployed yet — check-in recorded locally only.'
          })
        } else {
          pushToast({
            type: 'warning',
            title: 'Heartbeat confirmed',
            message: chainResult.error || 'Vault status updated, but the on-chain mint still needs attention.'
          })
        }
      } else {
        await fetchBalance()
        pushToast({
          type: 'success',
          title: 'Heartbeat confirmed',
          message: result.blockchainStatus === 'confirmed'
            ? 'Your heartbeat and on-chain reward are both confirmed.'
          : walletConnected
              ? 'Check-in recorded. Connect the deployed contract to trigger MetaMask reward minting.'
              : 'Check-in recorded locally. Connect your Sepolia wallet to mint on-chain rewards.'
        })
      }
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Check-in failed',
        message: error?.payload?.message || error?.message || 'The heartbeat request did not complete.'
      })
    } finally {
      setIsChainConfirming(false)
    }
  }

  const handleAddToMetaMask = async () => {
    const result = await addLVTToMetaMask()

    if (result.success) {
      window.localStorage.setItem('lvt_added_to_metamask', 'true')
      setAddedToMetaMask(true)
      pushToast({
        type: 'success',
        title: 'LVT added',
        message: 'Legacy Vault Token is now visible in MetaMask.'
      })
      return
    }

    if (result.reason === 'no_contract') {
      pushToast({
        type: 'warning',
        title: 'Deploy contract first',
        message: 'Deploy contract first, then add LVT to MetaMask.'
      })
      return
    }

    if (result.reason === 'user_rejected') {
      pushToast({
        type: 'info',
        title: 'MetaMask update skipped',
        message: 'You declined adding LVT to MetaMask.'
      })
      return
    }

    pushToast({
      type: 'warning',
      title: 'MetaMask update skipped',
      message: result.error || 'MetaMask did not add the token. Try again after the contract is deployed.'
    })
  }

  if (loading) {
    return (
      <div className="cards-grid three">
        <CardSkeleton tall />
        <CardSkeleton tall />
        <CardSkeleton tall />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="dashboard-grid dashboard-grid-modern">
        <section className="dashboard-main">
          <article className="hero-card">
            <div className="panel-head">
              <div className="status-chip success">Live heartbeat monitoring</div>
              <div className="status-chip subtle">{status.data?.status}</div>
            </div>
            <p className="section-label centered">Next required check-in</p>
            <Countdown lastCheckIn={effectiveLastCheckIn} intervalDays={user?.checkInIntervalDays || 45} />
            <button
              className={`button primary large wide checkin-button ${lvtLoading || checkInMutation.isPending || isChainConfirming ? 'is-loading' : canCheckIn || !contractConfigured ? 'is-ready' : 'is-cooldown'}`}
              onClick={runCheckIn}
              disabled={checkInMutation.isPending || isChainConfirming}
            >
              {checkInMutation.isPending || isChainConfirming ? <LoaderCircle className="spin" size={18} /> : <Fingerprint size={18} />}
              {checkInMutation.isPending
                ? 'Verifying heartbeat...'
                : isChainConfirming
                  ? 'Confirming on-chain...'
                  : "I'm Alive - Check In"}
            </button>
            {walletConnected && contractReachable && !canCheckIn ? (
              <p className="checkin-cooldown">Cooldown active. Next on-chain check-in in about {hoursUntilNextCheckIn} hour{hoursUntilNextCheckIn === 1 ? '' : 's'}.</p>
            ) : null}
            <div className="hero-meta">
              <div>
                <span>Last check-in</span>
                <strong>{formatCheckInDate(effectiveLastCheckIn)}</strong>
              </div>
              <div>
                <span>Days until warning</span>
                <strong>{daysUntilWarning}</strong>
              </div>
            </div>
          </article>

          <div className="cards-grid three dashboard-stat-grid">
            <article className="glass-panel stat-card dashboard-stat-card">
              <ShieldCheck size={20} />
              <span>Trust confidence</span>
              <strong>{summary?.trustAverage ?? 0}%</strong>
            </article>
            <article className="glass-panel stat-card dashboard-stat-card">
              <TimerReset size={20} />
              <span>Vault integrity</span>
              <strong>{summary?.integrityAverage ?? 0}%</strong>
            </article>
            <article className="glass-panel stat-card dashboard-stat-card lvt-balance-card">
              <Wallet size={20} />
              <div className="stat-card-head">
                <span className="stat-card-title">LVT balance</span>
                <button
                  type="button"
                  className={`icon-button subtle stat-card-refresh ${lvtLoading ? 'balance-pulse' : ''}`}
                  onClick={fetchBalance}
                  aria-label="Refresh LVT balance"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <strong>
                {lvtLoading ? <span className="balance-placeholder" /> : !walletConnected ? 'Connect wallet' : !contractConfigured ? '— LVT' : `${parseFloat(lvtBalance || '0').toFixed(2)} LVT`}
              </strong>
              <span className="stat-card-subtle">
                {!contractConfigured
                  ? 'Deploy contract to see live LVT balance'
                  : lvtError
                    ? lvtError
                    : contractReachable
                      ? 'Live on-chain balance'
                      : 'Awaiting wallet sync'}
              </span>
              <button
                className="button ghost wide"
                type="button"
                onClick={handleAddToMetaMask}
                disabled={!contractConfigured || addedToMetaMask}
                title={!contractConfigured ? 'Deploy contract first' : undefined}
              >
                {addedToMetaMask ? 'LVT added to MetaMask' : '+ Add LVT to MetaMask'}
              </button>
            </article>
          </div>

          <div className="split-grid two-even">
            <article className="glass-panel">
              <h3>Case timeline</h3>
              <div className="activity-list">
                {(summary?.activity || []).map((item) => (
                  <div key={item._id} className="activity-item">
                    <span className={`timeline-dot ${item.severity === 'critical' ? 'warning' : 'blue'}`} />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-panel">
              <h3>Live security monitoring</h3>
              <div className="summary-grid">
                <div>
                  <span>Wallet status</span>
                  <strong>{securityState?.walletConnected ? 'Connected' : 'Pending'}</strong>
                </div>
                <div>
                  <span>Vault health</span>
                  <strong>{securityState?.vaultHealth}%</strong>
                </div>
                <div>
                  <span>Blockchain sync</span>
                  <strong>{securityState?.blockchainSync}%</strong>
                </div>
                <div>
                  <span>IPFS</span>
                  <strong>{securityState?.ipfsAvailability}</strong>
                </div>
              </div>
            </article>
          </div>

          <TransactionHistory onRefresh={txRefresh} />
        </section>

        <aside className="dashboard-side glass-panel">
          <h3>Workflow status</h3>
          <div className="contact-stack">
            <div className="contact-card">
              <div className="avatar large">A1</div>
              <div>
                <strong>Protected assets</strong>
                <span>{summary?.assetCount ?? 0} tracked records</span>
              </div>
            </div>
            <div className="contact-card">
              <div className="avatar large">C2</div>
              <div>
                <strong>Trusted contacts</strong>
                <span>{summary?.contactCount ?? 0} validators</span>
              </div>
            </div>
            <div className="contact-card">
              <div className="avatar large">W3</div>
              <div>
                <strong>Will proof</strong>
                <span>{summary?.will?.proofStatus || 'draft'}</span>
              </div>
            </div>
          </div>
          {!walletAddress ? (
            <div className="notice-banner warning">
              <ShieldAlert size={18} />
              <p>Connect a Sepolia wallet to activate full proof registration and live contract sync.</p>
            </div>
          ) : null}
          <Link className="button ghost wide" to="/security">
            Open Security Panel
          </Link>
        </aside>
      </div>
    </div>
  )
}
