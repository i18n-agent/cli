import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { loginAction } from './commands/login.js';
import { logoutAction } from './commands/logout.js';
import { creditsAction } from './commands/credits.js';
import { languagesAction } from './commands/languages.js';
import { translateAction, translateTextAction, translateFileAction } from './commands/translate.js';
import { statusAction } from './commands/status.js';
import { downloadAction } from './commands/download.js';
import { resumeAction } from './commands/resume.js';
import { uploadAction, uploadsListAction } from './commands/upload.js';
import { analyzeAction } from './commands/analyze.js';
import { tuiAction } from './commands/tui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVersion() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

export function createProgram() {
  const program = new Command();

  program
    .name('i18nagent')
    .description('Terminal client for i18n-agent translation service')
    .version(getVersion());

  // --- Auth ---

  program
    .command('login')
    .description('Save API key to config file')
    .option('--key <key>', 'API key (or enter interactively)')
    .option('--force', 'Overwrite existing key')
    .action(loginAction);

  program
    .command('logout')
    .description('Remove saved API key')
    .action(logoutAction);

  // --- Translation ---

  const addTranslateOpts = (cmd) => cmd
    .option('--lang <languages>', 'Target language(s), comma-separated (e.g. es,fr,ja)')
    .option('--source <lang>', 'Source language (auto-detected if omitted)')
    .option('--audience <audience>', 'Target audience (e.g. general, technical)')
    .option('--industry <industry>', 'Industry context (e.g. technology, healthcare)')
    .option('--context <context>', 'Additional instructions for translation')
    .option('--namespace <ns>', 'Namespace for project tracking')
    .option('--pseudo', 'Pseudo-translation mode (no AI cost)')
    .option('--skip-warnings', 'Skip source quality warnings')
    .option('--output <dir>', 'Output directory for file translations')
    .option('--json', 'Output as JSON');

  const translate = program
    .command('translate [input]')
    .description('Translate text or file (auto-detected). Run without args for interactive mode.');
  addTranslateOpts(translate).action(translateAction);

  const translateTextCmd = translate
    .command('text [text]')
    .description('Translate text content');
  addTranslateOpts(translateTextCmd).action(translateTextAction);

  const translateFileCmd = translate
    .command('file [path]')
    .description('Translate a file');
  addTranslateOpts(translateFileCmd).action(translateFileAction);

  // --- Job management ---

  program
    .command('status <jobId>')
    .description('Check translation job status')
    .option('--json', 'Output as JSON')
    .option('--page-size <n>', 'Languages per page (default: 50)')
    .action(statusAction);

  program
    .command('download <jobId>')
    .description('Download completed translations')
    .option('--output <dir>', 'Output directory')
    .option('--json', 'Output as JSON')
    .action(downloadAction);

  program
    .command('resume <jobId>')
    .description('Resume a failed or interrupted translation job')
    .option('--json', 'Output as JSON')
    .action(resumeAction);

  // --- Upload ---

  program
    .command('upload [filePath]')
    .description('Upload existing translations for reuse')
    .requiredOption('--source <lang>', 'Source language code')
    .requiredOption('--target <lang>', 'Target language code')
    .option('--namespace <ns>', 'Namespace for tracking')
    .option('--json', 'Output as JSON')
    .action(uploadAction);

  const uploads = program
    .command('uploads')
    .description('Manage uploaded translations');

  uploads
    .command('list')
    .description('List uploaded translations in a namespace')
    .requiredOption('--namespace <ns>', 'Namespace to list')
    .option('--source <lang>', 'Filter by source language')
    .option('--target <lang>', 'Filter by target language')
    .option('--json', 'Output as JSON')
    .action(uploadsListAction);

  // --- Info ---

  program
    .command('credits')
    .description('Check translation credit balance')
    .option('--json', 'Output as JSON')
    .action(creditsAction);

  program
    .command('languages')
    .description('List supported languages')
    .option('--json', 'Output as JSON')
    .option('--no-quality', 'Exclude quality ratings')
    .action(languagesAction);

  program
    .command('analyze <input>')
    .description('Analyze content for translation readiness')
    .requiredOption('--lang <lang>', 'Target language')
    .option('--source <lang>', 'Source language')
    .option('--audience <audience>', 'Target audience')
    .option('--industry <industry>', 'Industry context')
    .option('--json', 'Output as JSON')
    .action(analyzeAction);

  // --- Interactive ---

  program
    .command('tui')
    .description('Launch interactive TUI mode')
    .action(tuiAction);

  return program;
}
