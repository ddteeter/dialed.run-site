/**
 * The design contract as a lint over source text. Each rule is one line of
 * "a raw value is a review failure" (tokens.js, CONTRACT FOR AGENTS):
 *  - the RegExp rules tokens.js exports as LINT, used as written;
 *  - no raw hex colour (T1 variables only);
 *  - no Tailwind arbitrary value (`max-w-[620px]`, `bg-[#fff]`), which is
 *    a raw value in a class name;
 *  - no `disabled` attribute (Accessibility Contract 07: aria-disabled).
 *
 * test/contract-lint.test.ts runs it over src/.
 */
export interface LintRule {
  id: string;
  reject: RegExp;
  allow: string;
  /** Lets a match through, e.g. a 1px border on `border-bottom`. */
  exempt?: (match: string, before: string) => boolean;
}

export interface Violation {
  file: string;
  line: number;
  rule: string;
  text: string;
  allow: string;
}

interface TokensLintEntry {
  id: string;
  reject: RegExp | string;
  allow: string;
}

const borderWidth = (match: string, before: string) =>
  before.endsWith("border-") && /:\s*[12]px\b/.test(match);

export function contractRules(
  tokensLint: readonly TokensLintEntry[],
): LintRule[] {
  const fromTokens = tokensLint.flatMap((entry): LintRule[] =>
    entry.reject instanceof RegExp
      ? [
          {
            id: entry.id,
            reject: entry.reject,
            allow: entry.allow,
            ...(entry.id === "no-raw-spacing" ? { exempt: borderWidth } : {}),
          },
        ]
      : [],
  );
  return [
    ...fromTokens,
    {
      id: "no-raw-hex",
      reject: /(?<![\w"'/=&])#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/,
      allow: "a T1 variable: var(--ink), or a colour utility like text-ink",
    },
    {
      id: "no-tailwind-arbitrary-value",
      reject: /(?<=^|[\s"'`{])[\w:-]*\[[^\]\s]+\](?=[\s"'`}]|$)/,
      allow: "a theme utility (p-4, max-w-column, rounded-card)",
    },
    {
      id: "no-disabled-attribute",
      reject: /(?<=\s)disabled(?=[\s=>/])/,
      allow: 'aria-disabled="true" plus a handler guard',
    },
  ];
}

export function lintSource(
  file: string,
  text: string,
  rules: LintRule[],
): Violation[] {
  const violations: Violation[] = [];
  for (const rule of rules) {
    const global = new RegExp(
      rule.reject.source,
      `${rule.reject.flags.replace("g", "")}g`,
    );
    for (const match of text.matchAll(global)) {
      const before = text.slice(0, match.index);
      if (rule.exempt?.(match[0], before) === true) continue;
      violations.push({
        file,
        line: before.split("\n").length,
        rule: rule.id,
        text: match[0],
        allow: rule.allow,
      });
    }
  }
  return violations;
}
