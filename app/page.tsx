"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

type IconName =
  | "arrow"
  | "bag"
  | "bolt"
  | "calendar"
  | "chart"
  | "check"
  | "chevron"
  | "clock"
  | "coffee"
  | "download"
  | "grid"
  | "light"
  | "menu"
  | "plus"
  | "report"
  | "spark"
  | "trend";

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    bolt: <path d="m13 2-8 11h7l-1 9 8-12h-7l1-8Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    coffee: <><path d="M4 9h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V9Z" /><path d="M17 11h1a3 3 0 0 1 0 6h-2M7 3v3M11 3v3" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 20h14" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    light: <><path d="M9 18h6M10 22h4" /><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.8.6-1.2 1.2-1.4 2.5h-4.2c-.2-1.3-.6-1.9-1.4-2.5Z" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    report: <><path d="M6 3h9l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    spark: <><path d="m12 3 1.4 4.1L17 9l-3.6 1.9L12 15l-1.4-4.1L7 9l3.6-1.9L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      {paths[name]}
    </svg>
  );
}

const weeklyData = [44, 59, 51, 72, 63, 88, 54];
const products = [
  { name: "Croissants", units: 18, cost: 32.4, color: "#f0a550" },
  { name: "Oat milk", units: 6, cost: 19.2, color: "#6f8f72" },
  { name: "Pain au chocolat", units: 9, cost: 17.55, color: "#875c48" },
  { name: "Blueberry muffins", units: 7, cost: 14.7, color: "#9b7ba5" },
];

function Logo() {
  return (
    <a className="logo" href="#">
      <span className="logo-mark">
        <Icon name="coffee" size={18} strokeWidth={2.2} />
      </span>
      <span>anteiku</span>
    </a>
  );
}

