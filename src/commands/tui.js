import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promptChoice, promptText } from '../prompts.js';
import { translateAction } from './translate.js';
import { statusAction } from './status.js';
import { creditsAction } from './credits.js';
import { loginAction } from './login.js';
import { printErr } from '../output.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVersion() {
  const pkgPath = path.join(__dirname, '..', '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

export async function tuiAction() {
  console.error(`\ni18n-agent CLI v${getVersion()}\n`);

  while (true) {
    const choice = await promptChoice('What would you like to do?', [
      'Translate text',
      'Translate file',
      'Check job status',
      'View credits',
      'Upload translations',
      'Settings (login/logout)',
      'Exit',
    ]);

    if (choice === null || choice === 6) {
      break;
    }

    try {
      switch (choice) {
        case 0: {
          const text = await promptText('\nEnter text to translate: ');
          if (!text) break;
          const lang = await promptText('Target language(s) (e.g. es,fr): ');
          if (!lang) break;
          await translateAction(text, { lang });
          break;
        }
        case 1: {
          const filePath = await promptText('\nFile path: ');
          if (!filePath) break;
          const lang = await promptText('Target language(s) (e.g. es,fr): ');
          if (!lang) break;
          await translateAction(filePath, { lang });
          break;
        }
        case 2: {
          const jobId = await promptText('\nJob ID: ');
          if (!jobId) break;
          await statusAction(jobId, {});
          break;
        }
        case 3: {
          await creditsAction({});
          break;
        }
        case 4: {
          printErr('\nUse: i18nagent upload <file> --source <lang> --target <lang>');
          break;
        }
        case 5: {
          const settingChoice = await promptChoice('\nSettings:', [
            'Login (save API key)',
            'Logout (remove API key)',
            'Back',
          ]);
          if (settingChoice === 0) await loginAction({});
          if (settingChoice === 1) {
            const { logoutAction } = await import('./logout.js');
            await logoutAction();
          }
          break;
        }
      }
    } catch (error) {
      printErr(`\nError: ${error.message}\n`);
    }

    console.error('');
  }

  console.error('Goodbye!');
}
