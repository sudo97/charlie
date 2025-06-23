import { createRoot } from 'react-dom/client';
import '../styles/main.css';
import { App } from './App';
import { loadAllData } from './data-loader';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const data = loadAllData();
    const container = document.getElementById('app');

    if (!container) {
      throw new Error('App container not found');
    }

    const root = createRoot(container);
    root.render(<App data={data} />);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `<div style="color: red; padding: 20px;">Error loading application: ${(error as Error).message}</div>`;
    }
  }
});
