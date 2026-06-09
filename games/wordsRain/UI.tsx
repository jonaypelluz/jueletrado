'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { FallingWordItem, GameConfig, RainWordItem } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type WordsRainUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    timer: number;
    gameLevel: string | null;
    isLoading: boolean;
    showButton: boolean;
    gameStarted: boolean;
    isFreezing: boolean;
    isLevelUp: boolean;
    heartsFlash: boolean;
    fallingWords: FallingWordItem[];
    hearts: number;
    totalHearts: number;
    speed: number;
    incorrectWords: RainWordItem[];
    wrapperRef: React.RefObject<HTMLDivElement>;
    handleGameStartClick: () => void;
    handleWordClick: (key: number, word: RainWordItem) => void;
    animationHasEnded: (key: number, word: RainWordItem) => void;
};

const UI: React.FC<WordsRainUIProps> = ({
    gameConfig,
    timer,
    gameLevel,
    isLoading,
    showButton,
    gameStarted,
    isFreezing,
    isLevelUp,
    heartsFlash,
    fallingWords,
    hearts,
    totalHearts,
    speed,
    wrapperRef,
    incorrectWords,
    handleGameStartClick,
    handleWordClick,
    animationHasEnded,
}) => {
    const fallingWordElements = fallingWords.map((item) => (
        <div
            key={item.key}
            data-word-key={item.key}
            className="words-rain-word"
            style={{
                width: `${item.widthPx}px`,
                left: `${item.leftPercentage}%`,
                animationDuration: `${item.duration}s`,
                display: 'inline-flex',
                userSelect: 'none',
                justifyContent: 'center',
                alignItems: 'center',
            }}
            onClick={() => handleWordClick(item.key, item.word)}
            onAnimationEnd={() => animationHasEnded(item.key, item.word)}
        >
            <span className="word-text">{item.word?.word}</span>
        </div>
    ));

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
                ) : null}
                {timer > 0 && (
                    <p className="game-timer">
                        {timer} <FormattedMessage id="gameSeconds" />
                    </p>
                )}
            </Hero>
            <div className="words-rain-wrapper" ref={wrapperRef}>
                {(showButton || !gameLevel) && incorrectWords.length === 0 && (
                    <div className="words-rain-inner">
                        <GameRules {...gameConfig.gameRules} />
                    </div>
                )}
                {isFreezing ? (
                    <>{fallingWordElements}</>
                ) : gameStarted ? (
                    <>
                        {fallingWordElements}
                        <div className="words-rain-points">
                            <span className={`level-value${isLevelUp ? ' level-up' : ''}`}>
                                <FormattedMessage id="gameSpeedLevel" values={{ speed }} />
                            </span>
                        </div>
                        <div className={`words-rain-lifes${heartsFlash ? ' hearts-flash' : ''}`}>
                            {Array.from({ length: totalHearts }, (_, i) => (
                                <span
                                    key={i}
                                    className={`heart-icon ${i < hearts ? 'heart-active' : 'heart-inactive'}`}
                                >
                                    ❤
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="results-wrapper words-rain-results">
                        {incorrectWords.length > 0 && (
                            <div className="results-summary">
                                <em className="results-title">
                                    <FormattedMessage id="incorrectWords" />
                                </em>
                                <strong className="results-title text-danger">
                                    {incorrectWords.length}
                                </strong>
                            </div>
                        )}
                        {incorrectWords.map((item, index) => (
                            <div key={index} className="results-card">
                                <span className="results-wrong">
                                    {item.word !== item.correctWord ? (
                                        item.word
                                    ) : (
                                        <FormattedMessage id="gameMissed" />
                                    )}
                                </span>
                                <span className="results-arrow">→</span>
                                <span className="results-correct">{item.correctWord}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default UI;
