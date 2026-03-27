// Script de diagnóstico completo del sistema
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3005';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     DIAGNÓSTICO COMPLETO DEL SISTEMA                   ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBackend() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  TEST: BACKEND (http://localhost:4000)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend está FUNCIONANDO');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Backend NO está funcionando');
    if (error.code === 'ECONNREFUSED') {
      console.log('   Error: Conexión rechazada');
      console.log('   Causa: El servidor no está ejecutándose');
      console.log('');
      console.log('   💡 SOLUCIÓN:');
      console.log('      Ejecuta: INICIO-LIMPIO.bat');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Error: Timeout');
      console.log('   Causa: El servidor no responde');
    } else {
      console.log('   Error:', error.message);
    }
    return false;
  }
}

async function testFrontend() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  TEST: FRONTEND (http://localhost:3005)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend está FUNCIONANDO');
    console.log('   Status:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Frontend NO está funcionando');
    if (error.code === 'ECONNREFUSED') {
      console.log('   Error: Conexión rechazada');
      console.log('   Causa: El servidor no está ejecutándose');
      console.log('');
      console.log('   💡 SOLUCIÓN:');
      console.log('      Ejecuta: INICIO-LIMPIO.bat');
    } else {
      console.log('   Error:', error.message);
    }
    return false;
  }
}

async function testDependencyEndpoint() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  TEST: ENDPOINT DE DEPENDENCIAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Intentar sin archivo (debería dar error 400)
    await axios.post(`${BACKEND_URL}/api/dependencies/upload`, {}, { timeout: 5000 });
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Endpoint está DISPONIBLE');
      console.log('   URL: /api/dependencies/upload');
      console.log('   Mensaje esperado:', error.response.data.error);
      return true;
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Endpoint NO está disponible');
      console.log('   Error: No se puede conectar');
      return false;
    } else {
      console.log('⚠️  Respuesta inesperada');
      console.log('   Error:', error.message);
      return false;
    }
  }
}

async function checkFiles() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  TEST: ARCHIVOS DEL PROYECTO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const files = [
    'backend/src/index.ts',
    'backend/src/routes/dependencyRoutes.ts',
    'backend/src/controllers/dependencyController.ts',
    'backend/src/services/dependencyService.ts',
    'frontend/src/components/DependencyMap.tsx',
    'frontend/src/lib/api.ts',
    'frontend/vite.config.ts',
  ];
  
  let allExist = true;
  
  for (const file of files) {
    const exists = fs.existsSync(file);
    if (exists) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NO EXISTE`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function checkBackendCompiled() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  TEST: BACKEND COMPILADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const distExists = fs.existsSync('backend/dist');
  const indexExists = fs.existsSync('backend/dist/index.js');
  
  if (distExists && indexExists) {
    console.log('✅ Backend está compilado');
    console.log('   Carpeta dist existe');
    console.log('   Archivo index.js existe');
    return true;
  } else {
    console.log('❌ Backend NO está compilado');
    if (!distExists) {
      console.log('   Carpeta dist NO existe');
    }
    if (!indexExists) {
      console.log('   Archivo index.js NO existe');
    }
    console.log('');
    console.log('   💡 SOLUCIÓN:');
    console.log('      cd backend');
    console.log('      npm run build');
    console.log('      cd ..');
    return false;
  }
}

async function checkPorts() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('6️⃣  TEST: PUERTOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const { stdout: stdout4000 } = await execPromise('netstat -ano | findstr :4000 | findstr LISTENING');
    console.log('✅ Puerto 4000 está EN USO (Backend)');
  } catch {
    console.log('❌ Puerto 4000 está LIBRE (Backend no está ejecutándose)');
  }
  
  try {
    const { stdout: stdout3005 } = await execPromise('netstat -ano | findstr :3005 | findstr LISTENING');
    console.log('✅ Puerto 3005 está EN USO (Frontend)');
  } catch {
    console.log('❌ Puerto 3005 está LIBRE (Frontend no está ejecutándose)');
  }
}

async function runDiagnostics() {
  const backendOk = await testBackend();
  const frontendOk = await testFrontend();
  const endpointOk = backendOk ? await testDependencyEndpoint() : false;
  const filesOk = await checkFiles();
  const compiledOk = await checkBackendCompiled();
  await checkPorts();
  
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    RESUMEN                             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  console.log(`Backend:              ${backendOk ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Frontend:             ${frontendOk ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Endpoint Dependencias: ${endpointOk ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Archivos del Proyecto: ${filesOk ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Backend Compilado:     ${compiledOk ? '✅ OK' : '❌ FALLO'}`);
  
  console.log('');
  
  if (backendOk && frontendOk && endpointOk && filesOk && compiledOk) {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          ✅ SISTEMA FUNCIONANDO CORRECTAMENTE          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🎉 Todo está listo para usar');
    console.log('');
    console.log('📍 URLs:');
    console.log('   Backend:  http://localhost:4000');
    console.log('   Frontend: http://localhost:3005');
    console.log('');
    console.log('🌐 Abre tu navegador en: http://localhost:3005');
    console.log('');
  } else {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          ⚠️  SE ENCONTRARON PROBLEMAS                  ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('💡 SOLUCIÓN RECOMENDADA:');
    console.log('');
    console.log('   1. Ejecuta: DETENER-TODO.bat');
    console.log('   2. Espera 5 segundos');
    console.log('   3. Ejecuta: INICIO-LIMPIO.bat');
    console.log('   4. Ejecuta: node diagnostico-completo.js');
    console.log('');
  }
}

runDiagnostics().catch(error => {
  console.error('');
  console.error('❌ Error fatal en diagnóstico:', error.message);
  process.exit(1);
});
