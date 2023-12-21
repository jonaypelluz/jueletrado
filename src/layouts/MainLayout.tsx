import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import Header from 'src/components/Header';

const { Content } = Layout;

type MainLayoutProps = {
    children?: ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Layout>
            <Header />
            <Content>{children}</Content>
        </Layout>
    );
};

export default MainLayout;
