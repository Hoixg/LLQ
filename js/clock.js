import { getFromStorage, createElement } from './utils.js';

let timerId = null;
let flipRafId = null;
let flipVisHandler = null;
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(n) { return n.toString().padStart(2, '0'); }

const PIXEL_FONT = {
  '0': ['01110','10001','10001','10001','10001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  '3': ['01110','10001','00001','00110','00001','10001','01110'],
  '4': ['10001','10001','10001','01111','00001','00001','00001'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01110','10001','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','10000','10000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ':': ['00000','00000','00100','00000','00000','00100','00000'],
};
const PX_W = 5, PX_H = 7;

function drawMosaicTwo(canvas, str) {
  const SCALE = 8;
  const w = PX_W * 2 + 1;
  const h = PX_H;
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let di = 0; di < 2; di++) {
    const bitmap = PIXEL_FONT[str[di]];
    if (!bitmap) continue;
    const ox = di * (PX_W + 1);
    for (let y = 0; y < PX_H; y++) {
      for (let x = 0; x < PX_W; x++) {
        if (bitmap[y][x] === '1') {
          ctx.fillStyle = '#fff';
          ctx.fillRect((ox + x) * SCALE, y * SCALE, SCALE, SCALE);
        }
      }
    }
  }
}

function beginRoundedPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFlipCard(ctx, ch, prevCh, x, y, w, h, animT) {
  var r = 6;
  var midY = y + h / 2;

  beginRoundedPath(ctx, x, y, w, h, r);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  var grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, 'rgba(255,255,255,0.07)');
  grad.addColorStop(0.48, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  grad.addColorStop(0.52, 'rgba(255,255,255,0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  beginRoundedPath(ctx, x, y, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + r, midY);
  ctx.lineTo(x + w - r, midY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r, midY + 1);
  ctx.lineTo(x + w - r, midY + 1);
  ctx.stroke();

  var fontSize = Math.round(w * 0.52);
  ctx.font = 'bold ' + fontSize + 'px "Courier New", Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var textCX = x + w / 2;
  var textCY = y + h / 2 + 1;

  var isAnimating = animT < 1 && prevCh && prevCh !== ch;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, midY, w, h / 2);
  ctx.clip();
  ctx.fillStyle = isAnimating ? 'rgba(255,255,255,' + (0.6 + 0.4 * animT) + ')' : '#fff';
  ctx.fillText(ch, textCX, textCY);
  ctx.restore();

  if (!isAnimating) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h / 2);
    ctx.clip();
    ctx.fillStyle = '#fff';
    ctx.fillText(ch, textCX, textCY);
    ctx.restore();
  } else {
    var topCenterOffset = -(midY - (y + h / 4));
    var oldScale = 1 - animT;
    if (oldScale > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h / 2);
      ctx.clip();
      ctx.translate(textCX, midY);
      ctx.scale(1, oldScale);
      ctx.fillStyle = 'rgba(255,255,255,' + oldScale + ')';
      ctx.fillText(prevCh, 0, topCenterOffset);
      ctx.restore();
    }
    var newScale = animT;
    if (newScale > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h / 2);
      ctx.clip();
      ctx.translate(textCX, midY);
      ctx.scale(1, newScale);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * newScale) + ')';
      ctx.fillText(ch, 0, topCenterOffset);
      ctx.restore();
    }
  }
}

function drawFlipPair(canvas, cur, prev, animT) {
  var SCALE = 2;
  var DW = 54, DH = 76;
  var GAP = 5;
  canvas.width = (DW * 2 + GAP) * SCALE;
  canvas.height = DH * SCALE;
  canvas.style.width = (DW * 2 + GAP) + 'px';
  canvas.style.height = DH + 'px';
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var di = 0; di < 2; di++) {
    var ch = cur[di] || '';
    var prevCh = prev && prev[di] ? prev[di] : '';
    drawFlipCard(ctx, ch, prevCh, di * (DW + GAP) * SCALE, 0, DW * SCALE, DH * SCALE, animT);
  }
}

