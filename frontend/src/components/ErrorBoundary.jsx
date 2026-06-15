import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Vaultis UI error:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary-screen">
          <img src="/logo.png" width="48" height="48" alt="VAULTIS" />
          <h1>Something went wrong</h1>
          <p>The dashboard hit an unexpected UI error. Your vault data was not changed.</p>
          <button type="button" className="button primary" onClick={this.reset}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
