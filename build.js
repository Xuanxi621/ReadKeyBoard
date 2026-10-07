const esbuild = require('esbuild');

async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ['src/index.jsx'],
      bundle: true,
      outfile: 'app.react.js',
      format: 'iife',
      sourcemap: false,
      minify: false,
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    console.log('Build succeeded! Output: app.react.js');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
