/**
 * Deploy Parity Guard — impede deploy de frontend sem backend em paridade.
 *
 * Hook PreToolUse do Google Antigravity para verificação determinística de
 * paridade de produção (Supabase Migrations + Edge Functions + Frontend).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function respond(decision, reason) {
  const result = { decision };
  if (reason) {
    result.reason = reason;
  }
  console.log(JSON.stringify(result));
  process.exit(0);
}

function resolveWorkspaceRoot() {
  let curr = __dirname;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

function isDeployCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return false;

  const normalized = cmd.trim();

  // 1. Git push para a branch main
  if (/git\s+push\b/i.test(normalized) && /\b(origin\s+main|main)\b/i.test(normalized)) {
    return true;
  }

  // 2. Vercel deploy para produção
  if (/vercel\b/i.test(normalized) && /(--prod\b|deploy\s+--prod\b)/i.test(normalized)) {
    return true;
  }

  // 3. Deploy de functions explicitando ambiente de produção
  if (/supabase\s+functions\s+deploy\b/i.test(normalized) && /(--project-ref|yantfnekslrzhussewdh)/i.test(normalized)) {
    return true;
  }

  return false;
}

function checkMigrations(workspaceRoot) {
  try {
    const rawOutput = execSync('npx supabase migration list --linked', {
      cwd: workspaceRoot,
      encoding: 'utf8',
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const jsonMatch = rawOutput.match(/\{[\s\S]*"migrations"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.migrations)) {
        const pending = parsed.migrations.filter(m => !m.remote || m.remote === '' || m.remote !== m.local);
        if (pending.length > 0) {
          const versions = pending.map(m => m.local).join(', ');
          return {
            status: 'deny',
            reason: `Migrations pendentes no Supabase Cloud: [${versions}]. Aplique 'npx supabase db push' antes do deploy de frontend.`
          };
        }
        return { status: 'ok' };
      }
    }

    if (/pending/i.test(rawOutput) || /not applied/i.test(rawOutput)) {
      return {
        status: 'deny',
        reason: "Migrations com status 'Pending' detectadas no Supabase Cloud. Aplique 'npx supabase db push' antes do deploy de frontend."
      };
    }

    return { status: 'ok' };
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    const combined = stderr + ' ' + stdout;

    // Verificar se stdout ainda trouxe o JSON de migrations
    const jsonMatch = combined.match(/\{[\s\S]*"migrations"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.migrations)) {
          const pending = parsed.migrations.filter(m => !m.remote || m.remote === '' || m.remote !== m.local);
          if (pending.length > 0) {
            const versions = pending.map(m => m.local).join(', ');
            return {
              status: 'deny',
              reason: `Migrations pendentes no Supabase Cloud: [${versions}]. Aplique 'npx supabase db push' antes do deploy de frontend.`
            };
          }
          return { status: 'ok' };
        }
      } catch (_) {}
    }

    return {
      status: 'ask',
      reason: `Não foi possível verificar as migrações remotas no Supabase Cloud (${err.message.split('\n')[0]}). Deseja confirmar que o banco está em paridade e prosseguir?`
    };
  }
}

function checkEdgeFunctions(workspaceRoot) {
  const functionsDir = path.join(workspaceRoot, 'supabase', 'functions');
  if (!fs.existsSync(functionsDir)) {
    return { status: 'ok' };
  }

  const localFunctions = fs.readdirSync(functionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_') && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);

  if (localFunctions.length === 0) {
    return { status: 'ok' };
  }

  try {
    const rawOutput = execSync('npx supabase functions list', {
      cwd: workspaceRoot,
      encoding: 'utf8',
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let remoteNames = [];
    const jsonMatch = rawOutput.match(/\{[\s\S]*"functions"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.functions)) {
        remoteNames = parsed.functions.map(f => f.name || f.slug || '').filter(Boolean);
      }
    } else {
      remoteNames = localFunctions.filter(fn => rawOutput.includes(fn));
    }

    const missing = localFunctions.filter(fn => !remoteNames.includes(fn));
    if (missing.length > 0) {
      return {
        status: 'deny',
        reason: `Edge Functions locais não publicadas no Supabase Cloud: [${missing.join(', ')}]. Execute 'npx supabase functions deploy <nome>' antes do deploy de frontend.`
      };
    }

    return { status: 'ok' };
  } catch (err) {
    return {
      status: 'ask',
      reason: `Não foi possível verificar as Edge Functions no Supabase Cloud (${err.message.split('\n')[0]}). Deseja confirmar que as functions estão em paridade e prosseguir?`
    };
  }
}

function main() {
  let commandToInspect = '';

  // 1. Suporte a argumento CLI direto (para testes e simulações)
  if (process.argv[2]) {
    commandToInspect = process.argv.slice(2).join(' ');
  } else {
    // 2. Leitura via stdin (formato oficial de hooks do Antigravity)
    try {
      const input = fs.readFileSync(0, 'utf8').trim();
      if (input) {
        if (input.startsWith('{')) {
          const parsed = JSON.parse(input);
          commandToInspect =
            parsed?.toolCall?.args?.CommandLine ||
            parsed?.toolCall?.args?.command ||
            parsed?.commandLine ||
            '';
        } else {
          commandToInspect = input;
        }
      }
    } catch (_) {
      commandToInspect = '';
    }
  }

  // 3. Se não for comando de deploy para produção, autorizar imediatamente
  if (!isDeployCommand(commandToInspect)) {
    respond('allow');
    return;
  }

  // 4. Se for comando de deploy, executar verificação de paridade de backend
  const workspaceRoot = resolveWorkspaceRoot();

  // Checagem A: Migrações
  const migrationResult = checkMigrations(workspaceRoot);
  if (migrationResult.status === 'deny') {
    respond('deny', migrationResult.reason);
    return;
  }

  // Checagem B: Edge Functions
  const functionResult = checkEdgeFunctions(workspaceRoot);
  if (functionResult.status === 'deny') {
    respond('deny', functionResult.reason);
    return;
  }

  // Se alguma checagem foi incerta
  if (migrationResult.status === 'ask') {
    respond('ask', migrationResult.reason);
    return;
  }
  if (functionResult.status === 'ask') {
    respond('ask', functionResult.reason);
    return;
  }

  // Se tudo verificado e em paridade
  respond('allow');
}

try {
  main();
} catch (fatalError) {
  respond('ask', `Falha interna no Deploy Parity Guard: ${fatalError.message}. Deseja prosseguir com o comando?`);
}
