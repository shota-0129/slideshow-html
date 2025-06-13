///////////////////////
// 1. 型を先に宣言
///////////////////////
export interface Logger {
  log:   (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn:  (...args: unknown[]) => void;
  info:  (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

///////////////////////
// 2. 実装オブジェクト
///////////////////////
const loggerImpl: Logger = {
  log:   (..._args) => { void _args; },
  error: (..._args) => { void _args; },
  warn:  (..._args) => { void _args; },
  info:  (..._args) => { void _args; },
  debug: (..._args) => { void _args; },
};

///////////////////////
// 3. グローバルへ公開
///////////////////////
// 型宣言 (↓) が先にあるので any キャストは不要
globalThis.logger = loggerImpl;
export default loggerImpl;

///////////////////////
// 4. グローバル型宣言
///////////////////////
declare global {
  // eslint-disable-next-line no-var
  var logger: Logger;
}
