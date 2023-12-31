import React from 'react';
import { Button, Col, Row, Typography } from 'antd';
import { CardInfo } from '@models/types';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text, Title } = Typography;

type WordBuilderUIProps = {
    gameConfig: CardInfo;
    error: Error | null;
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
    error,
    isLoading,
    words,
    letters,
    tempWord,
    foundWords,
    handleGameStartClick,
    handleLetterClick,
    handleCheckWordClick,
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
                    {letters.length > 0 ? 'Generar otras letras' : 'Jugar'}
                </Button>
            </Hero>
            <div className="word-builder-wrapper">
                {letters.length === 0 && foundWords.length === 0 && (
                    <div className="game-rules">
                        <Title level={2}>Reglas</Title>
                        <p>
                            <Text strong>Objetivo del Juego:</Text>
                        </p>
                        <p>
                            <Text>
                                El objetivo es adivinar la mayor cantidad de palabras posibles
                                utilizando las letras que se muestran.
                            </Text>
                        </p>
                        <p>
                            <Text strong>Cómo Jugar:</Text>
                        </p>
                        <div>
                            <Text>
                                <ul>
                                    <li>
                                        Al inicio del juego, se presentan letras dispuestas en un
                                        círculo, y en el centro, un número indica el total de
                                        posibles combinaciones de palabras.
                                    </li>
                                    <li>
                                        Selecciona una letra para que aparezca junto a un botón de
                                        verificación, que te permite comprobar si la palabra existe.
                                    </li>
                                    <li>
                                        Las palabras adivinadas correctamente se mostrarán
                                        secuencialmente una detrás de otra.
                                    </li>
                                </ul>
                            </Text>
                        </div>
                        <p>
                            <Text strong>Reglas Adicionales:</Text>
                        </p>
                        <p>
                            <Text>
                                Las palabras con acentos serán aceptadas aunque la combinación de
                                letras no incluya acentos.
                                <br />
                                El juego concluye cuando se hayan encontrado todas las combinaciones
                                posibles de palabras.
                            </Text>
                        </p>
                        <p>
                            <Text strong>Consejos:</Text>
                        </p>
                        <p>
                            <Text>
                                Combinaciones de palabras que tengan dos sílabas es posible. <br />
                                Ten en cuenta que entre las opciones posibles, no se incluyen
                                palabras de una sola sílaba.
                            </Text>
                        </p>
                    </div>
                )}
                {letters.length > 0 && (
                    <>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={14} md={14} lg={10}>
                                <div className="word-builder-letters">
                                    {letters.map((letter: string, index: number) => (
                                        <Text key={index} onClick={() => handleLetterClick(letter)}>
                                            {letter.toUpperCase()}
                                        </Text>
                                    ))}
                                    {words && <span className="total-words">{words.length}</span>}
                                </div>
                            </Col>
                            <Col xs={24} sm={10} md={10} lg={14}>
                                <div className="word-builder-temporary-word">
                                    {tempWord && (
                                        <>
                                            <Text>{tempWord.toUpperCase()}</Text>
                                            <Button
                                                type="default"
                                                style={{
                                                    fontSize: '18px',
                                                    padding: '10px 22px',
                                                    height: 'auto',
                                                }}
                                                onClick={handleCheckWordClick}
                                            >
                                                Comprobar palabra
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div className="word-builder-found-words">
                                    {foundWords.map((word: string, index: number) => (
                                        <Text strong key={index}>
                                            {index < foundWords.length - 1 ? `${word} - ` : word}
                                        </Text>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        </>
    );
};

export default UI;
