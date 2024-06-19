import fs from 'fs';
import path from 'path';

import { parser } from './parser';
import { PerformanceTimer } from '$common/helpers';

// read all files in the samples directory
const samples = fs.readdirSync(path.join(__dirname, 'samples'));

for (const sample of samples) {
  PerformanceTimer.timer('Parsing ' + sample).start();
  console.log('Parsing', sample);
  const content = fs.readFileSync(path.join(__dirname, 'samples', sample), 'utf8');
  const result = parser.parse(content);
  // console.log(parser._lexer.tokenize(content));

  console.dir(result, {
    depth: 0,
  });
  console.log();
  console.log('============================================');
  console.log();
  PerformanceTimer.timer('Parsing ' + sample)
    .pause()
    .print();
}
