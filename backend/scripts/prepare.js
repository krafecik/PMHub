#!/usr/bin/env node

// Script para executar husky install apenas quando não estiver em workspace
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verificar se estamos em um workspace npm
// Se existe um package.json na raiz do projeto (acima de backend), estamos em workspace
const rootPackageJson = path.join(__dirname, '../../package.json');
const isWorkspace = fs.existsSync(rootPackageJson);

if (isWorkspace) {
  // Em workspace, verificar se o package.json raiz tem workspaces configurado
  try {
    const rootPkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
    if (rootPkg.workspaces && rootPkg.workspaces.length > 0) {
      // Estamos em workspace, pular husky install
      console.log('Skipping husky install in workspace context');
      process.exit(0);
    }
  } catch (e) {
    // Se não conseguir ler, continuar normalmente
  }
}

// Não estamos em workspace ou não foi detectado, executar husky install
try {
  execSync('husky install', { stdio: 'inherit', cwd: __dirname + '/..' });
} catch (e) {
  // Ignorar erros silenciosamente
  process.exit(0);
}

