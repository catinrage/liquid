import { LALRParser } from '$core/parser';

import { grammar } from './grammar';

export const parser = new LALRParser(grammar);
