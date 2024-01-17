import React from 'react';
import { Col, Row, Typography } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { createContentConfig } from '@hooks/useContentConfig';
import { useWordsContext } from '@store/WordsContext';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import './Orthography.scss';

const { Text, Title } = Typography;

const Orthography: React.FC = () => {
    const { locale } = useWordsContext();
    const ContentConfig = createContentConfig(locale, 'orthography');

    return (
        <MainLayout>
            {ContentConfig && (
                <Hero
                    image={ContentConfig.imgSrc}
                    title={ContentConfig.title}
                    subtitle={ContentConfig.description}
                />
            )}
            <div className="orthography-wrapper">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Las mayúsculas</Title>
                        <Text>
                            Se usa mayúscula en: inicio de un escrito y tras punto, nombres propios,
                            atributos divinos (Altísimo, Creador), títulos y dignidades (Sumo
                            Pontífice, Duque de Olivares), sobrenombres/apodos (Isabel la Católica),
                            tratamientos en abreviatura, y en nombres/adjetivos de instituciones o
                            corporaciones. Solo la primera letra de títulos de obras literarias y
                            películas.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La B</Title>
                        <Text>
                            Se usa &quot;b&quot; antes de otra consonante, en verbos terminados en
                            -bir (excepto hervir, servir, vivir), terminaciones -ba, -bas, -bais,
                            -ban, palabras que comienzan con bibl-, bu-, bur-, bus-, y en palabras
                            con prefijos bi-, bis- (dos veces), bene- (bien), bio- (vida). Además,
                            se escribe con &quot;b&quot; en compuestos y derivados de palabras que
                            ya llevan esta letra.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La V</Title>
                        <Text>
                            Se usa &quot;v&quot; después de la sílaba -ad, en adjetivos llanos
                            terminados en -ava, -avo, -eva, -evo, -ivo, -iva, -ave, en formas
                            verbales de verbos sin b ni v en infinitivo (excepto pretérito
                            imperfecto de indicativo), en palabras con prefijos vice- y villa-, en
                            palabras terminadas en -ívoro, -ívora (excepto víbora), y en compuestos
                            y derivados de palabras que ya incluyen esta letra.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La H</Title>
                        <Text>
                            Los prefijos con &quot;H&quot;: Palabras con prefijos como hidr- (agua),
                            hiper- (exceso), hipo- (bajo), etc., llevan &quot;h&quot;. &quot;H&quot;
                            Histórica: Algunas palabras llevan &quot;h&quot; al inicio por
                            tradición, aunque no tiene sonido en español moderno, como
                            &quot;hola&quot;. Los derivados y compuestos: Si la palabra original
                            tiene &quot;h&quot;, sus derivados también la mantienen, como en
                            &quot;desheredar&quot;. Las excepciones en derivados: Algunos derivados
                            de palabras con &quot;h&quot; pueden perderla, como &quot;osamenta&quot;
                            (de &quot;hueso&quot;).
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La G</Title>
                        <Text>
                            Se usa diéresis en &quot;gue&quot;, &quot;gui&quot; para pronunciar
                            todos los sonidos. Palabras que empiezan con geo- y verbos terminados en
                            -ger, -gir (excepto tejer y crujir) se escriben con &quot;g&quot;. Casi
                            todas las palabras que empiezan y terminan en &quot;gen&quot; también
                            llevan &quot;g&quot;, al igual que los compuestos y derivados de
                            palabras con esta letra.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La J</Title>
                        <Text>
                            Se utiliza &quot;j&quot; en palabras que terminan en -aje, -eje, -jería,
                            excepto &quot;ambages&quot; (sin rodeos). También en formas verbales de
                            verbos que no tienen &quot;g&quot; ni &quot;j&quot; en infinitivo, y en
                            compuestos y derivados de palabras que ya contienen la letra
                            &quot;j&quot;.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La S y la X</Title>
                        <Text>
                            Se utiliza &quot;x&quot; en palabras con los prefijos &quot;ex&quot; y
                            &quot;extra&quot;.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La Y y la LL</Title>
                        <Text>
                            Se usa &quot;y&quot; al final de palabras inacentuadas que terminan en
                            diptongo o triptongo; si están acentuadas, se escribe con &quot;í&quot;.
                            La conjunción &quot;y&quot; se escribe siempre así. Las terminaciones
                            illo, illa, illos, illas se escriben con &quot;ll&quot;. En formas
                            verbales cuyo infinitivo no contiene &quot;ll&quot; ni &quot;y&quot;, se
                            usa &quot;y&quot;.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La R y RR</Title>
                        <Text>
                            El sonido fuerte de la &quot;erre&quot; se escribe &quot;rr&quot; en el
                            interior de palabras entre vocales. El sonido simple de la &quot;r&quot;
                            se usa al principio de palabras o en el interior tras las consonantes
                            &quot;l&quot;, &quot;n&quot;, &quot;s&quot;, pero no entre vocales.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La M</Title>
                        <Text>
                            Se utiliza la letra &quot;m&quot; antes de las consonantes &quot;b&quot;
                            y &quot;p&quot;.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La D y Z finales</Title>
                        <Text>
                            Se usa &quot;d&quot; en palabras cuyo plural es en -des, y &quot;z&quot;
                            en palabras que forman el plural en -ces.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La C</Title>
                        <Text>
                            Se utiliza &quot;c&quot; antes de las vocales &quot;e&quot; e
                            &quot;i&quot; para el sonido suave (ejemplo: &quot;cereza&quot;,
                            &quot;cita&quot;). Ante las vocales &quot;a&quot;, &quot;o&quot;,
                            &quot;u&quot;, se usa &quot;c&quot; para el sonido fuerte (ejemplo:
                            &quot;casa&quot;, &quot;coco&quot;). En palabras de familia léxica que
                            incluyen un sonido suave ante &quot;a&quot;, &quot;o&quot;,
                            &quot;u&quot;, se usa &quot;z&quot; o &quot;ce/ci&quot; (ejemplo:
                            &quot;cazar&quot; y &quot;cacería&quot;).
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La Q</Title>
                        <Text>
                            Se utiliza &quot;q&quot; seguida de &quot;u&quot; para el sonido fuerte
                            ante &quot;e&quot; e &quot;i&quot; (ejemplo: &quot;que&quot;,
                            &quot;quien&quot;). La combinación &quot;qu&quot; se mantiene constante
                            incluso cuando el sonido podría representarse con &quot;k&quot;
                            (ejemplo: &quot;química&quot;).
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La Z</Title>
                        <Text>
                            Se usa &quot;z&quot; al final de palabras que al pluralizarse cambian a
                            &quot;ces&quot; (ejemplo: &quot;luz&quot;, &quot;luces&quot;).
                            Generalmente, se utiliza &quot;z&quot; antes de &quot;a&quot;,
                            &quot;o&quot;, &quot;u&quot; para el sonido suave (ejemplo:
                            &quot;zona&quot;).
                        </Text>
                    </Col>
                </Row>
            </div>
        </MainLayout>
    );
};

export default Orthography;