function DashboardPreview() {
  const [range, setRange] = useState("This week");
  const [toast, setToast] = useState("");

  const total = useMemo(
    () => products.reduce((sum, product) => sum + product.cost, 0),
    [],
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <div className="dashboard-shell" id="dashboard">
      <aside className="sidebar">
        <Logo />
        <nav>
          <a className="nav-item active" href="#dashboard"><Icon name="grid" />Overview</a>
          <a className="nav-item" href="#waste"><Icon name="bag" />Waste log</a>
          <a className="nav-item" href="#insights"><Icon name="spark" />Insights<span className="new-pill">3</span></a>
          <a className="nav-item" href="#reports"><Icon name="report" />Reports</a>
        </nav>
        <div className="sidebar-foot">
          <div className="location-avatar">BL</div>
          <div><strong>Brume &amp; Lait</strong><span>Paris, France</span></div>
          <Icon name="chevron" size={16} />
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="mobile-dash-head"><Logo /><Icon name="menu" /></div>
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Monday, 9 June</span>
            <h2>Good morning, Elise.</h2>
            <p>Here’s where your margin went this week.</p>
          </div>
          <div className="header-actions">
            <label className="range-select">
              <Icon name="calendar" size={17} />
              <select value={range} onChange={(event) => setRange(event.target.value)}>
                <option>This week</option>
                <option>Last week</option>
                <option>This month</option>
              </select>
            </label>
            <button className="button primary small" onClick={() => notify("Waste log opened")}>
              <Icon name="plus" size={17} />Log waste
            </button>
          </div>
        </header>

        <section className="metric-grid">
          <article className="metric-card featured">
            <div className="metric-top"><span>Waste cost</span><span className="icon-chip"><Icon name="bag" /></span></div>
            <strong>€{total.toFixed(2)}</strong>
            <p><span className="down">↓ 12.4%</span> vs last week</p>
            <div className="mini-line">
              <svg viewBox="0 0 220 42" preserveAspectRatio="none">
                <path d="M0 31 C25 26, 28 13, 55 21 S91 39, 111 24 S143 7, 164 17 S197 28, 220 6" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-top"><span>Items wasted</span><span className="icon-chip neutral"><Icon name="chart" /></span></div>
            <strong>40</strong>
            <p><span className="down">↓ 8 items</span> vs last week</p>
          </article>
          <article className="metric-card">
            <div className="metric-top"><span>Projected annual loss</span><span className="icon-chip warm"><Icon name="trend" /></span></div>
            <strong>€4,362</strong>
            <p>Based on the last 8 weeks</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel chart-panel">
            <div className="panel-head">
              <div><h3>Waste cost trend</h3><p>Your daily losses this week</p></div>
              <span className="target"><span /> €45 daily target</span>
            </div>
            <div className="bar-chart">
              <div className="chart-y"><span>€100</span><span>€75</span><span>€50</span><span>€25</span><span>€0</span></div>
              <div className="bars">
                <div className="target-line" />
                {weeklyData.map((value, index) => (
                  <div className="bar-column" key={`day-${index}`}>
                    <span className={`bar ${index === 5 ? "peak" : ""}`} style={{ height: `${value}%` }}>
                      {index === 5 && <em>€61</em>}
                    </span>
                    <small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel insight-panel" id="insights">
            <div className="insight-label"><Icon name="spark" size={17} />This week’s opportunity</div>
            <h3>Bake fewer croissants on Mondays.</h3>
            <p>You discard 22% more croissants on Mondays than your weekly average.</p>
            <div className="impact-box">
              <span>Estimated annual saving</span>
              <strong>€842</strong>
            </div>
            <button className="text-button" onClick={() => notify("Recommendation marked as reviewed")}>
              Review recommendation <Icon name="arrow" size={17} />
            </button>
          </article>
        </section>

        <section className="panel products-panel" id="waste">
          <div className="panel-head">
            <div><h3>Where your money went</h3><p>Products with the highest waste cost</p></div>
            <button className="text-button">View full log <Icon name="arrow" size={16} /></button>
          </div>
          <div className="product-list">
            {products.map((product, index) => (
              <div className="product-row" key={product.name}>
                <span className="rank">{index + 1}</span>
                <span className="product-dot" style={{ background: product.color }} />
                <strong>{product.name}</strong>
                <span>{product.units} items</span>
                <div className="product-bar"><i style={{ width: `${(product.cost / products[0].cost) * 100}%`, background: product.color }} /></div>
                <b>€{product.cost.toFixed(2)}</b>
              </div>
            ))}
          </div>
        </section>
      </main>
      {toast && <div className="toast"><Icon name="check" size={18} />{toast}</div>}
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitWaitlist = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <>
      <header className="site-header">
        <Logo />
        <nav className={menuOpen ? "site-nav open" : "site-nav"}>
          <a href="#product">Product</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          <a className="login-link" href="/login">Log in</a>
          <a className="button primary nav-cta" href="#calculator">Calculate my losses</a>
          <button className="menu-button" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "plus" : "menu"} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-noise" />
          <div className="hero-copy">
            <div className="announcement"><span>New</span> Built for independent cafés <Icon name="arrow" size={15} /></div>
            <h1>Find the leaks in your <em>café profit.</em></h1>
            <p>Track what gets thrown away, see exactly what it costs, and make smarter production decisions. No spreadsheets. No guesswork.</p>
            <div className="hero-actions">
              <a className="button primary large" href="#calculator">Calculate my waste losses <Icon name="arrow" size={19} /></a>
              <a className="button ghost large" href="#product"><span className="play">▶</span>See how it works</a>
            </div>
            <div className="proof"><span className="proof-avatars"><i>AM</i><i>LB</i><i>CK</i></span><span><b>Made with café owners</b><small>Simple enough for the morning rush</small></span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="floating-note note-one">
              <span className="float-icon green"><Icon name="trend" size={18} /></span>
              <span><small>This month’s saving</small><b>+ €286</b></span>
            </div>
            <div className="floating-note note-two">
              <span className="float-icon orange"><Icon name="light" size={18} /></span>
              <span><small>Smart insight</small><b>Reduce Monday bake</b></span>
            </div>
            <div className="phone">
              <div className="phone-top"><span>9:41</span><i /><span>● ◒</span></div>
              <div className="phone-content">
                <div className="phone-greeting"><span>Good morning, Elise</span><b>Today</b></div>
                <div className="phone-loss">
                  <span>WASTE COST · THIS WEEK</span>
                  <strong>€83.85</strong>
                  <small>↓ 12.4% from last week</small>
                  <div className="phone-bars">{[35, 55, 42, 68, 49, 81, 30].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
                </div>
                <div className="phone-action"><span className="float-icon dark"><Icon name="plus" /></span><div><b>Log today’s waste</b><small>Takes less than 30 seconds</small></div><Icon name="chevron" /></div>
                <span className="phone-section-title">TOP WASTE ITEMS</span>
                {products.slice(0, 3).map((product) => (
                  <div className="phone-product" key={product.name}>
                    <span className="product-dot" style={{ background: product.color }} /><span><b>{product.name}</b><small>{product.units} items</small></span><strong>€{product.cost.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>Purpose-built for</span><b><Icon name="coffee" />Cafés</b><b><Icon name="bag" />Bakeries</b><b><Icon name="bolt" />Coffee shops</b><b><Icon name="grid" />1–10 locations</b>
        </section>

        <section className="section problem-section" id="product">
          <div className="section-label">THE REAL PROBLEM</div>
          <div className="section-intro split">
            <h2>Your bin is quietly eating your margin.</h2>
            <p>Most cafés know they waste food. Almost none know what it actually costs them, which days hurt most, or what to change tomorrow.</p>
          </div>
          <div className="problem-grid">
            <article><span className="number">01</span><Icon name="clock" size={28} /><h3>Waste gets logged too late</h3><p>Paper notes and memory leave blind spots. Anteiku takes less than 30 seconds at close.</p></article>
            <article><span className="number">02</span><Icon name="chart" size={28} /><h3>Costs stay invisible</h3><p>See waste in euros, not just units, so every decision connects directly to your margin.</p></article>
            <article><span className="number">03</span><Icon name="light" size={28} /><h3>Data never becomes action</h3><p>Get practical recommendations with an estimated financial impact, not another spreadsheet.</p></article>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-label light">YOUR PROFIT, MADE VISIBLE</div>
          <div className="section-intro centered light-copy">
            <h2>Everything you need to waste less. Nothing you don’t.</h2>
            <p>A calm, focused view of where money is going and what to do next.</p>
          </div>
          <DashboardPreview />
        </section>

        <section className="section steps-section" id="how">
          <div className="section-label">HOW IT WORKS</div>
          <div className="section-intro centered"><h2>From leftovers to better decisions.</h2><p>Start learning from your waste in a single shift.</p></div>
          <div className="steps">
            <article><span>1</span><div className="step-icon"><Icon name="plus" size={30} /></div><h3>Log what’s left</h3><p>Choose a product, quantity, and reason. Your team is done in seconds.</p></article>
            <article><span>2</span><div className="step-icon"><Icon name="chart" size={30} /></div><h3>See the true cost</h3><p>Anteiku turns daily waste into clear weekly and monthly profit leakage.</p></article>
            <article><span>3</span><div className="step-icon"><Icon name="spark" size={30} /></div><h3>Act on smart insights</h3><p>Know what to make less of, on which days, and how much you could save.</p></article>
          </div>
        </section>

        <section className="section pricing-section" id="pricing">
          <div className="pricing-copy">
            <div className="section-label">SIMPLE PRICING</div>
            <h2>Less than the cost of one wasted croissant a day.</h2>
            <p>Everything an independent café needs to find and fix profit leaks. No setup fee. Cancel any time.</p>
            <ul>
              <li><Icon name="check" />Unlimited waste logging</li>
              <li><Icon name="check" />Weekly smart recommendations</li>
              <li><Icon name="check" />Reports and CSV exports</li>
              <li><Icon name="check" />Up to 3 team members</li>
            </ul>
          </div>
          <article className="price-card">
            <span className="popular">EARLY ACCESS</span>
            <p>For independent operators</p>
            <div className="price"><span>€</span><strong>29</strong><small>/ month</small></div>
            <span className="trial">14 days free · no card required</span>
            <a className="button primary large full" href="#calculator">Start finding my losses <Icon name="arrow" /></a>
            <small>Usually pays for itself in the first week.</small>
          </article>
        </section>

        <section className="section faq-section" id="faq">
          <div><div className="section-label">COMMON QUESTIONS</div><h2>A few things you might be wondering.</h2></div>
          <div className="faq-list">
            {[
              ["Do I need to track my full inventory?", "No. Anteiku is designed around quick daily waste logging, without the setup burden of a full inventory system."],
              ["How long does it take to get started?", "Add your core products and costs in a few minutes. You can record your first waste log the same day."],
              ["Can my team log waste too?", "Yes. The starter plan includes three team members, each with a simple, mobile-friendly logging flow."],
              [
                "How do you calculate waste cost?",
                "Each waste log multiplies the quantity you enter by the unit cost on your menu (ingredient or prep cost, not selling price). That cost is snapshotted when you save, so reports stay accurate even if you change prices later. Daily charts group logs by local calendar day.",
              ],
              [
                "How do you calculate carbon (CO₂e) from waste?",
                "We estimate embodied greenhouse gases in wasted food: quantity × grams CO₂e per menu unit. New products get EU food-category benchmarks (Agribalyse / PEF-style averages). You can override factors on each product and mark them as manual, supplier, or verified. Throwing food away does not save CO₂ — it counts carbon already spent growing, processing, and delivering that food. You only reduce this number by wasting less.",
              ],
              [
                "Is this ready for EU green-claims rules (EmpCo)?",
                "Anteiku tracks and documents methodology so you can prepare for the Empowering Consumers Directive (EU 2024/825), in force from 27 September 2026. Benchmarks are fine for internal tracking; customer-facing carbon labels need verified or supplier-backed data. The Carbon compliance hub in the dashboard shows your readiness checklist.",
              ],
              [
                "What are the driving and phone-charge equivalencies?",
                "They are simple illustrations to help teams understand scale — for example ~120 g CO₂e per passenger-km and ~8 g CO₂e per smartphone charge. They are not regulatory conversions and should not be published as formal claims without your own substantiation.",
              ],
            ].map(([question, answer]) => (
              <details key={question}><summary>{question}<Icon name="plus" /></summary><p>{answer}</p></details>
            ))}
          </div>
        </section>

        <section className="cta-section" id="calculator">
          <div>
            <span className="section-label light">STOP GUESSING</span>
            <h2>How much profit went in the bin this week?</h2>
            <p>Join the early access list and be first to calculate your true waste losses.</p>
          </div>
          {submitted ? (
            <div className="success-message"><span><Icon name="check" /></span><div><b>You’re on the list.</b><small>We’ll be in touch with early access details.</small></div></div>
          ) : (
            <form onSubmit={submitWaitlist}>
              <input aria-label="Work email" type="email" placeholder="you@yourcafe.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <button className="button cream large" type="submit">Get early access <Icon name="arrow" /></button>
            </form>
          )}
        </section>
      </main>

      <footer>
        <Logo />
        <p>Profit clarity for independent cafés.</p>
        <span>© 2026 Anteiku</span>
      </footer>
    </>
  );
}
