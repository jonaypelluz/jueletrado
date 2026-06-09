'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig, QuizDefinition } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type DefinitionMasterUIProps = {
    gameConfig: GameConfig;
    gameLevel: string | null;
    isGameStarted: boolean;
    letters: string[];
    quizWords: QuizDefinition[][];
    renderQuiz: () => JSX.Element | null;
    handleLetterClick: (letter: string) => Promise<void>;
    handleGameStartClick: () => void;
    handleResetLetterClick: () => void;
};

const UI: React.FC<DefinitionMasterUIProps> = ({
    gameConfig,
    gameLevel,
    isGameStarted,
    letters,
    quizWords,
    renderQuiz,
    handleLetterClick,
    handleGameStartClick,
    handleResetLetterClick,
}) => {
    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {isGameStarted && Object.keys(quizWords).length !== 0 && (
                    <button className="btn-default game-btn" onClick={handleResetLetterClick}>
                        <FormattedMessage id="gameQuizWordChoose" />
                    </button>
                )}
                {!isGameStarted && (
                    !gameLevel ? (
                        <button className="btn-primary game-btn" disabled>
                            <FormattedMessage id="gameSelectLevel" />
                        </button>
                    ) : (
                        <button className="btn-primary game-btn" onClick={handleGameStartClick}>
                            <FormattedMessage id="gamePlay" />
                        </button>
                    )
                )}
            </Hero>
            <div className="definition-master-wrapper">
                <div className="definition-master-inner">
                    {isGameStarted ? (
                        Object.keys(quizWords).length === 0 &&
                        letters.map((letter: string, index: number) => (
                            <button
                                className="letter-btn"
                                key={index}
                                onClick={() => handleLetterClick(letter)}
                            >
                                {letter.toUpperCase()}
                            </button>
                        ))
                    ) : (
                        <GameRules {...gameConfig.gameRules} />
                    )}
                    {renderQuiz()}
                </div>
            </div>
        </>
    );
};

export default UI;
