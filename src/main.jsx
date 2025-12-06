import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🎬 [MAIN] Application starting...');
console.log('🎬 [MAIN] Root element:', document.getElementById('root'));

const root = createRoot(document.getElementById('root'));
console.log('✅ [MAIN] React root created');

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
console.log('✅ [MAIN] App rendered to DOM');
