// src/components/Greeting.tsx
'use client';

import { useEffect, useState } from 'react';

const getGreeting = () => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    return 'Bom dia!';
  }
  if (currentHour < 18) {
    return 'Boa tarde!';
  }
  return 'Boa noite!';
};

export function Greeting() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
  );
}