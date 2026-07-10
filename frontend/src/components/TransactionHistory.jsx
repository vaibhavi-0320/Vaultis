import { useEffect, useState } from 'react'
import { checkInApi } from '../lib/api'

function formatTimestamp(value) {
  if (!value) {
    return 'Pending timestamp'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Pending timestamp'
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function readLocalHistory() {
  try {
    return JSON.parse(window.localStorage.getItem('vaultis_tx_history') || '[]')
  } catch {
    return []
  }
}

function isValidTxHash(hash) {
  return /^0x[0-9a-fA-F]{64}$/.test(String(hash || ''))
}

function getSepoliaTxUrl(hash) {
  return isValidTxHash(hash) ? `https://sepolia.etherscan.io/tx/${hash}` : ''
}

function TransactionHistory({ onRefresh = 0 }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const data = await checkInApi.history()
      if (data.success && Array.isArray(data.history) && data.history.length > 0) {
        setHistory(data.history)
      } else {
        setHistory(readLocalHistory())
      }
    } catch {
      setHistory(readLocalHistory())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [onRefresh])

  const copyToClipboard = (text) => {
    if (!text) {
      return
    }

    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className="glass-panel transaction-history-panel">
      <div className="transaction-history-head">
        <div>
          <h3>Transaction History</h3>
          <p className="transaction-empty-copy" style={{ marginTop: 4 }}>
            Verifiable on Ethereum Sepolia Testnet
          </p>
        </div>
        <div className="transaction-row-side">
          <span className="transaction-network-pill">{history.filter((item) => item.txHash).length} on-chain</span>
          <button
            type="button"
            onClick={fetchHistory}
            className="icon-button subtle"
            aria-label="Refresh transaction history"
            title="Refresh transaction history"
          >
            ↻
          </button>
        </div>
      </div>

      {loading ? (
        <div className="transaction-history-list">
          {[1, 2, 3].map((item) => (
            <div key={item} className="transaction-row" style={{ minHeight: 64, opacity: 0.45 }} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="transaction-empty-copy" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <p>No transactions yet.</p>
          <p style={{ marginTop: 4 }}>Complete a check-in to see your first on-chain record.</p>
        </div>
      ) : (
        <div className="transaction-history-list">
          {history.map((tx, index) => {
            const validTxHash = isValidTxHash(tx.txHash)
            const txUrl = tx.status === 'confirmed' ? (tx.etherscanUrl || getSepoliaTxUrl(tx.txHash)) : ''
            return (
              <div key={`${tx.txHash || 'local'}-${tx.timestamp || index}`} className="transaction-row">
                <div className="transaction-row-main">
                  <div className={`transaction-status-dot ${tx.status === 'confirmed' ? 'confirmed' : 'simulated'}`} />
                  <div>
                    <p className="transaction-title">Heartbeat Check-In</p>
                    <p className="transaction-time">{formatTimestamp(tx.timestamp)}</p>
                    {tx.blockNumber ? <p className="transaction-time">Block #{tx.blockNumber}</p> : null}
                  </div>
                </div>

                <div className="transaction-row-side">
                  <span className="transaction-reward">+{tx.lvtRewarded || 10} LVT</span>

                  {validTxHash ? (
                    <div className="transaction-row-side">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tx.txHash)}
                        className="icon-button subtle"
                        title="Copy full hash"
                        aria-label="Copy full hash"
                      >
                        ⎘
                      </button>

                      {txUrl ? (
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transaction-link"
                        >
                          <span>{tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}</span>
                          <span>↗</span>
                        </a>
                      ) : (
                        <span className="transaction-local-pill">Pending confirmation</span>
                      )}
                    </div>
                  ) : (
                    <span className="transaction-local-pill">
                      {tx.status === 'pending' ? 'Pending confirmation' : 'local only'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {history.some((item) => isValidTxHash(item.txHash) && item.status === 'confirmed') ? (
        <div className="transaction-empty-copy" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          All confirmed transactions are permanently recorded on Ethereum Sepolia Testnet and publicly verifiable.
        </div>
      ) : null}
    </div>
  )
}

export { TransactionHistory }
