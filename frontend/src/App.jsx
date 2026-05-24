import { useState, useRef, useEffect, useCallback } from 'react';
import MarketTicker from './components/MarketTicker.jsx';
import ChatMessage from './components/ChatMessage.jsx';
import styles from './App.module.css';

// ── Simulated live price data ──────────────────────────────────────────────
const ASSETS = [
  { sym: 'BTC/USDT', name: 'Bitcoin', base: 67420, chg: 2.34 },
  { sym: 'ETH/USDT', name: 'Ethereum', base: 3521, chg: -1.12 },
  { sym: 'BNB/USDT', name: 'BNB', base: 598, chg: 0.76 },
  { sym: 'SOL/USDT', name: 'Solana', base: 178.4, chg: 4.21 },
  { sym: 'IHSG', name: 'IDX Composite', base: 7124.5, chg: 0.34 },
  { sym: 'XAU/USD', name: 'Gold Spot', base: 2345, chg: 0.82 },
  { sym: 'USD/IDR', name: 'US Dollar', base: 16250, chg: -0.15 },
  { sym: 'BBCA', name: 'Bank BCA', base: 9750, chg: 1.20 },
  { sym: 'NIKEL', name: 'Nickel LME', base: 17840, chg: -0.94 },
];

function fmt(price) {
  if (price >= 10000) return price.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(4);
}

// ── Fake SVG sparkline chart ───────────────────────────────────────────────
function SparklineChart({ bullish }) {
  const points = useRef(
    Array.from({ length: 60 }, (_, i) => ({ x: i, y: 100 + (Math.random() - 0.5) * 40 }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      points.current = [...points.current.slice(1), {
        x: points.current[points.current.length - 1].x + 1,
        y: Math.max(20, Math.min(180, points.current[points.current.length - 1].y + (Math.random() - (bullish ? 0.42 : 0.58)) * 8))
      }];
    }, 800);
    return () => clearInterval(id);
  }, [bullish]);

  const xs = points.current;
  const minY = Math.min(...xs.map(p => p.y));
  const maxY = Math.max(...xs.map(p => p.y));
  const scaleX = i => (i / (xs.length - 1)) * 100;
  const scaleY = y => 100 - ((y - minY) / (maxY - minY || 1)) * 90 - 5;
  const d = xs.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.y)}`).join(' ');
  const area = d + ` L 100 100 L 0 100 Z`;
  const color = bullish ? '#0ecb81' : '#f6465d';

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)" />
      <path d={d} fill="none" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

// ── MarketAI MarketAIGauge ────────────────────────────────────────────────────────
function MarketAIMarketAIGauge({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 60 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';
  const label = pct >= 60 ? 'Bullish' : pct >= 40 ? 'Netral' : 'Bearish';
  return (
    <div className={styles.MarketAItMarketAIGauge}>
      <div className={styles.MarketAIGaugeLabel}>MarketAI Pasar</div>
      <div className={`${styles.MarketAIGaugeRead}`} style={{ color }}>{label}</div>
      <div className={styles.MarketAIGaugeBar}>
        <div className={styles.MarketAIGaugeFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={styles.MarketAIGaugeLabels}>
        <span style={{ color: 'var(--red)', fontSize: 10 }}>Bearish</span>
        <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{pct}</span>
        <span style={{ color: 'var(--green)', fontSize: 10 }}>Bullish</span>
      </div>
    </div >
  );
}

// ── System prompt welcome ──────────────────────────────────────────────────
const WELCOME = {
  role: 'model', MarketAI: 'neutral', timestamp: Date.now(),
  text: `Selamat datang di **MarketAI** 📊

Saya asisten analisis MarketAI pasar keuangan Indonesia. Tanyakan:

📈 MarketAI & kondisi pasar saat ini
🔍 Dampak berita ekonomi ke aset tertentu  
💡 Analisis aset di watchlist kamu
📰 Ringkasan berita & rekomendasi strategi

Klik aset di sidebar atau ketik pertanyaan di bawah!

