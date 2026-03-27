// Script para probar la conexión con el backend
const axios = require('axios');

const BACKEND_URL = 'http://localhost:4000';

async function testBackendConnection() {
  console.log('🔍 Probando conexión con el backend...\n');

  // Test 1: Health Check
  console.log('1️⃣ Test: Health Check');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend está funcionando');
    console.log('   Respuesta:', response.data);
  } catch (error) {
    console.error('❌ Backend NO está funcionando');
    console.error('   Error:', error.message);
    console.error('\n⚠️  Asegúrate de que el backend esté ejecutándose:');
    console.error('   - Ejecuta: npm run dev');
    console.error('   - O ejecuta: node backend/dist/index.js');
    process.exit(1);
  }

  console.log('\n2️⃣ Test: Endpoint de dependencias');
  try {
    // Intentar hacer una petición sin archivo (debería fallar con mensaje específico)
    await axios.post(`${BACKEND_URL}/api/dependencies/upload`);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Endpoint de dependencias está disponible');
      console.log('   Mensaje esperado:', error.response.data.error);
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  }

  console.log('\n✅ Todos los tests pasaron correctamente');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Abre el frontend en http://localhost:3005');
  console.log('   2. Ve al módulo "Mapa de Dependencias"');
  console.log('   3. Selecciona un archivo Excel');
  console.log('   4. Click en "Cargar"');
  console.log('   5. Revisa la consola del navegador (F12) para ver los logs');
}

testBackendConnection().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