export function initClock() {
  var clockEl = document.getElementById('clock');
  if (!clockEl) return;
  if (timerId) { clearInterval(timerId); timerId = null; }
  if (flipRafId) { cancelAnimationFrame(flipRafId); flipRafId = null; }
  if (flipVisHandler) {
    document.removeEventListener('visibilitychange', flipVisHandler);
    flipVisHandler = null;
  }
  clockEl.innerHTML = '';

  var style = getFromStorage('clockStyle', 'default');
  var cardRow = createElement('div', { className: 'clock-card-row' });
  var dateLine = createElement('div', { className: 'clock-date' });
  clockEl.append(cardRow, dateLine);

  var hCanvas, mCanvas, sCanvas;

  if (style === 'mosaic' || style === 'flip') {
    hCanvas = createElement('canvas');
    mCanvas = createElement('canvas');
    sCanvas = createElement('canvas');
    cardRow.append(
      createElement('span', { className: 'clock-card' }, [hCanvas]),
      createElement('span', { className: 'clock-card' }, [mCanvas]),
      createElement('span', { className: 'clock-card clock-card-sec' }, [sCanvas])
    );
  } else {
    var hourCard = createElement('span', { className: 'clock-card' });
    var colon1 = createElement('span', { className: 'clock-colon' }, ':');
    var minCard = createElement('span', { className: 'clock-card' });
    var colon2 = createElement('span', { className: 'clock-colon' }, ':');
    var secCard = createElement('span', { className: 'clock-card clock-card-sec' });
    cardRow.append(hourCard, colon1, minCard, colon2, secCard);
    var _hourCard = hourCard, _minCard = minCard, _secCard = secCard;
  }

  if (style === 'flip') {
    var flipState = { hh: { cur: '', prev: '', t: 1 }, mm: { cur: '', prev: '', t: 1 }, ss: { cur: '', prev: '', t: 1 } };
    var FLIP_DUR = 280;
    var lastTime = 0;
    var lastSecondKey = '';

    function flipLoop(ts) {
      if (!lastTime) lastTime = ts;
      var dt = Math.min(50, ts - lastTime);
      lastTime = ts;

      var now = new Date();
      var hh = pad(now.getHours());
      var mm = pad(now.getMinutes());
      var ss = pad(now.getSeconds());
      var sk = hh + mm + ss;

      if (sk !== lastSecondKey) {
        lastSecondKey = sk;
        function trigger(k, v) {
          if (flipState[k].cur && flipState[k].cur !== v) { flipState[k].prev = flipState[k].cur; flipState[k].t = 0; }
          if (!flipState[k].cur) { flipState[k].prev = v; flipState[k].t = 1; }
          flipState[k].cur = v;
        }
        trigger('hh', hh);
        trigger('mm', mm);
        trigger('ss', ss);
        dateLine.textContent = (now.getMonth() + 1) + '\u6708' + now.getDate() + '\u65e5 ' + WEEKDAYS[now.getDay()];
      }

      var inc = dt / FLIP_DUR;
      ['hh', 'mm', 'ss'].forEach(function(k) {
        if (flipState[k].t < 1) flipState[k].t = Math.min(1, flipState[k].t + inc);
      });

      drawFlipPair(hCanvas, flipState.hh.cur, flipState.hh.prev, flipState.hh.t);
      drawFlipPair(mCanvas, flipState.mm.cur, flipState.mm.prev, flipState.mm.t);
      drawFlipPair(sCanvas, flipState.ss.cur, flipState.ss.prev, flipState.ss.t);

      flipRafId = requestAnimationFrame(flipLoop);
    }

    var nowInit = new Date();
    var hhI = pad(nowInit.getHours());
    var mmI = pad(nowInit.getMinutes());
    var ssI = pad(nowInit.getSeconds());
    flipState.hh.cur = hhI; flipState.hh.prev = hhI; flipState.hh.t = 1;
    flipState.mm.cur = mmI; flipState.mm.prev = mmI; flipState.mm.t = 1;
    flipState.ss.cur = ssI; flipState.ss.prev = ssI; flipState.ss.t = 1;
    dateLine.textContent = (nowInit.getMonth() + 1) + '\u6708' + nowInit.getDate() + '\u65e5 ' + WEEKDAYS[nowInit.getDay()];
    drawFlipPair(hCanvas, hhI, hhI, 1);
    drawFlipPair(mCanvas, mmI, mmI, 1);
    drawFlipPair(sCanvas, ssI, ssI, 1);
    flipRafId = requestAnimationFrame(flipLoop);

    function onVisibility() {
      if (document.hidden) {
        if (flipRafId) { cancelAnimationFrame(flipRafId); flipRafId = null; }
      } else {
        lastTime = 0;
        if (!flipRafId) flipRafId = requestAnimationFrame(flipLoop);
      }
    }
    flipVisHandler = onVisibility;
    document.addEventListener('visibilitychange', onVisibility);
    return;
  }

  function update() {
    var now = new Date();
    var hh = pad(now.getHours());
    var mm = pad(now.getMinutes());
    var ss = pad(now.getSeconds());

    if (style === 'mosaic') {
      drawMosaicTwo(hCanvas, hh);
      drawMosaicTwo(mCanvas, mm);
      drawMosaicTwo(sCanvas, ss);
    } else {
      _hourCard.textContent = hh;
      _minCard.textContent = mm;
      _secCard.textContent = ss;
    }
    dateLine.textContent = (now.getMonth() + 1) + '\u6708' + now.getDate() + '\u65e5 ' + WEEKDAYS[now.getDay()];
  }
  update();
  timerId = setInterval(update, 1000);
}
