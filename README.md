# @i18n-agent/cli

Terminal client for the i18n-agent translation service. Translate text and files directly from your terminal.

## Install

```bash
npm install -g @i18n-agent/cli
```

Requires Node.js >= 18.

## Setup

```bash
# Save your API key (get one at https://app.i18nagent.ai)
i18nagent login
```

Or set via environment variable (for CI/CD):
```bash
export I18N_AGENT_API_KEY=your-key-here
```

## Usage

### Translate text
```bash
i18nagent translate "Hello world" --lang es
i18nagent translate "Hello world" --lang es,fr,ja
```

### Translate files
```bash
i18nagent translate ./locales/en.json --lang es,fr
i18nagent translate ./docs/guide.md --lang de --namespace my-project
```

### Interactive mode
```bash
i18nagent translate     # prompts for input
i18nagent tui           # full interactive menu
```

### Check job status
```bash
i18nagent status <jobId>
```

### Download translations
```bash
i18nagent download <jobId> --output ./locales
```

### Resume failed jobs
```bash
i18nagent resume <jobId>
```

### Check credits
```bash
i18nagent credits
```

### Upload existing translations
```bash
i18nagent upload ./de.json --source en --target de --namespace my-project
```

### List supported languages
```bash
i18nagent languages
```

### Analyze content
```bash
i18nagent analyze ./en.json --lang es
```

## JSON output

All commands support `--json` for machine-readable output:
```bash
i18nagent translate "Hello" --lang es --json
i18nagent credits --json
```

## Config

Config is stored at `~/.config/i18nagent/config.json`:
```json
{
  "apiKey": "i18n_...",
  "defaultLanguages": ["es", "fr"],
  "defaultNamespace": "my-project"
}
```

Environment variable `I18N_AGENT_API_KEY` takes priority over config file.

## Binary distribution

See [docs/BINARY_DISTRIBUTION.md](docs/BINARY_DISTRIBUTION.md) for standalone binary packaging.

## License

MIT
