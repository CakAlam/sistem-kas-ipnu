import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Kalau ada error (termasuk dari Translate), state ini berubah
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Catat errornya diam-diam di console
  componentDidCatch(error, errorInfo) {
    console.error("Tertangkap oleh Error Boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Oops! Tampilan Terganggu 🌍</h2>
          <p>Jika Anda menggunakan fitur <b>Auto-Translate</b> dari browser, ini mungkin menyebabkan gangguan sementara.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;