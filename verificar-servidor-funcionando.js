#!/usr/bin/env node

/**
 * Script para verificar que el servidor backend esté funcionando correctamente
 */

const http = require('http');

console.log('\n🔍 Verificando servidor backend...\n');

const checkServer = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // 404 es OK si no hay ruta /health, significa que el servidor está corriendo
        resolve(true);
      } else {
        reject(new Error(`Status code: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
};

const testUploadEndpoint = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      filename: 'test.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/report/get-upload-url',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data.uploadUrl) {
            resolve(response);
          } else {
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
};

(async () => {
  try {
    // Test 1: Verificar que el servidor esté corriendo
    console.log('TEST 1: Verificar servidor en puerto 4000...');
    await checkServer();
    console.log('✅ Servidor backend está corriendo\n');

    // Test 2: Probar endpoint de upload
    console.log('TEST 2: Probar endpoint /api/report/get-upload-url...');
    const response = await testUploadEndpoint();
    console.log('✅ Endpoint funcionando correctamente');
    console.log(`   URL generada: ${response.data.uploadUrl.substring(0, 80)}...`);
    console.log(`   Key: ${response.data.key}`);
    console.log(`   Expira en: ${response.data.expiresIn} segundos\n`);

    console.log('='.repeat(60));
    console.log('\n🎉 ¡SERVIDOR FUNCIONANDO CORRECTAMENTE!\n');
    console.log('✅ Puedes subir archivos sin problemas\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Abre http://localhost:3005');
    console.log('   2. Ve a Assess → Rapid Discovery');
    console.log('   3. Sube tu archivo Excel MPA\n');

  } catch (error) {
    console.error('❌ ERROR:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   El servidor backend NO está corriendo\n');
      console.error('💡 SOLUCIÓN:');
      console.error('   1. Ejecuta: REINICIAR-SERVIDOR.bat');
      console.error('   2. O manualmente: cd backend && npm start\n');
    } else if (error.message.includes('Timeout')) {
      console.error('   El servidor no responde (timeout)\n');
      console.error('💡 SOLUCIÓN:');
      console.error('   1. Verifica que el servidor esté iniciado');
      console.error('   2. Revisa los logs del servidor');
      console.error('   3. Reinicia el servidor\n');
    } else {
      console.error(`   ${error.message}\n`);
      console.error('💡 SOLUCIÓN:');
      console.error('   1. Revisa los logs del servidor backend');
      console.error('   2. Verifica la configuración en backend/.env');
      console.error('   3. Ejecuta: node diagnostico-upload-s3.js\n');
    }
    
    process.exit(1);
  }
})();
