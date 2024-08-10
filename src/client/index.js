/* eslint-disable no-undef */
import { createRoot } from 'react-dom/client'

import App from '@/client/App.jsx'

// Workaround for HMR creating a new root on every HMR update
if (window.root.render === undefined) {
  window.root = createRoot(document.getElementById('root'))
  window.root.render(<App />)
} else {
  window.root.render(<App />)
}

const moduleHot = module.hot
if (moduleHot) {
  console.log('✅ HMR Enabled!')
  moduleHot.accept()
} else {
  console.log('❌ HMR Not Enabled!')
}
