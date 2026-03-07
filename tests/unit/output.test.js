import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatOutput, formatError, formatSuccess, formatProgress } from '../../src/output.js';

describe('output', () => {
  describe('formatOutput', () => {
    it('returns JSON string when json=true', () => {
      const data = { key: 'value' };
      const result = formatOutput(data, { json: true });
      assert.strictEqual(result, JSON.stringify(data, null, 2));
    });

    it('returns human-friendly text when json=false with template', () => {
      const data = { key: 'value' };
      const result = formatOutput(data, { json: false, template: (d) => `Key: ${d.key}` });
      assert.strictEqual(result, 'Key: value');
    });

    it('falls back to JSON.stringify for human mode when no template', () => {
      const data = { key: 'value' };
      const result = formatOutput(data, { json: false });
      assert.ok(result.includes('key'));
    });
  });

  describe('formatError', () => {
    it('includes error message', () => {
      const result = formatError('Something went wrong');
      assert.ok(result.includes('Something went wrong'));
    });

    it('returns JSON for json mode', () => {
      const result = formatError('fail', { json: true });
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.error, 'fail');
    });
  });

  describe('formatSuccess', () => {
    it('includes message', () => {
      const result = formatSuccess('Done!');
      assert.ok(result.includes('Done!'));
    });
  });

  describe('formatProgress', () => {
    it('renders progress bar', () => {
      const result = formatProgress(45, 100);
      assert.ok(result.includes('45%'));
    });

    it('handles 0%', () => {
      const result = formatProgress(0, 100);
      assert.ok(result.includes('0%'));
    });

    it('handles 100%', () => {
      const result = formatProgress(100, 100);
      assert.ok(result.includes('100%'));
    });
  });
});
