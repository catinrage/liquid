import patterns from './lang/patterns';
import Lexer from './core/lexer';
import Parser from './core/parser';

const source = await Bun.file('./sandbox/main.li').text();

const x = new Lexer(source, patterns);

console.log(x.tokens, {
  depth: null,
});

// const p = new Parser(x.tokens, patterns);
// p.parse();
