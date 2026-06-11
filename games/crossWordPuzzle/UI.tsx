'use client';

import React, { ChangeEvent, FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { ICell } from '@models/interfaces';
import { GameConfig, SelectedWord } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';
import '@styles/CrossWordPuzzle.scss';

type CrossWordPuzzleUIProps = {
    gameConfig: GameConfig;
    gridSize: number;
    gridSizePixels: number;
    gameLevel: string | null;
    completedWords: Set<string>;
    crossword: ICell[][];
    selectedWords: SelectedWord;
    isGameStarted: boolean;
    isGenerating: boolean;
    isComplete: boolean;
    checkCellValue: (i: number, j: number) => (event: ChangeEvent<HTMLInputElement>) => void;
    handleGameStartClick: () => void;
};

const hexToRgb = (hex: string): string => {
    hex = hex.replace(/^#/, '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
};

const UI: FC<CrossWordPuzzleUIProps> = ({
    gameConfig,
    gridSize,
    gridSizePixels,
    gameLevel,
    completedWords,
    crossword,
    selectedWords,
    isGameStarted,
    isGenerating,
    isComplete,
    checkCellValue,
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
                ) : isGenerating ? (
                    <button className="btn-primary game-btn" disabled>
                        <FormattedMessage id="gameCrossWordGenerating" />
                    </button>
                ) : (
                    <button
                        className="btn-primary game-btn"
                        onClick={handleGameStartClick}
                    >
                        <FormattedMessage id="gamePlay" />
                    </button>
                )}
            </Hero>
            <div className="crossword-wrapper">
            {isGameStarted ? (
                isGenerating ? (
                    <div className="crossword-loading">
                        <div className="spinner" />
                        <p><FormattedMessage id="gameCrossWordGenerating" /></p>
                    </div>
                ) :
                <>
                {isComplete && (
                    <div className="crossword-complete-message">
                        <FormattedMessage id="gameCrossWordComplete" />
                    </div>
                )}
                <div className="crossword-container">
                    <div className="crossword-sidebar">
                        <ul>
                            {Object.entries(selectedWords).map(([word, data]) => (
                                <li key={word} className={completedWords.has(word) ? 'completed' : ''}>
                                    <span style={{ backgroundColor: data.color }}></span>
                                    {data.displayDefinition}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div
                        className="crossword-grid-container"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, ${gridSizePixels}px)`,
                        }}
                    >
                        {crossword.map((row, i) =>
                            row.map((cell, j) => (
                                <div
                                    key={`${i}-${j}`}
                                    className="crossword-grid-item"
                                    style={{
                                        width: `${gridSizePixels}px`,
                                        height: `${gridSizePixels}px`,
                                    }}
                                >
                                    {cell.filled ? (
                                        cell.isHint ? (
                                            <span
                                                className="crossword-hint-cell"
                                                style={{
                                                    width: `${gridSizePixels}px`,
                                                    height: `${gridSizePixels}px`,
                                                    backgroundColor: '#fff',
                                                    borderColor: '#000',
                                                    borderWidth: 3,
                                                    borderStyle: 'solid',
                                                }}
                                            >
                                                {cell.char.toUpperCase()}
                                            </span>
                                        ) : (
                                            <input
                                                type="text"
                                                maxLength={1}
                                                disabled={isComplete || !!cell.isLocked}
                                                onKeyDown={(e) => { if (/\d/.test(e.key)) e.preventDefault(); }}
                                                onChange={(event) => checkCellValue(i, j)(event)}
                                                style={{
                                                    width: `${gridSizePixels}px`,
                                                    height: `${gridSizePixels}px`,
                                                    backgroundColor: `rgba(${hexToRgb(cell.color)}, 0.3)`,
                                                    borderColor: cell.color,
                                                    borderWidth: 3,
                                                    borderStyle: 'solid',
                                                    textTransform: 'uppercase',
                                                    color: 'black',
                                                    display: 'flex',
                                                    textAlign: 'center',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                }}
                                            />
                                        )
                                    ) : (
                                        ''
                                    )}
                                </div>
                            )),
                        )}
                    </div>
                </div>
                </>
            ) : (
                <GameRules {...gameConfig.gameRules} />
            )}
            </div>
        </>
    );
};

export default UI;
