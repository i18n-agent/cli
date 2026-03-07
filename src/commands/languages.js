import { requireApiKey } from '../config.js';
import { callTool } from '../api-client.js';
import { formatOutput, print } from '../output.js';

export async function languagesAction(opts) {
  const apiKey = requireApiKey();

  try {
    const result = await callTool('list_supported_languages', {
      includeQuality: opts.quality,
    }, apiKey);

    print(formatOutput(result, {
      json: opts.json,
      template: (data) => {
        const languages = data.languages || data;
        if (!Array.isArray(languages)) {
          return JSON.stringify(data, null, 2);
        }
        const lines = ['Supported Languages:', ''];
        for (const lang of languages) {
          const quality = lang.quality ? ` (${lang.quality})` : '';
          lines.push(`  ${(lang.code || '').padEnd(12)} ${lang.name || ''}${quality}`);
        }
        lines.push('', `Total: ${languages.length} languages`);
        return lines.join('\n');
      }
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
