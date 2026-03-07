import fs from 'fs';
import path from 'path';
import { requireApiKey } from '../config.js';
import { callTool } from '../api-client.js';
import { print, printErr } from '../output.js';

export async function downloadAction(jobId, opts) {
  if (!jobId) {
    console.error('Error: jobId is required');
    console.error('Usage: i18nagent download <jobId>');
    process.exit(1);
  }

  const apiKey = requireApiKey();
  const outputDir = opts.output || `./i18n-translations-${jobId}`;

  try {
    printErr(`Downloading translations for job ${jobId}...`);

    const result = await callTool('download_translations', { jobId }, apiKey, { timeout: 60000 });

    fs.mkdirSync(outputDir, { recursive: true });
    const filesWritten = [];

    if (result.downloadUrls) {
      for (const [lang, url] of Object.entries(result.downloadUrls)) {
        printErr(`  Downloading ${lang}...`);
        const response = await fetch(url);
        const content = await response.text();
        const ext = result.fileName?.split('.').pop() || 'json';
        const filePath = path.join(outputDir, `${lang}.${ext}`);
        fs.writeFileSync(filePath, content);
        filesWritten.push(filePath);
      }
    } else if (result.translations) {
      for (const [lang, content] of Object.entries(result.translations)) {
        const ext = result.fileName?.split('.').pop() || 'json';
        const filePath = path.join(outputDir, `${lang}.${ext}`);
        fs.writeFileSync(filePath, content);
        filesWritten.push(filePath);
      }
    }

    if (opts.json) {
      print(JSON.stringify({ jobId, outputDir, filesWritten }, null, 2));
    } else {
      print(`Downloaded ${filesWritten.length} files to ${outputDir}:\n${filesWritten.map(f => `  ${f}`).join('\n')}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
