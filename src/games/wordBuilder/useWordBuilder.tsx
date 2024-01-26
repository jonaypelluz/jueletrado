import { useEffect, useState } from 'react';
import { NonAccentedVowels } from '@config/AccentRules';
import { consonants, vowels } from '@config/translations/Letters';
import { useWordProcessor } from '@hooks/useWordProcessor';
import { getAllWords } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';

const NUMBER_OF_VOWELS = 2;
const NUMBER_OF_CONSONANTS = 4;

const useWordBuilder = () => {
    const { locale, error, setError, setLoading, isLoading, gameLevel } = useWordsContext();
    const wordProcessor = useWordProcessor(locale);

    const [letters, setLetters] = useState<string[]>([]);
    const [tempWord, setTempWord] = useState<string>('');
    const [words, setWords] = useState<string[]>([]);
    const [allWords, setAllWords] = useState<string[]>([]);
    const [foundWords, setFoundWords] = useState<string[]>([]);

    const getRandomLetters = <T,>(array: T[], numberOfElements: number): T[] => {
        const shuffledArray = [...array];

        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }

        return shuffledArray.slice(0, numberOfElements);
    };

    const calculatePossibleWords = async () => {
        let expandedLetters = letters;
        if (locale === 'es') {
            // We have to add accented vowels to the possible words in spanish or catalan
            expandedLetters = letters.flatMap((letter: string) =>
                NonAccentedVowels[letter.toLowerCase()]
                    ? [letter, NonAccentedVowels[letter.toLowerCase()]]
                    : [letter],
            );
        }
        const possibleWords = await wordProcessor.filterWordsByLetters(expandedLetters, allWords);
        setWords(possibleWords);
    };

    const handleGameStartClick = () => {
        setWords([]);
        setFoundWords([]);
        setTempWord('');
        const selectedConsonants = getRandomLetters(consonants[locale], NUMBER_OF_CONSONANTS);
        const selectedVowels = getRandomLetters(vowels, NUMBER_OF_VOWELS);
        const selectedLetters = [...selectedConsonants, ...selectedVowels];
        setLetters(selectedLetters);
    };

    const generateAccentedVariations = (word: string): string[] => {
        const variations: string[] = [word];

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (NonAccentedVowels[char]) {
                const accentedChar = NonAccentedVowels[char];
                const accentedWord = word.substring(0, i) + accentedChar + word.substring(i + 1);
                variations.push(accentedWord);
            }
        }

        return variations;
    };

    const handleCheckWordClick = () => {
        const wordVariations = generateAccentedVariations(tempWord);
        for (const variation of wordVariations) {
            if (words.includes(variation)) {
                setFoundWords((currentFoundWords: string[]) => [...currentFoundWords, variation]);
                setWords((currentWords: string[]) =>
                    currentWords.filter((word) => word !== variation),
                );
            }
        }
        setTempWord('');
    };

    const handleLetterClick = (letter: string) => {
        setTempWord((currentTempWord: string) => currentTempWord + letter);
    };

    useEffect(() => {
        if (letters.length > 0) {
            setLoading(true);
            calculatePossibleWords().then(() => setLoading(false));
        }
    }, [letters]);

    useEffect(() => {
        const fetchAllWords = async () => {
            const theWords = await getAllWords(gameLevel, locale, setError);
            if (theWords) {
                setAllWords(theWords);
            }
        };

        if (allWords.length === 0) {
            setLoading(true);
            fetchAllWords().then(() => setLoading(false));
        }
    }, []);

    return {
        error,
        isLoading,
        words,
        letters,
        tempWord,
        foundWords,
        handleGameStartClick,
        handleLetterClick,
        handleCheckWordClick,
    };
};

export default useWordBuilder;
