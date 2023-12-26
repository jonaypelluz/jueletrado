export type ChangeRule = { [key: string]: [string, string] };

export type LevelConfig = {
    level: string;
    totalChunks: number;
    chunkSize: number;
    minimumPopulatedCount: number;
};

export type Game = {
    id: string;
    link: string;
    imgSrc: string;
    title: string;
    subtitle: string;
    description: string;
};

export type WordItem = {
    word: string;
    correct: string;
    correctWord: string;
};
