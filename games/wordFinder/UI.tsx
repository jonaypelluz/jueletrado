'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import LoadingScreen from '@components/LoadingScreen';
import '@styles/Buttons.scss';

type WordFinderUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    isLoading: boolean;
    showButton: boolean;
    word: string | undefined;
    isWordComplete: boolean;
    foundWords: { word: string; found: boolean }[];
    attempts: string[][];
    countdown: number;
    renderInputs: () => JSX.Element[];
    getClassForLetter: (letter: string, index: number) => string;
    handleCheckClick: () => void;
    handleGameStartClick: () => void;
};

const UI: React.FC<WordFinderUIProps> = ({
    gameConfig,
    error,
    isLoading,
    showButton,
    word,
    isWordComplete,
    foundWords,
    attempts,
    countdown,
    renderInputs,
    getClassForLetter,
    handleCheckClick,
    handleGameStartClick,
}) => {
    if (error || isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {showButton && (
                    <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                        <FormattedMessage id="gamePlay" />
                    </button>
                )}
                {!showButton && (
                    <p className="game-timer">
                        {countdown} <FormattedMessage id="gameSeconds" />
                    </p>
                )}
            </Hero>
            <div className="word-finder-wrapper">
                <div className="word-finder-inner">
                    {showButton && foundWords.length === 0 && (
                        <GameRules {...gameConfig.gameRules} />
                    )}
                    {word && (
                        <>
                            {attempts &&
                                attempts.map((attempt: string[], attemptIndex: number) => (
                                    <div
                                        key={`attempt-${attemptIndex}`}
                                        className="word-finder-word-wrapper"
                                    >
                                        {attempt.map((letter: string, index: number) => (
                                            <div
                                                key={`letter-${index}`}
                                                className={getClassForLetter(letter, index)}
                                            >
                                                {letter}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            <div className="word-finder-word-wrapper">{renderInputs()}</div>
                            {isWordComplete && (
                                <p style={{ textAlign: 'center' }}>
                                    <button
                                        className="btn-primary game-btn"
                                        onClick={handleCheckClick}
                                    >
                                        <FormattedMessage id="gameCheckWord" /> (
                                        {word.split('').length - attempts.length + 1})
                                    </button>
                                </p>
                            )}
                        </>
                    )}
                    {foundWords.length > 0 && (
                        <div className="word-finder-found-words">
                            {foundWords.map(
                                (foundWord: { word: string; found: boolean }, index: number) => (
                                    <span
                                        key={index}
                                        className={foundWord.found ? 'found' : 'not-found'}
                                    >
                                        {index < foundWords.length - 1
                                            ? `${foundWord.word} - `
                                            : foundWord.word}
                                    </span>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UI;
