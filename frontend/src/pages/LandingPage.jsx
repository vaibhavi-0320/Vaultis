import { ArrowRight, CheckCircle2, Moon, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { VaultisBrand } from '../components/VaultisBrand'
import { WalletConnectButton } from '../components/WalletConnectButton'

const protocolItems = [
  'Encrypted Vaults',
  'Timed Release Controls',
  'ERC-20 LVT Token',
  'AES-256 Encrypted',
  'Dead Man Switch',
  'Trustless Inheritance',
  'Zero Custody',
  'Verifiable Check-ins',
  'Beneficiary Safeguards',
  'Smart Contracts',
  'Progressive Release'
]

const protocolSteps = [
  {
    number: '01',
    title: 'Secure Your Assets',
    body: 'Encrypt passwords, wallet keys, recovery phrases, and documents before they ever touch storage.'
  },
  {
    number: '02',
    title: 'Assign Beneficiaries',
    body: 'Choose trusted contacts and define how inheritance should be confirmed when you miss a check-in.'
  },
  {
    number: '03',
    title: 'Configure Dead Man Switch',
    body: 'Set your preferred interval and let Vaultis track your heartbeat through regular on-chain check-ins.'
  },
  {
    number: '04',
    title: 'Trigger Staged Release',
    body: 'After confirmations arrive, assets unlock gradually across timed release stages instead of all at once.'
  }
]

const securityHighlights = [
  {
    title: 'Client-side encryption',
    body: 'Sensitive vault records are encrypted with modern standards before backend persistence.'
  },
  {
    title: 'Proof of activity',
    body: 'Each check-in creates a verifiable activity trail so your vault always has a clear signal of intent.'
  },
  {
    title: 'Human verification',
    body: 'Trusted contacts participate in confirmation so a missed check-in does not instantly release assets.'
  },
  {
    title: 'Progressive safeguards',
    body: 'Timed stages reduce panic risk and give your network room to intervene if something looks wrong.'
  }
]

const tokenStats = [
  ['Total Supply', '1,000,000 LVT'],
  ['Check-in Reward', '10 LVT'],
  ['Staking APY', '5%'],
  ['Vault Mode', 'Active Verification'],
  ['Standard', 'ERC-20'],
  ['Contract Base', 'OpenZeppelin']
]

const comparisonRows = [
  ['Automated inheritance trigger', 'No', 'Yes'],
  ['Blockchain-verifiable proof', 'No', 'Yes'],
  ['Encrypted secret storage', 'Limited', 'Yes'],
  ['Dead man switch workflow', 'Rare', 'Yes'],
  ['Staged asset release', 'No', 'Yes'],
  ['Tokenized engagement rewards', 'No', 'Yes']
]

const landingPageStyles = `
  .landing-page {
    min-height: 100vh;
    isolation: isolate;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 60% 20%, rgba(77, 142, 255, 0.08) 0%, transparent 60%),
      #080a0f;
    color: #ffffff;
  }

  .landing-page::before,
  .landing-page::after {
    display: none;
  }

  .landing-page .landing-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
    min-height: 76px;
    padding: 0 40px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(8, 10, 15, 0.76);
    backdrop-filter: blur(18px);
  }

  .landing-page .landing-nav .vaultis-brand {
    gap: 10px;
  }

  .landing-page .landing-nav .vaultis-brand-word {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .landing-page .landing-nav .vaultis-brand-tagline {
    display: none;
  }

  .landing-page .landing-links {
    display: flex;
    justify-content: center;
    gap: 40px;
    color: rgba(255, 255, 255, 0.55);
  }

  .landing-page .landing-links a {
    color: rgba(255, 255, 255, 0.55);
    font-size: 14px;
    font-weight: 400;
    text-decoration: none;
    transition: color 150ms ease;
  }

  .landing-page .landing-links a:hover {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
  }

  .landing-page .landing-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .landing-page .landing-actions .icon-button {
    width: auto;
    height: auto;
    padding: 8px;
    color: rgba(255, 255, 255, 0.5);
    background: transparent;
    border: none;
    border-radius: 10px;
  }

  .landing-page .landing-actions .icon-button:hover {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.9);
  }

  .landing-page .landing-actions .wallet-pill {
    min-height: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 14px;
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .landing-page .landing-actions .wallet-network-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(77, 142, 255, 0.15);
    color: #4d8eff;
    border: 1px solid rgba(77, 142, 255, 0.25);
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }

  .landing-page .landing-actions .button.ghost {
    min-height: auto;
    color: rgba(255, 255, 255, 0.6);
    background: transparent;
    padding: 8px 16px;
    font-size: 14px;
    border: none;
    border-radius: 10px;
  }

  .landing-page .landing-actions .button.ghost:hover {
    color: #ffffff;
    background: transparent;
  }

  .landing-page .landing-actions .button.primary {
    min-height: auto;
    background: #4d8eff;
    color: #ffffff;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    border: none;
  }

  .landing-page .hero-section {
    width: 100%;
    max-width: 1200px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 100px 40px 60px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 80px;
    align-items: center;
    background: transparent;
    background-image: none;
  }

  .landing-page .hero-copy {
    min-width: 0;
  }

  .landing-page .hero-kicker {
    display: block;
    color: rgba(255, 255, 255, 0.4);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    line-height: 1.5;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .landing-page .hero-kicker-line {
    display: none;
  }

  .landing-page .hero-copy h1 {
    margin: 0 0 20px;
    color: #ffffff;
    font-size: clamp(48px, 6vw, 72px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .landing-page .hero-copy h1 span {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
    font-style: italic;
    font-weight: 500;
    line-height: 1.6;
    letter-spacing: 0;
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .landing-page .hero-copy > p {
    max-width: 480px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 16px;
    line-height: 1.7;
    margin-bottom: 40px;
  }

  .landing-page .hero-copy .button-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 56px;
  }

  .landing-page .hero-copy .button.primary {
    min-height: auto;
    background: #4d8eff;
    color: #ffffff;
    padding: 14px 28px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 15px;
    border: none;
    cursor: pointer;
  }

  .landing-page .hero-copy .button.ghost {
    min-height: auto;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .landing-page .hero-copy .button.ghost:hover {
    color: rgba(255, 255, 255, 0.9);
    background: transparent;
  }

  .landing-page .interactive-card,
  .landing-page .interactive-button {
    transform: none;
    will-change: auto;
    transition: border-color 150ms ease, color 150ms ease, background 150ms ease, filter 150ms ease;
  }

  .landing-page .interactive-card::before,
  .landing-page .interactive-button::before {
    display: none;
  }

  .landing-page .interactive-card:hover,
  .landing-page .interactive-button:hover {
    transform: none;
    box-shadow: none;
  }

  .landing-page .stat-pills {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 0;
  }

  .landing-page .stat-pill {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 20px 24px;
    box-shadow: none;
  }

  .landing-page .stat-pill:hover {
    border-color: rgba(255, 255, 255, 0.07);
    box-shadow: none;
  }

  .landing-page .stat-pill strong {
    display: block;
    color: #ffffff;
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }

  .landing-page .stat-pill span {
    display: block;
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0.01em;
  }

  .landing-page .countdown-hero {
    width: 100%;
    max-width: 420px;
    justify-self: end;
    border-radius: 16px;
    box-shadow: none;
  }

  .landing-page .marquee-strip {
    overflow: hidden;
    border-block: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    padding: 18px 0;
  }

  .landing-page .marquee-track {
    display: flex;
    justify-content: center;
    width: max-content;
    flex-wrap: nowrap;
    gap: 14px 22px;
    animation: marquee 25s linear infinite;
  }

  .landing-page .marquee-track span {
    color: rgba(255, 255, 255, 0.38);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
  }

  .landing-page .section-block,
  .landing-page .token-island,
  .landing-page .landing-footer {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 96px 40px;
  }

  .landing-page .section-heading {
    margin-bottom: 48px;
  }

  .landing-page .section-heading span,
  .landing-page .section-kicker,
  .landing-page .section-label {
    display: block;
    color: rgba(255, 255, 255, 0.35);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    line-height: 1.5;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .landing-page .section-heading h2,
  .landing-page .token-island h2,
  .landing-page .comparison-wrap h2 {
    color: #ffffff;
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin: 0 0 16px;
  }

  .landing-page .token-island > div > p:not(.section-kicker),
  .landing-page .glass-panel p,
  .landing-page .footer-cta p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    line-height: 1.7;
  }

  .landing-page .token-island > div > p:not(.section-kicker) {
    max-width: 480px;
  }

  .landing-page .glass-panel,
  .landing-page .token-card,
  .landing-page .comparison-cell,
  .landing-page .comparison-header {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    padding: 32px;
    box-shadow: none;
    transition: border-color 150ms ease;
  }

  .landing-page .glass-panel:hover,
  .landing-page .token-card:hover,
  .landing-page .comparison-cell:hover {
    border-color: rgba(255, 255, 255, 0.14);
  }

  .landing-page .steps-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 0;
  }

  .landing-page .step-number {
    color: rgba(255, 255, 255, 0.25);
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 18px;
  }

  .landing-page .glass-panel h3 {
    color: #ffffff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 12px;
  }

  .landing-page .split-grid.two-even {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .landing-page .panel-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 10px;
  }

  .landing-page .panel-title svg {
    color: #4d8eff;
  }

  .landing-page .token-island {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 48px;
    align-items: center;
    color: #ffffff;
    background: transparent;
    border-radius: 0;
    overflow: visible;
  }

  .landing-page .token-island::before {
    display: none;
  }

  .landing-page .token-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 14px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
  }

  .landing-page .token-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 15px;
    margin-top: 24px;
  }

  .landing-page .token-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .landing-page .token-row span {
    color: rgba(255, 255, 255, 0.45);
    font-size: 14px;
  }

  .landing-page .token-row strong {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .landing-page .comparison-table {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.8fr;
    gap: 12px;
    background: transparent;
    border-radius: 0;
    overflow: visible;
  }

  .landing-page .comparison-header,
  .landing-page .comparison-cell {
    min-height: 62px;
    justify-content: center;
    color: rgba(255, 255, 255, 0.62);
    font-size: 14px;
  }

  .landing-page .comparison-header {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 700;
  }

  .landing-page .comparison-header.accent,
  .landing-page .comparison-cell.accent {
    background: rgba(77, 142, 255, 0.12);
    border-color: rgba(77, 142, 255, 0.24);
    color: rgba(255, 255, 255, 0.85);
  }

  .landing-page .landing-footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 48px;
    align-items: start;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.7);
    background: transparent;
  }

  .landing-page .landing-footer .vaultis-brand-word {
    color: #ffffff;
  }

  .landing-page .footer-links {
    display: grid;
    gap: 12px;
  }

  .landing-page .footer-links a {
    color: rgba(255, 255, 255, 0.55);
    font-size: 14px;
  }

  .landing-page .footer-cta {
    justify-self: end;
    max-width: 340px;
  }

  .landing-page .footer-cta .button.primary {
    background: #4d8eff;
    color: #ffffff;
    padding: 14px 22px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
  }

  .landing-page .pulse {
    animation: none;
  }

  @media (max-width: 1100px) {
    .landing-page .landing-nav {
      grid-template-columns: auto auto;
      gap: 24px;
    }

    .landing-page .landing-links {
      display: none;
    }

    .landing-page .hero-section,
    .landing-page .token-island {
      grid-template-columns: 1fr;
      gap: 48px;
    }

    .landing-page .countdown-hero {
      width: 100%;
      max-width: 420px;
      justify-self: start;
    }

    .landing-page .steps-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 767px) {
    .landing-page .landing-nav {
      position: sticky;
      min-height: auto;
      padding: 16px;
      grid-template-columns: 1fr;
      align-items: start;
    }

    .landing-page .landing-actions {
      width: 100%;
      gap: 10px;
      flex-wrap: wrap;
    }

    .landing-page .hero-section,
    .landing-page .section-block,
    .landing-page .token-island,
    .landing-page .landing-footer {
      padding-left: 24px;
      padding-right: 24px;
    }

    .landing-page .hero-section {
      min-height: auto;
      padding-top: 64px;
    }

    .landing-page .hero-copy h1 {
      font-size: 48px;
    }

    .landing-page .hero-copy .button-row,
    .landing-page .stat-pills,
    .landing-page .steps-grid,
    .landing-page .split-grid.two-even,
    .landing-page .comparison-table,
    .landing-page .landing-footer {
      grid-template-columns: 1fr;
    }

    .landing-page .hero-copy .button-row {
      display: grid;
    }

    .landing-page .landing-footer {
      gap: 32px;
    }

    .landing-page .footer-cta {
      justify-self: start;
    }
  }
`

function useDemoTimer() {
  const [target, setTarget] = useState(() => Date.now() + (((5 * 24 + 14) * 60 + 22) * 60 + 1) * 1000)

  useEffect(() => {
    const interval = window.setInterval(() => setTarget((current) => current - 1000), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const diff = Math.max(0, target - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const days = String(Math.floor(totalSeconds / 86400)).padStart(2, '0')
  const hours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  return { days, clock: `${hours}:${minutes}:${seconds}` }
}

function updateTiltTarget(target, event) {
  const rect = target.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const rotateX = ((50 - y) / 8).toFixed(2)
  const rotateY = ((x - 50) / 7).toFixed(2)

  target.style.setProperty('--mx', `${x}%`)
  target.style.setProperty('--my', `${y}%`)
  target.style.setProperty('--rx', `${rotateX}deg`)
  target.style.setProperty('--ry', `${rotateY}deg`)
}

function resetTiltTarget(target) {
  target.style.setProperty('--mx', '50%')
  target.style.setProperty('--my', '50%')
  target.style.setProperty('--rx', '0deg')
  target.style.setProperty('--ry', '0deg')
}

export function LandingPage() {
  const navigate = useNavigate()
  const { toggleTheme, isDark } = useTheme()
  const demo = useDemoTimer()
  const marqueeItems = [...protocolItems, ...protocolItems]
  const [cursorGlow, setCursorGlow] = useState({ x: '50%', y: '18%' })

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = `${((event.clientX - rect.left) / rect.width) * 100}%`
    const y = `${((event.clientY - rect.top) / rect.height) * 100}%`

    setCursorGlow({ x, y })
  }

  const handlePointerLeave = () => {
    setCursorGlow({ x: '50%', y: '18%' })
  }

  const handleTiltMove = (event) => {
    updateTiltTarget(event.currentTarget, event)
  }

  const handleTiltLeave = (event) => {
    resetTiltTarget(event.currentTarget)
  }

  return (
    <div
      className="landing-page"
      style={{ '--cursor-x': cursorGlow.x, '--cursor-y': cursorGlow.y }}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <style>{landingPageStyles}</style>
      <header className="landing-nav">
        <VaultisBrand to="/" logoSize={28} />

        <nav className="landing-links">
          <a href="#protocol">Protocol</a>
          <a href="#security">Security</a>
          <a href="#token">LVT Token</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-actions">
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <WalletConnectButton />
          <Link className="button ghost" to="/login">
            Sign In
          </Link>
          <Link className="button primary rounded" to="/register">
            Launch Vault
          </Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="hero-kicker-line" />
            <span>Inheritance infrastructure for the assets that matter most.</span>
          </div>
          <h1>
            Protect Your
            <br />
            Digital Legacy
            <br />
            <span>Without Trust Gaps.</span>
          </h1>
          <p>
            Vaultis combines encrypted storage, smart contracts, and a dead man switch so digital
            assets can move to the right people with verification, timing, and crystal-clear proof
            when action is required.
          </p>

          <div className="button-row">
            <Link
              className="button primary rounded interactive-button"
              to="/register"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              Start Your Vault
            </Link>
            <a
              className="button ghost interactive-button"
              href="#protocol"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              Explore the Protocol
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="stat-pills">
            <div className="stat-pill">
              <strong>45</strong>
              <span>Check-in Interval</span>
            </div>
            <div className="stat-pill">
              <strong>3</strong>
              <span>Progressive Release</span>
            </div>
            <div className="stat-pill">
              <strong>5%</strong>
              <span>LVT Staking</span>
            </div>
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden countdown-hero"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            padding: '32px'
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '24px'
            }}
          >
            NEXT REQUIRED CHECK-IN
          </p>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
              marginBottom: '20px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <p
              style={{
                fontSize: '56px',
                fontWeight: '800',
                color: '#ffffff',
                lineHeight: '1',
                letterSpacing: '-0.03em',
                marginBottom: '8px'
              }}
            >
              {demo.days} Days
            </p>
            <p
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#4d8eff',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                marginBottom: 0
              }}
            >
              {demo.clock}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#4d8eff',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              marginBottom: '20px'
            }}
          >
            I&apos;m Alive - Check In
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                Last verified
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: '500',
                  marginBottom: 0
                }}
              >
                2 days ago
              </p>
            </div>
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                Active assets
              </p>
              <p
                style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: '500',
                  marginBottom: 0
                }}
              >
                12 protected
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="marquee-strip" aria-label="Vaultis protocol highlights">
        <div className="marquee-track">
          {marqueeItems.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <section id="protocol" className="section-block">
        <div className="section-heading">
          <span>Protocol</span>
          <h2>How Vaultis Works</h2>
        </div>

        <div className="steps-grid">
          {protocolSteps.map((step) => (
            <article
              key={step.number}
              className="glass-panel step-card interactive-card"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="section-block">
        <div className="section-heading">
          <span>Security</span>
          <h2>Built For Real-World Failure Modes</h2>
        </div>

        <div className="split-grid two-even">
          {securityHighlights.map((item) => (
            <article
              key={item.title}
              className="glass-panel interactive-card"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              <p className="panel-title">
                <CheckCircle2 size={18} />
                <strong>{item.title}</strong>
              </p>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="token" className="token-island">
        <div>
          <p className="section-kicker">LVT Token</p>
          <h2>Earn While You Keep Your Vault Active.</h2>
          <p>
            Vaultis rewards regular check-ins with LVT and lets active users stake for yield.
            Every heartbeat strengthens the recovery workflow and leaves a traceable signal.
          </p>

          <div className="button-row">
            <span className="token-chip blue">+10 LVT per check-in</span>
            <span className="token-chip green">5% APY staking</span>
          </div>

          <Link className="token-link" to="/tokens">
            View token center
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="token-card interactive-card" onMouseMove={handleTiltMove} onMouseLeave={handleTiltLeave}>
          <p className="section-label">LVT Token Stats</p>
          {tokenStats.map(([label, value]) => (
            <div key={label} className="token-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="section-block comparison-wrap">
        <div className="section-heading centered">
          <span>Why Vaultis</span>
          <h2>Traditional Storage Stops At Backup. Vaultis Continues To Recovery.</h2>
        </div>

        <div className="comparison-table">
          <div className="comparison-header">Feature</div>
          <div className="comparison-header">Traditional Tools</div>
          <div className="comparison-header accent">Vaultis</div>

          {comparisonRows.flatMap(([feature, traditional, vaultis]) => [
            <div
              key={`${feature}-label`}
              className="comparison-cell interactive-card"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              {feature}
            </div>,
            <div
              key={`${feature}-traditional`}
              className="comparison-cell interactive-card"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              {traditional}
            </div>,
            <div
              key={`${feature}-vaultis`}
              className="comparison-cell accent interactive-card"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              {vaultis}
            </div>
          ])}
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <VaultisBrand to="/" logoSize={28} />
        </div>

        <div className="footer-links">
          <a href="#protocol">Protocol</a>
          <a href="#security">Security</a>
          <a href="#token">LVT Token</a>
          <a href="#about">About</a>
        </div>

        <div className="footer-cta">
          <p>Built for resilient digital inheritance, active verification, and confident recovery.</p>
          <Link
            className="button primary rounded interactive-button"
            to="/register"
            onMouseMove={handleTiltMove}
            onMouseLeave={handleTiltLeave}
          >
            Open Your Vault
          </Link>
        </div>
      </footer>
    </div>
  )
}
