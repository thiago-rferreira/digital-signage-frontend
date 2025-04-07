import Parser from 'rss-parser';
import styles from './noticias.module.css';

export default async function Noticias() {
  const parser = new Parser();
  const feed = await parser.parseURL('https://rss.tecmundo.com.br/feed');

  const noticias = feed.items.slice(0, 15);

  const getImageFromContent = (content) => {
    const match = content?.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  };

  const destaque = noticias[0];
  const secundarias = noticias.slice(1, 4);
  const laterais = noticias.slice(4, 12);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📰 Últimas Notícias - TecMundo</h1>
      <div className={styles.grid}>
        <div className={styles.mainNews}>
          <div className={styles.destaque}>
            {getImageFromContent(destaque.content) && (
              <img
                src={getImageFromContent(destaque.content)}
                alt="Imagem da notícia"
                className={styles.destaqueImg}
              />
            )}
            <div className={styles.destaqueTitulo}>{destaque.title}</div>
            <div className={styles.destaqueData}>
              {destaque.pubDate
                ? new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(destaque.pubDate))
                : 'Data indisponível'}
            </div>
          </div>

          <div className={styles.secundarias}>
            {secundarias.map((item, i) => (
              <div key={i} className={styles.card}>
                {getImageFromContent(item.content) && (
                  <img
                    src={getImageFromContent(item.content)}
                    alt="Imagem da notícia"
                    className={styles.cardImg}
                  />
                )}
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardDate}>
                  {new Date(item.pubDate).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.lateral}>
          {laterais.map((item, i) => (
            <div key={i} className={styles.cardSmall}>
              <div className={styles.cardTitleSmall}>{item.title}</div>
              <div className={styles.cardDateSmall}>
                {new Date(item.pubDate).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
