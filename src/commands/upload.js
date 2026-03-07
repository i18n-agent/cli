import fs from 'fs';
import path from 'path';
import { requireApiKey, loadConfig, getConfigPath } from '../config.js';
import { callTool, uploadFile } from '../api-client.js';
import { formatOutput, print, printErr } from '../output.js';
import { detectNamespaceFromPath } from '../namespace-detector.js';
import { promptText } from '../prompts.js';

export async function uploadAction(filePath, opts) {
  if (!filePath) {
    filePath = await promptText('File path: ');
    if (!filePath) return;
  }

  const apiKey = requireApiKey();

  if (!opts.source) {
    console.error('Error: --source is required (source language code, e.g. en)');
    process.exit(1);
  }
  if (!opts.target) {
    console.error('Error: --target is required (target language code, e.g. es)');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

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
    namespace = await promptText('Namespace: ');
    if (!namespace) {
      console.error('Error: namespace is required');
      process.exit(1);
    }
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  try {
    printErr(`Uploading ${fileName}...`);

    const result = await uploadFile(
      `/namespaces/${namespace}/translations/upload`,
      { sourceLocale: opts.source, targetLocale: opts.target },
      { name: 'file', content, fileName },
      apiKey,
    );

    print(formatOutput(result, {
      json: opts.json,
      template: (data) => {
        const lines = ['Upload successful\n'];
        lines.push(`  Namespace:  ${namespace}`);
        lines.push(`  File:       ${fileName}`);
        lines.push(`  Languages:  ${opts.source} -> ${opts.target}`);
        if (data.pairsStored) lines.push(`  Pairs stored:  ${data.pairsStored}`);
        if (data.pairsUpdated) lines.push(`  Pairs updated: ${data.pairsUpdated}`);
        return lines.join('\n');
      }
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

export async function uploadsListAction(opts) {
  const apiKey = requireApiKey();

  if (!opts.namespace) {
    console.error('Error: --namespace is required');
    process.exit(1);
  }

  try {
    const args = { namespace: opts.namespace };
    if (opts.source) args.sourceLocale = opts.source;
    if (opts.target) args.targetLocale = opts.target;

    const result = await callTool('list_uploaded_translations', args, apiKey);

    print(formatOutput(result, {
      json: opts.json,
      template: (data) => {
        const files = data.files || data.translations || data;
        if (!Array.isArray(files) || files.length === 0) {
          return `No uploaded translations found in namespace "${opts.namespace}"`;
        }
        const lines = [`Uploaded translations in "${opts.namespace}":\n`];
        for (const f of files) {
          lines.push(`  ${f.fileName || f.name} | ${f.sourceLocale} -> ${f.targetLocale} | ${f.translationCount || f.pairs || '?'} pairs`);
        }
        return lines.join('\n');
      }
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
