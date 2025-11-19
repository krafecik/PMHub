#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const hostname = process.argv[2] || '127.0.0.1';
const port = process.argv[3] || '3056';

const child = spawn('node', [nextBin, 'dev', '--hostname', hostname, '--port', port], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

