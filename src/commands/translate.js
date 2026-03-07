import fs from 'fs';
import path from 'path';
import { requireApiKey, loadConfig, getConfigPath } from '../config.js';
import { callTool } from '../api-client.js';
import { formatOutput, formatProgress, print, printErr } from '../output.js';
import { promptText, promptChoice } from '../prompts.js';
import { detectNamespaceFromPath } from '../namespace-detector.js';

function isFilePath(input) {
  if (!input) return false;
  if (fs.existsSync(input)) return true;
  const ext = path.extname(input);
  if (ext && !input.includes(' ')) return true;
  return false;
}

function parseLanguages(langStr) {
  if (!langStr) return null;
  return langStr.split(',').map(l => l.trim()).filter(Boolean);
}

async function interactiveTranslate(opts) {
  const modeIdx = await promptChoice('What would you like to translate?', [
    'Text',
    'File',
  ]);
  if (modeIdx === null) return;

  if (modeIdx === 0) {
    const text = await promptText('Enter text to translate: ');
    if (!text) return;
    const lang = await promptText('Target language(s) (comma-separated, e.g. es,fr): ');
    if (!lang) return;
    opts.lang = lang;
    return translateText([text], opts);
  } else {
    const filePath = await promptText('File path: ');
    if (!filePath) return;
    const lang = await promptText('Target language(s) (comma-separated, e.g. es,fr): ');
    if (!lang) return;
    opts.lang = lang;
    return translateFile(filePath, opts);
  }
}

export async function translateAction(input, opts) {
  if (!input) {
    return interactiveTranslate(opts);
  }
  if (isFilePath(input)) {
    return translateFile(input, opts);
  } else {
    return translateText([input], opts);
  }
}

export async function translateTextAction(text, opts) {
  if (!text) {
    const input = await promptText('Enter text to translate: ');
    if (!input) return;
    text = input;
  }
  return translateText([text], opts);
}

export async function translateFileAction(filePath, opts) {
  if (!filePath) {
    const input = await promptText('File path: ');
    if (!input) return;
    filePath = input;
  }
  return translateFile(filePath, opts);
}

