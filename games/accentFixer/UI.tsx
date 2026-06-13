'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import { AccentChallenge } from '@utils/AccentGameProcessor';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type PendingResult = { clickedIndex: number; correctIndex: number };

type AccentFixerUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    countdown: number;
    gameLevel: string | null;
    showButton: boolean;
    challenges: AccentChallenge[] | null;
    currentIndex: number;
    gameStarted: boolean;
    hasBeenPlayed: boolean;
    correctAnswers: number;
    incorrectAnswers: [string, string][];
    pendingResult: PendingResult | null;
    isLoading: boolean;
    handleGameStartClick: () => void;
    handleVowelClick: (index: number) => void;
    handleNoAccentClick: () => void;
};

const UI: React.FC<AccentFixerUIProps> = ({
    gameConfig,
    error,
    countdown,
    gameLevel,
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
    handleVowelClick,
    handleNoAccentClick,
}) => {
    const challenge = challenges?.[currentIndex] ?? null;

    const noAccentClassName = (() => {
        if (pendingResult === null) return 'btn-default accent-fixer-no-accent';
        if (pendingResult.correctIndex === -1) return 'btn-default accent-fixer-no-accent correct';
        if (pendingResult.clickedIndex === -2) return 'btn-default accent-fixer-no-accent incorrect';
        return 'btn-default accent-fixer-no-accent';
    })();

    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {!gameLevel ? (
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
            <div className="accent-fixer-game">
                <div className="accent-fixer-game-inner">
                    {!hasBeenPlayed || !gameLevel ? (
                        <GameRules {...gameConfig.gameRules} />
                    ) : gameStarted && challenge ? (
                        <>
                            <div className="accent-fixer-score">{correctAnswers}</div>
                            <div className="accent-fixer-word">
                                {challenge.displayed.split('').map((char, index) => {
                                    const isVowel = challenge.vowelIndices.includes(index);
                                    let className = 'accent-fixer-letter';
                                    if (isVowel) className += ' vowel';
                                    if (pendingResult !== null) {
                                        if (index === pendingResult.correctIndex) className += ' correct';
                                        else if (index === pendingResult.clickedIndex) className += ' incorrect';
                                    }
                                    return (
                                        <button
                                            key={index}
                                            className={className}
                                            disabled={!isVowel || pendingResult !== null}
                                            onClick={() => handleVowelClick(index)}
                                        >
                                            {char}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                className={noAccentClassName}
                                disabled={pendingResult !== null}
                                onClick={handleNoAccentClick}
                            >
                                <FormattedMessage id="gameAccentNoAccent" />
                            </button>
                        </>
                    ) : (
                        <div className="results-wrapper">
                            {error && <p className="load-error">{error.message}</p>}
                            <div>
                                <em className="results-title">
                                    <FormattedMessage id="incorrectWords" />
                                </em>
                                <strong className="results-title text-danger">
                                    {incorrectAnswers.length}
                                </strong>
                            </div>
                            {incorrectAnswers.map(([displayed, original], index) => (
                                <div key={index}>
                                    <span className="results-ko text-danger">{displayed}</span>
                                    {' → '}
                                    <strong className="results-ok text-success">{original}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UI;
