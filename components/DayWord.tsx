'use client';

import React from 'react';
import '@styles/DayWord.scss';

interface DayWordProps {
    word?: string;
}

const DayWord: React.FC<DayWordProps> = ({ word }) => {
    return (
        <div className="day-word">
            <h2>Palabra del día:</h2>
            <p>
                <em>{word}</em>
            </p>
        </div>
    );
};

export default DayWord;
