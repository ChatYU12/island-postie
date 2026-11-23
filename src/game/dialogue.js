/* The "E 说话" prompt and the dialogue box. Plain DOM over the canvas. */

export function createDialogue(root) {
  const prompt = root.querySelector('#prompt');
  const box = root.querySelector('#dialogue');
  const speaker = box.querySelector('.dialogue-speaker');
  const title = box.querySelector('.dialogue-title');
  const text = box.querySelector('.dialogue-text');
  let onClose = null;

  function showPrompt(name) {
    if (!name) { prompt.hidden = true; return; }
    prompt.querySelector('.prompt-name').textContent = name;
    prompt.hidden = false;
  }

  function open(line, closed) {
    speaker.textContent = line.speaker;
    title.textContent = line.title || '';
    text.textContent = line.text;
    box.hidden = false;
    prompt.hidden = true;
    onClose = closed || null;
    box.querySelector('button').focus({ preventScroll: true });
  }

  function close() {
    if (box.hidden) return false;
    box.hidden = true;
    const done = onClose; onClose = null;
    if (done) done();
    return true;
  }

  box.querySelector('button').addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (box.hidden) return;
    if (['Escape', 'KeyE', 'Space', 'Enter'].includes(event.code) || event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  return { showPrompt, open, close, get isOpen() { return !box.hidden; } };
}
