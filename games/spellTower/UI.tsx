'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type PendingResult = { clickedIndex: number; correctIndex: number };

type SpellTowerUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    countdown: number;
    gameLevel: string | null;
    showButton: boolean;
    gameStarted: boolean;
    hasBeenPlayed: boolean;
    correctAnswers: number;
    incorrectAnswers: [string, string][];
    currentWordIndex: number;
    randomizedVariations: string[];
    pendingResult: PendingResult | null;
    isLoading: boolean;
    handleGameStartClick: () => void;
    handleWordClick: (index: number) => void;
};

const UI: React.FC<SpellTowerUIProps> = ({
    gameConfig,
    error,
    countdown,
    gameLevel,
    showButton,
    gameStarted,
    hasBeenPlayed,
    correctAnswers,
    incorrectAnswers,
    randomizedVariations,
    pendingResult,
    isLoading,
    handleGameStartClick,
    handleWordClick,
}) => {
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
            {!hasBeenPlayed || !gameLevel ? (
                <div className="spell-tower-game">
                    <div className="spell-tower-game-inner">
                        <GameRules {...gameConfig.gameRules} />
                    </div>
                </div>
            ) : (
                <div className="spell-tower-layout">
                    <div className="spell-tower-col-main">
                        <div className="spell-tower-game">
                            <div className="spell-tower-game-inner">
                                <div className="spell-tower-variations">
                                    {gameStarted ? (
                                        randomizedVariations.map((variation, index) => {
                                            let className = 'variation-btn';
                                            if (pendingResult !== null) {
                                                if (index === pendingResult.correctIndex) className += ' correct-answer';
                                                else if (index === pendingResult.clickedIndex) className += ' incorrect-answer';
                                            }
                                            return (
                                                <button
                                                    key={index}
                                                    className={className}
                                                    disabled={pendingResult !== null}
                                                    onClick={() => handleWordClick(index)}
                                                >
                                                    {variation}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="results-wrapper">
                                            {error && (
                                                <p className="load-error">{error.message}</p>
                                            )}
                                            {incorrectAnswers.length > 0 && (
                                                <div>
                                                    <em className="results-title">
                                                        <FormattedMessage id="incorrectWords" />
                                                    </em>
                                                    <strong className="results-title text-danger">
                                                        {incorrectAnswers.length}
                                                    </strong>
                                                </div>
                                            )}
                                            {incorrectAnswers.map(([wrong, correct]: [string, string], index: number) => (
                                                <div key={index}>
                                                    <span className="results-ko text-danger">{wrong}</span>
                                                    {' → '}
                                                    <strong className="results-ok text-success">{correct}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="spell-tower-col-aside">
                        <div className="spell-tower-wrapper">
                            <div className="spell-tower-top">{correctAnswers}</div>
                            <div className="spell-tower-wrapper-inner">
                                <div className="spell-tower">
                                    {Array.from({ length: correctAnswers }, (_, index) => (
                                        <div key={index} className="tower-block" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UI;
