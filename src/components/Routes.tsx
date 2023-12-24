import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AllGames from 'src/pages/AllGames';
import Home from 'src/pages/Home';
import NotFound from 'src/pages/NotFound';
import SpellTower from 'src/pages/games/SpellTower';
import WordBuilder from 'src/pages/games/WordBuilder';
import WordFinder from 'src/pages/games/WordFinder';
import WordsRain from 'src/pages/games/WordsRain';

const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/games" element={<AllGames />} />
                <Route path="/games/spelltower" element={<SpellTower />} />
                <Route path="/games/wordsrain" element={<WordsRain />} />
                <Route path="/games/wordbuilder" element={<WordBuilder />} />
                <Route path="/games/wordfinder" element={<WordFinder />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;
