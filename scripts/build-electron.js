
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Building Electron app...');
execSync('npx electron-builder', { stdio: 'inherit' });

console.log('Electron build complete!');
