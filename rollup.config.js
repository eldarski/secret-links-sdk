import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/secret-links-sdk.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      typescript({
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      }),
      production && terser()
    ]
  },
  
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/secret-links-sdk.js',
      format: 'umd',
      name: 'SecretLinksSDK',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      typescript({
        declaration: false // Only generate declarations once
      }),
      production && terser()
    ]
  },
  
  // Minified UMD build for CDN
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/secret-links-sdk.min.js',
      format: 'umd',
      name: 'SecretLinksSDK',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      typescript({
        declaration: false
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          reserved: ['SecretLinksSDK']
        }
      })
    ]
  }
];