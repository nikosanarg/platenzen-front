'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Root, Photo, Content, Code, Title, Text, HomeLink } from './styled';

const NotFound: React.FC = () => (
  <Root>
    <Photo>
      <Image
        src="/assets/site/404/road-not-found.jpg"
        alt="Un sendero de montaña con un cartel amarillo que prohíbe el paso a corredores"
        fill
        priority
        sizes="100vw"
      />
    </Photo>
    <Content>
      <Code>404</Code>
      <Title>Este camino no existe</Title>
      <Text>La página que buscás no está en Platenzen.</Text>
      <HomeLink as={Link} href="/">Volver al inicio</HomeLink>
    </Content>
  </Root>
);

export default NotFound;
