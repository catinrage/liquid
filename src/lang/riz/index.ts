import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

import parser from './frontend/parser';
import { RizRuntime } from './backend/runtime';
import type { Riz } from './artifacts';

const args = process.argv.slice(2);
const sourcePath = args[0];

if (!sourcePath) {
  console.error(chalk.redBright.bold('☓ No source file provided.'));
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, 'utf-8');

const result = parser.parse(source);

if (result.accepted) {
  // console.log(chalk.greenBright.bold('✔ Accepted : '));
  const runtime = new RizRuntime(result.output as Riz.Program);
  runtime.run();
} else {
  console.log(chalk.redBright.bold('☓ Rejected : '));
  console.error(result.error);
}
