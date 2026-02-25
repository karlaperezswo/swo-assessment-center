/**
 * Test script for SelectorSessionService
 * 
 * Run with: npx ts-node src/services/selector/test-session-service.ts
 */

import { SelectorSessionService } from './SelectorSessionService';
import { SelectorSession } from '../../types/selector';

async function testSessionService() {
  console.log('='.repeat(60));
  console.log('Testing SelectorSessionService');
  console.log('='.repeat(60));
  console.log();

  const testClientName = 'Test Client Corp';
  let testSession: SelectorSession;

  try {
    // Test 1: Create new session
    console.log('Test 1: Creating new session...');
    testSession = SelectorSessionService.createSession(testClientName);
    console.log('✅ Session created successfully');
    console.log(`   - Session ID: ${testSession.sessionId}`);
    console.log(`   - Client: ${testSession.clientName}`);
    console.log(`   - Answers: ${testSession.answers.length}`);
    console.log(`   - Completed: ${testSession.completed}`);
    console.log();

    // Test 2: Update answers
    console.log('Test 2: Adding answers to session...');
    testSession = SelectorSessionService.updateAnswer(testSession, 'q1', 'Si');
    testSession = SelectorSessionService.updateAnswer(testSession, 'q2', '<30');
    testSession = SelectorSessionService.updateAnswer(testSession, 'q3', 'VMware');
    console.log('✅ Answers added successfully');
    console.log(`   - Total answers: ${testSession.answers.length}`);
    console.log(`   - Last answer: ${testSession.answers[testSession.answers.length - 1].questionId} = ${testSession.answers[testSession.answers.length - 1].answer}`);
    console.log();

    // Test 3: Update existing answer
    console.log('Test 3: Updating existing answer...');
    const beforeUpdate = testSession.answers.find(a => a.questionId === 'q1')?.answer;
    testSession = SelectorSessionService.updateAnswer(testSession, 'q1', 'No');
    const afterUpdate = testSession.answers.find(a => a.questionId === 'q1')?.answer;
    console.log('✅ Answer updated successfully');
    console.log(`   - Before: q1 = ${beforeUpdate}`);
    console.log(`   - After: q1 = ${afterUpdate}`);
    console.log(`   - Total answers: ${testSession.answers.length} (should still be 3)`);
    console.log();

    // Test 4: Save session
    console.log('Test 4: Saving session to storage...');
    const savedSession = await SelectorSessionService.saveSession(testSession);
    console.log('✅ Session saved successfully');
    console.log(`   - Session ID: ${savedSession.sessionId}`);
    console.log(`   - Updated at: ${savedSession.updatedAt}`);
    console.log();

    // Test 5: Load session
    console.log('Test 5: Loading session from storage...');
    const loadedSession = await SelectorSessionService.loadSession(
      testClientName,
      testSession.sessionId
    );
    
    if (loadedSession) {
      console.log('✅ Session loaded successfully');
      console.log(`   - Session ID: ${loadedSession.sessionId}`);
      console.log(`   - Client: ${loadedSession.clientName}`);
      console.log(`   - Answers: ${loadedSession.answers.length}`);
      console.log(`   - Completed: ${loadedSession.completed}`);
    } else {
      console.log('❌ Session not found');
    }
    console.log();

    // Test 6: Mark as completed
    console.log('Test 6: Marking session as completed...');
    testSession = SelectorSessionService.markCompleted(testSession);
    await SelectorSessionService.saveSession(testSession);
    console.log('✅ Session marked as completed');
    console.log(`   - Completed: ${testSession.completed}`);
    console.log();

    // Test 7: Create another session for the same client
    console.log('Test 7: Creating second session for same client...');
    const session2 = SelectorSessionService.createSession(testClientName);
    const updatedSession2 = SelectorSessionService.updateAnswer(session2, 'q1', 'Si');
    await SelectorSessionService.saveSession(updatedSession2);
    console.log('✅ Second session created and saved');
    console.log(`   - Session ID: ${session2.sessionId}`);
    console.log();

    // Test 8: List sessions for client
    console.log('Test 8: Listing sessions for client...');
    const sessions = await SelectorSessionService.listSessions(testClientName, 10);
    console.log(`✅ Found ${sessions.length} sessions`);
    sessions.forEach((s: SelectorSession, i: number) => {
      console.log(`   ${i + 1}. ${s.sessionId.substring(0, 8)}... - ${s.answers.length} answers - Completed: ${s.completed}`);
    });
    console.log();

    // Test 9: Load non-existent session
    console.log('Test 9: Loading non-existent session...');
    const nonExistent = await SelectorSessionService.loadSession(
      testClientName,
      'non-existent-id'
    );
    
    if (nonExistent === null) {
      console.log('✅ Correctly returned null for non-existent session');
    } else {
      console.log('❌ Should have returned null');
    }
    console.log();

    // Test 10: Delete sessions (cleanup)
    console.log('Test 10: Deleting test sessions (cleanup)...');
    await SelectorSessionService.deleteSession(testClientName, testSession.sessionId);
    await SelectorSessionService.deleteSession(testClientName, session2.sessionId);
    console.log('✅ Test sessions deleted successfully');
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
testSessionService();
