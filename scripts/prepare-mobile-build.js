#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
const nextConfigBackupPath = path.join(__dirname, '..', 'next.config.mjs.backup');
const apiPath = path.join(__dirname, '..', 'src', 'app', 'api');
const apiBackupPath = path.join(__dirname, '..', '.api.backup');

const mobileConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Gera apenas as páginas estáticas, deixa rotas dinâmicas para client-side
  distDir: '.next',
  // Desabilita geração de páginas dinâmicas no build
  // Elas serão renderizadas client-side (SPA mode)
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
`;

const command = process.argv[2];

if (command === 'prepare') {
  console.log('📱 Preparando configuração para build mobile...');
  
  // Backup da configuração atual
  if (fs.existsSync(nextConfigPath)) {
    fs.copyFileSync(nextConfigPath, nextConfigBackupPath);
    console.log('✅ Backup do next.config.mjs criado');
  }
  
  // Sobrescreve com configuração mobile
  fs.writeFileSync(nextConfigPath, mobileConfig);
  console.log('✅ Configuração mobile aplicada');
  
  // Backup e remove pasta API (não compatível com export estático)
  if (fs.existsSync(apiPath)) {
    if (!fs.existsSync(apiBackupPath)) {
      fs.cpSync(apiPath, apiBackupPath, { recursive: true });
      console.log('✅ Backup da pasta API criado');
    }
    fs.rmSync(apiPath, { recursive: true, force: true });
    console.log('✅ Pasta API temporariamente removida para build mobile');
  }
  
} else if (command === 'restore') {
  console.log('🔄 Restaurando configuração original...');
  
  // Restaura backup do next.config
  if (fs.existsSync(nextConfigBackupPath)) {
    fs.copyFileSync(nextConfigBackupPath, nextConfigPath);
    fs.unlinkSync(nextConfigBackupPath);
    console.log('✅ Configuração original restaurada');
  } else {
    console.log('⚠️  Nenhum backup do next.config encontrado');
  }
  
  // Restaura pasta API
  if (fs.existsSync(apiBackupPath)) {
    if (fs.existsSync(apiPath)) {
      fs.rmSync(apiPath, { recursive: true, force: true });
    }
    fs.cpSync(apiBackupPath, apiPath, { recursive: true });
    fs.rmSync(apiBackupPath, { recursive: true, force: true });
    console.log('✅ Pasta API restaurada');
  } else {
    console.log('⚠️  Nenhum backup da pasta API encontrado');
  }
  
} else {
  console.error('❌ Comando inválido. Use: prepare ou restore');
  process.exit(1);
}
