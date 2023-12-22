import React from 'react';
import { Button } from 'antd';
import LoadingSpinner from 'src/components/LoadingSpinner';
import Logger from 'src/services/Logger';
import { useWordsContext } from 'src/store/WordsContext';

type LoadingScreenProps = {
    rotateMessages?: boolean;
};

const errorMessages = [
    'Oops, las letras se han rebelado. ¡Algo ha ido mal!',
    'Parece que nuestras palabras están jugando al escondite. ¡Error detectado!',
    '¡Vaya! Alguien derramó café en el código. Estamos arreglándolo.',
    'Las tildes se han escapado, y con ellas, la estabilidad del sistema. Error en proceso.',
    'Estamos experimentando una tormenta de ideas... y de errores. Por favor, espera.',
    'Error en el sistema. Las letras están bailando salsa en vez de trabajar.',
    'Algo se ha torcido... posiblemente sean las eses. Trabajando para solucionarlo.',
    'Nuestros puntos y comas hicieron una pausa demasiado larga. Error encontrado.',
    'El alfabeto ha decidido tomarse un descanso. Error inesperado.',
    'Las palabras están haciendo huelga. Nos disculpamos por este error técnico.',
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ rotateMessages = false }) => {
    const { loadingProgress, error } = useWordsContext();

    const getRandomErrorMessage = () => {
        return errorMessages[Math.floor(Math.random() * errorMessages.length)];
    };

    if (error) {
        Logger.error(error.message);
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
            }}
        >
            {error ? (
                <>
                    <p>{getRandomErrorMessage()}</p>
                    <Button type="link" href="/" style={{ marginTop: '20px' }}>
                        Ir al inicio a buscar las letras
                    </Button>
                </>
            ) : (
                <LoadingSpinner rotateMessages={rotateMessages} loadingProgress={loadingProgress} />
            )}
        </div>
    );
};

export default LoadingScreen;
