#!/usr/bin/env node
/**
 * Proyecto Orinoco - Universal Cross-Platform Runner
 * Funciona de manera idéntica en Windows (CMD / PowerShell), Linux y macOS.
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const IS_WIN = process.platform === 'win32';

function getVenvPython() {
  return path.join(
    ROOT_DIR,
    '.venv',
    IS_WIN ? 'Scripts' : 'bin',
    IS_WIN ? 'python.exe' : 'python'
  );
}

function getNpmCmd() {
  return IS_WIN ? 'npm.cmd' : 'npm';
}

function findSystemPython() {
  const candidates = IS_WIN
    ? [
        { cmd: 'py', args: ['-3'] },
        { cmd: 'python', args: [] },
        { cmd: 'python3', args: [] },
      ]
    : [
        { cmd: 'python3', args: [] },
        { cmd: 'python', args: [] },
      ];

  for (const cand of candidates) {
    try {
      const res = spawnSync(cand.cmd, [...cand.args, '--version'], { stdio: 'ignore' });
      if (res.status === 0) {
        return cand;
      }
    } catch (err) {}
  }
  return null;
}

function killProcessTree(proc) {
  if (!proc || proc.exitCode !== null) return;
  if (IS_WIN) {
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', proc.pid.toString()], { stdio: 'ignore' });
    } catch (e) {}
  } else {
    try {
      process.kill(-proc.pid, 'SIGTERM');
    } catch (e) {
      try {
        proc.kill('SIGTERM');
      } catch (err) {}
    }
  }
}

function cmdSetup() {
  console.log('='.repeat(60));
  console.log('  🌊 Proyecto Orinoco - Instalación Multiplataforma');
  console.log('='.repeat(60));

  // 1. Detectar Python del sistema
  const sysPy = findSystemPython();
  if (!sysPy) {
    console.error('❌ Error: No se encontró Python 3 instalado en el sistema.');
    console.error('   Por favor descárgalo desde https://www.python.org/');
    if (IS_WIN) console.error('   (Asegúrate de marcar "Add python.exe to PATH")');
    process.exit(1);
  }

  // 2. Entorno virtual
  const venvDir = path.join(ROOT_DIR, '.venv');
  const venvPython = getVenvPython();

  console.log('\n📦 [1/2] Configurando Backend y Entorno Virtual Python...');
  if (!fs.existsSync(venvDir) || !fs.existsSync(venvPython)) {
    console.log(`  Creando entorno virtual en ${venvDir}...`);
    const venvRes = spawnSync(sysPy.cmd, [...sysPy.args, '-m', 'venv', venvDir], {
      stdio: 'inherit',
    });
    if (venvRes.status !== 0) {
      console.error('❌ Error creando entorno virtual Python.');
      process.exit(1);
    }
  } else {
    console.log('  Entorno virtual existente detectado en .venv.');
  }

  console.log('  Instalando dependencias de Python (requirements.txt)...');
  const pipUpgrade = spawnSync(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
    stdio: 'inherit',
  });
  if (pipUpgrade.status !== 0) {
    console.error('❌ Error actualizando pip.');
  }

  const pipReqs = spawnSync(
    venvPython,
    ['-m', 'pip', 'install', '-r', path.join(ROOT_DIR, 'requirements.txt')],
    { stdio: 'inherit' }
  );
  if (pipReqs.status !== 0) {
    console.error('❌ Error instalando requirements.txt.');
    process.exit(1);
  }
  console.log('✓ Dependencias de Python listas.');

  // 3. Dependencias de Frontend
  console.log('\n📦 [2/2] Instalando dependencias del Frontend (npm install)...');
  const npmRes = spawnSync(getNpmCmd(), ['install'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: IS_WIN,
  });
  if (npmRes.status !== 0) {
    console.error('❌ Error instalando paquetes de npm en frontend.');
    process.exit(1);
  }
  console.log('✓ Dependencias de Frontend listas.');

  console.log('\n' + '='.repeat(60));
  console.log('  ✅ ¡Instalación completada con éxito!');
  console.log('='.repeat(60));
  console.log('Para iniciar ambos servidores simultáneamente ejecuta:');
  console.log('  npm run dev\n');
}

function cmdDev() {
  const venvPython = getVenvPython();
  if (!fs.existsSync(venvPython)) {
    console.error('❌ Entorno virtual no configurado.');
    console.error('   Ejecuta primero: npm run setup');
    process.exit(1);
  }

  const nodeModulesDir = path.join(FRONTEND_DIR, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    console.error('❌ Dependencias de Frontend no encontradas.');
    console.error('   Ejecuta primero: npm run setup');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('  🌊 Proyecto Orinoco - Levantando Servidores');
  console.log('='.repeat(60));
  console.log('  🌐 Backend API:  http://localhost:8000  (Docs: http://localhost:8000/docs)');
  console.log('  💻 Frontend Web: http://localhost:3000');
  console.log('  Presiona Ctrl + C para detener ambos servidores.');
  console.log('='.repeat(60) + '\n');

  let backendProc = null;
  let frontendProc = null;
  let isShuttingDown = false;

  const cleanup = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n🛑 Deteniendo servidores...');
    if (backendProc) killProcessTree(backendProc);
    if (frontendProc) killProcessTree(frontendProc);
    console.log('✓ Servidores detenidos limpiamente.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    if (!isShuttingDown) {
      if (backendProc) killProcessTree(backendProc);
      if (frontendProc) killProcessTree(frontendProc);
    }
  });

  // 1. Iniciar Backend
  backendProc = spawn(
    venvPython,
    ['-m', 'uvicorn', 'src.api.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
    {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      detached: !IS_WIN,
    }
  );

  backendProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.log(`\n⚠️  El backend se cerró con código ${code}`);
      cleanup();
    }
  });

  // 2. Iniciar Frontend
  frontendProc = spawn(getNpmCmd(), ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: IS_WIN,
    detached: !IS_WIN,
  });

  frontendProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.log(`\n⚠️  El frontend se cerró con código ${code}`);
      cleanup();
    }
  });
}

function cmdBackend() {
  const venvPython = getVenvPython();
  if (!fs.existsSync(venvPython)) {
    console.error('❌ Entorno virtual no encontrado. Ejecuta: npm run setup');
    process.exit(1);
  }
  const proc = spawn(
    venvPython,
    ['-m', 'uvicorn', 'src.api.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
    { cwd: ROOT_DIR, stdio: 'inherit' }
  );
  proc.on('exit', (code) => process.exit(code || 0));
}

function cmdFrontend() {
  const proc = spawn(getNpmCmd(), ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: IS_WIN,
  });
  proc.on('exit', (code) => process.exit(code || 0));
}

function cmdTest() {
  const venvPython = getVenvPython();
  if (!fs.existsSync(venvPython)) {
    console.error('❌ Entorno virtual no encontrado. Ejecuta: npm run setup');
    process.exit(1);
  }
  const proc = spawn(venvPython, ['-m', 'pytest'], { cwd: ROOT_DIR, stdio: 'inherit' });
  proc.on('exit', (code) => process.exit(code || 0));
}

function main() {
  const arg = (process.argv[2] || '').toLowerCase();

  switch (arg) {
    case 'setup':
    case 'install':
      cmdSetup();
      break;
    case 'dev':
    case 'start':
      cmdDev();
      break;
    case 'backend':
      cmdBackend();
      break;
    case 'frontend':
      cmdFrontend();
      break;
    case 'test':
      cmdTest();
      break;
    default:
      console.log('Uso: npm run <comando>');
      console.log('\nComandos disponibles:');
      console.log('  npm run setup    - Instala todas las dependencias (Python + Node.js)');
      console.log('  npm run dev      - Inicia ambos servidores en paralelo (Backend + Frontend)');
      console.log('  npm run backend  - Inicia solo el Backend FastAPI');
      console.log('  npm run frontend - Inicia solo el Frontend Next.js');
      console.log('  npm run test     - Ejecuta las pruebas unitarias con pytest');
      process.exit(0);
  }
}

main();
