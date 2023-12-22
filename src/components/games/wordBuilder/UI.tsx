import React from 'react';
import { Button, Col, Row, Typography } from 'antd';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text } = Typography;

type WordBuilderUIProps = {
    error: Error | null;
    isLoading: boolean;
    words: string[];
    letters: string[];
    tempWord: string;
    foundWords: string[];
    generateLetters: () => void;
    handleLetterClick: (letter: string) => void;
    handleCheckWordClick: () => void;
};

const UI: React.FC<WordBuilderUIProps> = ({
    error,
    isLoading,
    words,
    letters,
    tempWord,
    foundWords,
    generateLetters,
    handleLetterClick,
    handleCheckWordClick,
}) => {
    if (error || isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Hero
                image="/games/WordBuilder.png"
                title="Constructor de palabras"
                subtitle="Es un desafiante juego de formación de palabras con letras aleatorias, fomentando habilidades 
                lingüísticas y de vocabulario de manera lúdica y educativa"
            >
                <Button
                    type="primary"
                    style={{
                        fontSize: '18px',
                        padding: '10px 22px',
                        height: 'auto',
                        marginRight: '5px',
                    }}
                    onClick={generateLetters}
                >
                    {letters.length > 0 ? 'Generar otras letras' : 'Jugar'}
                </Button>
            </Hero>
            <div className="word-builder-wrapper">
                <Row gutter={[16, 16]}>
                    <Col xs={10} sm={10} md={10} lg={10}>
                        {letters.length > 0 && (
                            <div className="word-builder-letters">
                                {letters.map((letter: string, index: number) => (
                                    <Text key={index} onClick={() => handleLetterClick(letter)}>
                                        {letter.toUpperCase()}
                                    </Text>
                                ))}
                                {words && <span className="total-words">{words.length}</span>}
                            </div>
                        )}
                    </Col>
                    <Col xs={14} sm={14} md={14} lg={14}>
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
                            {foundWords.map((word, index) => (
                                <Text strong key={index}>
                                    {index < foundWords.length - 1 ? `${word} - ` : word}
                                </Text>
                            ))}
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default UI;
