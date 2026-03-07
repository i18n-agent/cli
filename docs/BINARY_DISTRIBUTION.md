# Binary Distribution Strategy

Notes on future standalone binary packaging for `@i18n-agent/cli`.

## Current: npm only

```bash
npm install -g @i18n-agent/cli
```

Requires Node.js >= 18.

## Future Options

### Option 1: Node.js SEA (Single Executable Applications)

Available since Node.js 20. Bundles the app into a single executable.

**Pros:** Official Node.js feature, no external tools
**Cons:** Large binary (~50MB), Node 20+ only for building

```bash
# 1. Generate SEA config
echo '{"main":"bin/i18nagent.js","output":"sea-prep.blob"}' > sea-config.json

# 2. Generate the blob
node --experimental-sea-config sea-config.json

# 3. Copy node binary and inject
cp $(which node) i18nagent
npx postject i18nagent NODE_SEA_BLOB sea-prep.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

# 4. Sign on macOS
codesign --sign - i18nagent
```

### Option 2: Bun compile

Bun has built-in single-file compilation.

**Pros:** Fast, small binaries (~10-20MB), cross-compile support
**Cons:** Requires Bun, may have Node.js compatibility edge cases

```bash
bun build --compile bin/i18nagent.js --outfile i18nagent
# Cross-compile:
bun build --compile --target=bun-linux-x64 bin/i18nagent.js --outfile i18nagent-linux
bun build --compile --target=bun-darwin-arm64 bin/i18nagent.js --outfile i18nagent-macos
```

### Option 3: pkg (legacy)

Vercel's pkg tool. Deprecated but still works.

```bash
npx pkg bin/i18nagent.js --targets node18-macos-arm64,node18-linux-x64,node18-win-x64
```

### Option 4: esbuild + SEA

Bundle with esbuild first (tree-shaking, single file), then use SEA.

```bash
npx esbuild bin/i18nagent.js --bundle --platform=node --outfile=dist/i18nagent.cjs --format=cjs
# Then use SEA on the bundled file
```

## Recommended Approach

**Bun compile** for simplest DX and smallest binaries. Fall back to **Node.js SEA** if Bun compatibility issues arise.

## Distribution Channels

1. **GitHub Releases** - attach binaries for macOS (arm64, x64), Linux (x64, arm64), Windows (x64)
2. **Homebrew tap** - `brew install i18n-agent/tap/i18nagent`
3. **curl installer** - `curl -fsSL https://i18nagent.ai/install.sh | sh`

## CI/CD

Use GitHub Actions to build binaries on each release tag:

```yaml
# .github/workflows/release-binaries.yml
on:
  release:
    types: [published]

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: bun-darwin-arm64
            artifact: i18nagent-macos-arm64
          - os: ubuntu-latest
            target: bun-linux-x64
            artifact: i18nagent-linux-x64
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: cd cli && bun build --compile --target=${{ matrix.target }} bin/i18nagent.js --outfile ${{ matrix.artifact }}
      - uses: softprops/action-gh-release@v2
        with:
          files: cli/${{ matrix.artifact }}
```
