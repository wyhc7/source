import React from 'react';
import { createRoot } from 'react-dom/client';
import { SidePanel } from '@ui/pages/SidePanel';
import { useStore } from '@store';
import './globals.css';

function App() {
  useStore(); // Initialize store
  return <SidePanel />;
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}