import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AllGames from 'src/pages/AllGames';
import Home from 'src/pages/Home';
import NotFound from 'src/pages/NotFound';
import SpellingRules from 'src/pages/SpellingRules';
import DefinitionMaster from 'src/pages/games/DefinitionMaster';
import SpellTower from 'src/pages/games/SpellTower';
import WordBuilder from 'src/pages/games/WordBuilder';
import WordFinder from 'src/pages/games/WordFinder';
import WordsRain from 'src/pages/games/WordsRain';
import Accentuation from 'src/pages/spelling/Accentuation';
import Orthography from 'src/pages/spelling/Orthography';
import Spelling from 'src/pages/spelling/Spelling';

const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/spelling-rules" element={<SpellingRules />} />
                <Route path="/spelling-rules/orthography" element={<Orthography />} />
                <Route path="/spelling-rules/accentuation" element={<Accentuation />} />
                <Route path="/spelling-rules/spelling" element={<Spelling />} />
                <Route path="/games" element={<AllGames />} />
                <Route path="/games/spelltower" element={<SpellTower />} />
                <Route path="/games/wordsrain" element={<WordsRain />} />
                <Route path="/games/wordbuilder" element={<WordBuilder />} />
                <Route path="/games/wordfinder" element={<WordFinder />} />
                <Route path="/games/definitionmaster" element={<DefinitionMaster />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;
