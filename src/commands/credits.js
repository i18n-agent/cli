import { requireApiKey } from '../config.js';
import { callTool } from '../api-client.js';
import { formatOutput, print } from '../output.js';

export async function creditsAction(opts) {
  const apiKey = requireApiKey();
  const result = await callTool('get_credits', {}, apiKey);

  print(formatOutput(result, {
    json: opts.json,
    template: (data) => {
      const credits = data.credits ?? data.remainingCredits ?? data;
      if (typeof credits === 'object') {
        const remaining = credits.remaining ?? credits.balance ?? 'unknown';
        const wordsRemaining = credits.wordsRemaining ?? (typeof remaining === 'number' ? Math.floor(remaining / 0.001) : 'unknown');
        return `Credits remaining: ${remaining}\nEstimated words:  ${typeof wordsRemaining === 'number' ? wordsRemaining.toLocaleString() : wordsRemaining}\n\nTop up at: https://app.i18nagent.ai`;
      }
      return `Credits: ${JSON.stringify(credits)}`;
    }
  }));
}
