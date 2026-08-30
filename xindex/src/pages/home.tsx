import { useEffect, useState, useRef, type PointerEvent as ReactPointerEvent } from "react";

const BASKETS = {
  ai7: {
    symbol: "$AI7",
    name: "AI Compute Basket",
    price: 245.0,
    holdings: [
      { name: "NVIDIA", ticker: "NVDA", weight: 35 },
      { name: "Broadcom", ticker: "AVGO", weight: 25 },
      { name: "TSMC", ticker: "TSM", weight: 25 },
      { name: "AMD", ticker: "AMD", weight: 15 }
    ],
    exposureText: "4 Stocks (NVDA, AVGO, TSM, AMD)",
    stabilityText: "+42% Stability vs Solo NVDA"
  },
  mag7: {
    symbol: "$MAG7",
    name: "Magnificent Seven",
    price: 380.0,
    holdings: [
      { name: "Apple", ticker: "AAPL", weight: 14.3 },
      { name: "Microsoft", ticker: "MSFT", weight: 14.3 },
      { name: "Alphabet", ticker: "GOOGL", weight: 14.3 },
      { name: "Amazon", ticker: "AMZN", weight: 14.3 },
      { name: "NVIDIA", ticker: "NVDA", weight: 14.3 },
      { name: "Meta", ticker: "META", weight: 14.3 },
      { name: "Tesla", ticker: "TSLA", weight: 14.2 }
    ],
    exposureText: "7 Mega-Caps (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA)",
    stabilityText: "+58% Stability vs Solo TSLA"
  },
  gold: {
    symbol: "$GOLD",
    name: "Gold-Linked Basket",
    price: 95.0,
    holdings: [
      { name: "Robinhood Gold-Linked Contract", ticker: "RH-GOLD", weight: 100 }
    ],
    exposureText: "Verified gold-linked Robinhood contract",
    stabilityText: "Non-Correlated Macro Hedge"
  }
};

const STOCK_LOGOS: Record<string, string> = {
  NVDA: "/assets/stock-logos/nvidia.svg",
  AVGO: "/assets/stock-logos/broadcom.svg",
  TSM: "/assets/stock-logos/tsmc.svg",
  AMD: "/assets/stock-logos/amd.svg",
  AAPL: "/assets/stock-logos/apple.svg",
  GOOGL: "/assets/stock-logos/google.svg",
  META: "/assets/stock-logos/meta.svg",
  TSLA: "/assets/stock-logos/tesla.svg"
};

type BasketKey = keyof typeof BASKETS;
type Mode = "mint" | "redeem";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [activeBasketPill, setActiveBasketPill] = useState<BasketKey>("ai7");
  const [currentMode, setCurrentMode] = useState<Mode>("mint");
  const [selectedBasketKey, setSelectedBasketKey] = useState<BasketKey>("ai7");
  const [terminalInputAmount, setTerminalInputAmount] = useState("1000");
  const [simBasketKey, setSimBasketKey] = useState<BasketKey>("ai7");
  const [activeFaqIndex, setActiveFaqIndex] = useState<number>(0);
  
  const [actionStatus, setActionStatus] = useState<"idle" | "processing" | "success">("idle");
  
  const [statsCounters, setStatsCounters] = useState({
    stat1: 0,
    stat2: 0,
    stat3: 0,
    stat4: 0
  });
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const hasAnimatedStats = useRef(false);
  const basketsTrackRef = useRef<HTMLDivElement>(null);
  const basketDragState = useRef({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    active: false
  });
  const [isDraggingBaskets, setIsDraggingBaskets] = useState(false);

  // Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      const sections = document.querySelectorAll("section[id]");
      let current = "";
      
      sections.forEach((section) => {
        const htmlSection = section as HTMLElement;
        const sectionTop = htmlSection.offsetTop;
        const sectionHeight = htmlSection.offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          current = htmlSection.getAttribute("id") || "";
        }
      });
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  // Stats Animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedStats.current) {
          hasAnimatedStats.current = true;
          
          const duration = 1200;
          const startTime = performance.now();
          
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            
            setStatsCounters({
              stat1: ease * 1,
              stat2: ease * 100,
              stat3: ease * 3,
              stat4: ease * 0.1
            });
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setStatsCounters({ stat1: 1, stat2: 100, stat3: 3, stat4: 0.1 });
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );
    
    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }
    
    return () => {
      if (statsSectionRef.current) {
        observer.unobserve(statsSectionRef.current);
      }
    };
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);
  
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobileMenuOpen]);

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(activeFaqIndex === index ? -1 : index);
  };

  const handleBasketSelect = (key: BasketKey) => {
    setActiveBasketPill(key);
    
    const card = document.getElementById(`basket-card-${key}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const scrollBasketTrack = (direction: -1 | 1) => {
    const track = basketsTrackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.78, 320),
      behavior: "smooth"
    });
  };

  const handleBasketPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const track = basketsTrackRef.current;
    if (!track) return;

    basketDragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: track.scrollLeft,
      active: true
    };
    track.setPointerCapture(event.pointerId);
    setIsDraggingBaskets(true);
  };

  const handleBasketPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = basketsTrackRef.current;
    const drag = basketDragState.current;
    if (!track || !drag.active || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    track.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX) * 1.12;
  };

  const endBasketDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = basketsTrackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    basketDragState.current.active = false;
    setIsDraggingBaskets(false);
  };

  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
    if (mode === "mint") {
      setTerminalInputAmount("1000");
    } else {
      setTerminalInputAmount("4.08");
    }
  };

  const handleQuickMint = (key: BasketKey) => {
    setSelectedBasketKey(key);
    handleModeChange("mint");
    document.getElementById("vault-terminal")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAction = () => {
    window.location.href = `${import.meta.env.BASE_URL}app?basket=${selectedBasketKey}&mode=${currentMode}`;
  };

  const activeTerminalBasket = BASKETS[selectedBasketKey];
  const rawInputVal = parseFloat(terminalInputAmount) || 0;
  
  let terminalReceiveAmount = "";
  let feeCalcText = "";
  let actionBtnText = "";
  let netUSDG = 0;
  
  if (currentMode === "mint") {
    const fee = rawInputVal * 0.001;
    netUSDG = Math.max(0, rawInputVal - fee);
    const basketUnits = netUSDG / activeTerminalBasket.price;
    terminalReceiveAmount = basketUnits > 0 ? basketUnits.toFixed(4) : "0.0000";
    feeCalcText = `${fee.toFixed(2)} USDG → Protocol Fee Engine`;
    actionBtnText = `Deposit ${rawInputVal.toLocaleString()} USDG & Mint ${activeTerminalBasket.symbol}`;
  } else {
    const grossUSDG = rawInputVal * activeTerminalBasket.price;
    const fee = grossUSDG * 0.001;
    netUSDG = Math.max(0, grossUSDG - fee);
    terminalReceiveAmount = netUSDG > 0 ? `${netUSDG.toFixed(2)} USDG` : "0.00 USDG";
    feeCalcText = `${fee.toFixed(2)} USDG → Protocol Fee Engine`;
    actionBtnText = `Redeem ${rawInputVal} ${activeTerminalBasket.symbol} → ${netUSDG.toFixed(2)} USDG`;
  }

  return (
    <>
      <header className="header-sticky" id="main-header">
        <div className="header-inner">
          <a href="#top" className="logo-btn" aria-label="Xindex Home">
            <img src="/assets/xindex-logo.png" alt="Xindex Logo" width={44} height={44} className="logo-img" />
          </a>

          <nav className="nav-pill" id="desktop-nav" aria-label="Main Navigation">
            <a href="#why-xindex" className={`nav-link ${activeSection === 'why-xindex' ? 'active' : ''}`}>Why Baskets</a>
            <a href="#baskets" className={`nav-link ${activeSection === 'baskets' ? 'active' : ''}`}>3 Baskets</a>
            <a href="#vault-terminal" className={`nav-link ${activeSection === 'vault-terminal' ? 'active' : ''}`}>Mint &amp; Redeem</a>
            <a href="#pairing-engine" className={`nav-link ${activeSection === 'pairing-engine' ? 'active' : ''}`}>Pairing</a>
            <a href="#tokenomics" className={`nav-link ${activeSection === 'tokenomics' ? 'active' : ''}`}>Fee Engine</a>
            <a href="#architecture" className={`nav-link ${activeSection === 'architecture' ? 'active' : ''}`}>Security</a>
          </nav>

          <div className="header-actions">
            <a href={`${import.meta.env.BASE_URL}app`} className="btn-signin btn-signin-desktop">
              <span className="btn-dot"></span> Open Protocol App
            </a>
          </div>

          <button 
            className="burger-btn" 
            aria-label="Toggle menu" 
            aria-expanded={isMobileMenuOpen} 
            aria-controls="mobile-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="burger-bar"></span>
            <span className="burger-bar"></span>
            <span className="burger-bar"></span>
          </button>
        </div>
      </header>

      <div className="mobile-overlay" aria-hidden={!isMobileMenuOpen} hidden={!isMobileMenuOpen} onClick={closeMobileMenu}></div>
      <div className="mobile-menu" aria-hidden={!isMobileMenuOpen} hidden={!isMobileMenuOpen}>
        <nav className="mobile-nav-links" aria-label="Mobile Navigation">
          <a href="#why-xindex" className={`mobile-nav-link ${activeSection === 'why-xindex' ? 'active' : ''}`} onClick={closeMobileMenu}>Why Baskets (Problem &amp; Solution)</a>
          <a href="#baskets" className={`mobile-nav-link ${activeSection === 'baskets' ? 'active' : ''}`} onClick={closeMobileMenu}>3 Core Baskets</a>
          <a href="#vault-terminal" className={`mobile-nav-link ${activeSection === 'vault-terminal' ? 'active' : ''}`} onClick={closeMobileMenu}>Deposit USDG &amp; Mint Terminal</a>
          <a href="#pairing-engine" className={`mobile-nav-link ${activeSection === 'pairing-engine' ? 'active' : ''}`} onClick={closeMobileMenu}>Hold, Trade &amp; Pair</a>
          <a href="#tokenomics" className={`mobile-nav-link ${activeSection === 'tokenomics' ? 'active' : ''}`} onClick={closeMobileMenu}>Token = Fee Engine</a>
          <a href="#architecture" className={`mobile-nav-link ${activeSection === 'architecture' ? 'active' : ''}`} onClick={closeMobileMenu}>Official Robinhood Contracts</a>
          <a href="#faq" className={`mobile-nav-link ${activeSection === 'faq' ? 'active' : ''}`} onClick={closeMobileMenu}>FAQ</a>
        </nav>
          <a href={`${import.meta.env.BASE_URL}app`} className="btn-signin btn-signin-mobile" onClick={closeMobileMenu}>Open Protocol App</a>
      </div>

      <div className="content-wrapper">
        <section className="section-hero" id="home">
          <div className="hero-background" aria-hidden="true">
            <div className="bg-ambient-mesh">
              <div className="ambient-glow glow-1"></div>
              <div className="ambient-glow glow-2"></div>
              <div className="ambient-glow glow-3"></div>
            </div>
            <video className="bg-video" autoPlay muted loop playsInline preload="auto" poster="/assets/video-poster.jpg">
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
                type="video/mp4"
              />
            </video>
            <div className="bg-overlay-gradient"></div>
          </div>
          <div className="hero-container">
            <a href="#architecture" className="trust-row anim" style={{ '--d': '0.05s' } as React.CSSProperties} title="Built around canonical Robinhood Stock Token contracts">
              <div className="trust-avatars">
                <div className="trust-avatar trust-avatar-1" title="NVIDIA (NVDA)">
                  <div className="trust-inner-circle"><i className="fa-brands fa-microsoft" aria-hidden="true"></i></div>
                </div>
                <div className="trust-avatar trust-avatar-2" title="Amazon (AMZN)">
                  <div className="trust-inner-circle"><i className="fa-brands fa-amazon" aria-hidden="true"></i></div>
                </div>
                <div className="trust-avatar trust-avatar-3" title="Google (GOOGL)">
                  <div className="trust-inner-circle"><i className="fa-brands fa-google" aria-hidden="true"></i></div>
                </div>
              </div>
              <div className="trust-pill">
                <span className="trust-text">Canonical Robinhood Stock Token Contracts</span>
              </div>
            </a>

            <h1 className="headline anim">
              <span className="headline-line headline-line-1">Tokenized Baskets</span>
              <span className="headline-line headline-line-2">Hold &amp; Pair As One</span>
            </h1>

            <p className="subhead anim" style={{ '--d': '0.22s' } as React.CSSProperties}>
              Access several tokenized stocks through one liquid basket—not a wallet full of separate tickers. Deposit <strong>USDG</strong> and receive one basket token built to hold, trade, and pair. Example: <strong>$AI7</strong> brings NVDA, AVGO, TSM, and AMD together in one position. <strong>One basket. One sale. Done.</strong>
            </p>

            <div className="cta-wrapper anim" style={{ '--d': '0.35s' } as React.CSSProperties}>
              <a href={`${import.meta.env.BASE_URL}app`} className="btn-cta">
                <span>Open the Protocol App</span>
                <svg className="cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a href="/whitepaper/xindex-whitepaper.pdf" className="btn-cta-secondary" target="_blank" rel="noreferrer">
                Read the Whitepaper
              </a>
            </div>

            <div className="basket-pills-row anim" style={{ '--d': '0.45s' } as React.CSSProperties}>
              <a href="#baskets" className={`basket-pill ${activeBasketPill === 'ai7' ? 'active' : ''}`} onClick={() => handleBasketSelect('ai7')}>
                <span className="basket-dot dot-ai"></span>
                <span className="basket-name">$AI7</span>
                <span className="basket-desc">NVDA · AVGO · TSM · AMD</span>
              </a>
              <a href="#baskets" className={`basket-pill ${activeBasketPill === 'mag7' ? 'active' : ''}`} onClick={() => handleBasketSelect('mag7')}>
                <span className="basket-dot dot-mag"></span>
                <span className="basket-name">$MAG7</span>
                <span className="basket-desc">AAPL · MSFT · GOOGL +4</span>
              </a>
              <a href="#baskets" className={`basket-pill ${activeBasketPill === 'gold' ? 'active' : ''}`} onClick={() => handleBasketSelect('gold')}>
                <span className="basket-dot dot-gold"></span>
                <span className="basket-name">$GOLD</span>
                <span className="basket-desc">Gold-Linked Exposure</span>
              </a>
            </div>

            <div className="stats-footer" id="stats-section" ref={statsSectionRef}>
              <div className="stats-grid">
                <div className="stat-item anim" style={{ '--d': '0.5s' } as React.CSSProperties}>
                  <span className="stat-icon" aria-hidden="true">&lt;</span>
                  <div className="stat-content">
                    <span className="stat-val"><span className="stat-num">{statsCounters.stat1.toFixed(0)}</span><span className="stat-unit"> Tx</span></span>
                    <span className="stat-label">Deposit USDG, Mint 1 Asset</span>
                  </div>
                </div>

                <div className="stat-item anim" style={{ '--d': '0.58s' } as React.CSSProperties}>
                  <span className="stat-icon" aria-hidden="true">%</span>
                  <div className="stat-content">
                    <span className="stat-val"><span className="stat-num">{statsCounters.stat2.toFixed(0)}</span><span className="stat-unit">%</span></span>
                    <span className="stat-label">Non-Custodial Vaults</span>
                  </div>
                </div>

                <div className="stat-item anim" style={{ '--d': '0.66s' } as React.CSSProperties}>
                  <span className="stat-icon" aria-hidden="true">*</span>
                  <div className="stat-content">
                    <span className="stat-val"><span className="stat-num">{statsCounters.stat3.toFixed(0)}</span><span className="stat-unit"> Baskets</span></span>
                    <span className="stat-label">$AI7 · $MAG7 · $GOLD</span>
                  </div>
                </div>

                <div className="stat-item anim" style={{ '--d': '0.74s' } as React.CSSProperties}>
                  <span className="stat-icon" aria-hidden="true">#</span>
                  <div className="stat-content">
                    <span className="stat-val"><span className="stat-num">{statsCounters.stat4.toFixed(1)}</span><span className="stat-unit">%</span></span>
                    <span className="stat-label">Illustrative Fee Model</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block wallet-clutter-section" id="why-xindex">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">The Problem &amp; Solution</span>
              <h2 className="section-title">End The Wallet Clutter</h2>
              <p className="section-subtitle">
                Several tokenized stocks should not mean several separate positions. Xindex turns verified Robinhood Stock Token exposure into one asset you can hold, trade, and pair.
              </p>
            </div>

            <div className="wallet-flow-stage">
              <div className="wallet-stage-glow wallet-stage-glow-left"></div>
              <div className="wallet-stage-glow wallet-stage-glow-right"></div>

              <div className="wallet-stage-toolbar">
                <span className="wallet-stage-label">
                  <i className="fa-solid fa-chart-line"></i>
                  Portfolio consolidation
                </span>
                <span className="wallet-stage-status">
                  <span className="wallet-stage-dot"></span>
                  Live basket architecture
                </span>
              </div>

              <div className="wallet-flow-grid">
                <article className="wallet-state wallet-state-fragmented">
                  <header className="wallet-state-header">
                    <div className="wallet-state-icon">
                      <i className="fa-solid fa-wallet"></i>
                    </div>
                    <div>
                      <span>Current wallet</span>
                      <h3>7 Separate Tickers</h3>
                    </div>
                    <strong className="wallet-state-count">07</strong>
                  </header>

                  <div className="stock-mark-cloud" aria-label="Separate stock positions">
                    <span className="stock-mark stock-mark-blue"><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA logo" />NVDA</span>
                    <span className="stock-mark stock-mark-purple"><img src="/assets/stock-logos/broadcom.svg" alt="Broadcom logo" />AVGO</span>
                    <span className="stock-mark stock-mark-cyan"><img src="/assets/stock-logos/tsmc.svg" alt="TSMC logo" />TSM</span>
                    <span className="stock-mark stock-mark-orange"><img src="/assets/stock-logos/amd.svg" alt="AMD logo" />AMD</span>
                    <span className="stock-mark stock-mark-dim"><span className="stock-mark-more">+</span>3</span>
                  </div>

                  <div className="wallet-state-metrics">
                    <div><span>Transactions</span><strong>7x</strong></div>
                    <div><span>Exit routes</span><strong>7</strong></div>
                    <div><span>Pairing</span><strong>Split</strong></div>
                  </div>
                </article>

                <div className="wallet-flow-bridge" aria-label="Consolidate through the Xindex vault">
                  <span>Consolidate</span>
                  <div className="wallet-bridge-icon">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                  <small>USDG vault</small>
                </div>

                <article className="wallet-state wallet-state-unified">
                  <header className="wallet-state-header">
                    <div className="wallet-state-icon wallet-state-icon-unified">
                      <i className="fa-solid fa-layer-group"></i>
                    </div>
                    <div>
                      <span>Xindex basket</span>
                      <h3>One Living Asset</h3>
                    </div>
                    <strong className="wallet-state-count">01</strong>
                  </header>

                  <div className="basket-orbit" aria-label="AI7 unified basket">
                    <span className="orbit-stock orbit-stock-1"><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA logo" /><span>NVDA</span></span>
                    <span className="orbit-stock orbit-stock-2"><img src="/assets/stock-logos/broadcom.svg" alt="Broadcom logo" /><span>AVGO</span></span>
                    <span className="orbit-stock orbit-stock-3"><img src="/assets/stock-logos/tsmc.svg" alt="TSMC logo" /><span>TSM</span></span>
                    <span className="orbit-stock orbit-stock-4"><img src="/assets/stock-logos/amd.svg" alt="AMD logo" /><span>AMD</span></span>
                    <div className="basket-orbit-core">
                      <i className="fa-solid fa-chart-pie"></i>
                      <strong>$AI7</strong>
                      <span>Unified</span>
                    </div>
                  </div>

                  <div className="wallet-state-metrics">
                    <div><span>Mint action</span><strong>1x</strong></div>
                    <div><span>Wallet asset</span><strong>1</strong></div>
                    <div><span>Pairing</span><strong>Unified</strong></div>
                  </div>
                </article>
              </div>

              <div className="wallet-outcome-strip">
                <div><i className="fa-solid fa-layer-group"></i><span>One basket balance</span></div>
                <div><i className="fa-solid fa-arrow-right-arrow-left"></i><span>One mint or redeem flow</span></div>
                <div><i className="fa-solid fa-droplet"></i><span>One liquidity pair</span></div>
                <div><i className="fa-solid fa-shield-halved"></i><span>Non-custodial vault</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block section-baskets" id="baskets">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">3 Core Baskets · More Later</span>
              <h2 className="section-title">Start With Three Baskets</h2>
              <p className="section-subtitle">
                Start narrow with three core baskets: AI, mega-cap technology, and gold-linked exposure. Future concepts show where the catalogue can expand after the first products prove demand.
              </p>
            </div>

            <div className="baskets-carousel-shell">
              <button
                type="button"
                className="basket-carousel-arrow basket-carousel-arrow-prev"
                onClick={() => scrollBasketTrack(-1)}
                aria-label="Show previous basket"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>

              <div
                ref={basketsTrackRef}
                className={`baskets-showcase-grid${isDraggingBaskets ? " is-dragging" : ""}`}
                onPointerDown={handleBasketPointerDown}
                onPointerMove={handleBasketPointerMove}
                onPointerUp={endBasketDrag}
                onPointerCancel={endBasketDrag}
              >
              {/* Basket 1: AI7 */}
              <div className="basket-card card-ai7" id="basket-card-ai7">
                <div className="basket-card-header">
                  <div className="b-identity">
                    <span className="b-symbol-pill symbol-ai">$AI7</span>
                    <div>
                      <h3 className="b-title">AI Compute Basket</h3>
                      <span className="b-network">Robinhood Chain</span>
                    </div>
                  </div>
                  <span className="b-price-badge">1 $AI7 = 245.00 USDG</span>
                </div>

                <div className="basket-logo-rail" aria-label="AI7 holdings">
                  <span><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA" /></span>
                  <span><img src="/assets/stock-logos/broadcom.svg" alt="Broadcom" /></span>
                  <span><img src="/assets/stock-logos/tsmc.svg" alt="TSMC" /></span>
                  <span><img src="/assets/stock-logos/amd.svg" alt="AMD" /></span>
                </div>

                <p className="b-narration">
                  One basket for the AI hardware stack. Hold NVDA, AVGO, TSM, and AMD exposure without managing four separate tickers.
                </p>

                <div className="b-holdings-bar">
                  <div className="b-bar-segment seg-nvda" style={{ width: '35%' }} title="NVDA 35%">35%</div>
                  <div className="b-bar-segment seg-avgo" style={{ width: '25%' }} title="AVGO 25%">25%</div>
                  <div className="b-bar-segment seg-tsm" style={{ width: '25%' }} title="TSM 25%">25%</div>
                  <div className="b-bar-segment seg-amd" style={{ width: '15%' }} title="AMD 15%">15%</div>
                </div>

                <div className="b-holdings-grid">
                  <div className="b-holding-item">
                    <div className="h-main"><span className="h-name">NVIDIA</span><span className="h-ticker">NVDA</span></div>
                    <div className="h-weight">35% Weight</div>
                  </div>
                  <div className="b-holding-item">
                    <div className="h-main"><span className="h-name">Broadcom</span><span className="h-ticker">AVGO</span></div>
                    <div className="h-weight">25% Weight</div>
                  </div>
                  <div className="b-holding-item">
                    <div className="h-main"><span className="h-name">TSMC</span><span className="h-ticker">TSM</span></div>
                    <div className="h-weight">25% Weight</div>
                  </div>
                  <div className="b-holding-item">
                    <div className="h-main"><span className="h-name">AMD</span><span className="h-ticker">AMD</span></div>
                    <div className="h-weight">15% Weight</div>
                  </div>
                </div>

                <div className="b-card-footer">
                  <button className="b-action-btn select-mint-btn" onClick={() => handleQuickMint("ai7")}>
                    Simulate Minting $AI7
                  </button>
                </div>
              </div>

              {/* Basket 2: MAG7 */}
              <div className="basket-card card-mag7" id="basket-card-mag7">
                <div className="basket-card-header">
                  <div className="b-identity">
                    <span className="b-symbol-pill symbol-mag">$MAG7</span>
                    <div>
                      <h3 className="b-title">Magnificent Seven</h3>
                      <span className="b-network">Robinhood Chain</span>
                    </div>
                  </div>
                  <span className="b-price-badge">1 $MAG7 = 380.00 USDG</span>
                </div>

                <div className="basket-logo-rail" aria-label="MAG7 holdings">
                  <span><img src="/assets/stock-logos/apple.svg" alt="Apple" /></span>
                  <span><img src="/assets/stock-logos/google.svg" alt="Alphabet" /></span>
                  <span><img src="/assets/stock-logos/meta.svg" alt="Meta" /></span>
                  <span><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA" /></span>
                  <span><img src="/assets/stock-logos/tesla.svg" alt="Tesla" /></span>
                </div>

                <p className="b-narration">
                  Seven mega-cap technology leaders in one balanced basket. Hold diversified exposure without carrying seven separate positions.
                </p>

                <div className="b-holdings-bar">
                  <div className="b-bar-segment" style={{ width: '14.3%', background: '#3b82f6' }}>14%</div>
                  <div className="b-bar-segment" style={{ width: '14.3%', background: '#10b981' }}>14%</div>
                  <div className="b-bar-segment" style={{ width: '14.3%', background: '#f59e0b' }}>14%</div>
                  <div className="b-bar-segment" style={{ width: '14.3%', background: '#8b5cf6' }}>14%</div>
                  <div className="b-bar-segment" style={{ width: '14.3%', background: '#06b6d4' }}>14%</div>
                  <div className="b-bar-segment" style={{ width: '14.3%', background: '#ec4899' }}>14%</div>
                  <div className="b-bar-segment" style={{ width: '14.2%', background: '#64748b' }}>14%</div>
                </div>

                <div className="b-holdings-grid holdings-mag7">
                  <div className="b-holding-item"><span className="h-ticker">AAPL</span><span className="h-weight">14.3%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">MSFT</span><span className="h-weight">14.3%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">GOOGL</span><span className="h-weight">14.3%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">AMZN</span><span className="h-weight">14.3%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">NVDA</span><span className="h-weight">14.3%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">META</span><span className="h-weight">14.3%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">TSLA</span><span className="h-weight">14.2%</span></div>
                </div>

                <div className="b-card-footer">
                  <button className="b-action-btn select-mint-btn" onClick={() => handleQuickMint("mag7")}>
                    Simulate Minting $MAG7
                  </button>
                </div>
              </div>

              {/* Basket 3: GOLD */}
              <div className="basket-card card-gold" id="basket-card-gold">
                <div className="basket-card-header">
                  <div className="b-identity">
                    <span className="b-symbol-pill symbol-gold">$GOLD</span>
                    <div>
                      <h3 className="b-title">Gold-Linked Basket</h3>
                      <span className="b-network">Robinhood Chain</span>
                    </div>
                  </div>
                  <span className="b-price-badge">1 $GOLD = 95.00 USDG</span>
                </div>

                <div className="basket-logo-rail basket-logo-rail-gold" aria-label="Gold reserve">
                  <span className="commodity-logo">AU</span>
                  <strong>Gold-linked exposure</strong>
                </div>

                <p className="b-narration">
                  A gold-linked basket concept built from a verified Robinhood contract. One asset for holding and pairing against a macro hedge.
                </p>

                <div className="b-holdings-bar">
                  <div className="b-bar-segment" style={{ width: '100%', background: '#f59e0b' }}>100% Gold-Linked Allocation</div>
                </div>

                <div className="gold-vault-info">
                  <div className="g-stat">
                    <span className="g-label">Basket Allocation</span>
                    <span className="g-value">100% Gold-Linked</span>
                  </div>
                  <div className="g-stat">
                    <span className="g-label">Contract Reference</span>
                    <span className="g-value verified">Canonical Robinhood</span>
                  </div>
                </div>

                <div className="b-card-footer">
                  <button className="b-action-btn select-mint-btn" onClick={() => handleQuickMint("gold")}>
                    Simulate Minting $GOLD
                  </button>
                </div>
              </div>

              {/* Basket 4: MEGA5 Concept */}
              <div className="basket-card future-concept-card card-mega5">
                <div className="basket-card-header">
                  <div className="b-identity">
                    <span className="b-symbol-pill symbol-mega">$MEGA5</span>
                    <div>
                      <h3 className="b-title">Mega-Cap Momentum</h3>
                      <span className="b-network">Future Concept</span>
                    </div>
                  </div>
                  <span className="b-price-badge">Concept preview</span>
                </div>

                <div className="basket-logo-rail" aria-label="MEGA5 concept holdings">
                  <span><img src="/assets/stock-logos/apple.svg" alt="Apple" /></span>
                  <span><img src="/assets/stock-logos/google.svg" alt="Alphabet" /></span>
                  <span><img src="/assets/stock-logos/meta.svg" alt="Meta" /></span>
                  <span><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA" /></span>
                  <span><img src="/assets/stock-logos/tesla.svg" alt="Tesla" /></span>
                </div>

                <p className="b-narration">
                  A concentrated concept basket tracking five highly liquid public companies shaping global technology and consumer markets.
                </p>

                <div className="b-holdings-bar">
                  <div className="b-bar-segment" style={{ width: '20%', background: '#f8fafc' }}>20%</div>
                  <div className="b-bar-segment" style={{ width: '20%', background: '#60a5fa' }}>20%</div>
                  <div className="b-bar-segment" style={{ width: '20%', background: '#8b5cf6' }}>20%</div>
                  <div className="b-bar-segment" style={{ width: '20%', background: '#76b900' }}>20%</div>
                  <div className="b-bar-segment" style={{ width: '20%', background: '#e82127' }}>20%</div>
                </div>

                <div className="b-holdings-grid">
                  <div className="b-holding-item"><span className="h-ticker">AAPL</span><span className="h-weight">20%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">GOOGL</span><span className="h-weight">20%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">META</span><span className="h-weight">20%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">NVDA + TSLA</span><span className="h-weight">40%</span></div>
                </div>

                <div className="b-concept-status">Future concept — outside the initial three baskets</div>
              </div>

              {/* Basket 5: SEMI4 Concept */}
              <div className="basket-card future-concept-card card-semi4">
                <div className="basket-card-header">
                  <div className="b-identity">
                    <span className="b-symbol-pill symbol-semi">$SEMI4</span>
                    <div>
                      <h3 className="b-title">Semiconductor Leaders</h3>
                      <span className="b-network">Future Concept</span>
                    </div>
                  </div>
                  <span className="b-price-badge">Concept preview</span>
                </div>

                <div className="basket-logo-rail" aria-label="SEMI4 concept holdings">
                  <span><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA" /></span>
                  <span><img src="/assets/stock-logos/broadcom.svg" alt="Broadcom" /></span>
                  <span><img src="/assets/stock-logos/tsmc.svg" alt="TSMC" /></span>
                  <span><img src="/assets/stock-logos/amd.svg" alt="AMD" /></span>
                </div>

                <p className="b-narration">
                  A focused semiconductor concept spanning GPU design, connectivity, advanced foundry capacity, and high-performance compute.
                </p>

                <div className="b-holdings-bar">
                  <div className="b-bar-segment seg-nvda" style={{ width: '30%' }}>30%</div>
                  <div className="b-bar-segment seg-avgo" style={{ width: '25%' }}>25%</div>
                  <div className="b-bar-segment seg-tsm" style={{ width: '25%' }}>25%</div>
                  <div className="b-bar-segment seg-amd" style={{ width: '20%' }}>20%</div>
                </div>

                <div className="b-holdings-grid">
                  <div className="b-holding-item"><span className="h-ticker">NVDA</span><span className="h-weight">30%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">AVGO</span><span className="h-weight">25%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">TSM</span><span className="h-weight">25%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">AMD</span><span className="h-weight">20%</span></div>
                </div>

                <div className="b-concept-status">Future concept — outside the initial three baskets</div>
              </div>

              {/* Basket 6: AUTO4 Concept */}
              <div className="basket-card future-concept-card card-auto4">
                <div className="basket-card-header">
                  <div className="b-identity">
                    <span className="b-symbol-pill symbol-auto">$AUTO4</span>
                    <div>
                      <h3 className="b-title">Autonomous Future</h3>
                      <span className="b-network">Future Concept</span>
                    </div>
                  </div>
                  <span className="b-price-badge">Concept preview</span>
                </div>

                <div className="basket-logo-rail" aria-label="AUTO4 concept holdings">
                  <span><img src="/assets/stock-logos/tesla.svg" alt="Tesla" /></span>
                  <span><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA" /></span>
                  <span><img src="/assets/stock-logos/amd.svg" alt="AMD" /></span>
                  <span><img src="/assets/stock-logos/google.svg" alt="Alphabet" /></span>
                </div>

                <p className="b-narration">
                  A mobility and autonomous-compute concept connecting electric vehicles, accelerated processors, and AI software platforms.
                </p>

                <div className="b-holdings-bar">
                  <div className="b-bar-segment" style={{ width: '35%', background: '#e82127' }}>35%</div>
                  <div className="b-bar-segment" style={{ width: '30%', background: '#76b900' }}>30%</div>
                  <div className="b-bar-segment" style={{ width: '20%', background: '#ed1c24' }}>20%</div>
                  <div className="b-bar-segment" style={{ width: '15%', background: '#4285f4' }}>15%</div>
                </div>

                <div className="b-holdings-grid">
                  <div className="b-holding-item"><span className="h-ticker">TSLA</span><span className="h-weight">35%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">NVDA</span><span className="h-weight">30%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">AMD</span><span className="h-weight">20%</span></div>
                  <div className="b-holding-item"><span className="h-ticker">GOOGL</span><span className="h-weight">15%</span></div>
                </div>

                <div className="b-concept-status">Future concept — outside the initial three baskets</div>
              </div>

              </div>

              <button
                type="button"
                className="basket-carousel-arrow basket-carousel-arrow-next"
                onClick={() => scrollBasketTrack(1)}
                aria-label="Show next basket"
              >
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            <div className="basket-drag-hint">
              <i className="fa-solid fa-arrows-left-right"></i>
              Drag, swipe, or use the arrows to explore each basket
            </div>
          </div>
        </section>

        <section className="section-block section-pairing" id="pairing-engine">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">One Asset · One Pair</span>
              <h2 className="section-title">The Basket Token is Alive</h2>
              <p className="section-subtitle">
                  A basket is more than portfolio exposure. It becomes one liquid asset people can hold, trade, and pair against.
              </p>
            </div>

            <div className="pairing-feature-box">
              <div className="pairing-left-desc">
                <div className="pairing-kicker">
                  <span>Market Structure</span>
                  <strong>01</strong>
                </div>
                <h3 className="p-subheading">Launch new liquidity against a basket, not a single stock.</h3>
                <p className="p-text">
                  New projects can launch a pool against $AI7 instead of anchoring their entire market to NVDA alone. One basket gives the pair diversified AI exposure in a single balance.
                </p>

                <div className="pairing-stock-rail" aria-label="AI7 underlying companies">
                  <span><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA" /></span>
                  <span><img src="/assets/stock-logos/broadcom.svg" alt="Broadcom" /></span>
                  <span><img src="/assets/stock-logos/tsmc.svg" alt="TSMC" /></span>
                  <span><img src="/assets/stock-logos/amd.svg" alt="AMD" /></span>
                  <div>
                    <strong>4 underlying markets</strong>
                    <small>One unified liquidity pair</small>
                  </div>
                </div>

                <div className="pairing-bullet-points">
                  <div className="p-point">
                    <div className="p-icon-box"><i className="fa-solid fa-anchor"></i></div>
                    <div>
                      <h4>One diversified pair</h4>
                      <p>Move from single-company exposure to a basket built across the sector.</p>
                    </div>
                  </div>
                  <div className="p-point">
                    <div className="p-icon-box"><i className="fa-solid fa-code-branch"></i></div>
                    <div>
                      <h4>Hold, trade, pair</h4>
                      <p>Use one basket balance across DEX pools and other on-chain markets.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pairing-interactive-card">
                <div className="pair-card-header">
                  <div>
                    <span className="pair-card-eyebrow">Pool configuration</span>
                    <span className="pair-card-title">Robinhood Chain DEX</span>
                  </div>
                  <span className="live-tag"><span className="live-dot"></span> Simulation</span>
                </div>

                <div className="pool-visualizer">
                  <div className="pool-asset-box">
                    <span className="asset-logo asset-logo-token"><i className="fa-solid fa-cube"></i></span>
                    <span className="asset-title">$AGI_COIN</span>
                    <span className="asset-type">New project token</span>
                  </div>

                  <div className="pool-connector">
                    <span className="connector-label">LIQUIDITY PAIR</span>
                    <div className="connector-line">
                      <div className="pulsing-node"></div>
                    </div>
                    <span className="connector-fee">0.30% fee tier</span>
                  </div>

                  <div className="pool-asset-box box-basket">
                    <span className="asset-logo asset-logo-xindex"><img src="/assets/xindex-logo.png" alt="Xindex" /></span>
                    <span className="asset-title">{BASKETS[simBasketKey].symbol}</span>
                    <span className="asset-type">Basket asset</span>
                  </div>
                </div>

                <div className="pool-controls">
                  <div className="pool-input-group">
                    <label htmlFor="pool-basket-select">Select Pairing Basket Asset</label>
                    <select 
                      id="pool-basket-select" 
                      className="pool-select"
                      value={simBasketKey}
                      onChange={(e) => setSimBasketKey(e.target.value as BasketKey)}
                    >
                      <option value="ai7">$AI7 — AI Compute Basket</option>
                      <option value="mag7">$MAG7 — Magnificent 7 Index</option>
                      <option value="gold">$GOLD — Gold-Linked Basket</option>
                    </select>
                  </div>

                  <div className="pool-stats-row">
                    <div className="p-stat">
                      <span>Underlying exposure</span>
                      <strong>{BASKETS[simBasketKey].exposureText}</strong>
                    </div>
                    <div className="p-stat">
                      <span>Volatility profile</span>
                      <strong className="color-green">{BASKETS[simBasketKey].stabilityText}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block section-vault" id="vault-terminal">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">Protocol Preview</span>
              <h2 className="section-title">Vault Mint &amp; Redeem Flow</h2>
              <p className="section-subtitle">
                Deposit USDG, receive one basket token, then hold, trade, or redeem it. Estimates below are illustrative only.
              </p>
            </div>

            <div className="vault-terminal-wrapper">
              <div className="terminal-demo-disclosure" role="note">
                <i className="fa-solid fa-flask" aria-hidden="true"></i>
                <div>
                  <strong>Simulation only — no wallet is connected.</strong>
                  <span>This demo does not submit, sign, or confirm any on-chain transaction. Values and balances are illustrative.</span>
                </div>
              </div>
              <div className="vault-terminal-card">
                <div className="vault-console-header">
                  <div className="vault-console-identity">
                    <span className="vault-console-mark"><i className="fa-solid fa-vault"></i></span>
                    <div>
                      <span>VAULT EXECUTION CONSOLE</span>
                      <strong>Xindex Basket Router</strong>
                    </div>
                  </div>
                  <div className="vault-console-status">
                    <span className="status-pulse"></span>
                    Preview environment
                  </div>
                </div>
                <div className="vault-mode-switch" role="tablist">
                  <button 
                    className={`mode-btn ${currentMode === 'mint' ? 'active' : ''}`}
                    onClick={() => handleModeChange('mint')}
                  >
                    <i className="fa-solid fa-arrow-down-to-bracket"></i> Deposit USDG &amp; Mint Basket
                  </button>
                  <button 
                    className={`mode-btn ${currentMode === 'redeem' ? 'active' : ''}`}
                    onClick={() => handleModeChange('redeem')}
                  >
                    <i className="fa-solid fa-arrow-up-from-bracket"></i> Redeem Basket &rarr; USDG
                  </button>
                </div>

                <div className="terminal-body">
                  <div className="terminal-input-card terminal-input-primary">
                    <div className="input-card-top">
                      <span className="input-label">{currentMode === 'mint' ? "You Deposit" : `You Redeem (${activeTerminalBasket.symbol})`}</span>
                      <span className="input-balance">Illustrative input: <strong>{currentMode === 'mint' ? '10,000 USDG' : `4.08 ${activeTerminalBasket.symbol}`}</strong></span>
                    </div>
                    <div className="input-card-row">
                      <input 
                        type="number" 
                        value={terminalInputAmount}
                        onChange={(e) => setTerminalInputAmount(e.target.value)}
                        min={currentMode === 'mint' ? "10" : "0.01"}
                        step={currentMode === 'mint' ? "50" : "0.5"}
                        className="terminal-number-input" 
                        aria-label="Deposit Amount" 
                      />
                      <div className="token-selector-pill">
                        {currentMode === 'mint' ? (
                          <>
                            <span className="usdg-glyph">$</span>
                            <span className="token-name">USDG</span>
                          </>
                        ) : (
                          <>
                            <span className="usdg-glyph"><i className="fa-solid fa-layer-group"></i></span>
                            <span className="token-name">{activeTerminalBasket.symbol}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="terminal-arrow-divider">
                    <div className="arrow-circle">
                      <i className={`fa-solid ${currentMode === 'mint' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                    </div>
                  </div>

                  <div className="terminal-input-card terminal-input-output">
                    <div className="input-card-top">
                      <span className="input-label">{currentMode === 'mint' ? "You Receive (Estimated)" : "You Receive (USDG)"}</span>
                      <span className="input-rate">1 {activeTerminalBasket.symbol} = {activeTerminalBasket.price.toFixed(2)} USDG</span>
                    </div>
                    <div className="input-card-row">
                      <input 
                        type="text" 
                        value={terminalReceiveAmount} 
                        readOnly 
                        className="terminal-number-input input-readonly" 
                        aria-label="Receive Amount" 
                      />
                      <select 
                        className="terminal-dropdown" 
                        aria-label="Select Basket Asset"
                        value={selectedBasketKey}
                        onChange={(e) => setSelectedBasketKey(e.target.value as BasketKey)}
                      >
                        <option value="ai7">$AI7 (AI Compute)</option>
                        <option value="mag7">$MAG7 (Magnificent 7)</option>
                        <option value="gold">$GOLD (Tokenized Gold)</option>
                      </select>
                    </div>
                  </div>

                  <div className="terminal-allocation-box">
                    <div className="alloc-header">
                      <span>Underlying contract allocation</span>
                      <span className="verified-badge"><i className="fa-solid fa-shield-halved"></i> 100% Non-Custodial</span>
                    </div>
                    <div className="alloc-items-grid">
                      {activeTerminalBasket.holdings.map((h, i) => (
                        <div key={i} className="alloc-tag">
                          <span className="alloc-asset">
                            {STOCK_LOGOS[h.ticker] ? (
                              <img src={STOCK_LOGOS[h.ticker]} alt={`${h.name} logo`} />
                            ) : (
                              <span className="alloc-fallback"><i className="fa-solid fa-coins"></i></span>
                            )}
                            <span>
                              <strong className="alloc-ticker">{h.ticker}</strong>
                              <small className="alloc-val">{h.name}</small>
                            </span>
                          </span>
                          <span className="alloc-pct">{h.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="terminal-fee-breakdown">
                    <div className="fee-heading">
                      <span>Execution summary</span>
                      <i className="fa-solid fa-receipt"></i>
                    </div>
                    <div className="fee-line">
                      <span>Illustrative Vault Fee (0.1%)</span>
                      <span>{feeCalcText}</span>
                    </div>
                    <div className="fee-line">
                      <span>Network Execution</span>
                      <span>Robinhood Chain (Gas: &lt;$0.001)</span>
                    </div>
                  </div>

                  <button 
                    className="terminal-action-btn" 
                    onClick={handleAction}
                    disabled={false}
                    style={{
                      opacity: actionStatus === "idle" ? 1 : (actionStatus === "processing" ? 0.75 : 1),
                      background: actionStatus === "success" ? "#10b981" : "",
                      color: actionStatus === "success" ? "#ffffff" : ""
                    }}
                  >
                    Open Protocol App
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block section-tokenomics" id="tokenomics">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">Product First · Token Later</span>
              <h2 className="section-title">Token = Fee Engine. Baskets = The Product.</h2>
              <p className="section-subtitle">
                We’ll have a project token on Robinhood Chain later. Don’t launch the token first. Tie it to mint/redeem fees and basket listings.
              </p>
            </div>

            <div className="tokenomics-grid">
              <article className="token-card token-product-panel">
                <div className="token-panel-top">
                  <span className="t-kicker">01 / PRODUCT LAYER</span>
                  <i className="fa-solid fa-layer-group t-panel-icon"></i>
                </div>
                <div className="token-panel-heading">
                  <h3 className="t-title">Baskets are the product.</h3>
                  <span className="t-index-mark">INDEXED</span>
                </div>
                <p className="t-desc">
                  Product-market fit starts with assets people genuinely want to hold and pair against. Utility, liquidity, and vault volume come before any token launch.
                </p>
                <div className="basket-product-rail">
                  <div className="basket-product-row">
                    <span className="basket-product-symbol">$AI7</span>
                    <span className="basket-product-name">AI Compute</span>
                    <span className="basket-product-mark"><img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA logo" /><img src="/assets/stock-logos/amd.svg" alt="AMD logo" /></span>
                  </div>
                  <div className="basket-product-row">
                    <span className="basket-product-symbol">$MAG7</span>
                    <span className="basket-product-name">Mega-cap leaders</span>
                    <span className="basket-product-mark"><img src="/assets/stock-logos/apple.svg" alt="Apple logo" /><img src="/assets/stock-logos/google.svg" alt="Alphabet logo" /><img src="/assets/stock-logos/tesla.svg" alt="Tesla logo" /></span>
                  </div>
                  <div className="basket-product-row">
                    <span className="basket-product-symbol">$GOLD</span>
                    <span className="basket-product-name">Macro reserve</span>
                    <span className="basket-product-mark gold-mark"><i className="fa-solid fa-coins"></i></span>
                  </div>
                </div>
              </article>

              <article className="token-card token-engine-panel">
                <div className="token-panel-top">
                  <span className="t-kicker">02 / REVENUE RAIL</span>
                  <i className="fa-solid fa-arrow-trend-up t-panel-icon"></i>
                </div>
                <div className="fee-engine-number"><strong>0.10%</strong><span>illustrative fee</span></div>
                <h3 className="t-title">Fees follow product activity.</h3>
                <p className="t-desc">
                  Deposits, redemptions, rebalancing arbitrage, and new basket listings create real cashflow that accumulates into the Xindex protocol treasury.
                </p>
                <div className="fee-source-list">
                  <span><i className="fa-solid fa-arrow-right-arrow-left"></i> Mint / redeem</span>
                  <span><i className="fa-solid fa-scale-balanced"></i> Rebalancing</span>
                  <span><i className="fa-solid fa-plus"></i> New listings</span>
                </div>
              </article>

              <article className="token-card token-future-panel">
                <div className="future-token-lockup">
                  <span className="xindex-token-mark">X</span>
                  <span className="t-kicker">03 / FUTURE GOVERNANCE</span>
                </div>
                <div className="future-copy">
                  <h3 className="t-title">The token comes after the product.</h3>
                  <p className="t-desc">
                    A future Xindex token can be tied to accumulated protocol fees and governance over curated baskets and listing parameters after the products prove demand.
                  </p>
                </div>
                <div className="future-status"><i className="fa-solid fa-lock"></i> Product and volume first</div>
              </article>
            </div>

            <div className="flywheel-box">
              <div className="flywheel-step">
                <span className="step-num">01</span>
                <span className="step-title">USDG Mint &amp; Pairs</span>
                <p className="step-desc">Users mint $AI7, $MAG7, $GOLD and launch DEX pairs.</p>
              </div>
              <div className="flywheel-arrow"><i className="fa-solid fa-chevron-right"></i></div>
              <div className="flywheel-step">
                <span className="step-num">02</span>
                <span className="step-title">Fee Accumulation</span>
                <p className="step-desc">Every mint, redeem, and listing yields protocol revenue.</p>
              </div>
              <div className="flywheel-arrow"><i className="fa-solid fa-chevron-right"></i></div>
              <div className="flywheel-step">
                <span className="step-num">03</span>
                <span className="step-title">Token Buyback &amp; Staking</span>
                <p className="step-desc">Fees route to Xindex token holders on Robinhood Chain.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block section-arch" id="architecture">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">Canonical Contract Catalogue</span>
              <h2 className="section-title">Official Robinhood Stock Contracts Only</h2>
              <p className="section-subtitle">
                Non-custodial basket contracts built around canonical Robinhood Stock Token references.
              </p>
            </div>

            <div className="arch-features-grid">
              <article className="arch-card arch-featured">
                <div className="arch-card-kicker"><span>01 / RESERVE LAYER</span><i className="fa-solid fa-shield-halved"></i></div>
                <div className="arch-featured-heading">
                  <div className="arch-icon"><i className="fa-solid fa-check"></i></div>
                  <div>
                    <h4>Official RH Stock Contracts</h4>
                    <p>Xindex baskets use verified Robinhood Stock Token contracts and transparent weights. No unverified proxy assets are used in the basket definition.</p>
                  </div>
                </div>
                <div className="contract-proof">
                  <div className="contract-proof-logos">
                    <img src="/assets/stock-logos/nvidia.svg" alt="NVIDIA logo" />
                    <img src="/assets/stock-logos/broadcom.svg" alt="Broadcom logo" />
                    <img src="/assets/stock-logos/tsmc.svg" alt="TSMC logo" />
                    <img src="/assets/stock-logos/amd.svg" alt="AMD logo" />
                  </div>
                  <div><strong>Canonical contract exposure</strong><span>Verified Robinhood references only</span></div>
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </div>
              </article>

              <article className="arch-card arch-custody">
                <div className="arch-card-kicker"><span>02 / CONTROL</span><i className="fa-solid fa-key"></i></div>
                <div className="arch-icon"><i className="fa-solid fa-lock-open"></i></div>
                <h4>100% Non-Custodial Vaults</h4>
                <p>You retain full cryptographic control. Redeem your basket tokens for the underlying Robinhood stock contracts or USDG at any time.</p>
                <div className="arch-card-footer"><span>USER CONTROLLED</span><i className="fa-solid fa-arrow-right"></i></div>
              </article>

              <article className="arch-card arch-oracle">
                <div className="arch-card-kicker"><span>03 / PRICING</span><i className="fa-solid fa-satellite-dish"></i></div>
                <div className="arch-icon"><i className="fa-solid fa-wave-square"></i></div>
                <h4>Chainlink Oracle Pricing</h4>
                <p>Reference price feeds support NAV and weighting estimates on-chain. Final execution is quoted when a transaction is configured.</p>
                <div className="oracle-readout"><span className="oracle-dot"></span><span>LIVE NAV FEED</span><strong>ON-CHAIN</strong></div>
              </article>

              <article className="arch-card arch-availability">
                <div className="arch-card-kicker"><span>04 / SETTLEMENT</span><i className="fa-solid fa-arrows-rotate"></i></div>
                <div className="arch-icon"><i className="fa-solid fa-clock"></i></div>
                <h4>24/7 On-Chain Mint &amp; Trade</h4>
                <p>Trade and pair your baskets on decentralized exchanges whenever on-chain liquidity is available.</p>
                <div className="availability-line"><span className="availability-bars"><i></i><i></i><i></i><i></i></span><span>ALWAYS OPEN</span></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section-block section-faq" id="faq">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-badge">Got Questions?</span>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">
                Everything you need to know about Xindex, USDG deposits, and liquidity pairing.
              </p>
            </div>

            <div className="faq-accordion">
              <div className={`faq-item ${activeFaqIndex === 0 ? 'active' : ''}`}>
                <button className="faq-question" aria-expanded={activeFaqIndex === 0} onClick={() => toggleFaq(0)}>
                  <span>How does depositing USDG work?</span>
                  <i className="fa-solid fa-chevron-down faq-chevron"></i>
                </button>
                <div className="faq-answer">
                  <p>Deposit USDG and the vault calculates one basket token against its published weights, such as 35% NVDA, 25% AVGO, 25% TSM, and 15% AMD for $AI7. The estimate is shown before any transaction is configured.</p>
                </div>
              </div>

              <div className={`faq-item ${activeFaqIndex === 1 ? 'active' : ''}`}>
                <button className="faq-question" aria-expanded={activeFaqIndex === 1} onClick={() => toggleFaq(1)}>
                  <span>Why should new projects pair against $AI7 instead of NVDA alone?</span>
                  <i className="fa-solid fa-chevron-down faq-chevron"></i>
                </button>
                <div className="faq-answer">
                  <p>A new coin can pair against $AI7 instead of NVDA alone. The basket gives its community one diversified AI exposure asset to hold, trade, and use as liquidity.</p>
                </div>
              </div>

              <div className={`faq-item ${activeFaqIndex === 2 ? 'active' : ''}`}>
                <button className="faq-question" aria-expanded={activeFaqIndex === 2} onClick={() => toggleFaq(2)}>
                  <span>Can I redeem my basket token back to USDG at any time?</span>
                  <i className="fa-solid fa-chevron-down faq-chevron"></i>
                </button>
                <div className="faq-answer">
                  <p>Yes. The Xindex vault is non-custodial. You can use the redemption flow to exchange your basket position back toward USDG, subject to the configured route, available liquidity, and displayed execution terms.</p>
                </div>
              </div>

              <div className={`faq-item ${activeFaqIndex === 3 ? 'active' : ''}`}>
                <button className="faq-question" aria-expanded={activeFaqIndex === 3} onClick={() => toggleFaq(3)}>
                  <span>Why aren't you launching a token right now?</span>
                  <i className="fa-solid fa-chevron-down faq-chevron"></i>
                </button>
                <div className="faq-answer">
                  <p>Baskets are the product; the token is the fee engine. We are building product adoption, mint/redeem activity, and useful liquidity pairs first. A future token can be tied to protocol fees and basket listings after that foundation exists.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block section-cta-banner">
          <div className="section-container">
            <div className="cta-banner-box">
              <span className="cta-banner-tag">Start Holding Baskets Today</span>
              <h2 className="cta-banner-heading">Deposit USDG. Get One Basket. Hold, Trade, Pair.</h2>
              <p className="cta-banner-text">Start with $AI7, $MAG7, and $GOLD — three focused basket products on Robinhood Chain.</p>
              <div className="cta-banner-btns">
                <a href="#vault-terminal" className="btn-cta">
                  <span>Open Protocol App</span>
                  <svg className="cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="section-container footer-inner">
            <div className="footer-brand">
              <div className="footer-logo-row">
                <img src="/assets/xindex-logo.png" alt="Xindex Logo" width={36} height={36} />
                <span className="footer-name">Xindex</span>
              </div>
              <p className="footer-desc">One-asset exposure to verified Robinhood Stock Token baskets, built to hold, trade, and pair.</p>
              <div className="footer-status-pill">
                <span className="status-dot"></span> Canonical Robinhood Contract References
              </div>
            </div>

            <div className="footer-nav-col">
              <h4>3 Core Baskets</h4>
              <a href="#baskets">$AI7 Compute Basket</a>
              <a href="#baskets">$MAG7 Magnificent Seven</a>
              <a href="#baskets">$GOLD Tokenized Gold</a>
            </div>

            <div className="footer-nav-col">
              <h4>Protocol</h4>
              <a href="#vault-terminal">Mint &amp; Redeem Vault</a>
              <a href="#pairing-engine">Pairing Infrastructure</a>
              <a href="#tokenomics">Fee Engine Tokenomics</a>
              <a href="#architecture">Robinhood Contracts</a>
            </div>

            <div className="footer-nav-col">
              <h4>Connect</h4>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-x-twitter"></i> X / Twitter</a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-telegram"></i> Telegram</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"><i className="fa-brands fa-github"></i> GitHub</a>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="section-container bottom-inner">
              <span>&copy; 2026 Xindex Protocol. All rights reserved.</span>
              <span className="disclaimer">Robinhood Stock Tokens provide economic exposure, not share ownership or voting rights. Reference values are illustrative; execution may differ. Not financial advice.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
