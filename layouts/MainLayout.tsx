'use client';

import React, { ReactNode } from 'react';
import Footer from '@components/Footer';
import Header from '@components/Header';

type MainLayoutProps = {
    children?: ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <>
            <Header />
            <main>{children}</main>
            <Footer />
        </>
    );
};

export default MainLayout;
