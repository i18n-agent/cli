import { getConfigPath, saveConfig, getApiKey } from '../config.js';
import { promptApiKey } from '../prompts.js';
import { print } from '../output.js';

export async function loginAction(opts) {
  const configPath = getConfigPath();

  const existingKey = getApiKey(configPath);
  if (existingKey && !opts.force) {
    print('Already logged in. Use --force to overwrite.');
    return;
  }

  let apiKey = opts.key;
  if (!apiKey) {
    apiKey = await promptApiKey();
  }

  if (!apiKey) {
    print('No API key provided. Aborting.');
    return;
  }

  saveConfig(configPath, { apiKey });
  print(`API key saved to ${configPath}`);
}
