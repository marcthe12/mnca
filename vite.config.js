import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
     input: './client/main.jsx',
    },
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],
})
