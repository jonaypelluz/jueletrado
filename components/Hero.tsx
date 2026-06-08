'use client';

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
    return (
        <div className={`hero ${className ?? ''}`} style={{ ...styles }}>
            {image && (
                <div>
                    {/* next/image is unavailable for export+unoptimized cases of dynamic
                        local paths from /public; using <img> keeps it framework-free. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={title} />
                </div>
            )}
            <div>
                <Title>{title}</Title>
                {subtitle && (
                    <Paragraph>
                        <Text>{subtitle}</Text>
                    </Paragraph>
                )}
                {children}
            </div>
        </div>
    );
};

export default Hero;
