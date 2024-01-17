import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'antd';
import { GameConfig, QuizDefinition } from '@models/types';
import GameRules from 'src/components/GameRules';
import Hero from 'src/components/Hero';

type DefinitionMasterUIProps = {
    gameConfig: GameConfig;
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
                    <Button
                        style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                        onClick={handleResetLetterClick}
                    >
                        <FormattedMessage id="gameQuizWordChoose" />
                    </Button>
                )}
                {!isGameStarted && (
                    <Button
                        type="primary"
                        style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                        onClick={handleGameStartClick}
                    >
                        <FormattedMessage id="gamePlay" />
                    </Button>
                )}
            </Hero>
            <div className="definition-master-wrapper">
                <div className="definition-master-inner">
                    {isGameStarted ? (
                        Object.keys(quizWords).length === 0 &&
                        letters.map((letter: string, index: number) => (
                            <Button
                                className="letter-btn"
                                key={index}
                                onClick={() => handleLetterClick(letter)}
                            >
                                {letter.toUpperCase()}
                            </Button>
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
