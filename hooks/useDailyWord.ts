import { useEffect } from 'react';
import { loadDailyWordForLocale } from '@services/WordsService';
import { useWordsContext } from '@store/WordsContext';

const useDailyWord = (): void => {
    const { hydrated, locale, wordOfTheDay, setWordOfTheDay } = useWordsContext();

    useEffect(() => {
        if (!hydrated || wordOfTheDay) return;
        loadDailyWordForLocale(locale).then((word) => {
            if (word) setWordOfTheDay(word);
        });
    }, [hydrated, locale, wordOfTheDay, setWordOfTheDay]);
};

export default useDailyWord;
