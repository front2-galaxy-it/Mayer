/* eslint-disable no-undef */
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { htmlFiles } from './getHTMLFileNames';

const input = { main: resolve(__dirname, 'src/index.html') };
htmlFiles.forEach((file) => {
  input[file.replace('.html', '')] = resolve(__dirname, 'src', file);
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/Mayer',
    root: 'src',
    publicDir: '../public',
    plugins: [
      handlebars({ partialDirectory: resolve(__dirname, 'src/templates') }),
    ],
    server: {
      host: true,
      port: 5173, 
      
    },
    build: {
      rollupOptions: {
        input,
      },
      outDir: '../dist/',
      emptyOutDir: true,
    },
    define: {
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || ''),
    },
    envDir: '..',
  };
});
