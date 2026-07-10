import { Clock3, HelpCircle, Shield, CheckCheck, Download, KeyRound, LockKeyhole } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

function BeneficiaryContent({ triggered }) {
  const { isDark } = useTheme()
  const stages = [
    ['UNLOCKED', 'Day 1: Identity & Credentials', 'Master keys and digital identities transferred.', true],
    [triggered ? 'UNLOCKED' : 'NEXT STEP', 'Day 3: Financial Assets', 'Bank accounts, crypto-wallets, and stocks accessible.', triggered],
    ['PENDING', 'Day 7: Real Estate & Legal', 'Titles, deeds, and official legal documents in transfer.', false]
  ]

  if (!triggered) {
    return (
      <div className="page-stack beneficiary-content">
        <div className="notice-banner warning">
          <Clock3 size={18} />
          <p>No active inheritance event.</p>
        </div>
        <div className="split-grid timeline-layout">
          <div className="timeline-column">
            {stages.map(([badge, title, body, complete], index) => (
              <div className="timeline-stage" key={title}>
                <div className={`timeline-mark ${complete ? 'complete' : index === 2 ? 'pending' : 'next'}`}>{complete ? <CheckCheck size={18} /> : <Clock3 size={18} />}</div>
                <div>
                  <span className={`timeline-badge ${badge === 'PENDING' ? 'warning' : 'success'}`}>{badge}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel assets-portal">
            <div className="panel-head">
              <h3>Prepared Release Preview</h3>
              <span className="status-chip subtle">Staged timeline ready</span>
            </div>
            <div className="portal-grid">
              {[
                ['Stage 1 Preview', 'Identity & Credentials', 'Passwords, digital IDs, and recovery notes', KeyRound],
                ['Stage 2 Preview', 'Financial Assets', 'Crypto wallets, account notes, and ledger references', LockKeyhole],
                ['Stage 3 Preview', 'Legal Documents', 'Estate files, deeds, and final directives', Download]
              ].map(([action, title, subtitle, Icon]) => (
                <article className="portal-card" key={title}>
                  <div className="portal-top">
                    <div className="asset-icon blue"><Icon size={20} /></div>
                    <span>{action}</span>
                  </div>
                  <h4>{title}</h4>
                  <p>{subtitle}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack beneficiary-content">
      <div className="beneficiary-header">
        <div className="status-chip success">{isDark ? 'System Status: Active Release' : 'Your journey is being guided'}</div>
        <h1>{isDark ? 'Inheritance Activation in Progress' : 'A Step Toward Stewardship'}</h1>
        <p>
          {isDark
            ? 'VAULTIS is systematically decrypting and releasing your allocated assets according to a high-security schedule.'
            : 'We are here to help you through this transition, ensuring every step is clear, supported, and secure.'}
        </p>
      </div>

      <div className="split-grid timeline-layout">
        <div className="timeline-column">
          {stages.map(([badge, title, body, complete], index) => (
            <div className="timeline-stage" key={title}>
              <div className={`timeline-mark ${complete ? 'complete' : index === 2 ? 'pending' : 'next'}`}>{complete ? <CheckCheck size={18} /> : <Clock3 size={18} />}</div>
              <div>
                <span className={`timeline-badge ${badge === 'PENDING' ? 'warning' : 'success'}`}>{badge}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel assets-portal">
          <div className="panel-head">
            <h3>{isDark ? 'Unlocked Assets' : 'Gifts Prepared for You'}</h3>
            <span className="status-chip success">SECURE ACCESS GRANTED</span>
          </div>
          <div className="portal-grid">
            {[
              ['DOWNLOAD VAULT →', 'Main Financial Portfolio', 'Secured Ledger: #LV-4921-X', Download],
              ['VIEW KEYS →', 'Digital Life Credentials', '24 secured vault entries', KeyRound],
              ['ACCESS PORTAL →', 'Crypto Assets Storage', 'Multi-sig hardware bridge', LockKeyhole],
              ['Next Release in 4 days', 'Legal Documents & Estate Assets', 'Pending stage transfer', Clock3]
            ].map(([action, title, subtitle, Icon], index) => (
              <article className={`portal-card ${index === 3 ? 'pending' : ''}`} key={title}>
                <div className="portal-top">
                  <div className="asset-icon blue"><Icon size={20} /></div>
                  <span>{action}</span>
                </div>
                <h4>{title}</h4>
                <p>{subtitle}</p>
                {index === 3 ? null : <div className="progress-track"><div className="progress-fill blue" style={{ width: '100%' }} /></div>}
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel guidance-card">
        <div className="asset-icon blue"><HelpCircle size={22} /></div>
        <div>
          <h3>Reassuring Guidance</h3>
          <p>
            We understand this transition can feel overwhelming. Every release is paired with supportive guidance, legal references,
            and a concierge contact for next steps.
          </p>
        </div>
      </div>

      <div className="cards-grid three">
        {[
          ['Legal Verification', 'Certified by Global Trust Alliance'],
          ['256-bit Decryption', 'Military-grade asset protection'],
          ['Global Redundancy', 'Indestructible node-based backup']
        ].map(([title, subtitle]) => (
          <article className="image-card" key={title}>
            <div className="image-overlay">
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function BeneficiaryPage() {
  const { user } = useAuth()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const publicView = query.get('public') === 'true' || Boolean(query.get('token'))
  const triggered = ['triggered', 'released'].includes(user?.status) || publicView

  if (user) {
    return (
      <AppShell title="Beneficiary Portal">
        <BeneficiaryContent triggered={triggered} />
      </AppShell>
    )
  }

  return <BeneficiaryContent triggered={publicView} />
}
