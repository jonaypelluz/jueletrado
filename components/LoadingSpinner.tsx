'use client';

import React, { useEffect, useState } from 'react';
import '@styles/LoadingSpinner.scss';

interface LoadingSpinnerProps {
    rotateMessages: boolean;
    messages: string[];
    loadingProgress?: number | null;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    rotateMessages = false,
    messages,
    loadingProgress = null,
}) => {
    const [currentMessage, setCurrentMessage] = useState(messages[0]);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (rotateMessages) {
            const interval = setInterval(() => {
                const nextIndex = (messageIndex + 1) % messages.length;
                setMessageIndex(nextIndex);
                setCurrentMessage(messages[nextIndex]);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [rotateMessages, messageIndex, messages]);

    return (
        <>
            <div className="spinner" />
            <p>{rotateMessages && currentMessage ? currentMessage : 'Cargando palabras'}</p>
            {loadingProgress != null && (
                <p className="loading-progress">{loadingProgress.toFixed(0)}%</p>
            )}
        </>
    );
};

export default LoadingSpinner;
