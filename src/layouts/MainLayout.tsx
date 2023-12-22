import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import Footer from 'src/components/Footer';
import Header from 'src/components/Header';

const { Content } = Layout;

type MainLayoutProps = {
    children?: ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <>
            <Header />
            <Layout>
                <Content>{children}</Content>
            </Layout>
            <Footer />
        </>
    );
};

export default MainLayout;
