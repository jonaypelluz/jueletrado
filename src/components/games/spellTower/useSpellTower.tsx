import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { ForwardOutlined } from '@ant-design/icons';
import ExclusionsRules from 'src/config/ExclusionRules';
import WordRules from 'src/config/WordRules';
import { useWordProcessor } from 'src/hooks/useWordProcessor';
import Logger from 'src/services/Logger';
import StorageService from 'src/store/StorageService';
import { useWordsContext } from 'src/store/WordsContext';

const { Text } = Typography;

const GAME_TIME = 10;

const useSpellTower = () => {
    const { error, setError, setLoading, isLoading } = useWordsContext();

    const [countdown, setCountdown] = useState<number>(0);
    const [showButton, setShowButton] = useState<boolean>(false);
    const [words, setWords] = useState<string[][] | null>(null);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [randomizedVariations, setRandomizedVariations] = useState<string[]>([]);
    const [correctAnswers, setCorrectAnswers] = useState<number>(0);
    const [incorrectAnswers, setIncorrectAnswers] = useState<[string, string][]>([]);

    const { processWords, processLastWords } = useWordProcessor();

    const handleWordClick = (clickedIndex: number) => {
        if (words && currentWordIndex < words.length) {
            const correctWord = words[currentWordIndex][0];
            const clickedWord = randomizedVariations[clickedIndex];

            if (clickedWord === correctWord) {
                setCorrectAnswers(correctAnswers + 1);
            } else {
                setIncorrectAnswers([...incorrectAnswers, [clickedWord, correctWord]]);
            }

            if (currentWordIndex < words.length - 1) {
                setCurrentWordIndex(currentWordIndex + 1);
            } else {
                Logger.log('All words processed');
            }
        }
    };

    useEffect(() => {
        if (words && currentWordIndex < words.length) {
            const currentVariations = [...words[currentWordIndex]];
            setRandomizedVariations(currentVariations.sort(() => Math.random() - 0.5));
        }
    }, [words, currentWordIndex]);

    useEffect(() => {
        const fetchWordsFromStorage = async () => {
            const storedWords = StorageService.getItem<string[]>(StorageService.WORDS_GROUP_60);

            if (storedWords) {
                const gameWords = processWords(storedWords, WordRules, ExclusionsRules);
                const finalGameWords = processLastWords(gameWords);
                setWords(finalGameWords);
                setShowButton(true);
            } else {
                const errorMsg = 'Words group 60 not found in storage';
                setError(new Error(errorMsg));
                Logger.error(errorMsg);
            }
        };

        if (!words) {
            setLoading(true);
            fetchWordsFromStorage().then(() => setLoading(false));
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setIsGameActive(false);
            setShowButton(true);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    const handleButtonClick = () => {
        setShowButton(false);
        setCurrentWordIndex(0);
        setCorrectAnswers(0);
        setIncorrectAnswers([]);
        setCountdown(GAME_TIME);
        setIsGameActive(true);
    };

    const renderGameResult = (): JSX.Element => {
        return (
            <div>
                {incorrectAnswers.length > 0 && (
                    <div>
                        <Text italic style={{ fontSize: '24px', marginRight: '5px' }}>
                            Palabras incorrectas:
                        </Text>
                        <Text strong type="danger" style={{ fontSize: '24px' }}>
                            {incorrectAnswers.length}
                        </Text>
                    </div>
                )}
                {incorrectAnswers.map(([wrong, correct], index) => (
                    <div key={index}>
                        <Text type="danger" style={{ fontSize: '20px', marginRight: '5px' }}>
                            {wrong}
                        </Text>
                        <ForwardOutlined />
                        <Text strong type="success" style={{ fontSize: '24px', marginLeft: '5px' }}>
                            {correct}
                        </Text>
                    </div>
                ))}
            </div>
        );
    };

    const renderTowerBlocks = (): JSX.Element[] => {
        return Array.from({ length: correctAnswers }, (_, index) => (
            <div key={index} className="tower-block"></div>
        ));
    };

    const displayWordVariations = (): JSX.Element[] => {
        return randomizedVariations.map((variation, index) => (
            <Button
                size="large"
                block
                key={index}
                onClick={() => handleWordClick(index)}
                style={{ fontSize: '24px', height: '60px' }}
            >
                {variation}
            </Button>
        ));
    };

    return {
        error,
        countdown,
        showButton,
        words,
        isGameActive,
        correctAnswers,
        isLoading,
        handleButtonClick,
        renderTowerBlocks,
        displayWordVariations,
        renderGameResult,
    };
};

export default useSpellTower;
