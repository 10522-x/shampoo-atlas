export default function HomePage({ onExplore }) {
  return (
    <section className="home-page" aria-labelledby="home-title">
      <div className="home-copy">
        <h1 className="home-title" id="home-title">
          <span>好好洗发，</span>
          <span>从懂成分开始。</span>
        </h1>
        <button className="home-explore" type="button" onClick={onExplore}>
          <span className="home-explore-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v15m-6-6 6 6 6-6" /></svg>
          </span>
          <span>查看成分表</span>
        </button>
      </div>
      <div className="home-artwork">
        <img src="/illustrations/hair-garden.svg" alt="长发女孩在花园里享受轻松的洗护时光" width="1400" height="1000" fetchPriority="high" />
      </div>
    </section>
  );
}
