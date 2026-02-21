#!/usr/bin/env node

/**
 * Script de deployment del backend a AWS Lambda
 *
 * Este script automatiza:
 * 1. Build del código TypeScript
 * 2. Creación del paquete ZIP
 * 3. Upload a S3
 * 4. Actualización de Lambda
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuración
const CONFIG = {
  functionName: process.env.LAMBDA_FUNCTION_NAME || 'assessment-center-api',
  bucketName: process.env.S3_BUCKET_NAME || 'assessment-center-files',
  region: process.env.AWS_REGION || 'us-east-1',
  zipFileName: 'lambda-function.zip'
};

console.log('🚀 Iniciando deployment del backend a AWS Lambda...\n');

// Paso 1: Build
console.log('[1/4] 📦 Building TypeScript...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '../backend'), stdio: 'inherit' });
  console.log('✅ Build completado\n');
} catch (error) {
  console.error('❌ Error en build:', error.message);
  process.exit(1);
}

// Paso 2: Crear ZIP
console.log('[2/4] 📦 Creando paquete ZIP...');
const backendDir = path.join(__dirname, '../backend');
const zipPath = path.join(backendDir, CONFIG.zipFileName);

// Eliminar ZIP anterior si existe
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ ZIP creado: ${sizeInMB} MB\n`);

  // Paso 3: Upload a S3
  uploadToS3();
});

archive.on('error', (err) => {
  console.error('❌ Error creando ZIP:', err);
  process.exit(1);
});

archive.pipe(output);

// Agregar dist y node_modules
archive.directory(path.join(backendDir, 'dist'), 'dist');
archive.directory(path.join(backendDir, 'node_modules'), 'node_modules');
archive.file(path.join(backendDir, 'package.json'), { name: 'package.json' });

archive.finalize();

// Función para upload a S3
function uploadToS3() {
  console.log('[3/4] ☁️  Subiendo a S3...');
  const s3Key = `lambda/${CONFIG.zipFileName}`;

  try {
    execSync(
      `aws s3 cp ${CONFIG.zipFileName} s3://${CONFIG.bucketName}/${s3Key} --region ${CONFIG.region}`,
      { cwd: backendDir, stdio: 'inherit' }
    );
    console.log(`✅ Subido a s3://${CONFIG.bucketName}/${s3Key}\n`);

    // Paso 4: Actualizar Lambda
    updateLambda(s3Key);
  } catch (error) {
    console.error('❌ Error subiendo a S3:', error.message);
    process.exit(1);
  }
}

// Función para actualizar Lambda
function updateLambda(s3Key) {
  console.log('[4/4] 🔄 Actualizando función Lambda...');

  try {
    execSync(
      `aws lambda update-function-code --function-name ${CONFIG.functionName} --s3-bucket ${CONFIG.bucketName} --s3-key ${s3Key} --region ${CONFIG.region}`,
      { stdio: 'inherit' }
    );
    console.log('✅ Lambda actualizado\n');

    // Limpiar ZIP local
    const zipPath = path.join(backendDir, CONFIG.zipFileName);
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    console.log('✅ Deployment completado exitosamente!\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Verificar logs: aws logs tail /aws/lambda/' + CONFIG.functionName + ' --follow');
    console.log('   2. Test: curl https://[API-ID].execute-api.' + CONFIG.region + '.amazonaws.com/prod/health\n');

  } catch (error) {
    console.error('❌ Error actualizando Lambda:', error.message);
    process.exit(1);
  }
}
