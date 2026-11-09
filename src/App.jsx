import { useMemo, useRef, useState } from 'react';
import ingredients from './data/ingredients.json';
import { PROFILE_GROUPS, createEmptyProfile } from './data/profile-options.js';
import { classifyIngredients, getDefaultSections, groupIngredients, hasProfileSelection } from './lib/matching.js';
import { ingredientSearchText, normalizeName } from './lib/names.js';
import { validateIngredients } from './lib/validation.js';
import ProfileSidebar from './components/ProfileSidebar.jsx';
import IngredientTable from './components/IngredientTable.jsx';
import HomePage from './components/HomePage.jsx';

validateIngredients(ingredients);
const SEARCH_INDEX = new Map(ingredients.map(ingredient => [ingredient.id, ingredientSearchText(ingredient)]));

function SearchIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></svg>;
}

export default function App() {
  const [profile, setProfile] = useState(createEmptyProfile);
  const [query, setQuery] = useState('');
  const resultsRef = useRef(null);
  const pagesRef = useRef(null);
  const guideRef = useRef(null);
  const isCustom = hasProfileSelection(profile);
  const search = normalizeName(query.trim());
  const visibleIngredients = useMemo(() => search
    ? ingredients.filter(ingredient => SEARCH_INDEX.get(ingredient.id).includes(search))
    : ingredients, [search]);
  const result = useMemo(() => classifyIngredients(visibleIngredients, profile), [visibleIngredients, profile]);
  const fullSections = useMemo(() => getDefaultSections(visibleIngredients).filter(section => section.ingredients.length), [visibleIngredients]);
  const selectedLabels = PROFILE_GROUPS.flatMap(group => group.options
    .filter(option => group.type === 'single' ? profile[group.id] === option.value : profile[group.id].includes(option.value))
    .map(option => option.label));

  function scrollToTop(event) {
    event?.preventDefault();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    resultsRef.current?.scrollTo({ top: 0, behavior });
    pagesRef.current?.scrollTo({ top: guideRef.current?.offsetTop || 0, behavior });
  }

  function openGuide(event, { focusResults = true } = {}) {
    event?.preventDefault();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    pagesRef.current?.scrollTo({ top: guideRef.current?.offsetTop || 0, behavior });
    if (focusResults) resultsRef.current?.focus({ preventScroll: true });
  }

  function openHome(event) {
    event?.preventDefault();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    pagesRef.current?.scrollTo({ top: 0, behavior });
  }

  function resetAll() {
    setProfile(createEmptyProfile());
    setQuery('');
    scrollToTop();
  }

  function updateProfile(nextProfile) {
    setProfile(nextProfile);
    resultsRef.current?.scrollTo({ top: 0 });
  }

  function updateQuery(value) {
    setQuery(value);
    resultsRef.current?.scrollTo({ top: 0 });
    openGuide(undefined, { focusResults: false });
  }

  const status = isCustom
    ? `当前条件：${selectedLabels.join('、')}。推荐 ${result.recommended.length} 项，避开 ${result.avoid.length} 项。`
    : `当前显示 ${visibleIngredients.length} 项成分。`;

  return (
    <div className="app-shell">
      <div id="top" aria-hidden="true" />
      <a className="skip-link" href="#ingredient-guide" onClick={openGuide}>跳到成分表</a>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="wordmark" href="#top" onClick={openHome} aria-label="Shampoo Atlas，返回首页"><span lang="en">Shampoo Atlas</span></a>
          <div className="header-actions">
            <div className="search-field"><SearchIcon /><label className="sr-only" htmlFor="ingredient-search">搜索成分</label><input id="ingredient-search" type="search" value={query} onChange={event => updateQuery(event.target.value)} placeholder="搜索成分" />{query ? <button className="search-clear" type="button" onClick={() => updateQuery('')} aria-label="清空搜索">×</button> : null}</div>
            <button className="header-link" type="button" onClick={resetAll}>全部成分</button>
          </div>
        </div>
      </header>

      <main className="page-deck" ref={pagesRef}>
        <HomePage onExplore={openGuide} />
        <section className="guide-page" id="ingredient-guide" ref={guideRef} aria-label="成分资料库">
          <div className="workspace">
            <h2 className="sr-only">洗发水成分表</h2>
            <ProfileSidebar profile={profile} onChange={updateProfile} onReset={resetAll} hasSelection={isCustom || Boolean(query)} />
            <div className="results-column" id="ingredient-results" ref={resultsRef} tabIndex={-1}>
              <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</p>

              {isCustom ? (
                <div className="custom-tables" data-view="custom">
                  <IngredientTable sections={groupIngredients(result.recommended)} tone="recommended" title="推荐" headingId="recommended" />
                  <IngredientTable sections={groupIngredients(result.avoid)} tone="avoid" title="避开" headingId="avoid" />
                </div>
              ) : <div data-view="all"><IngredientTable sections={fullSections} title="全部成分" headingId="all" showHeading={false} sideModules /></div>}

              <footer className="results-footer"><a href="#ingredient-guide" onClick={scrollToTop}>返回页首 ↑</a></footer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
