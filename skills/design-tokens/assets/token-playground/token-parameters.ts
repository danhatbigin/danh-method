// Danh Method · Token parameters contract & validation (schemaVersion 1)
// Pure validation functions matching skills/design-prototype/scripts/token-parameters.mjs

export interface TokenBundle {
  schemaVersion: 1;
  source: {
    id: string;
    hashes: Record<string, string>;
  };
  tokens: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])])
    );
  }
  return value;
}

export function validateBundle(bundle: any, baseline: any = bundle): TokenBundle {
  if (!bundle || bundle.schemaVersion !== 1) {
    throw new Error('Unsupported token schemaVersion');
  }
  if (!bundle.source?.id || !bundle.source?.hashes || !Object.keys(bundle.source.hashes).length) {
    throw new Error('Missing source provenance');
  }
  if (JSON.stringify(canonical(bundle.source)) !== JSON.stringify(canonical(baseline.source))) {
    throw new Error('Source mismatch: render again from current components');
  }
  if (!bundle.tokens || Object.keys(bundle.tokens).sort().join(',') !== 'dark,light') {
    throw new Error('Expected light and dark modes');
  }

  for (const mode of ['light', 'dark'] as const) {
    const values = bundle.tokens[mode];
    const expected = baseline.tokens?.[mode];
    if (!values || typeof values !== 'object' || Array.isArray(values) || !expected) {
      throw new Error('Invalid mode');
    }
    if (Object.keys(values).sort().join(',') !== Object.keys(expected).sort().join(',')) {
      throw new Error('Token keys differ from the approved editable set');
    }
    for (const [name, value] of Object.entries(values)) {
      if (!/^--[a-zA-Z][\w-]*$/.test(name)) {
        throw new Error(`Invalid token name: ${name}`);
      }
      if (
        typeof value !== 'string' ||
        !value.trim() ||
        value.length > 500 ||
        /[;{}<>\r\n\x00-\x1f]|(?:url|image-set|image|cross-fade|src|paint|element|expression)\s*\(|(?:https?|data|file|blob):|!important|\/\*|\\|@/i.test(
          value
        )
      ) {
        throw new Error(`Invalid token value: ${name}`);
      }
    }
  }

  return JSON.parse(JSON.stringify(bundle));
}

export function parseBundle(text: string, baseline: any): TokenBundle {
  const value = text.trim();
  const json = value.startsWith('{') ? value : value.match(/```json\s*\n([\s\S]*?)\n```/)?.[1];
  if (!json) {
    throw new Error('Expected JSON or Markdown with a JSON block');
  }
  return validateBundle(JSON.parse(json), baseline);
}

export function toMarkdown(bundle: TokenBundle): string {
  validateBundle(bundle);
  return (
    '# Design token parameters · proposal\n\n' +
    'Source: ' +
    bundle.source.id +
    '\n\nApprove before applying to the design system.\n\n```json\n' +
    JSON.stringify(bundle, null, 2) +
    '\n```\n'
  );
}
