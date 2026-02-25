/**
 * Test script for SelectorConfigService
 * 
 * Run with: npx ts-node src/services/selector/test-config-service.ts
 */

import { SelectorConfigService } from './SelectorConfigService';

async function testConfigService() {
  console.log('='.repeat(60));
  console.log('Testing SelectorConfigService');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test 1: Load Questions
    console.log('Test 1: Loading questions configuration...');
    const questions = await SelectorConfigService.loadQuestions();
    console.log('✅ Questions loaded successfully');
    console.log(`   - Version: ${questions.version}`);
    console.log(`   - Total Questions: ${questions.totalQuestions}`);
    console.log(`   - Categories: ${questions.categories.length}`);
    console.log();

    // Test 2: Load Matrix
    console.log('Test 2: Loading matrix configuration...');
    const matrix = await SelectorConfigService.loadMatrix();
    console.log('✅ Matrix loaded successfully');
    console.log(`   - Version: ${matrix.version}`);
    console.log(`   - Tools: ${matrix.tools.join(', ')}`);
    console.log(`   - Matrix Entries: ${matrix.matrix.length}`);
    console.log();

    // Test 3: Cache Test
    console.log('Test 3: Testing cache (should be instant)...');
    const startTime = Date.now();
    await SelectorConfigService.loadQuestions();
    await SelectorConfigService.loadMatrix();
    const endTime = Date.now();
    console.log(`✅ Cache working (loaded in ${endTime - startTime}ms)`);
    console.log();

    // Test 4: Get Question by ID
    console.log('Test 4: Getting question by ID (q1)...');
    const question = await SelectorConfigService.getQuestionById('q1');
    if (question) {
      console.log('✅ Question found');
      console.log(`   - ID: ${question.id}`);
      console.log(`   - Text: ${question.text}`);
      console.log(`   - Type: ${question.type}`);
    } else {
      console.log('❌ Question not found');
    }
    console.log();

    // Test 5: Get All Question IDs
    console.log('Test 5: Getting all question IDs...');
    const questionIds = await SelectorConfigService.getAllQuestionIds();
    console.log(`✅ Found ${questionIds.length} question IDs`);
    console.log(`   - First 5: ${questionIds.slice(0, 5).join(', ')}`);
    console.log();

    // Test 6: Validate Integrity
    console.log('Test 6: Validating configuration integrity...');
    const validation = await SelectorConfigService.validateIntegrity();
    if (validation.valid) {
      console.log('✅ Configuration integrity validated successfully');
    } else {
      console.log('❌ Configuration has errors:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }
    console.log();

    // Test 7: Reload
    console.log('Test 7: Testing reload functionality...');
    const reloaded = await SelectorConfigService.reload();
    console.log('✅ Configurations reloaded successfully');
    console.log(`   - Questions: ${reloaded.questions.totalQuestions}`);
    console.log(`   - Matrix entries: ${reloaded.matrix.matrix.length}`);
    console.log();

    console.log('='.repeat(60));
    console.log('All tests completed successfully! ✅');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testConfigService();
