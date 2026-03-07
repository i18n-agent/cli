import { requireApiKey } from '../config.js';
import { callTool } from '../api-client.js';
import { formatOutput, print } from '../output.js';

export async function resumeAction(jobId, opts) {
  if (!jobId) {
    console.error('Error: jobId is required');
    console.error('Usage: i18nagent resume <jobId>');
    process.exit(1);
  }

  const apiKey = requireApiKey();

  try {
    const result = await callTool('resume_translation', { jobId }, apiKey, { timeout: 30000 });

    print(formatOutput(result, {
      json: opts.json,
      template: (data) => {
        if (data.status === 'processing' || data.status === 'resumed') {
          return `Job ${jobId} resumed. Check progress with: i18nagent status ${jobId}`;
        }
        return `Resume result: ${JSON.stringify(data, null, 2)}`;
      }
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
