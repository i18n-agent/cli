import readline from 'readline';

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

export async function promptText(question) {
  const rl = createInterface();
  try {
    const answer = await ask(rl, question);
    return answer || null;
  } finally {
    rl.close();
  }
}

export async function promptApiKey() {
  const rl = createInterface();
  try {
    const key = await ask(rl, 'Enter your API key (get one at https://app.i18nagent.ai): ');
    if (!key) return null;
    if (!key.startsWith('i18n_') || key.length <= 5) {
      console.error('Invalid API key format. Keys should start with "i18n_"');
      return null;
    }
    return key;
  } finally {
    rl.close();
  }
}

export async function promptChoice(question, choices) {
  const rl = createInterface();
  try {
    console.error(question);
    choices.forEach((choice, i) => {
      console.error(`  [${i + 1}] ${choice}`);
    });
    const answer = await ask(rl, '\n  Choose: ');
    const num = parseInt(answer, 10);
    if (isNaN(num) || num < 1 || num > choices.length) return null;
    return num - 1;
  } finally {
    rl.close();
  }
}

export async function promptConfirm(question) {
  const rl = createInterface();
  try {
    const answer = await ask(rl, `${question} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}
