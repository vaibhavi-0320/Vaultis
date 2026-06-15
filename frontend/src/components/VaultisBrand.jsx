import { Link } from 'react-router-dom'

export function VaultisBrand({
  to = '/',
  logoSize = 32,
  wordmarkClassName = '',
  tagline = '',
  className = '',
  stacked = false
}) {
  return (
    <Link to={to} className={`vaultis-brand ${stacked ? 'stacked' : ''} ${className}`.trim()}>
      <img src="/logo.png" width={logoSize} height={logoSize} alt="VAULTIS" className="vaultis-brand-logo" />
      <span className="vaultis-brand-copy">
        <strong className={`vaultis-brand-word ${wordmarkClassName}`.trim()}>VAULTIS</strong>
        {tagline ? <span className="vaultis-brand-tagline">{tagline}</span> : null}
      </span>
    </Link>
  )
}
