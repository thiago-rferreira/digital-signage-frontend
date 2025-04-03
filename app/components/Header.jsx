import Link from 'next/link';
import { Home, Info, Settings } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>Digital Signage</h1>
      <nav>
        <ul className={styles.navList}>
          <li>
            <Link href="/" className={styles.navItem}>
              <Home size={20} /> Início
            </Link>
          </li>
          <li>
            <Link href="/sobre" className={styles.navItem}>
              <Info size={20} /> Sobre
            </Link>
          </li>
          <li>
            <Link href="/configuracoes" className={styles.navItem}>
              <Settings size={20} /> Configurações
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
