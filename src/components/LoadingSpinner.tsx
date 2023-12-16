import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';

const messages = [
    'Ajustando las tildes... ¡Espere por favor!',
    'Buscando las Ñs perdidas en el teclado...',
    'Ordenando abecedario... A, B, C, ¿Dónde está la D?',
    'Cargando palabras... y alguna que otra falta de ortografía.',
    'Revisando que todas las letras lleguen a su destino...',
    '¡Espera un momentito! Estoy poniendo las comas en su lugar.',
    'Alineando acentos... ¡Casi listo!',
    'Descifrando jeroglíficos modernos (también conocidos como caligrafía).',
    'Mezclando consonantes y vocales... ¿Alguien ha visto una E?',
    'Buscando sinónimos divertidos... Cargando humor.',
];

interface LoadingSpinnerProps {
    rotateMessages?: boolean;
    loadingProgress?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    rotateMessages = false,
    loadingProgress,
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
    }, [rotateMessages, messageIndex]);

    return (
        <>
            <Spin size="large" />
            <p>{rotateMessages && currentMessage ? currentMessage : 'Cargando palabras'}</p>
            {loadingProgress != null && (
                <p style={{ fontSize: '24px', fontWeight: '800' }}>{loadingProgress.toFixed(0)}%</p>
            )}
        </>
    );
};

export default LoadingSpinner;
