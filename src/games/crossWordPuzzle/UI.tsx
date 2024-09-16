import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'antd';
import { GameConfig, SelectedWord } from '@models/types';
import Hero from 'src/components/Hero';
import { ICell } from '@models/interfaces';
import GameRules from 'src/components/GameRules';

type CrossWordPuzzleUIProps = {
    gameConfig: GameConfig;
    gridSize: number;
    gridSizePixels: number;
    liRefs: React.MutableRefObject<(HTMLLIElement | null)[]>;
    crossword: ICell[][];
    selectedWords: SelectedWord;
    isGameStarted: boolean;
    checkCellValue: (i: number, j: number) => (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleGameStartClick: () => void;
}

const hexToRgb = (hex: string): string => {
    hex = hex.replace(/^#/, '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
}

const UI: React.FC<CrossWordPuzzleUIProps> = ({
    gameConfig,
    gridSize,
    gridSizePixels,
    liRefs,
    crossword,
    selectedWords,
    isGameStarted,
    checkCellValue,
    handleGameStartClick
}) => {
    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {/* {!isGameStarted && ( */}
                    <Button
                        type='primary'
                        style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                        onClick={handleGameStartClick}
                    >
                        <FormattedMessage id='gamePlay' />
                    </Button>
                {/* )} */}
            </Hero>
            {isGameStarted ? (
                <div className='crossword-container'>
                    <div className='crossword-sidebar'>
                        <ul>
                        {Object.entries(selectedWords).map(([word, data], index) => {
                            const randomIndex = Math.floor(Math.random() * data.definition.length);
                            const randomDefinition = data.definition[randomIndex];
                            const color = data.color;
                            return (
                                <li
                                    key={word}
                                    ref={(el) => (liRefs.current[index] = el)}>
                                    <span style={{ backgroundColor: color }}></span>
                                    {randomDefinition.definition}
                                </li>
                            );
                        })}
                        </ul>
                    </div>
                    <div
                        className='crossword-grid-container'
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, ${gridSizePixels}px)`,
                        }}
                    >
                        {crossword.map((row, i) =>
                            row.map((cell, j) => (
                                <div
                                    key={`${i}-${j}`}
                                    className='crossword-grid-item'
                                    style={{
                                        width: `${gridSizePixels}px`,
                                        height: `${gridSizePixels}px`,
                                    }}
                                >
                                    {cell.filled ? (
                                        <input
                                            type='text'
                                            maxLength={1}
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
                                    ) : (
                                        ''
                                    )}
                                </div>
                            )),
                        )}
                    </div>
                </div>
            ): (
                <GameRules {...gameConfig.gameRules} />
            )}
        </>
    );
};

export default UI;
