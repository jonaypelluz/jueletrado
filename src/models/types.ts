export type ChangeRule = { [key: string]: string };

export type LevelConfig = {
    level: string;
    totalChunks: number;
    chunkSize: number;
    minimumPopulatedCount: number;
};

export type CardInfo = {
    id: string;
    link: string;
    imgSrc: string;
    title: string;
    subtitle: string;
    description: string;
};

export type DefinitionWords = { [key: string]: Definition[] };

export type Definition = {
    definition: string;
    number: number;
    type: string;
    typeExtra?: string;
    definitionExtra?: string;
};

export type QuizDefinition = {
    isCorrect: boolean;
    definition: string;
    word: string;
};

export type WordItem = {
    word: string;
    correct: string;
    correctWord: string;
};
