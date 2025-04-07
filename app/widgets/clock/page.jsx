'use client';

import { useEffect, useState } from 'react';
import styles from './clock.module.css';

export default function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR'));
    };
    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.clock}>{time}</h1>
    </div>
  );
}
