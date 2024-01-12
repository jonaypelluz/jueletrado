import React from 'react';
import { Button, Typography } from 'antd';
import { CardInfo, QuizDefinition } from '@models/types';
import Hero from 'src/components/Hero';

type DefinitionMasterUIProps = {
    gameConfig: CardInfo;
    isGameStarted: boolean;
    letters: string[];
    quizWords: QuizDefinition[][];
    renderQuiz: () => JSX.Element | null;
    handleLetterClick: (letter: string) => Promise<void>;
    handleGameStartClick: () => void;
    handleResetLetterClick: () => void;
};

const { Text, Title } = Typography;

const UI: React.FC<DefinitionMasterUIProps> = ({
    gameConfig,
    isGameStarted,
    letters,
    quizWords,
    renderQuiz,
    handleLetterClick,
    handleGameStartClick,
    handleResetLetterClick,
}) => (
    <>
        <Hero image={gameConfig.imgSrc} title={gameConfig.title} subtitle={gameConfig.description}>
            {isGameStarted && Object.keys(quizWords).length !== 0 && (
                <Button
                    style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                    onClick={handleResetLetterClick}
                >
                    Elegir otra letra
                </Button>
            )}
            {!isGameStarted && (
                <Button
                    type="primary"
                    style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                    onClick={handleGameStartClick}
                >
                    Jugar
                </Button>
            )}
        </Hero>
        <div className="definition-master-wrapper">
            <div className="definition-master-inner">
                {!isGameStarted && (
                    <div className="game-rules">
                        <Title level={2}>Reglas</Title>
                        <p>
                            <Text strong>Objetivo del Juego:</Text>
                        </p>
                        <p>
                            <Text>
                                El objetivo es aprender y adivinar las definiciones de tantas
                                palabras como sea posible.
                            </Text>
                        </p>
                        <p>
                            <Text strong>Cómo Jugar:</Text>
                        </p>
                        <div>
                            <Text>
                                <ul>
                                    <li>
                                        Al inicio del juego, se presenta una palabra acompañada de
                                        varias definiciones posibles.
                                    </li>
                                    <li>
                                        El jugador selecciona la definición que cree correcta. Si es
                                        correcta, se resaltará en color azul.
                                    </li>
                                    <li>
                                        Si la definición es incorrecta, se mostrará en color rojo, y
                                        se revelará la palabra correcta a la que corresponde esa
                                        definición.
                                    </li>
                                </ul>
                            </Text>
                        </div>
                        <p>
                            <Text strong>Reglas Adicionales:</Text>
                        </p>
                        <p>
                            <Text>
                                Una vez que se hayan agotado las palabras seleccionadas
                                aleatoriamente, tendrás que elegir otra letra para obtener nuevas
                                palabras.
                            </Text>
                        </p>
                        <p>
                            <Text strong>Consejos:</Text>
                        </p>
                        <p>
                            <Text>
                                A veces, la palabra a adivinar puede aparecer en una de las
                                definiciones proporcionadas.
                            </Text>
                        </p>
                    </div>
                )}
                {isGameStarted &&
                    Object.keys(quizWords).length === 0 &&
                    letters.map((letter: string, index: number) => (
                        <Button
                            className="letter-btn"
                            key={index}
                            onClick={() => handleLetterClick(letter)}
                        >
                            {letter.toUpperCase()}
                        </Button>
                    ))}
                {renderQuiz()}
            </div>
        </div>
    </>
);

export default UI;
