'use client';

import React, { ChangeEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type WordFinderUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    gameLevel: string | null;
    isLoading: boolean;
    showButton: boolean;
    word: string | undefined;
    letters: string[];
    inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    isWordComplete: boolean;
    foundWords: { word: string; found: boolean }[];
    attempts: string[][];
    countdown: number;
    getClassForLetter: (letter: string, index: number) => string;
    handleInputChange: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
    handleCheckClick: () => void;
    handleGameStartClick: () => void;
};

const UI: React.FC<WordFinderUIProps> = ({
    gameConfig,
    gameLevel,
    isLoading,
    showButton,
    word,
    letters,
    inputRefs,
    isWordComplete,
    foundWords,
    attempts,
    countdown,
    getClassForLetter,
    handleInputChange,
    handleCheckClick,
    handleGameStartClick,
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
            <div className="word-finder-wrapper">
                <div className="word-finder-inner">
                    {(showButton || !gameLevel) && foundWords.length === 0 && (
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
                            <div className="word-finder-word-wrapper">
                                {letters.map((_, index: number) => (
                                    <input
                                        key={`input-${index}`}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        maxLength={1}
                                        onChange={(event) => handleInputChange(event, index)}
                                        aria-label={`Letra ${index + 1}`}
                                    />
                                ))}
                            </div>
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
