import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// =========================================================
// 🔥 PATCH SAKTI: ANTI-CRASH GOOGLE TRANSLATE (ENTERPRISE)
// =========================================================
if (typeof Node === 'function' && Node.prototype) {
  // 1. Cegah Crash saat React mencoba menghapus elemen yang dicolong Translate
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      console.warn("🛡️ Crash Google Translate berhasil ditangkis! (removeChild)");
      return child;
    }
    return originalRemoveChild.call(this, child);
  };

  // 2. Cegah Crash saat React mencoba menyisipkan elemen baru
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn("🛡️ Crash Google Translate berhasil ditangkis! (insertBefore)");
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}
// =========================================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)