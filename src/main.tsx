import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@fontsource-variable/oswald';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './palette.css';
import './tacustav.css';
import { readEdition } from './lib/editions';
import { filamentPalette } from './lib/pieces';

document.documentElement.dataset.edition=readEdition();

for (const [color, hex] of Object.entries(filamentPalette)) {
  document.documentElement.style.setProperty(`--filament-${color}`, hex);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
