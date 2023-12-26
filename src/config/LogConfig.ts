import { LogLevels } from '@models/interfaces';

const LogConfig = (): LogLevels => {
    switch (process.env.REACT_APP_APP_ENV) {
        case 'production':
            return {
                LOG_LEVEL: 'error',
            };
        case 'development':
            return {
                LOG_LEVEL: 'info',
            };
        case 'staging':
            return {
                LOG_LEVEL: 'warn',
            };
        case 'test':
            return {
                LOG_LEVEL: 'test',
            };
        default:
            return {
                LOG_LEVEL: 'error',
            };
    }
};

export default LogConfig;
