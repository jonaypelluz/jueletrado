import React, { useEffect, useState } from 'react';
import { useWordsContext } from 'src/store/WordsContext';
import { LoadWords, getRandomWord } from 'src/services/WordsService';
import LoadingScreen from 'src/components/LoadingScreen';
import DayWord from 'src/components/DayWord';
import StorageService from 'src/store/StorageService';
import Logger from 'src/services/Logger';
import { Layout, Typography } from 'antd';
import MainLayout from 'src/layouts/MainLayout';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const heroStyles = {
    backgroundColor: '#999',
    padding: '60px 20px',
};

const Home: React.FC = () => {
    const { isLoading, error, setLoadingProgress, setError, setLoading } = useWordsContext();
    const [dailyWord, setDailyWord] = useState<string | undefined>(() => {
        const storedWord = StorageService.getItem<string>(StorageService.DAY_WORD_SELECTED);
        return storedWord || undefined;
    });
    const [areWordsLoaded, setAreWordsLoaded] = useState(false);

    useEffect(() => {
        Logger.debug('LoadWords');
        LoadWords(setError, setLoadingProgress, setLoading);
        setAreWordsLoaded(true);
    }, []);

    useEffect(() => {
        async function fetchRandomWord() {
            Logger.debug('fetchRandomWord');
            const word = await getRandomWord(setError, setLoading);
            StorageService.setItem(StorageService.DAY_WORD_SELECTED, word);
            setDailyWord(word);
        }

        if (!dailyWord) {
            fetchRandomWord();
        }
    }, [areWordsLoaded]);

    if (isLoading || error) {
        return <LoadingScreen />;
    }

    return (
        <MainLayout>
            <Content style={heroStyles}>
                <Title style={{ color: '#fff', textAlign: 'center', marginBottom: '0' }}>
                    Jueletrado
                </Title>
                <Paragraph style={{ textAlign: 'center' }}>
                    <Text
                        strong
                        italic
                        style={{ textAlign: 'center', color: '#fff', fontSize: '20px' }}
                    >
                        Donde jugar y aprender a escribir van de la mano
                    </Text>
                </Paragraph>
            </Content>
            {dailyWord ? <DayWord word={dailyWord} /> : ''}
        </MainLayout>
    );
};

export default Home;
