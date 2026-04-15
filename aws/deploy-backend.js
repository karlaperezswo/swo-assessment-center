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
  bucketName: process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard',
  region: process.env.AWS_REGION || 'us-east-1',
  zipFileName: 'lambda-function.zip',
  // Archivos de configuración que deben sincronizarse con S3 en cada deploy
  s3ConfigFiles: [
    {
      localPath: path.join(__dirname, '../backend/src/config/selector/questions.json'),
      s3Key: 'selector/config/questions.json',
    },
    {
      localPath: path.join(__dirname, '../backend/src/config/selector/matrix.json'),
      s3Key: 'selector/config/matrix.json',
    },
  ],
};

console.log('🚀 Iniciando deployment del backend a AWS Lambda...\n');

// Paso 1: Build
console.log('[1/6] 📦 Building TypeScript...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '../backend'), stdio: 'inherit' });
  console.log('✅ Build completado\n');
} catch (error) {
  console.error('❌ Error en build:', error.message);
  process.exit(1);
}

// Paso 2: Crear ZIP
console.log('[2/6] 📦 Creando paquete ZIP...');
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

// Agregar archivos de configuración JSON (no compilados por TypeScript)
archive.directory(path.join(backendDir, 'src/config'), 'dist/backend/src/config');

archive.finalize();

// Función para upload a S3
function uploadToS3() {
  console.log('[3/6] ☁️  Subiendo a S3...');
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
  console.log('[4/6] 🔄 Actualizando función Lambda...');

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

    // Paso 5: Sincronizar archivos de configuración a S3
    uploadConfigFilesToS3();

  } catch (error) {
    console.error('❌ Error actualizando Lambda:', error.message);
    process.exit(1);
  }
}

// Función para subir archivos de configuración a S3
function uploadConfigFilesToS3() {
  console.log('[5/6] 📄 Sincronizando archivos de configuración en S3...');

  try {
    for (const file of CONFIG.s3ConfigFiles) {
      if (!fs.existsSync(file.localPath)) {
        console.warn(`⚠️  Archivo no encontrado, se omite: ${file.localPath}`);
        continue;
      }
      execSync(
        `aws s3 cp "${file.localPath}" s3://${CONFIG.bucketName}/${file.s3Key} --region ${CONFIG.region}`,
        { stdio: 'inherit' }
      );
      console.log(`   ✅ ${file.s3Key}`);
    }
    console.log('✅ Archivos de configuración sincronizados\n');

    // Paso 6: Forzar cold start del Lambda para limpiar caché en memoria
    forceLambdaColdStart();

  } catch (error) {
    console.error('❌ Error sincronizando configuración en S3:', error.message);
    process.exit(1);
  }
}

// Fuerza un cold start actualizando una variable de entorno con el timestamp del deploy
function forceLambdaColdStart() {
  console.log('[6/6] 🧹 Forzando cold start de Lambda para limpiar caché...');

  try {
    // Obtener variables de entorno actuales
    const currentEnvRaw = execSync(
      `aws lambda get-function-configuration --function-name ${CONFIG.functionName} --region ${CONFIG.region} --query "Environment.Variables"`,
      { encoding: 'utf-8' }
    );
    const currentEnv = JSON.parse(currentEnvRaw);

    // Agregar/actualizar DEPLOY_TIMESTAMP para invalidar instancias warm
    currentEnv.DEPLOY_TIMESTAMP = String(Math.floor(Date.now() / 1000));

    const envString = Object.entries(currentEnv)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    execSync(
      `aws lambda update-function-configuration --function-name ${CONFIG.functionName} --region ${CONFIG.region} --environment "Variables={${envString}}"`,
      { stdio: 'inherit' }
    );
    console.log('✅ Cold start forzado — caché de configuración limpiada\n');

    console.log('✅ Deployment completado exitosamente!\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Verificar logs: aws logs tail /aws/lambda/' + CONFIG.functionName + ' --follow');
    console.log('   2. Test: curl https://[API-ID].execute-api.' + CONFIG.region + '.amazonaws.com/prod/health\n');

  } catch (error) {
    console.error('❌ Error forzando cold start:', error.message);
    // No hacer process.exit aquí — el deploy fue exitoso, solo falló el cold start
    console.warn('⚠️  El deploy fue exitoso pero el caché podría tardar en refrescarse');
  }
}
