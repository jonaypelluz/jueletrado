import React from 'react';
import { Typography } from 'antd';
import './Hero.scss';

const { Title, Paragraph, Text } = Typography;

interface HeroProps {
    title: string;
    subtitle?: string;
    image?: string;
    styles?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, image, styles, className, children }) => {
    const subtitleStyles = {};

    return (
        <div className={`hero ${className}`} style={{ ...styles }}>
            {image && (
                <div>
                    <img src={image} alt={title} />
                </div>
            )}
            <div>
                <Title>{title}</Title>
                {subtitle && (
                    <Paragraph style={subtitleStyles}>
                        <Text>{subtitle}</Text>
                    </Paragraph>
                )}
                {children && <>{children}</>}
            </div>
        </div>
    );
};

export default Hero;
