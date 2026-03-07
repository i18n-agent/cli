import { requireApiKey } from '../config.js';
import { callTool } from '../api-client.js';
import { formatOutput, formatProgress, print } from '../output.js';

export async function statusAction(jobId, opts) {
  if (!jobId) {
    console.error('Error: jobId is required');
    console.error('Usage: i18nagent status <jobId>');
    process.exit(1);
  }

  const apiKey = requireApiKey();

  try {
    const result = await callTool('check_translation_status', {
      jobId,
      pageSize: opts.pageSize ? parseInt(opts.pageSize) : 50,
    }, apiKey, { timeout: 30000 });

    print(formatOutput(result, {
      json: opts.json,
      template: (data) => {
        const lines = [`Job: ${jobId}`];
        lines.push(`Status: ${data.status || 'unknown'}`);
        if (data.progress !== undefined) {
          lines.push(`Progress: ${formatProgress(data.progress, 100)}`);
        }
        if (data.elapsedTime) {
          lines.push(`Elapsed: ${data.elapsedTime}`);
        }
        if (data.completedLanguages?.length) {
          lines.push(`Completed: ${data.completedLanguages.join(', ')}`);
        }
        if (data.status === 'completed') {
          lines.push('\nDownload with: i18nagent download ' + jobId);
        }
        return lines.join('\n');
      }
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
