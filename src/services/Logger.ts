import appConfig from 'src/config/AppConfig';
import { LogLevels } from 'src/models/interfaces';

const NO_OP = (message?: any, ...optionalParams: any[]): void => {}; // eslint-disable-line

const config: LogLevels = appConfig();

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

    constructor(options: { level?: 'error' | 'warn' | 'info' | 'log' | 'debug' } = {}) {
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

        if (level === 'error') {
            this.warn = NO_OP;
            this.log = NO_OP;
            this.info = NO_OP;
            this.debug = NO_OP;
            return;
        }

        this.warn = console.warn.bind(console);

        if (level === 'warn') {
            this.log = NO_OP;
            this.info = NO_OP;
            this.debug = NO_OP;
            return;
        }

        this.info = bindConsoleWithColor(console.log, COLOR_CYAN);
        this.log = bindConsoleWithColor(console.log, COLOR_BLUE);
        this.debug = bindConsoleWithColor(console.log, COLOR_DEBUG, BG_COLOR_DEBUG);
    }
}

const Logger = new ConsoleLogger({ level: config.LOG_LEVEL ?? 'error' });

export default Logger;
