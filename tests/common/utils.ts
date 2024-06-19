import fs from 'fs';
import path from 'path';

/**
 * Read a sample file from the samples directory.
 */
export function read(source: string) {
  return fs.readFileSync(path.join(__dirname, source), 'utf-8');
}
