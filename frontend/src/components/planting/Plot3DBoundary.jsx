import { Component } from 'react'

// Si la vista 3D falla al cargar (por ejemplo, internet lento al bajar el módulo del mapa),
// se muestra un aviso con "Reintentar" en vez de dejar toda la aplicación en blanco.
export default class Plot3DBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Vista 3D:', error)
  }

  retry = () => {
    this.setState({ failed: false })
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.35)',
          color: '#fff',
          fontSize: '14px',
        }}
      >
        <span>No se pudo cargar la vista 3D. Suele ser la conexión; prueba de nuevo.</span>
        <button
          type="button"
          onClick={this.retry}
          style={{
            padding: '8px 14px',
            borderRadius: '99px',
            border: '1px solid rgba(74,222,128,0.7)',
            background: 'rgba(74,222,128,0.28)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }
}