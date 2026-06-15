import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="not-found-page">
      <img src="/logo.png" width="48" height="48" alt="VAULTIS" />
      <h1>404</h1>
      <p>This vault doesn&apos;t exist.</p>
      <Link className="button primary rounded" to="/">
        Return Home
      </Link>
    </div>
  )
}