async function translateText(texts, opts) {
  const apiKey = requireApiKey();
  const languages = parseLanguages(opts.lang);
  if (!languages) {
    printErr('Error: --lang is required (e.g. --lang es,fr,ja)');
    process.exit(1);
  }

  const args = {
    texts,
    targetLanguages: languages,
  };
  if (opts.source) args.sourceLanguage = opts.source;
  if (opts.audience) args.targetAudience = opts.audience;
  if (opts.industry) args.industry = opts.industry;
  if (opts.context) args.context = opts.context;
  if (opts.namespace) args.namespace = opts.namespace;
  if (opts.pseudo) args.pseudoTranslation = true;
  if (opts.skipWarnings) args.skipWarnings = true;

  try {
    const result = await callTool('translate_text', args, apiKey, {
      timeout: texts.join('').length > 50000 ? 600000 : 300000,
    });

    if (result.status === 'processing' && result.jobId) {
      printErr(`Job started: ${result.jobId}`);
      printErr('Polling for completion...\n');
      return pollAndDownload(result.jobId, apiKey, opts);
    }

    print(formatOutput(result, {
      json: opts.json,
      template: formatTranslationResult,
    }));
  } catch (error) {
    printErr(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function translateFile(filePath, opts) {
  const apiKey = requireApiKey();
  const languages = parseLanguages(opts.lang);
  if (!languages) {
    printErr('Error: --lang is required (e.g. --lang es,fr,ja)');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    printErr(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).slice(1) || 'auto';

  let namespace = opts.namespace;
  if (!namespace) {
    const config = loadConfig(getConfigPath());
    namespace = config.defaultNamespace;
  }
  if (!namespace) {
    const detection = detectNamespaceFromPath(path.resolve(filePath));
    if (detection.suggestion && detection.confidence > 0.5) {
      namespace = detection.suggestion;
      printErr(`Auto-detected namespace: "${namespace}"`);
    }
  }
  if (!namespace) {
    namespace = await promptText('Namespace (required for file translation): ');
    if (!namespace) {
      printErr('Error: namespace is required for file translation');
      process.exit(1);
    }
  }

  const args = {
    fileContent: content,
    filePath,
    fileType: ext,
    targetLanguages: languages,
    namespace,
  };
  if (opts.source) args.sourceLanguage = opts.source;
  if (opts.audience) args.targetAudience = opts.audience;
  if (opts.industry) args.industry = opts.industry;
  if (opts.context) args.context = opts.context;
  if (opts.pseudo) args.pseudoTranslation = true;
  if (opts.skipWarnings) args.skipWarnings = true;

  printErr(`Translating ${path.basename(filePath)} -> ${languages.join(', ')}...`);

  try {
    const result = await callTool('translate_file', args, apiKey, {
      timeout: content.length > 50000 ? 600000 : 300000,
    });

    if (result.jobId) {
      printErr(`Job ID: ${result.jobId}\n`);
      return pollAndDownload(result.jobId, apiKey, opts);
    }

    print(formatOutput(result, { json: opts.json }));
  } catch (error) {
    printErr(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function pollAndDownload(jobId, apiKey, opts) {
  const startTime = Date.now();
  const maxWait = 600000;

  while (Date.now() - startTime < maxWait) {
    try {
      const status = await callTool('check_translation_status', {
        jobId,
        pageSize: 50,
      }, apiKey, { timeout: 30000 });

      const progress = status.progress || 0;
      const statusText = status.status || 'unknown';

      if (!opts.json) {
        const bar = formatProgress(progress, 100);
        const completed = status.completedLanguages?.join(', ') || '';
        printErr(`\r  ${bar} | ${statusText}${completed ? ' | Done: ' + completed : ''}    `);
      }

      if (statusText === 'completed' || progress === 100) {
        if (!opts.json) printErr('\n');
        return downloadResults(jobId, apiKey, opts);
      }

      if (statusText === 'failed') {
        if (!opts.json) printErr('\n');
        const msg = status.error || 'Translation failed';
        printErr(`Error: ${msg}`);
        process.exit(1);
      }

      await new Promise(r => setTimeout(r, 5000));
    } catch (error) {
      printErr(`\nError checking status: ${error.message}`);
      printErr(`Check manually: i18nagent status ${jobId}`);
      process.exit(1);
    }
  }

  printErr(`\nTimeout waiting for job. Check status: i18nagent status ${jobId}`);
  process.exit(1);
}

async function downloadResults(jobId, apiKey, opts) {
  try {
    const result = await callTool('download_translations', { jobId }, apiKey, { timeout: 60000 });

    const outputDir = opts.output || `./i18n-translations-${jobId}`;
    fs.mkdirSync(outputDir, { recursive: true });

    const filesWritten = [];

    if (result.downloadUrls) {
      for (const [lang, url] of Object.entries(result.downloadUrls)) {
        const response = await fetch(url);
        const content = await response.text();
        const ext = result.fileName?.split('.').pop() || 'json';
        const fp = path.join(outputDir, `${lang}.${ext}`);
        fs.writeFileSync(fp, content);
        filesWritten.push(fp);
      }
    } else if (result.translations) {
      for (const [lang, content] of Object.entries(result.translations)) {
        const ext = result.fileName?.split('.').pop() || 'json';
        const fp = path.join(outputDir, `${lang}.${ext}`);
        fs.writeFileSync(fp, content);
        filesWritten.push(fp);
      }
    }

    if (opts.json) {
      print(JSON.stringify({ jobId, outputDir, filesWritten }, null, 2));
    } else {
      print(`Translation complete! Files saved to:\n${filesWritten.map(f => `  ${f}`).join('\n')}`);
    }
  } catch (error) {
    printErr(`Error downloading: ${error.message}`);
    printErr(`Download manually: i18nagent download ${jobId}`);
    process.exit(1);
  }
}

function formatTranslationResult(data) {
  if (!data) return 'No result';
  const lines = ['Translation complete\n'];

  if (data.translations) {
    if (Array.isArray(data.translations)) {
      for (const t of data.translations) {
        lines.push(`  ${t.language || t.lang}: "${t.text || t.translation}"`);
      }
    } else if (typeof data.translations === 'object') {
      for (const [lang, texts] of Object.entries(data.translations)) {
        if (Array.isArray(texts)) {
          lines.push(`  ${lang}: ${texts.map(t => `"${t}"`).join(', ')}`);
        } else {
          lines.push(`  ${lang}: "${texts}"`);
        }
      }
    }
  }

  if (data.creditsUsed !== undefined) {
    lines.push(`\n  Credits used: ${data.creditsUsed}`);
  }

  return lines.join('\n');
}