⚠️ *Bukan saran investasi profesional.*`
};

const QUICK_QUERIES = [
  'MarketAI pasar hari ini?',
  'Outlook BTC minggu ini?',
  'Dampak Fed rate ke IHSG?',
  'Apakah emas safe haven saat ini?',
  'Analisis saham BBCA',
];

const SAMPLE_HEADLINES = [
  'Fed tahan suku bunga, sinyal cut akhir 2025',
  'China GDP Q2 di bawah ekspektasi analis',
  'Nikel LME naik 3% pasca kebijakan ekspor RI',
  'Bitcoin ETF AS catat inflow $500 juta sehari',
  'Inflasi RI Mei turun ke 2.4%, terendah 3 tahun',
];

const TIME_FRAMES = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'];

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [watchlist, setWatchlist] = useState(['BTC/USDT', 'ETH/USDT', 'IHSG', 'XAU/USD', 'BBCA']);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [livePrice, setLivePrice] = useState(() => ASSETS[0].base);
  const [MarketAIScore, setMarketAIScore] = useState(62);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [activeTF, setActiveTF] = useState('1H');
  const [addInput, setAddInput] = useState('');
  const [headline, setHeadline] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Simulate live price
  useEffect(() => {
    setLivePrice(selectedAsset.base * (1 + (Math.random() - 0.5) * 0.005));
    const t = setInterval(() => {
      setLivePrice(p => Math.max(0, p * (1 + (Math.random() - 0.5) * 0.003)));
    }, 1200);
    return () => clearInterval(t);
  }, [selectedAsset]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function buildHistory() {
    return messages
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(({ role, text }) => ({ role, text }));
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text, timestamp: Date.now() };
    const history = [...buildHistory(), { role: 'user', text }];

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const tid = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'model', text: '', timestamp: tid, isThinking: true }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: history, watchlist })
      });
      const data = await res.json();
      const score = data.MarketAI === 'bullish' ? 65 + Math.random() * 20
        : data.MarketAI === 'bearish' ? 20 + Math.random() * 20
          : 40 + Math.random() * 20;
      setMarketAIScore(Math.round(score));
      setMessages(prev => prev.map(m =>
        m.timestamp === tid
          ? { role: 'model', text: data.text || 'Maaf, tidak ada respons.', MarketAI: data.MarketAI, timestamp: Date.now() }
          : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.timestamp === tid
          ? { role: 'model', text: '❌ Gagal terhubung ke server. Pastikan backend berjalan di port 3000.', MarketAI: null, timestamp: Date.now() }
          : m
      ));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, messages, watchlist]);

  async function analyzeHeadline() {
    if (!headline.trim()) return;
    setAnalyzing(true);
    setAnalysisResult('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, watchlist })
      });
      const data = await res.json();
      setAnalysisResult(data.text);
    } catch {
      setAnalysisResult('Gagal terhubung ke server.');
    } finally {
      setAnalyzing(false);
    }
  }

  function addToWatchlist(sym) {
    if (sym && !watchlist.includes(sym)) {
      setWatchlist(prev => [...prev, sym]);
    }
    setAddInput('');
  }

  const priceUp = livePrice >= selectedAsset.base;
  const priceChg = ((livePrice - selectedAsset.base) / selectedAsset.base * 100);

  return (
    <div className={styles.shell}>

      {/* ── Top Nav ── */}
      <nav className={styles.topNav}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>S</div>
          <div>
            <div className={styles.logoText}>MarketAI</div>
            <div className={styles.logoSub}>MARKET MarketAI</div>
          </div>
        </div>

        <div className={styles.navLinks}>
          {['Dashboard', 'Pasar', 'Watchlist', 'Berita', 'Analisis'].map(n => (
            <button key={n} className={`${styles.navLink} ${n === 'Dashboard' ? styles.navLinkActive : ''}`}>{n}</button>
          ))}
        </div>

        <div className={styles.navRight}>
          <div className={styles.connStatus}>
            <span className={styles.connDot} />
            <span className={styles.connText}>GEMINI LIVE</span>
          </div>
        </div>
      </nav>

      {/* ── Ticker ── */}
      <MarketTicker />

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* ── Left Sidebar ── */}
        <aside className={styles.leftSidebar}>
          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>Watchlist</div>
            <ul className={styles.assetList}>
              {watchlist.map(sym => {
                const a = ASSETS.find(x => x.sym === sym);
                if (!a) return (
                  <li key={sym} className={`${styles.assetItem} ${selectedAsset.sym === sym ? styles.assetItemActive : ''}`}
                    onClick={() => { }}>
                    <span className={styles.assetName}>{sym}</span>
                    <span className={styles.up}>—</span>
                  </li>
                );
                return (
                  <li key={sym}
                    className={`${styles.assetItem} ${selectedAsset.sym === sym ? styles.assetItemActive : ''}`}
                    onClick={() => setSelectedAsset(a)}>
                    <span className={styles.assetName}>{sym}</span>
                    <span className={a.chg >= 0 ? styles.up : styles.down}>
                      {a.chg >= 0 ? '+' : ''}{a.chg.toFixed(2)}%
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className={styles.addAssetRow}>
              <input
                className={styles.addAssetInput}
                value={addInput}
                onChange={e => setAddInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && addToWatchlist(addInput)}
                placeholder="+ Tambah aset"
              />
              <button className={styles.addAssetBtn} onClick={() => addToWatchlist(addInput)}>+</button>
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>Tanya Cepat</div>
            <div className={styles.quickQueries}>
              {QUICK_QUERIES.map(q => (
                <button key={q} className={styles.quickBtn}
                  onClick={() => { setActiveTab('chat'); sendMessage(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center ── */}
        <div className={styles.center}>

          {/* Asset header */}
          <div className={styles.assetHeader}>
            <div className={styles.assetTitle}>
              <div className={styles.assetSymbol}>{selectedAsset.sym}</div>
              <div className={styles.assetFullName}>{selectedAsset.name}</div>
            </div>
            <div className={`${styles.assetPrice} ${priceUp ? styles.priceUp : styles.priceDown}`}>
              {fmt(livePrice)}
            </div>
            <div className={`${priceUp ? styles.up : styles.down}`} style={{ fontSize: 13, fontFamily: 'var(--font-mono)', marginLeft: 4 }}>
              {priceChg >= 0 ? '+' : ''}{priceChg.toFixed(2)}%
            </div>
            <div className={styles.assetStats}>
              {[
                { label: '24h Vol', val: '2.34B' },
                { label: '24h High', val: fmt(selectedAsset.base * 1.022) },
                { label: '24h Low', val: fmt(selectedAsset.base * 0.978) },
                { label: 'Dominasi', val: '52.4%' },
              ].map(s => (
                <div key={s.label} className={styles.statItem}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab row */}
          <div className={styles.tabRow}>
            {['chat', 'news'].map(t => (
              <button key={t} className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}>
                {t === 'chat' ? '💬 AI Chat' : '⚡ Analisis Berita'}
              </button>
            ))}
            <div className={styles.tabSpacer} />
            <button className={styles.resetBtn} onClick={() => setMessages([WELCOME])}>Reset Chat</button>
          </div>

          {/* Chart */}
          <div className={styles.chartArea}>
            <SparklineChart bullish={priceUp} />
            <div className={styles.chartOverlay}>
              {TIME_FRAMES.map(tf => (
                <button key={tf}
                  className={`${styles.chartBtn} ${activeTF === tf ? styles.chartBtnActive : ''}`}
                  onClick={() => setActiveTF(tf)}>{tf}</button>
              ))}
            </div>
          </div>

          {/* Main row: chat + right panel */}
          <div className={styles.mainRow}>
            <div className={styles.chatPanel}>
              {activeTab === 'chat' && (
                <>
                  <div className={styles.chatMessages}>
                    {messages.map((m, i) => <ChatMessage key={i} {...m} />)}
                    <div ref={chatEndRef} />
                  </div>
                  <div className={styles.chatInputRow}>
                    <input
                      ref={inputRef}
                      className={styles.chatInput}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                      placeholder={`Tanyakan MarketAI ${selectedAsset.sym}, berita ekonomi, atau strategi...`}
                      disabled={loading}
                      autoFocus
                    />
                    <button className={styles.sendBtn}
                      onClick={() => sendMessage(input)}
                      disabled={loading || !input.trim()}>
                      {loading ? '...' : 'Kirim'}
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'news' && (
                <div className={styles.chatMessages}>
                  <div style={{ maxWidth: 600 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                      Paste judul berita ekonomi untuk mendapatkan analisis MarketAI instan terhadap aset watchlist kamu.
                    </p>
                    <div className={styles.newsForm}>
                      <textarea
                        className={styles.newsTextarea}
                        rows={3}
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder="Contoh: Fed tahan suku bunga, sinyal pemangkasan Q4 2025..."
                      />
                      <button className={styles.analyzeBtn}
                        onClick={analyzeHeadline}
                        disabled={analyzing || !headline.trim()}>
                        {analyzing ? 'Menganalisis...' : '⚡ Analisis MarketAI'}
                      </button>
                    </div>
                    {analysisResult && (
                      <pre className={styles.analysisResult}>{analysisResult}</pre>
                    )}
                    <div style={{ marginTop: 20 }}>
                      <p className={styles.sampleNewsTitle}>Contoh berita populer:</p>
                      <div className={styles.sampleNews}>
                        {SAMPLE_HEADLINES.map(h => (
                          <button key={h} className={styles.sampleNewsBtn} onClick={() => setHeadline(h)}>{h}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right panel — order-book / MarketAI style */}
            <aside className={styles.rightPanel}>
              <div className={styles.rpHeader}>
                <span className={styles.rpTitle}>Analisis AI</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>LIVE</span>
              </div>

              <MarketAIMarketAIGauge score={MarketAIScore} />

              <div className={styles.newsSection}>
                <div className={styles.newsTitle}>Analisis Cepat</div>
                <div className={styles.newsForm} style={{ marginBottom: 10 }}>
                  <textarea
                    className={styles.newsTextarea}
                    rows={2}
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="Masukkan berita..."
                  />
                  <button className={styles.analyzeBtn} onClick={analyzeHeadline} disabled={analyzing || !headline.trim()}>
                    {analyzing ? '...' : '⚡ Analisis'}
                  </button>
                </div>
                {analysisResult && <pre className={styles.analysisResult}>{analysisResult}</pre>}

                <div style={{ marginTop: 12 }}>
                  <div className={styles.sampleNewsTitle}>Berita terkini (simulasi)</div>
                  <div className={styles.sampleNews}>
                    {SAMPLE_HEADLINES.map(h => (
                      <button key={h} className={styles.sampleNewsBtn}
                        onClick={() => { setHeadline(h); setActiveTab('chat'); sendMessage(`Analisis dampak berita ini: "${h}"`); }}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
