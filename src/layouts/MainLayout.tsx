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
            <Content style={{ padding: '60px 20px' }}>{children}</Content>
        </Layout>
    );
};

export default MainLayout;
