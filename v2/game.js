'use strict';

const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  hasNote: false,
  hasKey: false,
  safeOpen: false,
  escaped: false,
  hintIndex: 0,
  dials: [0, 0, 0],
};

const CODE = '842';

const HINTS = [
  '机を調べて、メモを手に入れよう。',
  'メモの「CLOCK → RED → CLOUD」は、時計・赤い本・雲の順で数字を読む合図。',
  '時計は8時。本棚の赤い本を調べると4。窓には雲が2つ。',
  '金庫のコードは 842。ダイヤルを回して合わせよう。',
  '金庫を開けると鍵が手に入る。鍵を持って扉を調べれば脱出できる。',
];

const EXAMINE = {
  'hs-window': () => {
    openModal('窓', '外は曇り空。窓ガラスに雲が2つ浮かんでいる。');
  },
  'hs-clock': () => {
    openModal('壁掛け時計', '短針は8、長針は12。今はちょうど8時を指している。');
  },
  'hs-painting': () => {
    openModal('絵', 'ただの風景画だ。裏に何かあるか探したが、何も出てこない。');
  },
  'hs-shelf': () => {
    openModal('本棚', '本棚の赤い本を調べよう。数字の「4」が手がかりになる。');
  },
  'hs-desk': () => {
    if (!state.hasNote) {
      state.hasNote = true;
      setSlot('slot-note', true);
      openModal('机', '引き出しにメモが1枚。『CLOCK → RED → CLOUD』と書かれている。');
    } else {
      openModal('机', 'もう机には何も残っていない。');
    }
  },
  'hs-safe': () => {
    if (state.safeOpen) {
      openModal('金庫', '金庫はすでに開いている。');
    } else {
      openSafe();
    }
  },
  'hs-door': () => {
    if (state.escaped) {
      openModal('扉', 'あなたはすでに外へ出ている。');
    } else if (state.hasKey) {
      state.escaped = true;
      openWin();
    } else {
      openModal('扉', '扉は鍵がかかっていて開かない。鍵を探さなければ。');
    }
  },
};

function setSlot(id, filled) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle('filled', filled);
  el.classList.toggle('empty', !filled);
}

function setMessage(text) {
  const el = $('message');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(setMessage._t);
  setMessage._t = setTimeout(() => el.classList.remove('show'), 1800);
}

function openModal(title, body) {
  const modal = $('modal');
  if (!modal) return;
  const t = $('modal-title');
  const b = $('modal-body');
  const a = $('modal-actions');
  if (t) t.textContent = title;
  if (b) b.textContent = body;
  if (a) {
    a.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = '閉じる';
    btn.addEventListener('click', closeModal);
    a.appendChild(btn);
  }
  modal.hidden = false;
}

function closeModal() {
  const modal = $('modal');
  if (modal) modal.hidden = true;
}

function openSafe() {
  const modal = $('safe-modal');
  if (!modal) return;
  const t = $('safe-title');
  if (t) t.textContent = '金庫';
  const fb = $('safe-feedback');
  if (fb) {
    fb.textContent = 'ダイヤルを回して3桁のコードを合わせよう。';
    fb.classList.remove('ok', 'ng');
  }
  modal.hidden = false;
}

function closeSafe() {
  const modal = $('safe-modal');
  if (modal) modal.hidden = true;
}

function openWin() {
  const modal = $('win-modal');
  if (!modal) return;
  const t = $('win-title');
  if (t) t.textContent = '脱出成功！';
  modal.hidden = false;
}

function closeWin() {
  const modal = $('win-modal');
  if (modal) modal.hidden = true;
}

function openHint() {
  const panel = $('hint-panel');
  const list = $('hint-list');
  if (!panel || !list) return;
  list.innerHTML = '';
  const shown = Math.min(state.hintIndex + 1, HINTS.length);
  for (let i = 0; i < shown; i++) {
    const li = document.createElement('li');
    li.textContent = HINTS[i];
    list.appendChild(li);
  }
  panel.hidden = false;
}

function closeHint() {
  const panel = $('hint-panel');
  if (panel) panel.hidden = true;
}

function nextHint() {
  if (state.hintIndex < HINTS.length - 1) {
    state.hintIndex++;
    openHint();
  } else {
    setMessage('これ以上ヒントはありません。');
  }
}

function spinDial(index, dir) {
  let v = state.dials[index] + dir;
  if (v > 9) v = 0;
  if (v < 0) v = 9;
  state.dials[index] = v;
  const el = $('d' + index);
  if (el) el.textContent = String(v);
}

function checkSafe() {
  const fb = $('safe-feedback');
  const code = state.dials.join('');
  if (code === CODE) {
    if (fb) {
      fb.textContent = 'ガチャ…金庫が開いた！';
      fb.classList.add('ok');
      fb.classList.remove('ng');
    }
    if (!state.safeOpen) {
      state.safeOpen = true;
      state.hasKey = true;
      setSlot('slot-key', true);
      setMessage('金庫から鍵を手に入れた。');
    }
  } else {
    if (fb) {
      fb.textContent = 'コードが違う…（' + code + '）';
      fb.classList.add('ng');
      fb.classList.remove('ok');
    }
  }
}

function resetGame() {
  state.hasNote = false;
  state.hasKey = false;
  state.safeOpen = false;
  state.escaped = false;
  state.hintIndex = 0;
  state.dials = [0, 0, 0];

  setSlot('slot-note', false);
  setSlot('slot-key', false);

  for (let i = 0; i < 3; i++) {
    const el = $('d' + i);
    if (el) el.textContent = '0';
  }

  const fb = $('safe-feedback');
  if (fb) {
    fb.textContent = '';
    fb.classList.remove('ok', 'ng');
  }

  closeModal();
  closeSafe();
  closeWin();
  closeHint();

  const msg = $('message');
  if (msg) {
    msg.textContent = '';
    msg.classList.remove('show');
  }

  setMessage('部屋を調べて、脱出の鍵を探そう。');
}

function wire() {
  // 部屋のオブジェクト
  Object.keys(EXAMINE).forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('click', EXAMINE[id]);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        EXAMINE[id]();
      }
    });
  });

  // ボタン
  const bind = (id, fn) => {
    const el = $(id);
    if (el) el.addEventListener('click', fn);
  };

  bind('btn-hint', nextHint);
  bind('btn-hint-close', closeHint);
  bind('btn-reset', resetGame);
  bind('safe-close', closeSafe);
  bind('safe-open', checkSafe);
  bind('win-again', resetGame);

  // ダイヤル
  $$('.dial-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pos = parseInt(btn.dataset.pos, 10);
      const dir = parseInt(btn.dataset.dir, 10);
      if (!Number.isNaN(pos) && !Number.isNaN(dir)) {
        spinDial(pos, dir);
      }
    });
  });

  // 背景クリックでモーダルを閉じる
  ['modal', 'safe-modal', 'win-modal', 'hint-panel'].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        if (id === 'modal') closeModal();
        else if (id === 'safe-modal') closeSafe();
        else if (id === 'win-modal') closeWin();
        else if (id === 'hint-panel') closeHint();
      }
    });
  });

  // Esc で閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSafe();
      closeWin();
      closeHint();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wire();
  resetGame();
});
