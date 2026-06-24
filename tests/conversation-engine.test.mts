import test from 'node:test';
import assert from 'node:assert';
import { ConversationEngine } from '../src/lib/ai/conversation-engine.ts';

test('ConversationEngine parses personality correctly', async () => {
    // We can't easily mock the full OpenAI client within node:test without a mock library
    // but we can test instance initialization and public non-network methods.

    // Mock the OpenAI instance as any
    const mockOpenAI: any = {};

    const engine = new ConversationEngine(mockOpenAI, {
        agentId: 'agent_1',
        callSid: 'CA123',
        direction: 'outbound'
    });

    await engine.initialize({
        name: 'Test Agent',
        systemPrompt: 'You are a test agent',
        personality: JSON.stringify({
            confidence: 0.9,
            verbosity: 'concise'
        })
    });

    const transcript = engine.getTranscript();
    assert.strictEqual(transcript.length, 0, 'Initial transcript should only have system prompt which is excluded from getTranscript');
});

test('ConversationEngine estimates sentiment locally', async () => {
    const mockOpenAI: any = {};
    const engine = new ConversationEngine(mockOpenAI, {
        agentId: 'agent_1',
        callSid: 'CA123',
        direction: 'outbound'
    });

    // Accessing private method via bracket notation for testing
    const sentiment = (engine as any).estimateSentiment('this is perfect and great and wonderful');
    assert.ok(sentiment > 0, 'Sentiment should be positive');

    const negativeSentiment = (engine as any).estimateSentiment('no stop this is terrible');
    assert.ok(negativeSentiment < 0, 'Sentiment should be negative');
});

test('ConversationEngine detect forced transfer', async () => {
    const mockOpenAI: any = {};
    const engine = new ConversationEngine(mockOpenAI, {
        agentId: 'agent_1',
        callSid: 'CA123',
        direction: 'outbound'
    });

    const shouldTransfer = (engine as any).shouldForceTransfer('let me speak to a real person');
    assert.ok(shouldTransfer, 'Should force transfer when asked for real person');

    const shouldNotTransfer = (engine as any).shouldForceTransfer('tell me about the house');
    assert.ok(!shouldNotTransfer, 'Should not force transfer for normal question');
});
