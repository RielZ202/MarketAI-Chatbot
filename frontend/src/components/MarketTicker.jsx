import { useState, useEffect } from 'react';
import styles from './MarketTicker.module.css';

const BASE = {
  'BTC/USDT':  { price: 67420,  unit: 'USDT' },
  'ETH/USDT':  { price: 3521,   unit: 'USDT' },
  'BNB/USDT':  { price: 598,    unit: 'USDT' },
  'SOL/USDT':  { price: 178,    unit: 'USDT' },
  'DOGE/USDT': { price: 0.162,  unit: 'USDT' },
  'IHSG':      { price: 7124.5, unit: 'IDR' },
  'XAU/USD':   { price: 2345,   unit: 'USD' },
  'USD/IDR':   { price: 16250,  unit: 'IDR' },
  'NIKEL':     { price: 17840,  unit: 'USD' },
  'BBCA':      { price: 9750,   unit: 'IDR' },
  'BBRI':      { price: 4820,   unit: 'IDR' },
  'GOTO':      { price: 71,     unit: 'IDR' },
};

function fmt(price) {
  if (price >= 10000) return price.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  if (price >= 1)     return price.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  return price.toFixed(4);
}

export default function MarketTicker() {
  const [items, setItems] = useState(() =>
    Object.entries(BASE).map(([sym, d]) => ({
      sym, price: d.price,
      chg: (Math.random() - 0.45) * 3,
    }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setItems(prev => prev.map(item => {
        const newPrice = item.price * (1 + (Math.random() - 0.5) * 0.003);
        const chg = ((newPrice - BASE[item.sym].price) / BASE[item.sym].price) * 100;
        return { ...item, price: newPrice, chg };
      }));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className={styles.ticker}>
      <div className={styles.liveBadge}>
        <span className={styles.dot} />
        LIVE
      </div>
      <div className={styles.track}>
        <div className={styles.marquee}>
          {doubled.map((item, i) => (
            <div key={i} className={styles.item}>
              <span className={styles.sym}>{item.sym}</span>
              <span className={styles.price}>{fmt(item.price)}</span>
              <span className={item.chg >= 0 ? styles.up : styles.down}>
                {item.chg >= 0 ? '+' : ''}{item.chg.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
