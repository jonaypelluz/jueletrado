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
    type_extra?: string;
    definitionExtra?: string;
};

export type WordEntry = {
    level?: string;
    definitions: Definition[];
};

export type DefinitionWords = { [key: string]: Definition[] };

export type Position = {
    row: number;
    col: number;
};

export type SelectedWord = {
    [key: string]: {
        definition: Definition[];
        displayDefinition: string;
        position: Position;
        direction: string;
        color: string;
    };
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

export type FallingWordItem = {
    key: number;
    word: RainWordItem;
    leftPercentage: number;
    duration: number;
    widthPx: number;
};

export type Level = 'beginner' | 'intermediate' | 'advanced';

/** Boolean word features stored as 0|1. This order is the bit order of the chunk `flags` mask. */
export type WordFlagName =
    | 'hasAccent'
    | 'hasEnye'
    | 'hasDieresis'
    | 'hasTl'
    | 'hasDiphthong'
    | 'hasHiatus'
    | 'isPlural'
    | 'isVerbForm';

export type WordRecord = {
    word: string;
    locale: string;
    level: Level;
    levels: Level[];
    freqRank: number | null;
    length: number;
    syllables: number | null;
    stressedSyllable: number | null;
    firstLetter: string;
    lastLetter: string;
    letters: string;
    pos: string | null;
    senseCount: number;
    source: 'rae' | null;
} & Record<WordFlagName, 0 | 1>;

export type WordFilter = {
    level?: string;
    minLen?: number;
    maxLen?: number;
    exclude?: Partial<Record<WordFlagName, true>>;
    minSyllables?: number;
};

export type WordQuery = WordFilter & { locale: string; count: number };

export type WordRow = (string | number | null)[];

export type WordChunk = {
    version: 2;
    locale: string;
    level: string;
    fields: string[];
    rows: WordRow[];
};
