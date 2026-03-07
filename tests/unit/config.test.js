import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, saveConfig, getApiKey, getConfigPath } from '../../src/config.js';

describe('config', () => {
  let tmpDir;
  let originalEnv;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nagent-test-'));
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  describe('getConfigPath', () => {
    it('returns path under i18nagent dir', () => {
      const configPath = getConfigPath();
      assert.ok(configPath.includes('i18nagent'));
      assert.ok(configPath.endsWith('config.json'));
    });
  });

  describe('loadConfig', () => {
    it('returns empty object when config file does not exist', () => {
      const config = loadConfig(path.join(tmpDir, 'nonexistent.json'));
      assert.deepStrictEqual(config, {});
    });

    it('returns parsed config from file', () => {
      const configPath = path.join(tmpDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ apiKey: 'i18n_test123' }));
      const config = loadConfig(configPath);
      assert.strictEqual(config.apiKey, 'i18n_test123');
    });

    it('returns empty object on invalid JSON', () => {
      const configPath = path.join(tmpDir, 'config.json');
      fs.writeFileSync(configPath, 'not json');
      const config = loadConfig(configPath);
      assert.deepStrictEqual(config, {});
    });
  });

  describe('saveConfig', () => {
    it('writes config to file and creates directory', () => {
      const configPath = path.join(tmpDir, 'subdir', 'config.json');
      saveConfig(configPath, { apiKey: 'i18n_test456' });
      const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(content.apiKey, 'i18n_test456');
    });

    it('merges with existing config', () => {
      const configPath = path.join(tmpDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ apiKey: 'i18n_old', defaultNamespace: 'my-proj' }));
      saveConfig(configPath, { apiKey: 'i18n_new' });
      const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(content.apiKey, 'i18n_new');
      assert.strictEqual(content.defaultNamespace, 'my-proj');
    });
  });

  describe('getApiKey', () => {
    it('prefers env var over config file', () => {
      const configPath = path.join(tmpDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ apiKey: 'i18n_from_config' }));
      process.env.I18N_AGENT_API_KEY = 'i18n_from_env';
      const key = getApiKey(configPath);
      assert.strictEqual(key, 'i18n_from_env');
    });

    it('falls back to config file when env var not set', () => {
      const configPath = path.join(tmpDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ apiKey: 'i18n_from_config' }));
      delete process.env.I18N_AGENT_API_KEY;
      const key = getApiKey(configPath);
      assert.strictEqual(key, 'i18n_from_config');
    });

    it('returns null when neither env var nor config has key', () => {
      delete process.env.I18N_AGENT_API_KEY;
      const key = getApiKey(path.join(tmpDir, 'nonexistent.json'));
      assert.strictEqual(key, null);
    });
  });
});
