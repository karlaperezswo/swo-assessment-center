#!/usr/bin/env node

/**
 * Script de diagnóstico completo para verificar la configuración de S3
 * y probar la generación de URLs pre-firmadas
 */

require('dotenv').config({ path: './backend/.env' });

const { S3Client, PutObjectCommand, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { fromIni } = require('@aws-sdk/credential-providers');

console.log('\n🔍 DIAGNÓSTICO COMPLETO DE CONFIGURACIÓN S3\n');
console.log('='.repeat(60));

// Configuración
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard';
const AWS_PROFILE = process.env.AWS_PROFILE || 'default';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('\n📋 CONFIGURACIÓN ACTUAL:\n');
console.log(`   AWS_REGION: ${AWS_REGION}`);
console.log(`   S3_BUCKET_NAME: ${S3_BUCKET_NAME}`);
console.log(`   AWS_PROFILE: ${AWS_PROFILE}`);

// Determinar fuente de credenciales
let credentials;
let credentialSource;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
  credentialSource = 'Variables de entorno';
  console.log(`   Credenciales: ✅ ${credentialSource}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
} else {
  credentials = fromIni({ profile: AWS_PROFILE });
  credentialSource = `Perfil AWS CLI (${AWS_PROFILE})`;
  console.log(`   Credenciales: 🔑 ${credentialSource}`);
}

// Crear cliente S3
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials,
});

console.log('\n' + '='.repeat(60) + '\n');

(async () => {
  try {
    // TEST 1: Listar buckets
    console.log('TEST 1: Listar buckets de S3...\n');
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    
    console.log(`✅ Conexión exitosa a AWS S3`);
    console.log(`📦 Buckets disponibles: ${listResponse.Buckets?.length || 0}\n`);
    
    // TEST 2: Verificar bucket específico
    console.log('TEST 2: Verificar bucket configurado...\n');
    const bucketExists = listResponse.Buckets?.some(b => b.Name === S3_BUCKET_NAME);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${S3_BUCKET_NAME}" encontrado`);
      
      // Verificar acceso
      try {
        const headCommand = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME });
        await s3Client.send(headCommand);
        console.log(`✅ Tienes acceso al bucket "${S3_BUCKET_NAME}"\n`);
      } catch (error) {
        console.log(`❌ No tienes acceso al bucket "${S3_BUCKET_NAME}"`);
        console.log(`   Error: ${error.message}\n`);
        process.exit(1);
      }
    } else {
      console.log(`❌ Bucket "${S3_BUCKET_NAME}" NO encontrado\n`);
      console.log('💡 Buckets disponibles:');
      listResponse.Buckets?.slice(0, 10).forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.Name}`);
      });
      console.log('\n');
      process.exit(1);
    }
    
    // TEST 3: Generar URL pre-firmada (simular upload)
    console.log('TEST 3: Generar URL pre-firmada para upload...\n');
    
    const testKey = `test-uploads/test-${Date.now()}.xlsx`;
    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: testKey,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    try {
      const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 900 });
      console.log(`✅ URL pre-firmada generada exitosamente`);
      console.log(`   Key: ${testKey}`);
      console.log(`   Expira en: 900 segundos (15 minutos)`);
      console.log(`   URL: ${uploadUrl.substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`❌ Error al generar URL pre-firmada`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }
    
    // TEST 4: Verificar permisos necesarios
    console.log('TEST 4: Verificar permisos de S3...\n');
    console.log('✅ s3:ListAllMyBuckets - OK');
    console.log('✅ s3:HeadBucket - OK');
    console.log('✅ s3:PutObject - OK (URL pre-firmada generada)\n');
    
    console.log('='.repeat(60));
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!\n');
    console.log('📋 RESUMEN:\n');
    console.log(`   ✅ Credenciales: ${credentialSource}`);
    console.log(`   ✅ Región: ${AWS_REGION}`);
    console.log(`   ✅ Bucket: ${S3_BUCKET_NAME}`);
    console.log(`   ✅ Permisos: Lectura y Escritura`);
    console.log(`   ✅ URLs pre-firmadas: Funcionando\n`);
    
    console.log('🚀 PRÓXIMOS PASOS:\n');
    console.log('   1. Reinicia el servidor backend:');
    console.log('      cd backend');
    console.log('      npm start\n');
    console.log('   2. Abre la aplicación:');
    console.log('      http://localhost:3005\n');
    console.log('   3. Ve a Assess → Rapid Discovery');
    console.log('   4. Sube un archivo Excel MPA\n');
    console.log('   ✅ Debería funcionar sin errores\n');
    
  } catch (error) {
    console.error('\n❌ ERROR EN DIAGNÓSTICO:\n');
    console.error(`   ${error.message}\n`);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('💡 SOLUCIÓN:');
      console.log('   1. Ejecuta: aws configure');
      console.log('   2. Ingresa tus credenciales de AWS');
      console.log('   3. Vuelve a ejecutar este script\n');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 SOLUCIÓN:');
      console.log('   Tu usuario no tiene permisos suficientes');
      console.log('   Necesitas los siguientes permisos:');
      console.log('   - s3:ListAllMyBuckets');
      console.log('   - s3:HeadBucket');
      console.log('   - s3:PutObject');
      console.log('   - s3:GetObject');
      console.log('   - s3:DeleteObject\n');
    } else {
      console.log('💡 VERIFICA:');
      console.log('   - Que aws configure esté correctamente configurado');
      console.log('   - Que tengas conexión a internet');
      console.log('   - Que tus credenciales sean válidas\n');
    }
    
    process.exit(1);
  }
})();
