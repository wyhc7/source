import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from '@ui/pages/Popup';
import { useStore } from '@store';
import '@ui/styles/globals.css';

function App() {
  useStore(); // Initialize store
  return <Popup />;
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}