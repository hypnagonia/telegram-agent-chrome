import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { crx } from '@crxjs/vite-plugin'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    preact(),
    crx({ manifest }),
    viteStaticCopy({
      targets: [
        {
          src: 'wasm/rag.wasm',
          dest: 'wasm',
        },
        {
          src: 'wasm/wasm_exec.js',
          dest: 'wasm',
        },
        {
          src: 'img/icons/*',
          dest: 'img/icons',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@domain': resolve(__dirname, 'src/domain'),
      '@application': resolve(__dirname, 'src/application'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@presentation': resolve(__dirname, 'src/presentation'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
    },
  },
})
