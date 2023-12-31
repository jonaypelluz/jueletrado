import React from 'react';
import { Col, Row, Typography } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import ContentConfig from '@config/ContentConfig';
import { CardInfo } from '@models/types';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import './Accentuation.scss';

const { Text, Title } = Typography;

const Accentuation: React.FC = () => {
    const contentConfig = ContentConfig.find((content: CardInfo) => content.id === 'Accentuation');

    return (
        <MainLayout>
            {contentConfig && (
                <Hero
                    image={contentConfig.imgSrc}
                    title={contentConfig.title}
                    subtitle={contentConfig.description}
                />
            )}

            <div className="spelling-wrapper">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Agudas y llanas</Title>
                        <Text>
                            Las palabras agudas llevan tilde si terminan en vocal, &quot;n&quot; o
                            &quot;s&quot;. Las llanas llevan tilde si acaban en una consonante
                            distinta de &quot;n&quot; o &quot;s&quot;.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Esdrújulas y sobresdrújulas.</Title>
                        <Text>
                            Todas las palabras esdrújulas y sobresdrújulas en español llevan tilde,
                            independientemente de la letra en la que terminen.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Los diptongos, triptongos e hiatos</Title>
                        <Text>
                            En los diptongos y triptongos, la tilde se coloca en la vocal abierta
                            (a, e, o). En los hiatos formados por vocales abiertas (a, e, o) se
                            sigue la regla general. Sin embargo, en hiatos formados por
                            &quot;i&quot; o &quot;u&quot; tónicas (acentuadas) y una vocal abierta,
                            la tilde se coloca sobre la &quot;i&quot; o &quot;u&quot; (como en
                            &quot;país&quot; o &quot;día&quot;).
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Palabras compuestas</Title>
                        <Text>
                            En compuestos perfectos (decimoctavo, veintidós), se sigue la regla
                            general de acentuación. En compuestos imperfectos (reloj-despertador,
                            teórico-práctico), cada parte conserva su acento propio. Adverbios en
                            -mente llevan tilde si el adjetivo base lo necesita (buenamente,
                            tímidamente). En verbos compuestos con pronombres átonos (me, te, se),
                            se mantiene la tilde del verbo si la tiene (propón-propónle) o se sigue
                            la regla general (dile, díselo).
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La tilde diacrítica</Title>
                        <Text>
                            La mayoría de monosílabos no llevan tilde, excepto él, mí, tú, sí, dé,
                            sé, té, más, aún como tónicas. En interrogativas y exclamativas, qué,
                            quién, cuál, cómo, dónde, cuándo, cuánto llevan tilde. Demostrativos
                            (este, ese, aquel) llevan tilde como pronombres. &quot;Solo&quot; lleva
                            tilde como adverbio. Tildes se aplican también en mayúsculas.
                        </Text>
                    </Col>
                </Row>
            </div>
        </MainLayout>
    );
};

export default Accentuation;
