export class LiquidErrorInstance extends Error {
  constructor(stage: 'Lexer' | 'Parser', message: string, location?: number) {
    super(`[${stage} Error] : ${message} ${location ? `at : ${location}` : ''}`);
  }
}

export class LiquidLexerError extends LiquidErrorInstance {
  constructor(message: string, location: number) {
    super('Lexer', message, location);
  }
}

export class LiquidParserError extends LiquidErrorInstance {
  constructor(message: string, location?: number) {
    super('Parser', message, location);
  }
}
