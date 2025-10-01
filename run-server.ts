#!/usr/bin/env bun
/**
 * Standalone server runner for Process Manager
 * Usage: bun run run-server.ts [port]
 */

const { spawn } = await import('child_process');
const { existsSync } = await import('fs');
const { join } = await import('path');

const DEFAULT_PORT = 3000;

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => !arg.startsWith('-')) || DEFAULT_PORT;
const port = isNaN(parseInt(portArg)) ? DEFAULT_PORT : parseInt(portArg);

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Process Manager - Standalone Server Runner

Usage: ./process-manager [options] [port]

Options:
  --help, -h     Show this help message
  port           Port number to run the server on (default: 3000)

Examples:
  ./process-manager          # Run on default port 3000
  ./process-manager 8080     # Run on port 8080
  ./process-manager --help   # Show this help message
`);
  process.exit(0);
}

console.log(`🚀 Starting Process Manager on port ${port}`);
console.log(`📁 Working directory: ${process.cwd()}`);

// Check if .next directory and production build exist
const nextDir = join(process.cwd(), '.next');
const buildIdFile = join(nextDir, 'BUILD_ID');
const needsBuild = !existsSync(nextDir) || !existsSync(buildIdFile);

if (needsBuild) {
  console.log('📦 Building Next.js app...');

  // Build the app first
  const buildProcess = spawn('bun', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });

  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        resolve(void 0);
      } else {
        console.error('❌ Build failed');
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

// Start the production server
console.log(`🌐 Starting server on http://localhost:${port}`);
const serverProcess = spawn('bun', ['run', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: port.toString()
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});