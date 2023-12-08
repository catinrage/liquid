# Liquid Language Interpreter

This project is a TypeScript-based interpreter for a custom language named "Liquid". The project is organized into several modules, each with a specific role in the interpretation process.

## Project Structure

The project is divided into several directories:

- `src/`: Contains the source code of the interpreter.
  - `common/`: Contains helper functions and type definitions.
  - `core/`: Contains the core components of the interpreter, including the lexer, parser, and runtime.
  - `lang/`: Contains language-specific definitions, such as grammar and patterns.
- `tests/`: Contains test files for the lexer.

## Core Components

- Lexer (`src/core/lexer.ts`): Transforms a source code string into a sequence of tokens.
- Parser (`src/core/parser.ts`): Transforms a sequence of tokens into an Abstract Syntax Tree (AST).
- Runtime (`src/core/runtime.ts`): Executes the AST and produces a result.

## Usage

To run the interpreter, use the `dev` script defined in the `package.json` file:

```sh
npm run dev
```

This will execute the src/index.ts file, which serves as the entry point of the interpreter.

## Testing

Tests are located in the tests/ directory. Currently, there are tests for the lexer. run test using :

```sh
npm run test
```

## Linting and Formatting

The project uses ESLint for linting and Prettier for code formatting. You can run the linter and formatter using the following commands:

```sh
npm run lint
npm run format
```
