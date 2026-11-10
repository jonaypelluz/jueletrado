'use client';

import { useEffect, useRef, useState } from 'react';
import { CHALLENGE_COUNT, SYLLABLE_QUERY, SYLLABLE_WINDOW, isPlayable } from '@games/syllableSplitter/config';
import { dividerPositions, SyllableChallenge, syllabify } from '@utils/SyllableSplitter';
import { matchesQuery } from '@utils/WordQuery';
import Logger from '@services/Logger';
import { fetchConfig } from '@config/WordGroupConfig';
import { getSessionWords, getWordRecords } from '@services/WordsService';
import StorageService from '@store/StorageService';
import { useWordsContext } from '@store/WordsContext';

const SESSION_DRAW = 20;
// Extra draws when a session draw yields fewer than CHALLENGE_COUNT eligible words.
const MAX_DRAWS = 3;

/** Cuts the word at the given divider positions and joins the parts with `-`. */
const hyphenate = (word: string, positions: number[]): string => {
    const sorted = [...positions].sort((a, b) => a - b);
    return [0, ...sorted].map((start, k) => word.slice(start, sorted[k])).join('-');
};

const useSyllableSplitter = () => {
    const { locale, gameLevel, isLoading: isLevelLoading, error, setError } = useWordsContext();
    const [isLoadingWords, setIsLoadingWords] = useState(false);

    const [showButton, setShowButton] = useState<boolean>(false);
    const [hasBeenPlayed, setHasBeenPlayed] = useState<boolean>(false);
    const [challenges, setChallenges] = useState<SyllableChallenge[] | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [selectedDividers, setSelectedDividers] = useState<number[]>([]);
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const [lastCheckCorrect, setLastCheckCorrect] = useState<boolean | null>(null);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState<[string, string][]>([]);

    // Refs let handle*Click read current state without stale closures (e.g. a double tap in one render)
    const gameStartedRef = useRef(gameStarted);
    const checkedRef = useRef(false);
    const selectedRef = useRef<number[]>([]);
    useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);

    useEffect(() => {
        if (gameLevel && !isLevelLoading) setShowButton(true);
    }, [gameLevel, isLevelLoading]);

    const resetCheck = () => {
        checkedRef.current = false;
        selectedRef.current = [];
        setSelectedDividers([]);
        setIsChecked(false);
        setLastCheckCorrect(null);
    };

    const handleGapClick = (position: number) => {
        if (!gameStartedRef.current || checkedRef.current) return;

        const challenge = challenges?.[currentIndex];
        if (!challenge || position < 1 || position >= challenge.word.length) return;

        const prev = selectedRef.current;
        selectedRef.current = prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position];
        setSelectedDividers(selectedRef.current);
    };

    const handleCheckClick = () => {
        if (!gameStartedRef.current || checkedRef.current) return;

        const challenge = challenges?.[currentIndex];
        if (!challenge) return;

        const selected = selectedRef.current;
        const isCorrect =
            selected.length === challenge.dividers.length &&
            challenge.dividers.every((position) => selected.includes(position));

        if (isCorrect) {
            setCorrectAnswers((prev) => prev + 1);
        } else {
            setIncorrectAnswers((prev) => [
                ...prev,
                [hyphenate(challenge.word, selected), challenge.syllables.join('-')],
            ]);
        }

        checkedRef.current = true;
        setIsChecked(true);
        setLastCheckCorrect(isCorrect);
    };

    const handleNextClick = () => {
        if (!gameStartedRef.current || !checkedRef.current || !challenges) return;

        resetCheck();
        if (currentIndex + 1 >= challenges.length) {
            setGameStarted(false);
            setShowButton(true);
        } else {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleGameStartClick = async () => {
        setHasBeenPlayed(true);
        setShowButton(false);
        setIsLoadingWords(true);

        const level = gameLevel ?? 'beginner';

        // Draw again (bounded) until CHALLENGE_COUNT eligible words are found; an empty draw means the
        // pool is exhausted, so the session goes ahead with fewer words.
        // No level: report it as the word service does for an invalid level and draw nothing.
        if (!gameLevel) setError(new Error('Invalid level specified'));
        const eligibleWords: string[] = [];
        for (let draw = 0; gameLevel && draw < MAX_DRAWS && eligibleWords.length < CHALLENGE_COUNT; draw++) {
            // The queue holds the level window; the draw re-applies the full query plus isPlayable.
            const sessionWords = await getSessionWords(
                StorageService.WORDS_SYLLABLE,
                SESSION_DRAW,
                { locale, level: gameLevel, count: fetchConfig(StorageService.WORDS_SYLLABLE).count, ...SYLLABLE_WINDOW[level] },
                setError,
            );
            if (sessionWords.length === 0) break;

            (await getWordRecords(sessionWords, locale))
                .filter((record) => matchesQuery(record, SYLLABLE_QUERY[level]) && isPlayable(record.word) && !eligibleWords.includes(record.word))
                .forEach((record) => eligibleWords.push(record.word));
        }

        const builtChallenges = eligibleWords
            .slice(0, CHALLENGE_COUNT)
            .map((word) => ({ word, syllables: syllabify(word), dividers: dividerPositions(word) }));

        if (builtChallenges.length > 0) {
            setChallenges(builtChallenges);
            setCurrentIndex(0);
            setCorrectAnswers(0);
            setIncorrectAnswers([]);
            resetCheck();
            setGameStarted(true);
        } else {
            // No eligible words — fall back to the rules screen and the play button
            // instead of showing the (empty) results screen.
            Logger.error('No eligible challenges found for syllable splitter');
            setHasBeenPlayed(false);
            setShowButton(true);
        }

        setIsLoadingWords(false);
    };

    return {
        error,
        gameLevel,
        isLevelLoading,
        showButton,
        challenges,
        currentIndex,
        gameStarted,
        hasBeenPlayed,
        selectedDividers,
        isChecked,
        lastCheckCorrect,
        correctAnswers,
        incorrectAnswers,
        isLoading: isLoadingWords,
        handleGameStartClick,
        handleGapClick,
        handleCheckClick,
        handleNextClick,
    };
};

export default useSyllableSplitter;
