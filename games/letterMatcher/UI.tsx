'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import { LetterChallenge } from '@utils/LetterMatchProcessor';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import Spinner from '@components/Spinner';
import '@styles/Buttons.scss';

type PendingResult = { clickedOption: string; correct: boolean };

type LetterMatcherUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    countdown: number;
    gameLevel: string | null;
    isLevelLoading: boolean;
    showButton: boolean;
    challenges: LetterChallenge[] | null;
    currentIndex: number;
    gameStarted: boolean;
    hasBeenPlayed: boolean;
    correctAnswers: number;
    incorrectAnswers: [string, string][];
    pendingResult: PendingResult | null;
    isLoading: boolean;
    handleGameStartClick: () => void;
    handleOptionClick: (option: string) => void;
};

const optionLabel = (option: string): React.ReactNode =>
    option === '' ? <FormattedMessage id="gameLetterNothing" /> : option;

const UI: React.FC<LetterMatcherUIProps> = ({
    gameConfig,
    error,
    countdown,
    gameLevel,
    isLevelLoading,
    showButton,
    challenges,
    currentIndex,
    gameStarted,
    hasBeenPlayed,
    correctAnswers,
    incorrectAnswers,
    pendingResult,
    isLoading,
    handleGameStartClick,
    handleOptionClick,
}) => {
    const challenge = challenges?.[currentIndex] ?? null;

    const gapClassName = (() => {
        let className = 'letter-matcher-gap';
        if (pendingResult !== null) className += pendingResult.correct ? ' correct' : ' incorrect';
        return className;
    })();

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
                        {countdown} <FormattedMessage id="gameSeconds" />
                    </p>
                )}
            </Hero>
            <div className="letter-matcher-game">
                <div className="letter-matcher-game-inner">
                    {!hasBeenPlayed || !gameLevel ? (
                        <GameRules {...gameConfig.gameRules} />
                    ) : isLoading ? (
                        <Spinner label={<FormattedMessage id="gameLoading" />} />
                    ) : gameStarted && challenge ? (
                        <div className="letter-matcher-play">
                            <div className="letter-matcher-score">{correctAnswers}</div>
                            <p className="letter-matcher-word">
                                <span>{challenge.prefix}</span>
                                <span className={gapClassName}>
                                    {pendingResult === null
                                        ? '＿'
                                        : pendingResult.clickedOption}
                                </span>
                                <span>{challenge.suffix}</span>
                            </p>
                            <div className="letter-matcher-options">
                                {challenge.options.map((option, index) => {
                                    let className = 'btn-default letter-matcher-option';
                                    if (pendingResult !== null) {
                                        if (option === challenge.gapAnswer) className += ' correct';
                                        else if (option === pendingResult.clickedOption) className += ' incorrect';
                                    }
                                    return (
                                        <button
                                            key={index}
                                            className={className}
                                            disabled={pendingResult !== null}
                                            onClick={() => handleOptionClick(option)}
                                        >
                                            {optionLabel(option)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="results-wrapper">
                            {error && <p className="load-error">{error.message}</p>}
                            {incorrectAnswers.length === 0 ? (
                                <p className="results-verdict results-verdict--perfect">
                                    <FormattedMessage id="gameAccentResultPerfect" />
                                </p>
                            ) : incorrectAnswers.length < 5 ? (
                                <p className="results-verdict results-verdict--few">
                                    <FormattedMessage
                                        id="gameAccentResultFew"
                                        values={{ count: incorrectAnswers.length }}
                                    />
                                </p>
                            ) : (
                                <p className="results-verdict results-verdict--many">
                                    <FormattedMessage id="gameAccentResultMany" />
                                </p>
                            )}
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
                                    {incorrectAnswers.map(([chosen, correctWord], index) => (
                                        <div key={index}>
                                            <span className="results-ko text-danger">{chosen}</span>
                                            {' → '}
                                            <strong className="results-ok text-success">{correctWord}</strong>
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
