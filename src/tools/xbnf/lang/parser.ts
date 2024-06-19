import { LALRParser } from '$core/parser';

import { grammar } from './grammar';
import { patterns } from './patterns';

export const xbnfParser = new LALRParser(grammar, patterns);
