/**
 * Audits (and with --fix, cleans) the word lists and definitions. See wordAudit.ts.
 *
 * Usage:
 *   yarn words:audit [--locale es|en] [--fix] [--report <path>] [--root <dir>]
 *
 * Exit: 0 clean / fixed, 1 check found FIX/DELETE, 2 bad args or a missing data file.
 */

import { runCli } from './wordAudit';

runCli(process.argv.slice(2), process.cwd()).then((code) => process.exit(code));
