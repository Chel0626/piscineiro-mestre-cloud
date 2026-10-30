#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lê a versão do package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version || '0.1.0';

console.log(`📦 Atualizando versão do app para: ${version}`);

// Atualiza versão no Android (build.gradle)
const androidGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(androidGradlePath)) {
  let gradleContent = fs.readFileSync(androidGradlePath, 'utf8');
  
  // Extrai versão em números (ex: 0.1.0 -> 010)
  const versionCode = version.split('.').map(n => parseInt(n) || 0).join('');
  
  gradleContent = gradleContent.replace(
    /versionCode \d+/,
    `versionCode ${versionCode}`
  );
  gradleContent = gradleContent.replace(
    /versionName "[^"]+"/,
    `versionName "${version}"`
  );
  
  fs.writeFileSync(androidGradlePath, gradleContent);
  console.log('✅ Versão do Android atualizada');
}

// Atualiza versão no iOS (Info.plist)
const iosInfoPlistPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');
if (fs.existsSync(iosInfoPlistPath)) {
  let plistContent = fs.readFileSync(iosInfoPlistPath, 'utf8');
  
  plistContent = plistContent.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${version}$2`
  );
  plistContent = plistContent.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${version}$2`
  );
  
  fs.writeFileSync(iosInfoPlistPath, plistContent);
  console.log('✅ Versão do iOS atualizada');
}

console.log('✅ Versões atualizadas com sucesso!');
