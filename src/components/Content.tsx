import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row } from 'antd';
import ContentConfig from '@config/ContentConfig';
import { CardInfo } from '@models/types';

const { Meta } = Card;

const ContentList: React.FC = () => {
    return (
        <>
            {ContentConfig.map((content: CardInfo, index: number) => (
                <Col key={index} xs={12} sm={8} md={8} lg={6}>
                    <Link to={content.link}>
                        <Card hoverable cover={<img alt={content.title} src={content.imgSrc} />}>
                            <Meta title={content.title} description={content.subtitle} />
                        </Card>
                    </Link>
                </Col>
            ))}
        </>
    );
};

const Content: React.FC = () => {
    return (
        <div className="content-wrapper">
            <Row gutter={[16, 16]}>
                <ContentList />
            </Row>
        </div>
    );
};

export default Content;
