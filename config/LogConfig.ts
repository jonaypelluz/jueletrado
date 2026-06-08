import { LogLevels } from '@models/interfaces';

const LogConfig = (): LogLevels => {
    // In Next.js, only NEXT_PUBLIC_* vars are exposed to the browser bundle.
    // NODE_ENV is also available (next sets it to 'development' / 'production').
    const env = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV;
    switch (env) {
        case 'production':
            return { LOG_LEVEL: 'error' };
        case 'development':
            return { LOG_LEVEL: 'info' };
        case 'staging':
            return { LOG_LEVEL: 'warn' };
        case 'test':
            return { LOG_LEVEL: 'test' };
        default:
            return { LOG_LEVEL: 'error' };
    }
};

export default LogConfig;
