import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Make sure 'two-truths-game' matches your repository name exactly
  base: '/two-truths-game/', 
})