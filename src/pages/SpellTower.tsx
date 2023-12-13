import React, { useState, useEffect } from 'react';
import { Col, Row, Button } from 'antd';
import MainLayout from 'src/layouts/MainLayout';
import Hero from 'src/components/Hero';
import './tower.scss';
import { getGameWords } from 'src/services/WordsService';
import { useWordsContext } from 'src/store/WordsContext';
import { useWordProcessor } from 'src/hooks/useWordProcessor';
import WordRules from 'src/config/WordRules';
import ExclusionsRules from 'src/config/ExclusionRules';
import Logger from 'src/services/Logger';

const GAME_TIME = 120;
const GAME_WORDS = 30;

const SpellTower: React.FC = () => {
    const { setError, setLoading } = useWordsContext();
    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<string[] | null>(null);

    const { generateWords } = useWordProcessor();

    useEffect(() => {
        async function fetchGameWords() {
            const fetchedWords = await getGameWords(GAME_WORDS, setError, setLoading);
            Logger.debug('WORDS', fetchedWords);
            if (fetchedWords) {
                Logger.debug(
                    'GENERATED WORDS',
                    generateWords(fetchedWords, WordRules, ExclusionsRules),
                );
                setWords(fetchedWords);
                setShowButton(true);
            }
        }

        fetchGameWords();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setShowButton(true);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    const handleButtonClick = () => {
        setCountdown(GAME_TIME);
        setShowButton(false);
    };

    return (
        <MainLayout>
            <Hero
                title="La torre de la ortografía"
                subtitle="Un juego de construcción de torres donde cada palabra bien escrita agrega un
                        bloque a la torre. El juego desafía a los jugadores a construir la torre más
                        alta que puedan escribiendo o eligiendo correctamente una serie de palabras
                        donde la ortografía debe ser la correcta."
            >
                {showButton ? (
                    <Button
                        type="primary"
                        style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                        onClick={handleButtonClick}
                    >
                        Jugar
                    </Button>
                ) : (
                    <div>{countdown} segundos restantes</div>
                )}
            </Hero>
            <Row>
                <Col span={6} push={18}>
                    <div className="jenga-wrapper">
                        <div className="jenga-tower"></div>
                    </div>
                </Col>
                <Col span={18} pull={6}>
                    <div className="jenga-game">
                        {words && words.map((word, idx) => <div key={idx}>{word}</div>)}
                    </div>
                </Col>
            </Row>
        </MainLayout>
    );
};

export default SpellTower;
