#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando build mobile...\n');

try {
  // Passo 1: Preparar configuração
  console.log('📱 Passo 1/4: Preparando configuração...');
  execSync('node scripts/prepare-mobile-build.js prepare', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Passo 2: Limpar build anterior
  console.log('\n🧹 Passo 2/4: Limpando build anterior...');
  const nextPath = path.join(__dirname, '..', '.next');
  const outPath = path.join(__dirname, '..', 'out');
  const fs = require('fs');
  
  if (fs.existsSync(nextPath)) {
    fs.rmSync(nextPath, { recursive: true, force: true });
    console.log('✅ Pasta .next removida');
  }
  
  if (fs.existsSync(outPath)) {
    fs.rmSync(outPath, { recursive: true, force: true });
    console.log('✅ Pasta out removida');
  }

  // Passo 3: Build Next.js
  console.log('\n📦 Passo 3/4: Buildando Next.js...');
  execSync('next build --turbopack', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, CAPACITOR_BUILD: 'true' }
  });

  // Passo 4: Restaurar configuração
  console.log('\n🔄 Passo 4/4: Restaurando configuração...');
  execSync('node scripts/prepare-mobile-build.js restore', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('\n✅ Build mobile concluído com sucesso!');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Erro durante o build mobile:', error.message);
  
  // Tentar restaurar configuração em caso de erro
  try {
    console.log('\n🔄 Tentando restaurar configuração...');
    execSync('node scripts/prepare-mobile-build.js restore', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (restoreError) {
    console.error('⚠️  Erro ao restaurar:', restoreError.message);
  }
  
  process.exit(1);
}
