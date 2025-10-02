
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'sonner@2.0.3': 'sonner',
        'react-hook-form@7.55.0': 'react-hook-form',
        'next-themes@0.4.6': 'next-themes',
        'figma:asset/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png': path.resolve(__dirname, './src/assets/a7b96e6fbe59cc65b1f1fae75f58ca6158a2d650.png'),
        '@supabase/supabase-js@2': '@supabase/supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });