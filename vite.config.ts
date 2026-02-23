import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import stylelint from 'vite-plugin-stylelint'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    stylelint({
      fix: false, // Don't auto-fix naming, we want to see the beep
      emitWarning: true,
      include: ['src/**/*.css']
    })
  ],
})
