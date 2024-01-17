import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Row, Typography } from 'antd';
import { GameConfig } from '@models/types';
import GameRules from 'src/components/GameRules';
import Hero from 'src/components/Hero';
import LoadingScreen from 'src/components/LoadingScreen';

const { Text } = Typography;

type WordBuilderUIProps = {
    gameConfig: GameConfig;
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
                    {letters.length > 0 ? (
                        <FormattedMessage id="gameWordBuilderGenerate" />
                    ) : (
                        <FormattedMessage id="gamePlay" />
                    )}
                </Button>
            </Hero>
            <div className="word-builder-wrapper">
                {letters.length === 0 && foundWords.length === 0 && (
                    <GameRules {...gameConfig.gameRules} />
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
                                                <FormattedMessage id="gameCheckWord" />
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
