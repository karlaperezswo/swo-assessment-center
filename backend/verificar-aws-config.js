#!/usr/bin/env node

/**
 * Script para verificar la configuración de AWS S3
 * Ejecutar: node verificar-aws-config.js
 */

require('dotenv').config();

console.log('\n🔍 Verificando configuración de AWS S3...\n');

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files';
const AWS_PROFILE = process.env.AWS_PROFILE || 'default';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('📋 Configuración actual:\n');
console.log(`   AWS_REGION: ${AWS_REGION}`);
console.log(`   S3_BUCKET_NAME: ${S3_BUCKET_NAME}`);
console.log(`   AWS_PROFILE: ${AWS_PROFILE}`);

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  console.log(`   Credenciales: ✅ Variables de entorno`);
  console.log(`   AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
} else {
  console.log(`   Credenciales: 🔑 Perfil AWS CLI (${AWS_PROFILE})`);
}

console.log('\n' + '='.repeat(60) + '\n');

// Intentar conectar a S3
console.log('🔌 Probando conexión a S3...\n');

const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-providers');

let credentials;
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
} else {
  credentials = fromIni({ profile: AWS_PROFILE });
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials,
});

(async () => {
  try {
    // Listar buckets
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    
    console.log('✅ Conexión exitosa a AWS S3');
    console.log(`📦 Buckets disponibles: ${listResponse.Buckets?.length || 0}\n`);
    
    // Verificar si el bucket configurado existe
    const bucketExists = listResponse.Buckets?.some(b => b.Name === S3_BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${S3_BUCKET_NAME}" encontrado`);
      
      // Verificar acceso al bucket
      try {
        const headCommand = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME });
        await s3Client.send(headCommand);
        console.log(`✅ Tienes acceso al bucket "${S3_BUCKET_NAME}"`);
      } catch (error) {
        console.log(`⚠️  No tienes acceso al bucket "${S3_BUCKET_NAME}"`);
        console.log(`   Error: ${error.message}`);
      }
    } else {
      console.log(`⚠️  Bucket "${S3_BUCKET_NAME}" NO encontrado`);
      console.log('\n💡 Opciones:');
      console.log('   1. Crear el bucket en AWS Console');
      console.log('   2. Usar un bucket existente (actualiza S3_BUCKET_NAME en .env)');
      
      if (listResponse.Buckets && listResponse.Buckets.length > 0) {
        console.log('\n📦 Buckets disponibles:');
        listResponse.Buckets.forEach((bucket, index) => {
          console.log(`   ${index + 1}. ${bucket.Name}`);
        });
      }
    }
    
    console.log('\n🎉 ¡Configuración verificada!\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Si el bucket no existe, créalo en AWS Console');
    console.log('   2. Actualiza S3_BUCKET_NAME en backend/.env si es necesario');
    console.log('   3. Reinicia el servidor: npm start');
    console.log('   4. Prueba subir un archivo en Rapid Discovery\n');
    
  } catch (error) {
    console.error('❌ Error al conectar con S3:');
    console.error(`   ${error.message}\n`);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('💡 Solución:');
      console.log('   1. Ejecuta: aws configure');
      console.log('   2. Ingresa tus credenciales de AWS');
      console.log('   3. O configura variables de entorno en backend/.env\n');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 Posibles causas:');
      console.log('   - Credenciales incorrectas');
      console.log('   - Permisos insuficientes (necesitas AmazonS3FullAccess)');
      console.log('   - Usuario IAM sin permisos de S3\n');
    } else {
      console.log('💡 Verifica:');
      console.log('   - Región correcta en .env');
      console.log('   - Credenciales válidas');
      console.log('   - Conexión a internet\n');
    }
    
    console.log('📖 Para más ayuda, lee: GUIA-CONFIGURACION-AWS-S3.md\n');
  }
})();
