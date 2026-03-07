import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildJsonRpcRequest, parseJsonRpcResponse, isHeavyLoadError, MCP_SERVER_URL } from '../../src/api-client.js';

describe('api-client', () => {
  describe('MCP_SERVER_URL', () => {
    it('points to production MCP server', () => {
      assert.strictEqual(MCP_SERVER_URL, 'https://mcp.i18nagent.ai');
    });
  });

  describe('buildJsonRpcRequest', () => {
    it('builds valid JSON-RPC 2.0 request', () => {
      const req = buildJsonRpcRequest('translate_text', { texts: ['hello'] });
      assert.strictEqual(req.jsonrpc, '2.0');
      assert.strictEqual(req.method, 'tools/call');
      assert.strictEqual(req.params.name, 'translate_text');
      assert.deepStrictEqual(req.params.arguments, { texts: ['hello'] });
      assert.ok(typeof req.id === 'number');
    });
  });

  describe('parseJsonRpcResponse', () => {
    it('extracts result from successful response', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: '{"translations":["hola"]}' }]
        }
      };
      const parsed = parseJsonRpcResponse(response);
      assert.deepStrictEqual(parsed, { translations: ['hola'] });
    });

    it('throws on JSON-RPC error', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        error: { message: 'Something failed' }
      };
      assert.throws(() => parseJsonRpcResponse(response), /Something failed/);
    });

    it('returns raw text when content is not JSON', () => {
      const response = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: 'plain text result' }]
        }
      };
      const parsed = parseJsonRpcResponse(response);
      assert.strictEqual(parsed, 'plain text result');
    });
  });

  describe('isHeavyLoadError', () => {
    it('detects heavy load messages', () => {
      assert.ok(isHeavyLoadError('Our system is under heavy load, please resume your job later.'));
    });

    it('returns false for normal errors', () => {
      assert.ok(!isHeavyLoadError('Invalid API key'));
    });

    it('handles null/undefined', () => {
      assert.ok(!isHeavyLoadError(null));
      assert.ok(!isHeavyLoadError(undefined));
    });
  });
});
