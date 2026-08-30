(function () {
  'use strict';

  var state = {
    hasKey: false,
    safeOpen: false,
    dials: [0, 0, 0],
    memoSeen: false,
    hintLevel: 0
  };

  var stage2 = null;
  var refs = {};
  var winModal = null;
  var winAgain = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function byId(id) { return document.getElementById(id); }

  function button(label, cls, fn) {
    var b = el('button', cls || 'v2-btn', label);
    b.type = 'button';
    if (fn) b.addEventListener('click', fn);
    return b;
  }

  function tap(node, fn) {
    if (!node) return;
    node.addEventListener('click', fn);
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn(e);
      }
    });
  }

  function buildObject(id, label) {
    var b = el('button', 'v2-obj');
    b.type = 'button';
    b.id = id;
    b.setAttribute('aria-label', label);
    b.appendChild(el('div', 'v2-obj-art'));
    b.appendChild(el('div', 'v2-obj-name', label));
    return b;
  }

  function setMsg(t) { if (refs.msg) refs.msg.textContent = t; }
  function setHint(t) { if (refs.hint) refs.hint.textContent = t; }

  function refreshInventory() {
    refs.inv.textContent = state.hasKey
      ? '持ち物　🔑 鍵　📝 メモ'
      : (state.memoSeen ? '持ち物　📝 メモ' : '持ち物　なし');
  }

  function openModal(title, body, art, actions) {
    refs.modalTitle.textContent = title;
    refs.modalBody.textContent = body;
    refs.modalArt.textContent = art || '🔎';
    refs.modalActions.innerHTML = '';
    (actions || []).forEach(function (a) { refs.modalActions.appendChild(a); });
    refs.modal.hidden = false;
  }

  function closeModal() { refs.modal.hidden = true; }

  function openHint() {
    state.hintLevel = Math.min(state.hintLevel + 1, 3);
    var body = state.hintLevel === 1
      ? 'まずは机のメモを見直そう。順番が書いてある。'
      : state.hintLevel === 2
      ? '青い箱、星が3つある額、本棚を順番に調べよう。'
      : 'BLUE=6、STAR=3、BOOK=1。金庫の番号は631。';

    setHint(body);
    openModal('ヒント', body, '💡', [
      button('閉じる', 'v2-btn v2-btn-primary', closeModal)
    ]);
  }

  function updateDial(i) {
    if (refs.dials[i]) refs.dials[i].textContent = String(state.dials[i]);
  }

  function changeDial(i, d) {
    state.dials[i] = (state.dials[i] + d + 10) % 10;
    updateDial(i);
  }

  function openSafe() {
    refs.safeFeedback.textContent = state.safeOpen
      ? '金庫はもう開いている。'
      : '3桁の番号を入力して金庫を開けよう。';
    refs.safeModal.hidden = false;
  }

  function closeSafe() { refs.safeModal.hidden = true; }

  function trySafe() {
    if (state.dials.join('') === '631') {
      state.safeOpen = true;
      state.hasKey = true;
      refreshInventory();
      closeSafe();
      setMsg('金庫が開いた。鍵を手に入れたので扉を調べよう。');
      openModal('金庫が開いた', '番号631で金庫が開いた。中から鍵を手に入れた。', '🔑', [
        button('続ける', 'v2-btn v2-btn-primary', closeModal)
      ]);
    } else {
      refs.safeFeedback.textContent = '開かない。番号をもう一度確かめよう。';
    }
  }

  function launchConfetti() {
    refs.confetti.innerHTML = '';
    for (var i = 0; i < 28; i++) {
      var p = el('span', 'v2-confetti-piece');
      p.style.left = (3 + Math.random() * 94) + '%';
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      refs.confetti.appendChild(p);
    }
    refs.confetti.hidden = false;
  }

  function stopConfetti() {
    refs.confetti.innerHTML = '';
    refs.confetti.hidden = true;
  }

  function restartAll() {
    closeModal();
    closeSafe();
    stopConfetti();
    resetStage2();
    stage2.hidden = true;
    if (winAgain) winAgain.click();
  }

  function examine(scene) {
    if (scene === 'desk') {
      state.memoSeen = true;
      refreshInventory();
      setMsg('机のメモを見つけた。');
      openModal('机のメモ', '「BLUE → STAR → BOOK」と書かれている。', '📝', [
        button('閉じる', 'v2-btn v2-btn-primary', closeModal)
      ]);
    } else if (scene === 'blue') {
      openModal('青い箱', '青い箱には「BLUE = 6」と書かれている。', '🟦', [
        button('閉じる', 'v2-btn v2-btn-primary', closeModal)
      ]);
    } else if (scene === 'star') {
      openModal('星の額縁', '額には星が3つ並んでいる。つまり「STAR = 3」。', '⭐', [
        button('閉じる', 'v2-btn v2-btn-primary', closeModal)
      ]);
    } else if (scene === 'book') {
      openModal('本棚', '目立つ本が1つある。つまり「BOOK = 1」。', '📚', [
        button('閉じる', 'v2-btn v2-btn-primary', closeModal)
      ]);
    } else if (scene === 'safe') {
      openSafe();
    } else if (scene === 'door') {
      if (state.hasKey) {
        launchConfetti();
        openModal('2部屋クリア！', '2つの部屋から脱出した。', '🎉', [
          button('最初からあそぶ', 'v2-btn v2-btn-primary', restartAll),
          button('閉じる', 'v2-btn', closeModal)
        ]);
      } else {
        openModal('扉', 'まだ鍵がかかっている。先に金庫を開けよう。', '🚪', [
          button('閉じる', 'v2-btn v2-btn-primary', closeModal)
        ]);
      }
    }
  }

  function resetStage2() {
    state.hasKey = false;
    state.safeOpen = false;
    state.dials = [0, 0, 0];
    state.memoSeen = false;
    state.hintLevel = 0;
    refreshInventory();
    setHint('ヒントを見ると、次に調べる場所が分かる。');
    setMsg('机、青い箱、星の額、本棚を調べて手がかりを集めよう。');
    stopConfetti();
    refs.modal.hidden = true;
    refs.safeModal.hidden = true;
    refs.safeFeedback.textContent = '3桁の番号を入力して金庫を開けよう。';
    state.dials.forEach(updateDial);
  }

  function buildStage2() {
    stage2 = el('section', 'v2-stage');
    stage2.id = 'v2-stage';
    stage2.hidden = true;

    var bar = el('div', 'v2-bar');
    bar.appendChild(el('div', 'v2-title', '夕方の書斎'));
    bar.appendChild(el('div', 'v2-progress', 'STAGE 2 / 2'));
    refs.msg = el('div', 'v2-msg', '');
    bar.appendChild(refs.msg);
    stage2.appendChild(bar);

    var room = el('div', 'v2-room');
    room.appendChild(buildObject('v2-lamp', 'ランプ'));
    room.appendChild(buildObject('v2-book', '本棚'));
    room.appendChild(buildObject('v2-star', '星の額'));
    room.appendChild(buildObject('v2-safe', '金庫'));
    room.appendChild(buildObject('v2-desk', '机'));
    room.appendChild(buildObject('v2-blue', '青い箱'));
    room.appendChild(buildObject('v2-door', '扉'));
    stage2.appendChild(room);

    refs.inv = el('div', 'v2-inv');
    stage2.appendChild(refs.inv);

    refs.hint = el('div', 'v2-hint');
    stage2.appendChild(refs.hint);

    var actions = el('div', 'v2-actions');
    actions.appendChild(button('ヒント', 'v2-btn', openHint));
    actions.appendChild(button('リセット', 'v2-btn', resetStage2));
    stage2.appendChild(actions);

    refs.modal = el('div', 'v2-modal');
    refs.modal.hidden = true;
    var card = el('div', 'v2-modal-card');
    refs.modalArt = el('div', 'v2-modal-art');
    refs.modalTitle = el('div', 'v2-modal-title');
    refs.modalBody = el('div', 'v2-modal-body');
    refs.modalActions = el('div', 'v2-modal-actions');
    card.appendChild(refs.modalArt);
    card.appendChild(refs.modalTitle);
    card.appendChild(refs.modalBody);
    card.appendChild(refs.modalActions);
    refs.modal.appendChild(card);
    stage2.appendChild(refs.modal);

    refs.safeModal = el('div', 'v2-modal');
    refs.safeModal.hidden = true;
    var safeCard = el('div', 'v2-modal-card');
    safeCard.appendChild(el('div', 'v2-modal-art', '🔐'));
    safeCard.appendChild(el('div', 'v2-modal-title', '金庫'));
    safeCard.appendChild(el('div', 'v2-modal-body', 'ダイヤルを回して3桁の番号を合わせよう。'));

    var dials = el('div', 'v2-dials');
    refs.dials = [];
    for (var i = 0; i < 3; i++) {
      var col = el('div', 'v2-dial-col');
      var up = button('▲', 'v2-dial-btn');
      up.dataset.pos = String(i);
      up.dataset.dir = '1';
      var dial = el('div', 'v2-dial', '0');
      var down = button('▼', 'v2-dial-btn');
      down.dataset.pos = String(i);
      down.dataset.dir = '-1';
      refs.dials.push(dial);
      col.appendChild(up);
      col.appendChild(dial);
      col.appendChild(down);
      dials.appendChild(col);
    }

    refs.safeFeedback = el('div', 'v2-safe-feedback', '3桁の番号を入力して金庫を開けよう。');
    safeCard.appendChild(dials);
    safeCard.appendChild(refs.safeFeedback);

    var sa = el('div', 'v2-modal-actions');
    sa.appendChild(button('閉じる', 'v2-btn', closeSafe));
    sa.appendChild(button('金庫を開ける', 'v2-btn v2-btn-primary', trySafe));
    safeCard.appendChild(sa);

    refs.safeModal.appendChild(safeCard);
    stage2.appendChild(refs.safeModal);

    refs.confetti = el('div', 'v2-confetti');
    refs.confetti.hidden = true;
    stage2.appendChild(refs.confetti);

    document.body.appendChild(stage2);

    ['desk', 'blue', 'star', 'book', 'safe', 'door'].forEach(function (name) {
      tap(byId('v2-' + name), function () { examine(name); });
    });

    tap(byId('v2-lamp'), function () {
      openModal('ランプ', '暖かな光が机や本棚を照らしている。ここは夕方の書斎だ。', '💡', [
        button('閉じる', 'v2-btn v2-btn-primary', closeModal)
      ]);
    });

    Array.prototype.forEach.call(stage2.querySelectorAll('.v2-dial-btn'), function (b) {
      b.addEventListener('click', function () {
        changeDial(parseInt(b.dataset.pos, 10), parseInt(b.dataset.dir, 10));
      });
    });

    resetStage2();
  }

  function startStage2() {
    if (!stage2) buildStage2();
    resetStage2();
    stage2.hidden = false;
    if (winModal) winModal.hidden = true;
    setMsg('もう一つの扉が待っていた。3つの手がかりを集めて書斎から脱出しよう。');
    stage2.scrollTop = 0;
  }

  function init() {
    winModal = byId('win-modal');
    winAgain = byId('win-again');
    if (!winModal || !winAgain) return;

    if (!byId('win-next-stage')) {
      var b = button('次の部屋へ', 'btn v2-next-btn', startStage2);
      b.id = 'win-next-stage';
      winAgain.parentElement.appendChild(b);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
