/**
 * Runs measure.ts without tsx/esbuild (whose native binary may not match the platform, e.g. a Linux
 * container on a macOS node_modules). Transpiles .ts on the fly with the pure-JS TypeScript compiler
 * and resolves the tsconfig path aliases (@utils/*, @config/*, ...).
 *
 *   node ops/jobs/spikes/JUE-0008/run.cjs
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const ROOT = process.cwd();
const ALIASES = {
    '@utils/': 'utils/',
    '@config/': 'config/',
    '@models/': 'models/',
    '@services/': 'services/',
    '@store/': 'store/',
    '@hooks/': 'hooks/',
};

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
    for (const [alias, dir] of Object.entries(ALIASES)) {
        if (request.startsWith(alias)) {
            request = path.join(ROOT, dir, request.slice(alias.length));
            break;
        }
    }
    return originalResolve.call(this, request, parent, ...rest);
};

require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        fileName: filename,
    });
    module._compile(outputText, filename);
};

require(path.join(__dirname, 'measure.ts'));
