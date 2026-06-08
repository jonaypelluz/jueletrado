import LogConfig from '@config/LogConfig';
import { LogLevels } from '@models/interfaces';

const NO_OP = (message?: any, ...optionalParams: any[]): void => {}; // eslint-disable-line

const config: LogLevels = LogConfig();

const COLOR_CYAN = 36;
const COLOR_BLUE = 34;
const COLOR_DEBUG = 30;
const BG_COLOR_DEBUG = 43;

class ConsoleLogger {
    error: (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line
    warn: (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line
    log: (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line
    info: (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line
    debug: (message?: any, ...optionalParams: any[]) => void; // eslint-disable-line

    constructor(options: { level?: 'error' | 'warn' | 'test' | 'info' } = {}) {
        const { level } = options;

        const bindConsoleWithColor = (
            consoleMethod: (...args: any[]) => void, // eslint-disable-line
            fontColor: number,
            backgroundColor?: number,
        ) => {
            let colorCode = `\x1b[${fontColor}m`;
            if (backgroundColor) {
                colorCode = `\x1b[${fontColor};${backgroundColor}m`;
            }
            return consoleMethod.bind(console, `${colorCode}%s\x1b[0m`);
        };

        this.error = console.error.bind(console);
        this.warn = console.warn.bind(console);
        this.info = bindConsoleWithColor(console.log, COLOR_CYAN);
        this.log = bindConsoleWithColor(console.log, COLOR_BLUE);
        this.debug = bindConsoleWithColor(console.log, COLOR_DEBUG, BG_COLOR_DEBUG);

        if (level === 'error') {
            this.warn = NO_OP;
            this.log = NO_OP;
            this.info = NO_OP;
            this.debug = NO_OP;
            return;
        }

        if (level === 'test') {
            this.warn = NO_OP;
            this.log = NO_OP;
            this.info = NO_OP;
            return;
        }

        if (level === 'warn') {
            this.log = NO_OP;
            this.info = NO_OP;
            this.debug = NO_OP;
            return;
        }
    }
}

const Logger = new ConsoleLogger({ level: config.LOG_LEVEL });

export default Logger;
