import { BaseInfo, GameRules, Translation } from '@models/types';

export interface LogLevels {
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'test';
}

export interface Translations {
    [key: string]: Translation;
}

export interface ContentItemPreConfig extends Omit<BaseInfo, 'link'> {}

export interface ContentPreConfig {
    [key: string]: ContentItemPreConfig[];
}

export interface GamePreConfig
    extends Omit<BaseInfo, 'title' | 'link' | 'description' | 'subtitle'> {
    title: { en: string; es: string };
    description: { en: string; es: string };
    subtitle: { en: string; es: string };
    gameRules: { [key: string]: GameRules };
}
