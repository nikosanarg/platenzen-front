import React from 'react';
import { CardRoot, CardLabel, CardValue, CardSub, CardIcon } from './styled';

interface StatsCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, sub, icon }) => {
  return (
    <CardRoot>
      {icon && <CardIcon>{icon}</CardIcon>}
      <CardLabel>{label}</CardLabel>
      <CardValue>{value}</CardValue>
      {sub && <CardSub>{sub}</CardSub>}
    </CardRoot>
  );
};

export default StatsCard;
