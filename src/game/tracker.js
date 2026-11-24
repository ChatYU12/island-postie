/* Errand card (current errand and step), stamp counter, and short toasts. */

export function createTracker(root) {
  const card = root.querySelector('#tracker');
  const title = card.querySelector('.tracker-title');
  const step = card.querySelector('.tracker-step');
  const text = card.querySelector('.tracker-text');
  const note = card.querySelector('.tracker-note');
  const stamps = root.querySelector('#stamp-count');
  const toasts = root.querySelector('#toasts');

  function show(info, hint) {
    card.hidden = false;
    if (info) {
      title.textContent = info.title;
      step.textContent = `${info.step}/${info.steps}`;
      text.textContent = info.text;
      note.textContent = info.note || '';
      note.hidden = !info.note;
      card.dataset.state = 'active';
    } else {
      title.textContent = '暂时没有委托';
      step.textContent = '';
      text.textContent = hint || '在岛上逛逛，和居民聊聊天。';
      note.hidden = true;
      card.dataset.state = 'idle';
    }
  }

  function setStamps(found, total) {
    stamps.textContent = `${found}/${total}`;
  }

  function toast(message) {
    const el = document.createElement('p');
    el.className = 'toast';
    el.textContent = message;
    toasts.appendChild(el);
    setTimeout(() => el.classList.add('is-leaving'), 4200);
    setTimeout(() => el.remove(), 4800);
    while (toasts.children.length > 3) toasts.firstChild.remove();
  }

  function hide() { card.hidden = true; }

  return { show, setStamps, toast, hide };
}
