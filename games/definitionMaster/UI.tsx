'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameConfig, QuizDefinition } from '@models/types';
import GameRules from '@components/GameRules';
import Hero from '@components/Hero';
import '@styles/Buttons.scss';

type SelectedAnswersType = { [key: string]: boolean };

type DefinitionMasterUIProps = {
    gameConfig: GameConfig;
    gameLevel: string | null;
    isGameStarted: boolean;
    isLoadingLetter: boolean;
    isLetterDisabled: (letter: string) => boolean;
    isNextButtonActive: boolean;
    isQuizFinished: boolean;
    loadError: boolean;
    letters: string[];
    quizWord: string;
    quizWords: QuizDefinition[][];
    currentQuizIndex: number;
    selectedAnswers: SelectedAnswersType;
    handleLetterClick: (letter: string) => Promise<void>;
    handleGameStartClick: () => void;
    handleResetLetterClick: () => void;
    handleQuizWordClick: (word: string | undefined, isCorrect: boolean) => void;
    handleNextQuizWord: () => void;
};

const beautifyDefinition = (definition: string): string => {
    const capitalizedFirstLetter = definition.charAt(0).toUpperCase();
    const withoutFirstLetter = definition.slice(1);
    const withoutPeriodAndRest = withoutFirstLetter.split('.')[0];
    return capitalizedFirstLetter + withoutPeriodAndRest;
};

const UI: React.FC<DefinitionMasterUIProps> = ({
    gameConfig,
    gameLevel,
    isGameStarted,
    isLoadingLetter,
    isLetterDisabled,
    isNextButtonActive,
    isQuizFinished,
    loadError,
    letters,
    quizWord,
    quizWords,
    currentQuizIndex,
    selectedAnswers,
    handleLetterClick,
    handleGameStartClick,
    handleResetLetterClick,
    handleQuizWordClick,
    handleNextQuizWord,
}) => {
    const showQuiz =
        !isQuizFinished &&
        quizWords.length > 0 &&
        quizWords[currentQuizIndex] !== undefined;

    return (
        <>
            <Hero
                image={gameConfig.imgSrc}
                title={gameConfig.title}
                subtitle={gameConfig.description}
            >
                {isGameStarted && quizWords.length !== 0 && (
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
                        <>
                            {loadError && (
                                <p className="load-error">
                                    <FormattedMessage id="gameLoadError" />
                                </p>
                            )}
                            {quizWords.length === 0 && !loadError &&
                                letters.map((letter: string, index: number) => {
                                    const disabled = isLetterDisabled(letter) || isLoadingLetter;
                                    return (
                                        <button
                                            className={`letter-btn${isLetterDisabled(letter) ? ' letter-btn--disabled' : ''}`}
                                            key={index}
                                            disabled={disabled}
                                            onClick={() => handleLetterClick(letter)}
                                        >
                                            {letter.toUpperCase()}
                                        </button>
                                    );
                                })
                            }
                            {showQuiz && (
                                <div className="definition-master-quiz">
                                    <h2>
                                        <FormattedMessage id="gameQuizWord" values={{ quizWord }} />
                                    </h2>
                                    {quizWords[currentQuizIndex].map((word: QuizDefinition, index: number) => {
                                        const isCorrect = selectedAnswers[word.word];
                                        let buttonClass = 'definition-btn';
                                        if (isCorrect !== undefined) {
                                            buttonClass += isCorrect ? ' correct-answer' : ' incorrect-answer';
                                        }
                                        return (
                                            <button
                                                className={buttonClass}
                                                key={index}
                                                onClick={() => handleQuizWordClick(word.word, word.isCorrect)}
                                            >
                                                {isCorrect !== undefined && !isCorrect && (
                                                    <strong>{word.word}: </strong>
                                                )}
                                                {beautifyDefinition(word.definition)}.
                                            </button>
                                        );
                                    })}
                                    {isNextButtonActive && (
                                        <button
                                            className="btn-primary next-btn"
                                            onClick={handleNextQuizWord}
                                        >
                                            <FormattedMessage id="gameQuizWordNextWord" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <GameRules {...gameConfig.gameRules} />
                    )}
                </div>
            </div>
        </>
    );
};

export default UI;
