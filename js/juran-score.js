/* ════════════════════════════════════════════════════════════════════════
   JURAN 악보 판 — 만든 곡을 오선지에 그린다                    (2026-10-12)
   ------------------------------------------------------------------------
   왜 새로 지었나 —
     CGO 에도 악보 그리는 손이 있다. 그런데 그 손은 혼자 서지 못한다.
     무엇을 끌고 오는지 세어 봤더니 **917개 · 1.6MB** 였고, 그 안에
     사주·관상·얼굴 인식·화면 넘기기까지 딸려 왔다. 그 코드는 한 덩어리
     생물이라 떼어낼 수가 없다. 그래서 JURAN 몫으로 새로 짓는다.
     어차피 「음표를 고치는 악보」는 CGO 에 없던 것이라, 결국 지어야 했다.

   무엇을 보고 그리나 —
     window._cgoMelodyEvents : [{name:'C4', dur:0.5}, …]  ← 작곡실이 채워 준다
       · 추첨통에서 만들면 작곡실이 스스로 채우고
       · VVIP 곡은 서버가 음을 따서 채운다
     window._cgoMelodyBpm · _cgoMusicMod.tempoBpm         ← 빠르기
     _cgoMusicMod.selected.key                            ← 조성

   누가 부르나 —
     작곡실이 곡을 다 만들면 window._cgoGenerateScoreOnly368() 를 부른다.
     CGO 에서는 CGO 것이 답하고, JURAN 에서는 이 파일이 답한다. 이름이 같아서
     작곡실은 어느 쪽인지 알 필요가 없다.

   ⚠️ 음표마다 손잡이(data-i)를 달아 둔다. 나중에 「음표 고치기」를 붙일 때
      이 손잡이로 집으면 된다. 지금은 달아만 두고 쓰지 않는다.
   ⚠️ 고리를 새로 얹지 않는다. 그릴 때 한 번 돌고 끝이다.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var 글자 = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var 반음 = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };

  /* 'C#4' → {글자:'C', 올림:1, 옥타브:4, 칸:step}  (칸 = 오선지 세로 자리) */
  function 음읽기(이름) {
    if (!이름) return null;
    var m = String(이름).match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
    if (!m) return null;
    var L = m[1].toUpperCase();
    var 올 = m[2] === '#' ? 1 : (m[2] === 'b' ? -1 : 0);
    var 옥 = parseInt(m[3], 10);
    /* 플랫은 아래 글자의 올림으로 바꿔 그린다 (B♭ → A♯) */
    if (올 === -1) {
      var i = 글자.indexOf(L) - 1;
      if (i < 0) { i = 6; 옥 -= 1; }
      L = 글자[i]; 올 = 1;
    }
    return { 글자: L, 올림: 올, 옥타브: 옥, 칸: 옥 * 7 + 글자.indexOf(L) };
  }

  /* 길이(박) → 머리 모양 */
  function 모양(dur) {
    if (dur >= 4) return { 속빔: true, 대: false, 깃: 0 };
    if (dur >= 2) return { 속빔: true, 대: true, 깃: 0 };
    if (dur >= 1) return { 속빔: false, 대: true, 깃: 0 };
    if (dur >= 0.5) return { 속빔: false, 대: true, 깃: 1 };
    return { 속빔: false, 대: true, 깃: 2 };
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function 만들(이름, 속성) {
    var e = document.createElementNS(SVGNS, 이름);
    for (var k in 속성) if (Object.prototype.hasOwnProperty.call(속성, k)) e.setAttribute(k, 속성[k]);
    return e;
  }

  /* ── 한 줄(오선) 그리기 ─────────────────────────────────────────────── */
  var 줄높이 = 92;          // 한 오선 줄이 차지하는 세로
  var 선간격 = 9;           // 오선 다섯 줄 사이
  var 왼여백 = 46;          // 음자리표 자리
  var 바닥칸 = 4 * 7 + 2;   // E4 — 오선 맨 아랫줄
  var 위칸 = 5 * 7 + 3;     // F5 — 오선 맨 윗줄

  function 칸y(윗선y, 칸) { return 윗선y + 4 * 선간격 - (칸 - 바닥칸) * (선간격 / 2); }

  function 그리기(통, 음표들, 조성, 빠르기, 박자) {
    통.innerHTML = '';
    var 폭 = Math.max(280, 통.clientWidth || 340);

    /* 머리말 */
    var 머리 = document.createElement('div');
    머리.className = 'jn-score-head';
    머리.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;'
      + 'padding:12px 14px 6px;font-size:12px;color:#5a6472;font-weight:700';
    머리.innerHTML = '<span style="font-size:14px;color:#111;font-weight:800">🎼 악보</span>'
      + '<span>' + (조성 || 'C Major') + '</span>'
      + '<span>♩ = ' + Math.round(빠르기 || 120) + '</span>'
      + '<span>' + 박자 + '/4</span>'
      + '<span id="jn-score-bars"></span>';
    통.appendChild(머리);

    /* 마디로 나눈다 */
    var 마디들 = [], 이번 = [], 쌓 = 0;
    for (var i = 0; i < 음표들.length; i++) {
      var ev = 음표들[i];
      var d = (typeof ev.dur === 'number' && ev.dur > 0) ? ev.dur : 1;
      /* 마디를 넘기는 음은 그 마디 끝까지만 그린다 (묶음줄은 아직 안 그린다) */
      while (d > 0) {
        var 남 = 박자 - 쌓;
        var 쓸 = Math.min(d, 남);
        이번.push({ name: ev.name, dur: 쓸, i: i, 이어짐: (쓸 < d) });
        쌓 += 쓸; d -= 쓸;
        if (쌓 >= 박자 - 1e-9) { 마디들.push(이번); 이번 = []; 쌓 = 0; }
      }
    }
    if (이번.length) 마디들.push(이번);
    var 바표 = 머리.querySelector('#jn-score-bars');
    if (바표) 바표.textContent = '마디 ' + 마디들.length + ' · 음표 ' + 음표들.length;

    if (!마디들.length) {
      var 빈 = document.createElement('div');
      빈.style.cssText = 'padding:18px 14px;color:#9aa3ad;font-size:13px';
      빈.textContent = '그릴 음표가 없습니다.';
      통.appendChild(빈);
      return;
    }

    /* 한 줄에 몇 마디 — 좁으면 2, 넓으면 4까지 */
    var 줄당 = 폭 >= 760 ? 4 : (폭 >= 520 ? 3 : 2);
    var 마디폭 = (폭 - 왼여백 - 14) / 줄당;
    var 줄수 = Math.ceil(마디들.length / 줄당);
    var 높이 = 줄수 * 줄높이 + 18;

    var svg = 만들('svg', {
      width: '100%', height: String(높이),
      viewBox: '0 0 ' + 폭 + ' ' + 높이, preserveAspectRatio: 'xMinYMin meet'
    });
    svg.style.cssText = 'display:block;background:#fff';

    for (var r = 0; r < 줄수; r++) {
      var 윗 = 16 + r * 줄높이;
      /* 오선 다섯 줄 */
      for (var L = 0; L < 5; L++) {
        svg.appendChild(만들('line', {
          x1: 10, y1: 윗 + L * 선간격, x2: 폭 - 8, y2: 윗 + L * 선간격,
          stroke: '#2b3340', 'stroke-width': 1
        }));
      }
      /* 음자리표 (높은음자리표를 글자로 — 글꼴이 없어도 뜬다) */
      var 자리 = 만들('text', {
        x: 14, y: 윗 + 4 * 선간격 - 2, 'font-size': 46, fill: '#2b3340',
        'font-family': 'serif'
      });
      자리.textContent = '𝄞';
      svg.appendChild(자리);

      /* 이 줄의 마디들 */
      for (var c = 0; c < 줄당; c++) {
        var mi = r * 줄당 + c;
        if (mi >= 마디들.length) break;
        var x0 = 왼여백 + c * 마디폭;
        /* 마디 끝 세로줄 */
        svg.appendChild(만들('line', {
          x1: x0 + 마디폭, y1: 윗, x2: x0 + 마디폭, y2: 윗 + 4 * 선간격,
          stroke: '#2b3340', 'stroke-width': (mi === 마디들.length - 1) ? 2.6 : 1.2
        }));
        /* 마디 번호 */
        var 번 = 만들('text', { x: x0 + 2, y: 윗 - 5, 'font-size': 9, fill: '#9aa3ad' });
        번.textContent = String(mi + 1);
        svg.appendChild(번);

        /* 음표 놓기 — 길이에 비례하되, **너무 붙으면 밀어낸다.**
           ⚠️ 처음에 비례만 썼더니 16분음표 둘이 겹쳐 뭉갰다. 눈으로 보고 알았다. */
        var 마디 = 마디들[mi], 간 = 0;
        var 자리들 = [], 누 = 0;
        for (var z = 0; z < 마디.length; z++) {
          자리들.push(x0 + 8 + (누 / 박자) * (마디폭 - 20));
          누 += 마디[z].dur;
        }
        var 최소틈 = 15;
        for (var z2 = 1; z2 < 자리들.length; z2++) {
          if (자리들[z2] - 자리들[z2 - 1] < 최소틈) 자리들[z2] = 자리들[z2 - 1] + 최소틈;
        }
        /* 마디 밖으로 밀려나면 통째로 눌러 넣는다 */
        var 끝자리 = x0 + 마디폭 - 10;
        if (자리들.length && 자리들[자리들.length - 1] > 끝자리) {
          var 앞 = 자리들[0], 뒤 = 자리들[자리들.length - 1];
          var 배 = (끝자리 - 앞) / Math.max(1, 뒤 - 앞);
          for (var z3 = 0; z3 < 자리들.length; z3++) 자리들[z3] = 앞 + (자리들[z3] - 앞) * 배;
        }
        for (var k = 0; k < 마디.length; k++) {
          var nt = 마디[k];
          var x = 자리들[k];
          간 += nt.dur;
          var 음 = 음읽기(nt.name);
          if (!음) continue;
          var y = 칸y(윗, 음.칸);
          var sh = 모양(nt.dur);

          var 묶 = 만들('g', { 'data-i': String(nt.i), 'data-bar': String(mi + 1) });

          /* 덧줄 */
          var 덧 = [];
          if (음.칸 < 바닥칸) { for (var s = 바닥칸 - 2; s >= 음.칸; s -= 2) 덧.push(s); }
          if (음.칸 > 위칸) { for (var s2 = 위칸 + 2; s2 <= 음.칸; s2 += 2) 덧.push(s2); }
          for (var q = 0; q < 덧.length; q++) {
            묶.appendChild(만들('line', {
              x1: x - 7, y1: 칸y(윗, 덧[q]), x2: x + 7, y2: 칸y(윗, 덧[q]),
              stroke: '#2b3340', 'stroke-width': 1
            }));
          }
          /* 올림표 */
          if (음.올림 === 1) {
            var 샵 = 만들('text', { x: x - 16, y: y + 4, 'font-size': 13, fill: '#2b3340' });
            샵.textContent = '♯';
            묶.appendChild(샵);
          }
          /* 머리 */
          묶.appendChild(만들('ellipse', {
            cx: x, cy: y, rx: 5.2, ry: 3.9, transform: 'rotate(-18 ' + x + ' ' + y + ')',
            fill: sh.속빔 ? '#fff' : '#111', stroke: '#111', 'stroke-width': 1.5
          }));
          /* 대 — 가운뎃줄(B4, 칸 34)보다 높으면 아래로 내린다.
             ⚠️ 처음에 기준을 F5 로 잡아 거의 모든 대가 위로 섰다. 눈으로 보고 고쳤다. */
          if (sh.대) {
            var 아래로 = 음.칸 >= 34;
            var sx = 아래로 ? x - 5 : x + 5;
            var 대길이 = 26;
            var sy2 = 아래로 ? y + 대길이 : y - 대길이;
            묶.appendChild(만들('line', {
              x1: sx, y1: y, x2: sx, y2: sy2, stroke: '#111', 'stroke-width': 1.4
            }));
            /* 깃 — 대 끝에서 **몸쪽으로** 휜다. 위로 선 대는 아래로, 내린 대는 위로. */
            for (var f = 0; f < sh.깃; f++) {
              var fy = 아래로 ? (sy2 - f * 5.5) : (sy2 + f * 5.5);
              var 휨 = 아래로 ? -9 : 9;
              묶.appendChild(만들('path', {
                d: 'M' + sx + ',' + fy + ' c 5,1.5 7,4 6.5,' + 휨,
                stroke: '#111', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round'
              }));
            }
          }
          /* 점 — 길이가 어떤 길이의 1.5배일 때 (1.5 · 3 · 0.75 …) */
          var 밑 = nt.dur / 1.5;
          if (밑 > 0 && Math.abs(Math.log2(밑) - Math.round(Math.log2(밑))) < 1e-9) {
            묶.appendChild(만들('circle', { cx: x + 10, cy: y - (음.칸 % 2 ? 0 : 4), r: 1.5, fill: '#111' }));
          }
          svg.appendChild(묶);
        }
      }
    }
    통.appendChild(svg);

    /* 꼬리말 */
    var 꼬 = document.createElement('div');
    꼬.style.cssText = 'padding:6px 14px 12px;font-size:11px;color:#9aa3ad';
    꼬.textContent = '음표를 고치는 기능은 다음에 붙습니다.';
    통.appendChild(꼬);
  }

  /* ── 작곡실이 부르는 이름 ───────────────────────────────────────────── */
  window._cgoGenerateScoreOnly368 = function () {
    try {
      var mod = window._cgoMusicMod;
      var 통 = (mod && mod.root && mod.root.querySelector('#cgo-groove-score-wrap'))
               || document.getElementById('cgo-groove-score-wrap');
      if (!통) return;
      통.style.display = 'block';

      var 음표들 = window._cgoMelodyEvents;
      if (!음표들 || !음표들.length) {
        /* 작곡실이 스스로 만들 수 있으면 만들게 한다 */
        try { if (mod && typeof mod._buildNoteSequence === 'function') mod._buildNoteSequence(); } catch (e) {}
        음표들 = window._cgoMelodyEvents;
      }
      if (!음표들 || !음표들.length) {
        통.innerHTML = '<div style="padding:18px 14px;color:#9aa3ad;font-size:13px">'
          + '음표를 받지 못했습니다. 곡을 다시 만들어 주세요.</div>';
        return;
      }
      var 빠르기 = window._cgoMelodyBpm || (mod && mod.tempoBpm) || 120;
      var 조성 = (mod && mod.selected && mod.selected.key) || 'C Major';
      var 박자 = 4;
      try {
        var ts = window._cgoSelectedTimeSig;
        if (ts && ts.num) 박자 = ts.num;
        else if (mod && mod.selected && mod.selected.timeSig) {
          var mm = String(mod.selected.timeSig).match(/^(\d+)/);
          if (mm) 박자 = parseInt(mm[1], 10) || 4;
        }
      } catch (e) {}
      if (!(박자 >= 1 && 박자 <= 16)) 박자 = 4;

      그리기(통, 음표들, 조성, 빠르기, 박자);
      try { window._cgo악보판 = { totBars: Math.ceil(음표들.reduce(function (a, b) {
        return a + ((b.dur > 0) ? b.dur : 1); }, 0) / 박자) }; } catch (e) {}
    } catch (e) {
      try { console.error('[JURAN 악보]', e); } catch (_) {}
    }
  };

  /* 창 크기가 바뀌면 다시 그린다 — 고리를 돌지 않고, 바뀔 때만 */
  var 늦 = null;
  window.addEventListener('resize', function () {
    if (늦) clearTimeout(늦);
    늦 = setTimeout(function () {
      var 통 = document.getElementById('cgo-groove-score-wrap');
      if (통 && 통.querySelector('svg')) {
        try { window._cgoGenerateScoreOnly368(); } catch (e) {}
      }
    }, 250);
  });

  try { console.log('[JURAN] 악보 판 준비됨'); } catch (e) {}
})();
