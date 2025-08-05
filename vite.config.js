/* eslint-disable no-undef */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { htmlFiles } from './getHTMLFileNames';
import { svgSpritemap } from 'vite-plugin-svg-spritemap';

const input = { main: resolve(__dirname, 'src/index.html') };
htmlFiles.forEach((file) => {
  input[file.replace('.html', '')] = resolve(__dirname, 'src', file);
});

export default defineConfig({
  base: '/Mayer',
  root: 'src',
  publicDir: '../public',
  plugins: [
    handlebars({ partialDirectory: resolve(__dirname, 'src/templates') }),
    svgSpritemap({
      pattern: 'public/icons/*.svg',
    }),
  ],
  build: {
    rollupOptions: {
      input,
    },
    outDir: '../dist/',
    emptyOutDir: true,
  },
});
