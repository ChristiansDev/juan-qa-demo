// Stop hook for Cursor and Claude Code: if the agent changed TypeScript files, run typecheck and lint.
// On failure, the errors go back to the agent (Cursor: up to loop_limit times; Claude Code: once,
// since a continuation already triggered by this hook arrives with stop_hook_active).
import { spawnSync } from 'node:child_process';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function run(args) {
  const result = spawnSync('pnpm', args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

function changedTypeScriptFiles() {
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' });
  if (status.status !== 0) return true;
  return status.stdout.split('\n').some((line) => /\.(ts|tsx|mts|cts)$/.test(line.trim()));
}

async function main() {
  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const isClaude = payload.hook_event_name === 'Stop';
  const skip = isClaude ? payload.stop_hook_active === true : payload.status !== 'completed';

  if (skip || !changedTypeScriptFiles()) {
    process.stdout.write('{}\n');
    return;
  }

  const failures = [];
  for (const script of ['typecheck', 'lint']) {
    const { ok, output } = run(['run', '--silent', script]);
    if (!ok) failures.push(`pnpm ${script}:\n${output.slice(-4000)}`);
  }

  if (failures.length === 0) {
    process.stdout.write('{}\n');
    return;
  }

  const message = `El quality gate falló. Corregí estos errores y volvé a verificar:\n\n${failures.join('\n\n')}`;
  process.stdout.write(
    JSON.stringify(isClaude ? { decision: 'block', reason: message } : { followup_message: message }) + '\n',
  );
}

main().catch((err) => {
  console.error('[quality-gate]', err instanceof Error ? err.message : String(err));
  process.stdout.write('{}\n');
});
