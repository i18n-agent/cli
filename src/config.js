import fs from 'fs';
import path from 'path';
import os from 'os';

export function getConfigPath() {
  return path.join(os.homedir(), '.config', 'i18nagent', 'config.json');
}

export function loadConfig(configPath) {
  try {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

export function saveConfig(configPath, updates) {
  const existing = loadConfig(configPath);
  const merged = { ...existing, ...updates };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + '\n');
  return merged;
}

export function getApiKey(configPath) {
  if (process.env.I18N_AGENT_API_KEY) {
    return process.env.I18N_AGENT_API_KEY;
  }
  const config = loadConfig(configPath || getConfigPath());
  return config.apiKey || null;
}

export function requireApiKey(configPath) {
  const key = getApiKey(configPath);
  if (!key) {
    console.error('Error: No API key found.\n');
    console.error('Set your API key using one of:');
    console.error('  i18nagent login');
    console.error('  export I18N_AGENT_API_KEY=your-key-here\n');
    console.error('Get your API key at: https://app.i18nagent.ai');
    process.exit(1);
  }
  return key;
}
