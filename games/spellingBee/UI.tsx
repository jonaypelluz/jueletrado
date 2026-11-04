'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import { SpellingClue, SpellingHint } from '@utils/SpellingComparer';
import { SpellingFeedback } from '@games/spellingBee/useSpellingBee';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type SpellingBeeUIProps = {
    gameConfig: GameConfig;
    locale: string;
    gameLevel: string | null;
    isGameStarted: boolean;
    isLoadingLetter: boolean;
    loadError: boolean;
    isFinished: boolean;
    rounds: SpellingClue[];
    currentRound: number;
    totalRounds: number;
    failedAttempts: number;
    maxAttempts: number;
    accentRetryUsed: boolean;
    hint: SpellingHint | null;
    guess: string;
    feedback: SpellingFeedback | null;
    isRoundOver: boolean;
    score: number;
    maxScore: number;
    handleGuessChange: (value: string) => void;
    handleGameStartClick: () => Promise<void>;
    handleSubmit: (event?: React.FormEvent) => void;
    handleNextClick: () => void;
    handlePlayAgainClick: () => Promise<void>;
};

const FEEDBACK_MESSAGE_IDS: Record<SpellingFeedback['kind'], string> = {
    correct: 'gameSpellingBeeCorrect',
    'accent-miss': 'gameSpellingBeeAccentMiss',
    wrong: 'gameSpellingBeeWrong',
    revealed: 'gameSpellingBeeReveal',
};

const UI: React.FC<SpellingBeeUIProps> = ({
    gameConfig,
    locale,
    gameLevel,
    isGameStarted,
    isLoadingLetter,
    loadError,
    isFinished,
    rounds,
    currentRound,
    totalRounds,
    failedAttempts,
    maxAttempts,
    hint,
    guess,
    feedback,
    isRoundOver,
    score,
    maxScore,
    handleGuessChange,
    handleGameStartClick,
    handleSubmit,
    handleNextClick,
    handlePlayAgainClick,
}) => {
    const round = rounds[currentRound];

    const boxContent = (char: string, index: number, length: number): string => {
        if (isRoundOver) return char;
        if (index === 0) return hint?.firstLetter ?? '';
        if (index === length - 1) return hint?.lastLetter ?? '';
        return '';
    };

    const renderRound = (clue: SpellingClue) => {
        const chars = Array.from(clue.word.normalize('NFC'));
        return (
            <div className="spelling-bee-round">
                <h2>
                    <FormattedMessage
                        id="gameSpellingBeeRound"
                        values={{ current: currentRound + 1, total: totalRounds }}
                    />
                </h2>
                <p className="spelling-bee-definition">{clue.definition}</p>
                <p className="spelling-bee-type">
                    <FormattedMessage id="gameSpellingBeeType" values={{ type: clue.type }} />
                </p>
                {hint && (
                    <p className="spelling-bee-length">
                        <FormattedMessage id="gameSpellingBeeLength" values={{ count: hint.length }} />
                    </p>
                )}
                <div className="spelling-bee-boxes">
                    {chars.map((char, index) => (
                        <span className="spelling-bee-box" key={index}>
                            {boxContent(char, index, chars.length)}
                        </span>
                    ))}
                </div>
                {!isRoundOver && (
                    <p className="spelling-bee-attempt">
                        <FormattedMessage
                            id="gameSpellingBeeAttempt"
                            values={{ current: failedAttempts + 1, total: maxAttempts }}
                        />
                    </p>
                )}
                <form className="spelling-bee-form" onSubmit={handleSubmit}>
                    <label htmlFor="spelling-bee-guess">
                        <FormattedMessage id="gameSpellingBeeInputLabel" />
                    </label>
                    <input
                        id="spelling-bee-guess"
                        type="text"
                        value={guess}
                        onChange={(event) => handleGuessChange(event.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        lang={locale}
                    />
                    <button type="submit" className="btn-primary" disabled={!guess.trim() || isRoundOver}>
                        <FormattedMessage id="gameCheckWord" />
                    </button>
                </form>
                {feedback && (
                    <p className={`spelling-bee-feedback spelling-bee-feedback--${feedback.kind}`}>
                        <FormattedMessage
                            id={FEEDBACK_MESSAGE_IDS[feedback.kind]}
                            values={{
                                points: feedback.kind === 'correct' ? feedback.points : undefined,
                                word: feedback.kind === 'revealed' ? feedback.word : undefined,
                            }}
                        />
                    </p>
                )}
                {isRoundOver && (
                    <button className="btn-primary next-btn" onClick={handleNextClick}>
                        <FormattedMessage id="gameQuizWordNextWord" />
                    </button>
                )}
            </div>
        );
    };

    const renderGame = () => {
        if (isLoadingLetter) {
            return (
                <p className="spelling-bee-loading">
                    <FormattedMessage id="gameLoading" />
                </p>
            );
        }
        if (loadError) {
            return (
                <div className="spelling-bee-error">
                    <p className="load-error">
                        <FormattedMessage id="gameLoadError" />
                    </p>
                    <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                        <FormattedMessage id="gameSpellingBeeRetry" />
                    </button>
                </div>
            );
        }
        if (isFinished) {
            return (
                <div className="spelling-bee-summary">
                    <h2>
                        <FormattedMessage id="gameSpellingBeeFinalScore" values={{ score, total: maxScore }} />
                    </h2>
                    <button className="btn-primary game-btn" onClick={handlePlayAgainClick}>
                        <FormattedMessage id="gameSpellingBeePlayAgain" />
                    </button>
                </div>
            );
        }
        return round ? renderRound(round) : null;
    };

    return (
        <>
            <Hero image={gameConfig.imgSrc} title={gameConfig.title} subtitle={gameConfig.description}>
                {!isGameStarted && (
                    !gameLevel ? (
                        <button className="btn-primary game-btn" disabled>
                            <FormattedMessage id="gameSelectLevel" />
                        </button>
                    ) : (
                        <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                            <FormattedMessage id="gamePlay" />
                        </button>
                    )
                )}
            </Hero>
            <div className="spelling-bee-wrapper">
                <div className="spelling-bee-inner">
                    {isGameStarted ? renderGame() : <GameRules {...gameConfig.gameRules} />}
                </div>
            </div>
        </>
    );
};

export default UI;
