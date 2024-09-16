import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { useWordsContext } from '@store/WordsContext';
import AllGames from 'src/pages/AllGames';
import Home from 'src/pages/Home';
import NotFound from 'src/pages/NotFound';
import Accentuation from 'src/pages/content/es/Accentuation';
import Orthography from 'src/pages/content/es/Orthography';
import Spelling from 'src/pages/content/es/Spelling';
import SpellingRules from 'src/pages/content/es/SpellingRules';
import CrossWordPuzzle from 'src/pages/games/CrossWordPuzzle';
import DefinitionMaster from 'src/pages/games/DefinitionMaster';
import SpellTower from 'src/pages/games/SpellTower';
import WordBuilder from 'src/pages/games/WordBuilder';
import WordFinder from 'src/pages/games/WordFinder';
import WordsRain from 'src/pages/games/WordsRain';

const componentMap: { [key: string]: JSX.Element } = {
    home: <Home />,
    spellingRules: <SpellingRules />,
    orthography: <Orthography />,
    accentuation: <Accentuation />,
    spelling: <Spelling />,
    games: <AllGames />,
    spellTower: <SpellTower />,
    wordsRain: <WordsRain />,
    wordBuilder: <WordBuilder />,
    wordFinder: <WordFinder />,
    definitionMaster: <DefinitionMaster />,
    crossWordPuzzle: <CrossWordPuzzle />,
};

const Router: React.FC = () => {
    const intl = useIntl();
    const { locale, currentRoutes } = useWordsContext();

    const routes = Object.entries(currentRoutes).map(([key, value]) => (
        <Route key={key} path={value} element={componentMap[key] || <NotFound />} />
    ));

    const updateDocumentHead = () => {
        document.documentElement.lang = locale;
        document.title = intl.formatMessage({ id: 'mainTitle' });

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', intl.formatMessage({ id: 'mainDescription' }));
        }
    };

    useEffect(() => {
        updateDocumentHead();
    }, [locale]);

    return (
        <HashRouter basename="/">
            <Routes>
                {routes}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </HashRouter>
    );
};

export default Router;
