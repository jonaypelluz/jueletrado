import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import './WordsRain.scss';

const MIN_WORDS_PER_ITERATION = 2;
const MAX_WORDS_PER_ITERATION = 5;
const WORD_WIDTH = 50;
const MIN_ANIMATION_DURATION = 2;
const MAX_ANIMATION_DURATION = 5;
const MIN_ANIMATION_DELAY = 0;
const MAX_ANIMATION_DELAY = 2;

const WordsRain: React.FC = () => {
    const [fallingWords, setFallingWords] = useState<JSX.Element[]>([]);
    const [keyCount, setKeyCount] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const removeWord = useCallback((key: number) => {
        setFallingWords((currentWords) =>
            currentWords.filter((word) => word.key !== key.toString()),
        );
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (wrapperRef.current) {
                const wrapperWidth = wrapperRef.current.offsetWidth;
                const segmentWidth = wrapperWidth / MAX_WORDS_PER_ITERATION;
                const numberOfWords =
                    Math.floor(
                        Math.random() * (MAX_WORDS_PER_ITERATION - MIN_WORDS_PER_ITERATION + 1),
                    ) + MIN_WORDS_PER_ITERATION;
                const chosenSegments = new Set();

                for (let i = 0; i < numberOfWords; i++) {
                    let segmentIndex;
                    do {
                        segmentIndex = Math.floor(Math.random() * MAX_WORDS_PER_ITERATION);
                    } while (chosenSegments.has(segmentIndex));

                    chosenSegments.add(segmentIndex);
                    const segmentStart = segmentIndex * segmentWidth;
                    const randomLeft = segmentStart + Math.random() * (segmentWidth - WORD_WIDTH);
                    const randomLeftPercentage = (randomLeft / wrapperWidth) * 100;
                    const randomDelay =
                        Math.random() * (MAX_ANIMATION_DELAY - MIN_ANIMATION_DELAY) +
                        MIN_ANIMATION_DELAY;
                    const randomDuration =
                        Math.random() * (MAX_ANIMATION_DURATION - MIN_ANIMATION_DURATION) +
                        MIN_ANIMATION_DURATION;
                    const key = keyCount + i;

                    const newWord = (
                        <div
                            key={key}
                            className="word"
                            style={{
                                left: `${randomLeftPercentage}%`,
                                animationDelay: `${randomDelay}s`,
                                animationDuration: `${randomDuration}s`,
                            }}
                            onAnimationEnd={() => removeWord(key)}
                        />
                    );

                    setFallingWords((prevWords) => [...prevWords, newWord]);
                }

                setKeyCount((prevCount) => prevCount + numberOfWords);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [keyCount, removeWord]);

    return (
        <MainLayout>
            <Hero
                image="/games/WordsRain.png"
                title="Lluvia de palabras"
                subtitle="Un juego donde debes evitar que las palabras bien escritas caigan, ya que las mal escritas harán 
                que pierdas. Debes durar el mayor tiempo posible; quien dure más tiempo, gana."
            >
                <Button
                    type="primary"
                    style={{ fontSize: '18px', padding: '10px 22px', height: 'auto' }}
                >
                    Jugar
                </Button>
            </Hero>
            <div className="words-rain-wrapper" ref={wrapperRef}>
                {fallingWords}
            </div>
        </MainLayout>
    );
};

export default WordsRain;
