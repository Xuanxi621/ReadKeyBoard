import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteBailianPlugin } from './src/services/viteBailianPlugin.js';

export default defineConfig({
  plugins: [react(), viteBailianPlugin()],
  server: {
    port: 3000,
    open: true
  }
});
