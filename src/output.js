export function formatOutput(data, opts = {}) {
  if (opts.json) {
    return JSON.stringify(data, null, 2);
  }
  if (opts.template) {
    return opts.template(data);
  }
  return JSON.stringify(data, null, 2);
}

export function formatError(message, opts = {}) {
  if (opts.json) {
    return JSON.stringify({ error: message });
  }
  return `Error: ${message}`;
}

export function formatSuccess(message, opts = {}) {
  if (opts.json) {
    return JSON.stringify({ success: true, message });
  }
  return message;
}

export function formatProgress(current, total, width = 20) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  const bar = '#'.repeat(filled) + '.'.repeat(empty);
  return `[${bar}] ${pct}%`;
}

export function print(text) {
  process.stdout.write(text + '\n');
}

export function printErr(text) {
  process.stderr.write(text + '\n');
}
