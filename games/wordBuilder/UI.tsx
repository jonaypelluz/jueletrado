'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type WordBuilderUIProps = {
    gameConfig: GameConfig;
    error: Error | null;
    gameLevel: string | null;
    isLoading: boolean;
    words: string[];
    letters: string[];
    tempWord: string;
    foundWords: string[];
    handleGameStartClick: () => void;
    handleLetterClick: (letter: string) => void;
    handleCheckWordClick: () => void;
};

const UI: React.FC<WordBuilderUIProps> = ({
    gameConfig,
    gameLevel,
    isLoading,
    words,
    letters,
    tempWord,
    foundWords,
    handleGameStartClick,
    handleLetterClick,
    handleCheckWordClick,
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
                        {letters.length > 0 ? (
                            <FormattedMessage id="gameWordBuilderGenerate" />
                        ) : (
                            <FormattedMessage id="gamePlay" />
                        )}
                    </button>
                ) : (
                    <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                        {letters.length > 0 ? (
                            <FormattedMessage id="gameWordBuilderGenerate" />
                        ) : (
                            <FormattedMessage id="gamePlay" />
                        )}
                    </button>
                )}
            </Hero>
            <div className="word-builder-wrapper">
                {(letters.length === 0 || !gameLevel) && foundWords.length === 0 && (
                    <GameRules {...gameConfig.gameRules} />
                )}
                {letters.length > 0 && (
                    <div className="word-builder-layout">
                        <div className="word-builder-col-left">
                            <div className="word-builder-letters">
                                {letters.map((letter: string, index: number) => (
                                    <span
                                        key={index}
                                        className="letter-tile"
                                        onClick={() => handleLetterClick(letter)}
                                    >
                                        {letter.toUpperCase()}
                                    </span>
                                ))}
                                {words && <span className="total-words">{words.length}</span>}
                            </div>
                        </div>
                        <div className="word-builder-col-right">
                            <div className="word-builder-temporary-word">
                                {tempWord && (
                                    <>
                                        <span>{tempWord.toUpperCase()}</span>
                                        <button
                                            className="btn-default game-btn"
                                            onClick={handleCheckWordClick}
                                        >
                                            <FormattedMessage id="gameCheckWord" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="word-builder-found-words">
                                {foundWords.map((word: string, index: number) => (
                                    <span key={index}>
                                        {index < foundWords.length - 1 ? `${word} - ` : word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UI;
