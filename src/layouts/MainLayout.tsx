import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import Header from 'src/components/Header';

type MainLayoutProps = {
    children?: ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Layout>
            <Header />
            {children}
        </Layout>
    );
};

export default MainLayout;
