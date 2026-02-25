import { SelectorSessionService } from './SelectorSessionService';

console.log('SelectorSessionService:', SelectorSessionService);
console.log('createSession:', SelectorSessionService.createSession);

const session = SelectorSessionService.createSession('Test Client');
console.log('Session created:', session);
