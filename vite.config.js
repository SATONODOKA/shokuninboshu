import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015', // Better browser compatibility
    assetsDir: 'assets',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        unused: true
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['./src/lib/storage', './src/utils/dates', './src/lib/ids']
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    // Production optimizations
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true
  },
  // Define for production builds
  define: {
    __DEV__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  // Optimize deps for faster builds
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  // Base URL for Netlify deployment
  base: '/'
})
