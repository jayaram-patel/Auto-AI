// global-logger.ts
import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
  static log(level: LogLevel, ...args: any[]) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = (() => {
      switch (level) {
        case 'info': return chalk.blue('[INFO]');
        case 'warn': return chalk.yellow('[WARN]');
        case 'error': return chalk.red('[ERROR]');
        case 'debug': return chalk.magenta('[DEBUG]');
      }
    })();

    const logFn = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    }[level];

    logFn(`${prefix} ${timestamp} -`, ...args);
  }

  static info(...args: any[]) {
    this.log('info', ...args);
  }

  static warn(...args: any[]) {
    this.log('warn', ...args);
  }

  static error(...args: any[]) {
    this.log('error', ...args);
  }

  static debug(...args: any[]) {
    this.log('debug', ...args);
  }
}
