// D2 owner decision, 2026-10-29. Shared by Node validation and the offline editor.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export function validateBundle(bundle, baseline = bundle) {
  if (!bundle || bundle.schemaVersion !== 1) throw new Error('Unsupported token schemaVersion');
  if (!bundle.source?.id || !bundle.source?.hashes || !Object.keys(bundle.source.hashes).length) throw new Error('Missing source provenance');
  if (JSON.stringify(canonical(bundle.source)) !== JSON.stringify(canonical(baseline.source))) throw new Error('Source mismatch: render again from current components');
  if (!bundle.tokens || Object.keys(bundle.tokens).sort().join(',') !== 'dark,light') throw new Error('Expected light and dark modes');
  for (const mode of ['light', 'dark']) {
    const values = bundle.tokens[mode], expected = baseline.tokens?.[mode];
    if (!values || typeof values !== 'object' || Array.isArray(values) || !expected) throw new Error('Invalid mode');
    if (Object.keys(values).sort().join(',') !== Object.keys(expected).sort().join(',')) throw new Error('Token keys differ from the approved editable set');
    for (const [name, value] of Object.entries(values)) {
      if (!/^--[a-zA-Z][\w-]*$/.test(name)) throw new Error('Invalid token name');
      if (typeof value !== 'string' || !value.trim() || value.length > 500 || /[;{}<>\r\n\x00-\x1f]|(?:url|image-set|image|cross-fade|src|paint|element|expression)\s*\(|(?:https?|data|file|blob):|!important|\/\*|\\|@/i.test(value)) throw new Error(`Invalid token value: ${name}`);
    }
  }
  return JSON.parse(JSON.stringify(bundle));
}
export function parseBundle(text, baseline) {
  const value = text.trim();
  const json = value.startsWith('{') ? value : value.match(/```json\s*\n([\s\S]*?)\n```/)?.[1];
  if (!json) throw new Error('Expected JSON or Markdown with a JSON block');
  return validateBundle(JSON.parse(json), baseline);
}
export function toMarkdown(bundle) {
  validateBundle(bundle);
  return '# Design token parameters · proposal\n\nSource: ' + bundle.source.id + '\n\nApprove before applying to the design system.\n\n```json\n' + JSON.stringify(bundle, null, 2) + '\n```\n';
}

export function mountEditor(baseline) {
  let current = validateBundle(baseline);
  // Controls are outside the product canvas; shadow DOM prevents DS styles leaking in.
  const host = document.createElement('aside'); host.id = 'danh-token-editor';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>:host{display:block;position:relative;font:14px system-ui;background:#f5f5f5;color:#161616;padding:12px}summary,button,input,select{font:inherit}label{display:inline-flex;gap:8px;align-items:center;margin:6px}button{margin:6px}input[type=text]{width:180px}output{display:block;min-height:20px}details>div{display:flex;flex-wrap:wrap}</style><details><summary>Design tokens · review controls</summary><div><label>Theme <select id="mode"><option>light</option><option>dark</option></select></label><button id="json" type="button">Export JSON</button><button id="md" type="button">Export Markdown</button><label>Import JSON / Markdown <input id="import" type="file" accept=".json,.md,application/json,text/markdown"></label><button id="reset" type="button">Reset</button></div><div id="fields"></div><output role="status" aria-live="polite"></output><p>Proposal only. Apply to the design system after approval.</p></details>`;
  document.body.prepend(host);
  const $ = s => shadow.querySelector(s), message = text => { $('output').textContent = text; };
  const override = document.createElement('style'); override.id = 'danh-token-overrides'; document.head.append(override);
  const theme = () => $('#mode').value;
  function apply() {
    const tokens = current.tokens[theme()];
    override.textContent = ':root{' + Object.entries(tokens).map(([k,v]) => k + ':' + v + ' !important').join(';') + '}';
    document.documentElement.classList.toggle('dark', theme() === 'dark');
    document.documentElement.dataset.theme = theme();
    document.documentElement.style.colorScheme = theme();
  }
  function fields() {
    $('#fields').replaceChildren();
    for (const [name, value] of Object.entries(current.tokens[theme()])) {
      const label = document.createElement('label'); label.textContent = name;
      const input = document.createElement('input'); input.type = 'text'; input.value = value;
      input.addEventListener('change', () => {
        const next = JSON.parse(JSON.stringify(current)); next.tokens[theme()][name] = input.value;
        try { current = validateBundle(next, baseline); apply(); message('Preview updated. Export to save this proposal.'); }
        catch (error) { input.value = current.tokens[theme()][name]; message(error.message); }
      });
      label.append(input); $('#fields').append(label);
    }
  }
  function download(ext) {
    const text = ext === 'json' ? JSON.stringify(current, null, 2) + '\n' : toMarkdown(current);
    const url = URL.createObjectURL(new Blob([text], { type: ext === 'json' ? 'application/json' : 'text/markdown' }));
    const link = document.createElement('a'); link.href = url; link.download = 'design-token-parameters.' + ext; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    message('Proposal exported. Source files were not changed.');
  }
  $('#mode').value = document.documentElement.classList.contains('dark') || document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  $('#mode').addEventListener('change', () => { apply(); fields(); });
  $('#json').addEventListener('click', () => download('json'));
  $('#md').addEventListener('click', () => download('md'));
  $('#reset').addEventListener('click', () => { current = validateBundle(baseline); apply(); fields(); message('Reset to source snapshot.'); });
  $('#import').addEventListener('change', async event => {
    // A shadow-root event may lose its retargeted target after awaiting File.text().
    const input = event.currentTarget;
    const file = input.files[0]; if (!file) return;
    try { current = parseBundle(await file.text(), baseline); apply(); fields(); message('Imported proposal.'); }
    catch (error) { message(error.message); }
    input.value = '';
  });
  // Integrate with the capture script's ?theme=dark without opening the controls.
  const requested = new URLSearchParams(location.search).get('theme');
  if (requested === 'light' || requested === 'dark') $('#mode').value = requested;
  apply(); fields();
}
