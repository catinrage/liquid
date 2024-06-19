import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

import { parser } from './lang/parser';
import { LiquidParserError } from '$core/error';

// read all files in the samples directory
const samples = fs.readdirSync(path.join(__dirname, 'samples'));

chokidar.watch(path.join(__dirname, 'samples/trafficLight.ent')).on('all', (event, file) => {
  // process.stdout.write('\x1Bc');

  const content = fs.readFileSync(path.join(__dirname, 'samples', 'trafficLight.ent'), 'utf8');
  try {
    const result = parser.parse(content);
    console.dir(result, {
      depth: null,
    });
    console.log();
  } catch (error) {
    if (error instanceof LiquidParserError) {
      console.log(error.message);
    }
  }
  // console.log('hi');
});
