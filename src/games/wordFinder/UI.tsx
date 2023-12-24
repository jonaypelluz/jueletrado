import React from 'react';
import { Button, Typography } from 'antd';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';
import { Game } from 'src/models/types';

const { Text, Title } = Typography;

type WordFinderUIProps = {
    gameConfig: Game;
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
                        <div className="game-rules">
                            <Title level={2}>Reglas</Title>
                            <p>
                                <Text strong>Objetivo del Juego:</Text>
                            </p>
                            <p>
                                <Text>
                                    El jugador debe adivinar el mayor número de palabras secretas en
                                    un número limitado de intentos por cada palabra y un tiempo
                                    limitado.
                                </Text>
                            </p>
                            <p>
                                <Text strong>Cómo Jugar:</Text>
                            </p>
                            <div>
                                <Text>
                                    <ul>
                                        <li>
                                            El juego comienza mostrando una serie de espacios en
                                            blanco, cada uno representando una letra de la palabra
                                            secreta.
                                        </li>
                                        <li>
                                            El jugador escribe una palabra del mismo largo que la
                                            palabra secreta, intentando adivinarla.
                                        </li>
                                        <li>
                                            Después de cada intento, el juego proporciona
                                            retroalimentación de la siguiente manera:
                                            <ul>
                                                <li>
                                                    <Text type="success">Verde:</Text> La letra está
                                                    en la palabra secreta y en la posición correcta.
                                                </li>
                                                <li>
                                                    <Text type="warning">Amarillo:</Text> La letra
                                                    está en la palabra secreta pero en una posición
                                                    incorrecta.
                                                </li>
                                                <li>
                                                    <Text type="danger">Rojo:</Text> La letra no
                                                    está en la palabra secreta.
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </Text>
                            </div>
                            <p>
                                <Text strong>Reglas Adicionales:</Text>
                            </p>
                            <p>
                                <Text>
                                    Las letras pueden repetirse en la palabra secreta.
                                    <br />
                                    El juego termina cuando se acaba el tiempo.
                                </Text>
                            </p>
                            <p>
                                <Text strong>Consejos:</Text>
                            </p>
                            <p>
                                <Text>
                                    Presta atención a las pistas de color para ajustar tus
                                    siguientes intentos. Usa palabras comunes para tus primeros
                                    intentos y así descubrir más letras.
                                </Text>
                            </p>
                        </div>
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
                            <div className="word-finder-word-wrapper">
                                {renderInputs()}
                            </div>
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
                                        Comprobar palabra ({word.split('').length - attempts.length + 1})
                                    </Button>
                                </p>
                            )}
                        </>
                    )}
                    {foundWords.length > 0 && (
                        <div className="word-finder-found-words">
                            {foundWords.map((foundWord, index) => (
                                <Text
                                    strong
                                    key={index}
                                    className={foundWord.found ? 'found' : 'not-found'}
                                >
                                    {index < foundWords.length - 1
                                        ? `${foundWord.word} - `
                                        : foundWord.word}
                                </Text>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UI;
