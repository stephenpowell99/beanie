const { execSync } = require('child_process');
console.log('Starting custom build process...');
execSync('npm run build', { stdio: 'inherit' });
console.log('Build completed successfully');
process.exit(0);


