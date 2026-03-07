import { getConfigPath, loadConfig } from '../config.js';
import { print } from '../output.js';
import fs from 'fs';
import path from 'path';

export async function logoutAction() {
  const configPath = getConfigPath();
  const config = loadConfig(configPath);

  if (!config.apiKey) {
    print('Not logged in.');
    return;
  }

  delete config.apiKey;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  print('API key removed. Logged out.');
}
