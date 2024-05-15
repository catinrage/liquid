import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';

import parser from './frontend/parser';
import { RizRuntime } from './backend/runtime';
import type { Riz } from './artifacts';

// watch file using chokidar
const watcher = chokidar.watch(path.join(__dirname, './samples/main.riz'), {
  persistent: true,
});

watcher.on('change', () => {
  // clear console
  process.stdout.write('\x1Bc');

  const source = fs.readFileSync(path.join(__dirname, './samples/main.riz'), 'utf-8');

  const result = parser.parse(source);

  if (result.accepted) {
    console.log(chalk.greenBright.bold('✔ Accepted : '));

    // console.dir(result.output, { depth: null });

    const runtime = new RizRuntime(result.output as Riz.Program);
    console.time('Execution Time');
    runtime.run();
    console.timeEnd('Execution Time');
  } else {
    console.log(chalk.redBright.bold('☓ Rejected : '));
    console.error(result.error);
  }
});

watcher.emit('change');
