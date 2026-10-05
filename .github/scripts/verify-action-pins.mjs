/**
 * Every `uses:` in .github/workflows names a full commit SHA with its
 * release tag in a comment: `owner/repo@<40 hex> # vX.Y.Z`. A tag can be
 * moved after review; a SHA can't.
 *
 *   node .github/scripts/verify-action-pins.mjs           # shape only, offline
 *   node .github/scripts/verify-action-pins.mjs --online  # and ask GitHub that
 *                                                        # each SHA is its tag
 *
 * test/action-pins.test.ts runs the offline half, so a bad pin fails before
 * it's pushed. Dependabot's github-actions updates keep both parts current.
 */
import { readdirSync, readFileSync } from "node:fs";

const PINNED =
  /^([\w.-]+\/[\w.-]+)(\/[\w./-]+)?@([0-9a-f]{40}) # (v\d+\.\d+\.\d+)$/;

/** Every `uses:` value in one workflow file, with its line number. */
export function findUses(text) {
  return text.split("\n").flatMap((line, index) => {
    const match = /^\s*(?:-\s+)?uses:\s*(.+?)\s*$/.exec(line);
    return match ? [{ line: index + 1, value: match[1] }] : [];
  });
}

/** The parsed pin, or why it isn't one. */
export function parsePin(value) {
  if (value.startsWith("./")) return { local: true };
  const match = PINNED.exec(value);
  if (!match) {
    return { error: `${value}: pin it as owner/repo@<40-hex sha> # vX.Y.Z` };
  }
  const [, repo, , sha, tag] = match;
  return { repo, sha, tag };
}

export function workflowPins(dir = new URL("../workflows/", import.meta.url)) {
  return readdirSync(dir)
    .filter((name) => /\.ya?ml$/.test(name))
    .flatMap((name) =>
      findUses(readFileSync(new URL(name, dir), "utf8")).map((use) => ({
        file: name,
        ...use,
        pin: parsePin(use.value),
      })),
    );
}

async function github(path) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub ${path}: HTTP ${response.status}`);
  return response.json();
}

/** The commit a tag points at, through an annotated tag if there is one. */
async function tagCommit(repo, tag) {
  const ref = await github(`repos/${repo}/git/ref/tags/${tag}`);
  if (ref.object.type === "commit") return ref.object.sha;
  return (await github(`repos/${repo}/git/tags/${ref.object.sha}`)).object.sha;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pins = workflowPins();
  const problems = pins
    .filter((p) => p.pin.error)
    .map((p) => `${p.file}:${p.line}: ${p.pin.error}`);
  if (process.argv.includes("--online")) {
    const seen = new Map();
    for (const { file, line, pin } of pins) {
      if (!pin.repo) continue;
      const key = `${pin.repo}@${pin.tag}`;
      if (!seen.has(key)) seen.set(key, await tagCommit(pin.repo, pin.tag));
      if (seen.get(key) !== pin.sha) {
        problems.push(
          `${file}:${line}: ${key} is ${seen.get(key)}, not ${pin.sha}`,
        );
      }
    }
  }
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`${pins.length} action pins OK`);
}
