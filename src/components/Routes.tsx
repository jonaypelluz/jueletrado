import React from 'react';
import Home from 'src/pages/Home';
import NotFound from 'src/pages/NotFound';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SpellTower from 'src/pages/SpellTower';
import AllGames from 'src/pages/AllGames';

const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/games" element={<AllGames />} />
                <Route path="/games/spelltower" element={<SpellTower />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;
