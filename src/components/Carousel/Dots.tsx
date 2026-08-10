import React from 'react';
import { DotsContainer, DotSpan } from './styled';

interface CarouselDotsProps {
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

export const CarouselDots: React.FC<CarouselDotsProps> = ({ count, currentIndex, onSelect }) => (
  <DotsContainer>
    {Array.from({ length: count }, (_, index) => (
      <DotSpan
        key={index}
        $isActive={index === currentIndex}
        onClick={() => onSelect(index)}
      />
    ))}
  </DotsContainer>
);
