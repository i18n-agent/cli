import fs from 'fs';
import { requireApiKey } from '../config.js';
import { callTool } from '../api-client.js';
import { formatOutput, print } from '../output.js';

export async function analyzeAction(input, opts) {
  if (!input) {
    console.error('Error: provide text or file path to analyze');
    console.error('Usage: i18nagent analyze <text-or-file> --lang <target>');
    process.exit(1);
  }

  if (!opts.lang) {
    console.error('Error: --lang is required (target language)');
    process.exit(1);
  }

  const apiKey = requireApiKey();

  let content = input;
  if (fs.existsSync(input)) {
    content = fs.readFileSync(input, 'utf8');
  }

  try {
    const result = await callTool('analyze_content', {
      content,
      targetLanguage: opts.lang,
      sourceLanguage: opts.source,
      industry: opts.industry || 'general',
      targetAudience: opts.audience || 'general',
    }, apiKey);

    print(formatOutput(result, {
      json: opts.json,
      template: (data) => {
        const lines = ['Content Analysis\n'];
        if (data.sourceLanguage) lines.push(`  Source language: ${data.sourceLanguage} (${data.confidence || ''})`);
        if (data.contentType) lines.push(`  Content type:   ${data.contentType}`);
        if (data.readinessScore !== undefined) lines.push(`  Readiness:      ${data.readinessScore}/100`);
        if (data.wordCount) lines.push(`  Word count:     ${data.wordCount}`);
        if (data.estimatedCredits) lines.push(`  Est. credits:   ${data.estimatedCredits}`);
        if (data.suggestions?.length) {
          lines.push('\n  Suggestions:');
          data.suggestions.forEach(s => lines.push(`    - ${s}`));
        }
        if (data.warnings?.length) {
          lines.push('\n  Warnings:');
          data.warnings.forEach(w => lines.push(`    ! ${w}`));
        }
        return lines.join('\n');
      }
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
