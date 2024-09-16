export type BaseInfo = {
    id: string;
    link: string;
    imgSrc: string;
    title: string;
    subtitle: string;
    description: string;
};

export type CardInfo = BaseInfo;

export type GameConfig = BaseInfo & {
    gameRules: GameRules;
};

export type ChangeRule = { [key: string]: string };

export type CurrentRoutes = {
    [key: string]: string;
};

export type Definition = {
    definition: string;
    number: number;
    type: string;
    typeExtra?: string;
    definitionExtra?: string;
};

export type DefinitionWords = { [key: string]: Definition[] };

export type Position = {
    row: number;
    col: number;
};

export type SelectedWord = {
    [key: string]: {
        definition: Definition[];
        position: Position;
        direction: string;
        color: string;
    }
};

export type GameRules = {
    additionalRules: string[];
    howToPlay: string[];
    gameGoal: string;
    tips: string[];
};

export type LevelConfig = {
    level: string;
    totalChunks: { [key: string]: number };
    minimumPopulatedCount: { [key: string]: number };
};

export type LocaleType = {
    en: string;
    es: string;
};

export type LoadingMessagesType = {
    [key: string]: string[];
};

export type LocaleConfig = {
    lang: string;
    name: string;
};

export type Translation = {
    [key: string]: string;
};

export type QuizDefinition = {
    isCorrect: boolean;
    definition: string;
    word: string;
};

export type RainWordItem = {
    word: string;
    correct: string;
    correctWord: string;
};
