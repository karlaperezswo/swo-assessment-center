#!/usr/bin/env node

/**
 * Script para listar los buckets de S3 disponibles
 * Usa las credenciales de AWS CLI
 */

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-providers');

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_PROFILE = process.env.AWS_PROFILE || 'default';

console.log('\n🔍 Listando buckets de S3...\n');
console.log(`📍 Región: ${AWS_REGION}`);
console.log(`👤 Perfil: ${AWS_PROFILE}\n`);

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: fromIni({ profile: AWS_PROFILE }),
});

(async () => {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    if (!response.Buckets || response.Buckets.length === 0) {
      console.log('⚠️  No se encontraron buckets en tu cuenta AWS');
      console.log('\n💡 Para crear un bucket:');
      console.log('   1. Ve a AWS Console → S3');
      console.log('   2. Click en "Create bucket"');
      console.log('   3. Nombre: assessment-center-files-[tu-nombre]');
      console.log('   4. Región: us-east-1');
      console.log('   5. Click "Create bucket"\n');
      return;
    }
    
    console.log(`✅ Encontrados ${response.Buckets.length} bucket(s):\n`);
    
    response.Buckets.forEach((bucket, index) => {
      const creationDate = bucket.CreationDate ? bucket.CreationDate.toISOString().split('T')[0] : 'N/A';
      console.log(`${index + 1}. 📦 ${bucket.Name}`);
      console.log(`   Creado: ${creationDate}\n`);
    });
    
    console.log('─'.repeat(60));
    console.log('\n💡 Para usar uno de estos buckets:');
    console.log('   1. Edita backend/.env');
    console.log('   2. Actualiza: S3_BUCKET_NAME=nombre-del-bucket');
    console.log('   3. Reinicia el servidor backend\n');
    
  } catch (error) {
    console.error('❌ Error al listar buckets:');
    console.error(`   ${error.message}\n`);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('💡 Solución:');
      console.log('   1. Ejecuta: aws configure');
      console.log('   2. Ingresa tus credenciales de AWS');
      console.log('   3. Vuelve a ejecutar este script\n');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 Solución:');
      console.log('   Tu usuario no tiene permisos para listar buckets');
      console.log('   Contacta al administrador de AWS o usa un bucket existente\n');
    } else {
      console.log('💡 Verifica:');
      console.log('   - Que aws configure esté correctamente configurado');
      console.log('   - Que tengas conexión a internet');
      console.log('   - Que tus credenciales sean válidas\n');
    }
  }
})();
