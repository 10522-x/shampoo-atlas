import { useId } from 'react';
import { MODULES } from '../data/modules.js';

const COLUMN_WIDTHS = ['20%', '16%', '13%', '13%', '25%', '13%'];
const COLUMN_TITLES = ['成分名称', '主要作用', '适合情况', '避开情况', '配伍与条件', '资料来源'];

export default function IngredientTable({
  sections = [],
  tone = 'default',
  title = '全部成分',
  headingId,
  showHeading = true,
  sideModules = false,
}) {
  const generatedId = useId();
  const titleId = headingId || `ingredient-table-${generatedId}`;
  const visibleSections = sections.filter(section => section.ingredients?.length);
  const ingredientCount = visibleSections.reduce((count, section) => count + section.ingredients.length, 0);

  return (
    <section className="ingredient-section" data-tone={tone} aria-labelledby={titleId}>
      {showHeading ? <div className="section-heading">
        <h2 className="section-title" id={titleId}>{title}</h2>
        <span className="section-count">{ingredientCount} 条成分</span>
      </div> : <h2 className="sr-only" id={titleId}>{title}</h2>}

      <div className="table-scroll" tabIndex={0} role="region" aria-label={`${title}表格，可横向滚动`}>
        <table className="ingredient-table">
          <caption className="sr-only">{title}：成分名称、作用、适合与避开情况、配伍条件及资料来源</caption>
          <colgroup>
            {sideModules && <col style={{ width: '40px' }} />}
            {COLUMN_WIDTHS.map((width, index) => <col key={COLUMN_TITLES[index]} style={{ width: sideModules ? `calc(${width} - ${parseFloat(width) * .4}px)` : width }} />)}
          </colgroup>
          <thead>
            <tr>
              {sideModules && <th className="module-side-spacer" aria-hidden="true" />}
              {COLUMN_TITLES.map(column => <th key={column} scope="col">{column}</th>)}
            </tr>
          </thead>

          {visibleSections.map((section, index) => {
            const moduleIndex = MODULES.findIndex(module => module.id === section.id);
            const moduleNumber = String((moduleIndex >= 0 ? moduleIndex : index) + 1).padStart(2, '0');
            const moduleName = section.title || section.name;

            return (
              <tbody key={section.id}>
                {!sideModules && <tr className="module-divider" id={`${titleId}-${section.id}`}>
                  <th scope="rowgroup" colSpan={6}>
                    <div className="module-heading-row">
                      <span><span className="module-number" aria-hidden="true">{moduleNumber}</span><span className="module-name">{section.title || section.name}</span></span>
                    </div>
                    {section.description && <span className="module-description">{section.description}</span>}
                  </th>
                </tr>}

                {section.ingredients.map((ingredient, rowIndex) => (
                  <tr key={ingredient.id} id={sideModules && rowIndex === 0 ? `${titleId}-${section.id}` : undefined}>
                    {sideModules && rowIndex === 0 && (
                      <th className="module-side-cell" scope="rowgroup" rowSpan={section.ingredients.length}>
                        <div className="module-side-track">
                          <span className="module-side-label" tabIndex={0} role="note" aria-label={`${moduleNumber} ${moduleName}。${section.description || ''}`} title={section.description ? `${moduleName}：${section.description}` : moduleName}>
                            <span className="module-side-number" aria-hidden="true">{moduleNumber}</span>
                            <span className="module-side-name">{moduleName}</span>
                          </span>
                        </div>
                      </th>
                    )}
                    <td>
                      <span className="ingredient-name">{ingredient.cn}</span>
                      <span className="ingredient-inci" lang="en">{ingredient.inci}</span>
                    </td>
                    <td>{ingredient.func}</td>
                    <td>
                      <ul className="ingredient-tags">
                        {(ingredient.best || []).map((tag, tagIndex) => (
                          <li className="ingredient-tag" key={`${tagIndex}-${tag}`}>{tag}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="ingredient-tags">
                        {(ingredient.avoid || []).map((tag, tagIndex) => (
                          <li className="ingredient-tag" key={`${tagIndex}-${tag}`}>{tag}</li>
                        ))}
                      </ul>
                    </td>
                    <td>{ingredient.synergy}</td>
                    <td className="ingredient-source">{ingredient.src}</td>
                  </tr>
                ))}
              </tbody>
            );
          })}

          {ingredientCount === 0 && (
            <tbody>
              <tr>
                <td colSpan={sideModules ? 7 : 6}>
                  <p className="empty-state">当前选择下暂无匹配成分。</p>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </section>
  );
}
