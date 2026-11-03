'use client';

import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { GameConfig } from '@models/types';
import { SyllableChallenge } from '@utils/SyllableSplitter';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import Spinner from '@components/Spinner';
import '@styles/Buttons.scss';

type SyllableSplitterUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    gameLevel: string | null;
    isLevelLoading: boolean;
    showButton: boolean;
    challenges: SyllableChallenge[] | null;
    currentIndex: number;
    gameStarted: boolean;
    hasBeenPlayed: boolean;
    selectedDividers: number[];
    isChecked: boolean;
    lastCheckCorrect: boolean | null;
    correctAnswers: number;
    incorrectAnswers: [string, string][];
    isLoading: boolean;
    handleGameStartClick: () => void;
    handleGapClick: (position: number) => void;
    handleCheckClick: () => void;
    handleNextClick: () => void;
};

const UI: React.FC<SyllableSplitterUIProps> = ({
    gameConfig,
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
    isLoading,
    handleGameStartClick,
    handleGapClick,
    handleCheckClick,
    handleNextClick,
}) => {
    const intl = useIntl();
    const challenge = challenges?.[currentIndex] ?? null;
    const total = challenges?.length ?? 0;

    /** Check result for a gap: shown as a colour and appended to its label for screen readers. */
    const gapState = (position: number, dividers: number[]): 'correct' | 'incorrect' | 'missed' | null => {
        if (!isChecked) return null;
        const isDivider = dividers.includes(position);
        if (selectedDividers.includes(position)) return isDivider ? 'correct' : 'incorrect';
        return isDivider ? 'missed' : null;
    };

    const gapStateMessageId = {
        correct: 'gameSyllableGapCorrect',
        incorrect: 'gameSyllableGapIncorrect',
        missed: 'gameSyllableGapMissed',
    };

    const gapClassName = (position: number, dividers: number[]): string => {
        let className = 'syllable-splitter-gap';
        if (selectedDividers.includes(position)) className += ' selected';
        const state = gapState(position, dividers);
        if (state) className += ` ${state}`;
        return className;
    };

    const gapLabel = (position: number, dividers: number[], before: string, after: string): string => {
        const label = intl.formatMessage({ id: 'gameSyllableGap' }, { before, after });
        const state = gapState(position, dividers);
        return state ? `${label}, ${intl.formatMessage({ id: gapStateMessageId[state] })}` : label;
    };

    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {!gameLevel || isLevelLoading ? (
                    <button className="btn-primary game-btn" disabled>
                        <FormattedMessage id="gameSelectLevel" />
                    </button>
                ) : isLoading ? (
                    <button className="btn-primary game-btn" disabled>
                        <FormattedMessage id="gamePlay" />
                    </button>
                ) : showButton ? (
                    <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                        <FormattedMessage id="gamePlay" />
                    </button>
                ) : (
                    <p className="game-timer">
                        <FormattedMessage
                            id="gameSyllableProgress"
                            values={{ current: currentIndex + 1, total }}
                        />
                    </p>
                )}
            </Hero>
            <div className="syllable-splitter-game">
                <div className="syllable-splitter-game-inner">
                    {!hasBeenPlayed || !gameLevel ? (
                        <>
                            {error && <p className="load-error">{error.message}</p>}
                            <GameRules {...gameConfig.gameRules} />
                        </>
                    ) : isLoading ? (
                        <Spinner label={<FormattedMessage id="gameLoading" />} />
                    ) : gameStarted && challenge ? (
                        <>
                            <div className="syllable-splitter-score">
                                <FormattedMessage id="gameSyllableHits" values={{ count: correctAnswers }} />
                            </div>
                            {/* --letters sizes the tiles so the row fits; each gap wraps with the letter after it,
                                so a row never ends with a gap. */}
                            <div
                                className="syllable-splitter-word"
                                style={{ '--letters': challenge.word.length } as React.CSSProperties}
                            >
                                {challenge.word.split('').map((char, index) => (
                                    <span className="syllable-splitter-unit" key={index}>
                                        {index > 0 && (
                                            <button
                                                className={gapClassName(index, challenge.dividers)}
                                                aria-label={gapLabel(
                                                    index,
                                                    challenge.dividers,
                                                    challenge.word[index - 1],
                                                    char,
                                                )}
                                                aria-pressed={selectedDividers.includes(index)}
                                                disabled={isChecked}
                                                onClick={() => handleGapClick(index)}
                                            />
                                        )}
                                        <span className="syllable-splitter-letter">{char}</span>
                                    </span>
                                ))}
                            </div>
                            <p className="syllable-splitter-feedback" aria-live="polite">
                                {isChecked && lastCheckCorrect !== null && (
                                    <strong className={lastCheckCorrect ? 'text-success' : 'text-danger'}>
                                        <FormattedMessage
                                            id={lastCheckCorrect ? 'gameSyllableResultCorrect' : 'gameSyllableResultIncorrect'}
                                        />
                                    </strong>
                                )}
                            </p>
                            {isChecked && (
                                <p className="syllable-splitter-correct-split">
                                    <FormattedMessage id="gameSyllableCorrectSplit" />{' '}
                                    <strong>{challenge.syllables.join('-')}</strong>
                                </p>
                            )}
                            <button
                                className="btn-default syllable-splitter-action"
                                onClick={isChecked ? handleNextClick : handleCheckClick}
                            >
                                <FormattedMessage id={isChecked ? 'gameSyllableNext' : 'gameSyllableCheck'} />
                            </button>
                        </>
                    ) : (
                        <div className="results-wrapper">
                            {error && <p className="load-error">{error.message}</p>}
                            <p className="results-verdict">
                                <FormattedMessage
                                    id="gameSyllableScore"
                                    values={{ correct: correctAnswers, total }}
                                />
                            </p>
                            {incorrectAnswers.length > 0 && (
                                <>
                                    <div>
                                        <em className="results-title">
                                            <FormattedMessage id="incorrectWords" />
                                        </em>
                                        <strong className="results-title text-danger">
                                            {incorrectAnswers.length}
                                        </strong>
                                    </div>
                                    {incorrectAnswers.map(([player, correct], index) => (
                                        <div key={index}>
                                            <span className="results-ko text-danger">{player}</span>
                                            {' → '}
                                            <strong className="results-ok text-success">{correct}</strong>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UI;
