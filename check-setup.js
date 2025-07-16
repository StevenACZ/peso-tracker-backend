#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 Verificando configuración del backend...\n');

// Verificar archivos esenciales
const requiredFiles = [
  'package.json',
  'docker-compose.yml',
  'Dockerfile',
  'src/index.js',
  'src/config/db.js',
  'src/routes/auth.js',
  'src/routes/weights.js',
  'src/controllers/authController.js',
  'src/controllers/weightsController.js',
  'src/middleware/authMiddleware.js',
  'src/models/User.js',
  'src/models/WeightRecord.js',
  'init-db.sql'
];

console.log('📁 Verificando archivos requeridos:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    allFilesExist = false;
  }
});

// Verificar package.json
console.log('\n📦 Verificando package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.type === 'module') {
    console.log('✅ ES modules habilitado');
  } else {
    console.log('❌ ES modules no habilitado');
  }
  
  if (packageJson.main === 'src/index.js') {
    console.log('✅ Punto de entrada correcto');
  } else {
    console.log('❌ Punto de entrada incorrecto');
  }
  
  const requiredDeps = ['express', 'pg', 'bcryptjs', 'jsonwebtoken', 'cors', 'helmet', 'express-rate-limit', 'dotenv'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} instalado`);
    } else {
      console.log(`❌ ${dep} faltante`);
    }
  });
} catch (error) {
  console.log('❌ Error leyendo package.json');
}

// Verificar docker-compose.yml
console.log('\n🐳 Verificando docker-compose.yml:');
try {
  const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
  
  if (dockerCompose.includes('postgres')) {
    console.log('✅ Servicio PostgreSQL configurado');
  } else {
    console.log('❌ Servicio PostgreSQL faltante');
  }
  
  if (dockerCompose.includes('node-app')) {
    console.log('✅ Servicio Node.js configurado');
  } else {
    console.log('❌ Servicio Node.js faltante');
  }
  
  if (dockerCompose.includes('pgadmin')) {
    console.log('✅ PgAdmin configurado');
  } else {
    console.log('❌ PgAdmin faltante');
  }
  
  if (dockerCompose.includes('5432:5432')) {
    console.log('✅ Puerto PostgreSQL expuesto');
  } else {
    console.log('❌ Puerto PostgreSQL no expuesto');
  }
  
  if (dockerCompose.includes('3000:3000')) {
    console.log('✅ Puerto API expuesto');
  } else {
    console.log('❌ Puerto API no expuesto');
  }
} catch (error) {
  console.log('❌ Error leyendo docker-compose.yml');
}

// Verificar variables de entorno
console.log('\n🔧 Verificando variables de entorno:');
if (fs.existsSync('.env')) {
  console.log('✅ Archivo .env encontrado');
} else {
  console.log('⚠️  Archivo .env no encontrado - crear basado en env.example');
}

console.log('\n📋 Resumen de verificación:');
if (allFilesExist) {
  console.log('✅ Todos los archivos requeridos están presentes');
  console.log('\n🚀 El backend está listo para ejecutar con:');
  console.log('   docker-compose up --build');
} else {
  console.log('❌ Faltan algunos archivos requeridos');
}

console.log('\n📝 Próximos pasos:');
console.log('1. Crear archivo .env basado en env.example');
console.log('2. Configurar variables de entorno seguras');
console.log('3. Ejecutar: docker-compose up --build');
console.log('4. Verificar en: http://localhost:3000/health');
console.log('5. Acceder a PgAdmin en: http://localhost:5050'); 