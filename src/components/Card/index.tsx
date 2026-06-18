import React from 'react';

interface CardProps {
  className?: string;
  id?: string;
}

const Card = ({
  children,
  className = '',
  id,
}: React.PropsWithChildren<CardProps>) => (
  <div
    id={id}
    className={`rounded-xl bg-(--color-activity-card) p-5 ${className}`}
    style={{ boxShadow: '0 2px 8px var(--color-card-shadow)' }}
  >
    {children}
  </div>
);

export default Card;
