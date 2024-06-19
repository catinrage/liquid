import type { Token } from '$core/lexer';
import type { TokenLocation } from '$core/lexer/lexer';

export class LiquidErrorInstance extends Error {
  constructor(public stage: 'Syntax' | 'Parser', message: string, public location?: TokenLocation) {
    super(`${message} ${location ? `at : ${location.line}:${location.character}` : ''}`);
  }
}

export class LiquidSyntaxError extends LiquidErrorInstance {
  constructor(message: string, location: TokenLocation, public suggestions?: string[]) {
    super('Syntax', message, location);
  }
}

export class LiquidParserError extends LiquidErrorInstance {
  constructor(message: string, public token?: Token) {
    super('Parser', message);
  }
}
