import { Coins, LoaderCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import { useWallet } from '../context/useWallet'
import { useLVTToken } from '../hooks/useLVTToken'
import { useStakeMutation, useTokenBalance, useUnstakeMutation } from '../lib/api'

export function TokensPage() {
  const { pushToast } = useToast()
  const { connectedWallet } = useWallet()
  const balanceQuery = useTokenBalance()
  const stakeMutation = useStakeMutation()
  const unstakeMutation = useUnstakeMutation()
  const { lvtBalance, totalSupply, canCheckIn, hoursUntilNextCheckIn, contractReachable, fetchBalance } = useLVTToken()
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')

  const data = balanceQuery.data
  const walletConnected = connectedWallet === 'metamask'

  const submitStake = async (event) => {
    event.preventDefault()
    const result = await stakeMutation.mutateAsync(Number(stakeAmount))
    pushToast({ type: 'success', title: 'Stake confirmed', message: result.message })
    setStakeAmount('')
  }

  const submitUnstake = async (event) => {
    event.preventDefault()
    const result = await unstakeMutation.mutateAsync(Number(unstakeAmount))
    pushToast({ type: 'success', title: 'Unstake confirmed', message: `${result.message}` })
    setUnstakeAmount('')
  }

  return (
    <div className="page-stack">
      <div className="page-hero">
        <div>
          <h1>LVT Token Center</h1>
          <p>Track your live balance, stake for yield, and grow your inheritance signal every time you check in on time.</p>
        </div>
        <Link className="button primary rounded" to="/dashboard">
          Start Earning
        </Link>
      </div>

      <div className="cards-grid three">
        <article className="glass-panel stat-card">
          <Coins size={20} />
          <span>Available Balance</span>
          <strong>{walletConnected ? `${lvtBalance} LVT` : 'Connect wallet'}</strong>
        </article>
        <article className="glass-panel stat-card">
          <TrendingUp size={20} />
          <span>Total Supply</span>
          <strong>{contractReachable ? `${totalSupply} LVT` : 'Awaiting deployment'}</strong>
        </article>
        <article className="glass-panel stat-card">
          <Coins size={20} />
          <span>Check-in Status</span>
          <strong>{canCheckIn ? 'Ready to earn' : `${hoursUntilNextCheckIn}h cooldown`}</strong>
        </article>
      </div>

      <div className="glass-panel token-live-panel">
        <div className="token-live-row">
          <span>Your Balance</span>
          <strong>{walletConnected ? `${lvtBalance} LVT` : 'Connect MetaMask on Sepolia'}</strong>
        </div>
        <div className="token-live-row">
          <span>Backend Balance Mirror</span>
          <strong>{data?.lvtBalance ?? 0} LVT</strong>
        </div>
        <div className="token-live-row">
          <span>Network</span>
          <strong>Ethereum Sepolia</strong>
        </div>
        <div className="token-live-actions">
          <button className="button ghost" type="button" onClick={fetchBalance}>
            Refresh Contract Data
          </button>
        </div>
      </div>

      <div className="split-grid two-even">
        <form className="glass-panel token-form" onSubmit={submitStake}>
          <h3>Stake Tokens</h3>
          <p>Stake your LVT for 5% APY. Rewards accrue while your vault remains active.</p>
          <input type="number" min="0" step="0.01" value={stakeAmount} onChange={(event) => setStakeAmount(event.target.value)} placeholder="Amount to stake" />
          <button className="button primary large" type="submit" disabled={stakeMutation.isPending}>
            {stakeMutation.isPending ? <LoaderCircle className="spin" size={18} /> : null}
            Stake
          </button>
        </form>

        <form className="glass-panel token-form" onSubmit={submitUnstake}>
          <h3>Unstake Tokens</h3>
          <p>Withdraw your staked amount and collect the earned reward back into your balance.</p>
          <input type="number" min="0" step="0.01" value={unstakeAmount} onChange={(event) => setUnstakeAmount(event.target.value)} placeholder="Amount to unstake" />
          <button className="button ghost large" type="submit" disabled={unstakeMutation.isPending}>
            {unstakeMutation.isPending ? <LoaderCircle className="spin" size={18} /> : null}
            Unstake
          </button>
        </form>
      </div>

      <div className="glass-panel staking-summary">
        <h3>Yield Snapshot</h3>
        <div className="summary-grid">
          <div>
            <span>Staking Duration</span>
            <strong>{data?.stakingDays ?? 0} days</strong>
          </div>
          <div>
            <span>Total Rewards Earned</span>
            <strong>{data?.totalRewardsEarned ?? 0} LVT</strong>
          </div>
          <div>
            <span>APY</span>
            <strong>{data?.apy ?? '5%'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
