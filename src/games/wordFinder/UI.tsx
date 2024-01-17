import React from 'react';
import { Button, Typography } from 'antd';
import { GameConfig } from '@models/types';
import GameRules from 'src/components/GameRules';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text } = Typography;

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
                    <Button
                        type="primary"
                        style={{
                            fontSize: '18px',
                            padding: '10px 22px',
                            height: 'auto',
                            marginRight: '5px',
                        }}
                        onClick={handleGameStartClick}
                    >
                        Jugar
                    </Button>
                )}
                {!showButton && (
                    <p style={{ fontSize: '24px', fontWeight: '800' }}>
                        {countdown} segundos restantes
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
                                                <Text>{letter}</Text>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            <div className="word-finder-word-wrapper">{renderInputs()}</div>
                            {isWordComplete && (
                                <p style={{ textAlign: 'center' }}>
                                    <Button
                                        type="primary"
                                        style={{
                                            fontSize: '18px',
                                            padding: '10px 22px',
                                            height: 'auto',
                                        }}
                                        onClick={handleCheckClick}
                                    >
                                        Comprobar palabra (
                                        {word.split('').length - attempts.length + 1})
                                    </Button>
                                </p>
                            )}
                        </>
                    )}
                    {foundWords.length > 0 && (
                        <div className="word-finder-found-words">
                            {foundWords.map(
                                (foundWord: { word: string; found: boolean }, index: number) => (
                                    <Text
                                        strong
                                        key={index}
                                        className={foundWord.found ? 'found' : 'not-found'}
                                    >
                                        {index < foundWords.length - 1
                                            ? `${foundWord.word} - `
                                            : foundWord.word}
                                    </Text>
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
