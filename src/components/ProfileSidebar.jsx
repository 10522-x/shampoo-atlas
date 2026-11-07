import { PROFILE_GROUPS } from '../data/profile-options.js';

export default function ProfileSidebar({ profile, onChange, onReset, hasSelection }) {
  function update(group, value) {
    onChange(previous => {
      if (group.type === 'single') return { ...previous, [group.id]: value };
      const values = previous[group.id];
      return {
        ...previous,
        [group.id]: values.includes(value)
          ? values.filter(selected => selected !== value)
          : [...values, value],
      };
    });
  }

  return (
    <aside className="profile-sidebar" aria-label="头皮与发质选择">
      <h2 className="sr-only">筛选条件</h2>
      <div className="profile-groups">
        {PROFILE_GROUPS.map(group => (
          <fieldset key={group.id} className={`profile-group profile-group--${group.id}`}>
            <legend>{group.label}</legend>
            <div className="profile-options">
              {group.type === 'single' ? (
                <label className="profile-option" data-checked={profile[group.id] === ''}>
                  <input type="radio" name={group.id} value="" checked={profile[group.id] === ''} onChange={() => update(group, '')} />
                  <span>不限</span>
                </label>
              ) : null}
              {group.options.map(option => {
                const selected = group.type === 'single'
                  ? profile[group.id] === option.value
                  : profile[group.id].includes(option.value);
                return (
                  <label key={option.id} className="profile-option" data-checked={selected}>
                    <input type={group.type === 'single' ? 'radio' : 'checkbox'} name={group.id} value={option.value} checked={selected} onChange={() => update(group, option.value)} />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <button type="button" className="text-button reset-button" onClick={onReset} disabled={!hasSelection}>清空</button>
    </aside>
  );
}
