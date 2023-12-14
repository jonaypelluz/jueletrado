import React from 'react';
import { Spin } from 'antd';

const LoadingSpinner: React.FC = () => {
    return (
        <>
            <p>Cargando palabras</p>
            <Spin size="large" />
        </>
    );
};

export default LoadingSpinner;
