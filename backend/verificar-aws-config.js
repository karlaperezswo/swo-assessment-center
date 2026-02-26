#!/usr/bin/env node

/**
 * Script para verificar la configuración de AWS S3
 * Ejecutar: node verificar-aws-config.js
 */

require('dotenv').config();

console.log('\n🔍 Verificando configuración de AWS S3...\n');

const checks = {
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

let allConfigured = true;

// Verificar cada variable
Object.entries(checks).forEach(([key, value]) => {
  if (value) {
    if (key === 'AWS_SECRET_ACCESS_KEY') {
      // No mostrar el secret completo
      console.log(`✅ ${key}: ${value.substring(0, 4)}...${value.substring(value.length - 4)}`);
    } else if (key === 'AWS_ACCESS_KEY_ID') {
      console.log(`✅ ${key}: ${value.substring(0, 8)}...`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NO CONFIGURADO`);
    allConfigured = false;
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allConfigured) {
  console.log('🎉 ¡Configuración completa!');
  console.log('\nPróximos pasos:');
  console.log('1. Reinicia el servidor backend: npm start');
  console.log('2. Prueba subir un archivo en el módulo Rapid Discovery');
  console.log('3. Verifica que el archivo se suba correctamente a S3\n');
} else {
  console.log('⚠️  Configuración incompleta');
  console.log('\nPara configurar AWS S3:');
  console.log('1. Crea el archivo backend/.env (si no existe)');
  console.log('2. Agrega las siguientes variables:');
  console.log('\n   AWS_REGION=us-east-1');
  console.log('   S3_BUCKET_NAME=tu-bucket-name');
  console.log('   AWS_ACCESS_KEY_ID=tu-access-key');
  console.log('   AWS_SECRET_ACCESS_KEY=tu-secret-key');
  console.log('\n3. Lee la guía completa: GUIA-CONFIGURACION-AWS-S3.md\n');
}

// Intentar conectar a S3 si está configurado
if (allConfigured) {
  console.log('🔌 Probando conexión a S3...\n');
  
  const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({
    region: checks.AWS_REGION,
    credentials: {
      accessKeyId: checks.AWS_ACCESS_KEY_ID,
      secretAccessKey: checks.AWS_SECRET_ACCESS_KEY,
    },
  });

  (async () => {
    try {
      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);
      
      console.log('✅ Conexión exitosa a AWS S3');
      console.log(`📦 Buckets disponibles: ${response.Buckets?.length || 0}`);
      
      // Verificar si el bucket configurado existe
      const bucketExists = response.Buckets?.some(b => b.Name === checks.S3_BUCKET_NAME);
      
      if (bucketExists) {
        console.log(`✅ Bucket "${checks.S3_BUCKET_NAME}" encontrado`);
      } else {
        console.log(`⚠️  Bucket "${checks.S3_BUCKET_NAME}" NO encontrado`);
        console.log('   Verifica el nombre del bucket o créalo en AWS Console');
      }
      
      console.log('\n🎉 ¡Todo listo para usar S3!\n');
    } catch (error) {
      console.error('❌ Error al conectar con S3:');
      console.error(`   ${error.message}`);
      console.log('\n💡 Posibles causas:');
      console.log('   - Credenciales incorrectas');
      console.log('   - Permisos insuficientes');
      console.log('   - Región incorrecta');
      console.log('\n📖 Revisa la guía: GUIA-CONFIGURACION-AWS-S3.md\n');
    }
  })();
}
