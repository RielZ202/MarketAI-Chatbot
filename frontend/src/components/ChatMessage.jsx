import styles from './ChatMessage.module.css';

function Badge({ MarketAI }) {
  if (!MarketAI || MarketAI === 'neutral') return <span className={`${styles.badge} ${styles.neutral}`}>⚖️ NETRAL</span>;
  if (MarketAI === 'bullish') return <span className={`${styles.badge} ${styles.bullish}`}>📈 BULLISH</span>;
  if (MarketAI === 'bearish') return <span className={`${styles.badge} ${styles.bearish}`}>📉 BEARISH</span>;
  return null;
}

function formatText(str) {
  return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function ChatMessage({ role, text, MarketAI, timestamp, isThinking }) {
  const isUser = role === 'user';

  if (isThinking) {
    return (
      <div className={`${styles.row} ${styles.botRow}`}>
        <div className={`${styles.avatar} ${styles.botAvatar}`}>AI</div>
        <div className={`${styles.bubble} ${styles.botBubble} ${styles.thinking}`}>
          <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.botRow}`}>
      <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.botAvatar}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        {!isUser && <Badge MarketAI={MarketAI} />}
        <div className={styles.text} dangerouslySetInnerHTML={{ __html: formatText(text) }} />
        <div className={styles.meta}>
          <span className={styles.time}>
            {new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
