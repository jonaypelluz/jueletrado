import React from 'react';
import Home from 'src/pages/Home';
import NotFound from 'src/pages/NotFound';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Router: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;
