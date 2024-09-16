import { BaseInfo, GameRules, LocaleType, Translation } from '@models/types';

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

export interface ICell {
    char: string;
    color: string;
    filled: boolean;
    isCorrect: boolean;
}

export interface GamePreConfig
    extends Omit<BaseInfo, 'title' | 'link' | 'description' | 'subtitle'> {
    title: LocaleType;
    description: LocaleType;
    subtitle: LocaleType;
    gameRules: { [key: string]: GameRules };
}
