/* ═══════════════════════════════════════════════════════════════════════
   JURAN 편집 모드 — 판 581 (2026-10-15)
   파트너 — 「그냥 거기서 글씨 편집, 저장. 파일 올리고 거기서 저장하는 단순한 구조」
          「메인 카드에 파일과 이미지를 집어넣으려고 하는데 LEE 에는 없다」

   · 사이트를 **그대로** 보여 주고, 고칠 수 있는 곳에 점선을 친다.
       챔피언 카드 · 급상승 줄 · 차트 줄 → 누르면 그 곡 고치기 창
       챔피언 카드 위 🎵 🖼 ✏️ → 음악 · 사진 · 고치기
       카드에 mp3·그림을 **끌어다 놓아도** 들어간다
       첫 화면 큰 글씨 → 누르면 문구 고치기 창
   · 아래 띠의 「💾 저장」 하나 → 서버(cgo-544) → R2. 사이트에 바로 나온다.
   · 음악은 128k mp3 로, 사진은 긴 변 1280 의 jpg 로 이 컴퓨터 안에서 줄인 뒤 올린다.
   · 이 파일은 index.html 이 「?편집 + 서버 표」가 있을 때만 받는다. 손님은 받지 않는다.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if(window.__주란편집손) return; window.__주란편집손=true;

var 서버=window.__서버||'https://fastapi-production-d9f2.up.railway.app';
var 공개=window.__공개||'https://music.juranaimusic.com';
var 음악집=공개+'/songs/';
var 라메주소=window.__라메주소||'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
var 장르들=["K-팝","발라드","힙합/랩","R&B","EDM/댄스","록/밴드","시티팝","재즈","트로트","로파이","힐링(주파수)"];
var 자켓장르={"K-팝":4,"발라드":0,"힙합/랩":1,"R&B":6,"EDM/댄스":2,"록/밴드":3,"시티팝":13,"재즈":7,"트로트":27,"로파이":15,"힐링(주파수)":20};
var 나라들={"KR":"대한민국","US":"미국","JP":"일본","CN":"중국","TW":"대만","HK":"홍콩","GB":"영국","DE":"독일","FR":"프랑스",
"IT":"이탈리아","ES":"스페인","PT":"포르투갈","NL":"네덜란드","SE":"스웨덴","NO":"노르웨이","FI":"핀란드","DK":"덴마크","PL":"폴란드",
"RU":"러시아","UA":"우크라이나","TR":"튀르키예","IN":"인도","ID":"인도네시아","TH":"태국","VN":"베트남","PH":"필리핀","MY":"말레이시아",
"SG":"싱가포르","AU":"호주","NZ":"뉴질랜드","CA":"캐나다","MX":"멕시코","BR":"브라질","AR":"아르헨티나","CL":"칠레","CO":"콜롬비아",
"PE":"페루","SA":"사우디아라비아","AE":"아랍에미리트","EG":"이집트","MA":"모로코","ZA":"남아프리카","NG":"나이지리아","KE":"케냐",
"IL":"이스라엘","IR":"이란","PK":"파키스탄","BD":"방글라데시","MN":"몽골","GR":"그리스","CZ":"체코","AT":"오스트리아","CH":"스위스",
"BE":"벨기에","IE":"아일랜드","RO":"루마니아","HU":"헝가리"};

var 원본=null;           /* juran.json 그대로 — 이것을 고쳐 저장한다 */
var 새파일={};           /* 'sNNN.mp3' → Blob — 아직 안 올라간 것 */
var 바뀜=0;

function 표(){ try{ var v=sessionStorage.getItem('lee-t')||'', i=v.indexOf('|'); return i>0? v.slice(i+1) : ''; }catch(e){ return ''; } }
function 글(x){ return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function 크기(b){ return b>=1048576?(b/1048576).toFixed(1)+'MB':Math.max(1,Math.round(b/1024))+'KB'; }
function 분초(초){ 초=Math.round(+초||0); return Math.floor(초/60)+':'+('0'+(초%60)).slice(-2); }
function 해시(s){ var h=2166136261; s=String(s); for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0); }
function 깃발(c){ if(!c||c.length!==2) return '🌍'; try{ return String.fromCodePoint(0x1F1E6+c.charCodeAt(0)-65,0x1F1E6+c.charCodeAt(1)-65); }catch(e){ return '🌍'; } }
function 번호수(id){ var n=parseInt(String(id||'').replace(/\D/g,''),10); return isFinite(n)?n:0; }
function 다음번호(){ var m=0; (원본.곡||[]).forEach(function(c){ m=Math.max(m,번호수(c.id)); }); var s=String(m+1); while(s.length<3) s='0'+s; return 's'+s; }
function 곡찾기(k){ var r=null; (원본&&원본.곡||[]).forEach(function(c){ if(c.id===k) r=c; }); return r; }
function 다시(){ try{ JN.다시그리기(원본); }catch(e){} 손글씨(); }
/* 판 581 : 카드 단추에 지금 들어 있는 것을 보인다 — 「🎵 음악 ✅ 5:00」 */
/* ── 판 582 : 「카드 = 곡」 ──
   파트너 — 「수정하려고 하면 팝업에 가사도 없고 제목도 다르고 장르도 다르다」 「표 1147 확인해도 그대로」
   까닭: 카드 글씨는 **카드에만** 붙고(곡은 그대로), 카드는 「표 1등」을 저절로 보여서
         표를 바꾸면 **다른 곡이 카드로 올라왔다.** 이제는
   · 카드 제목·아랫줄을 쓰면 **그 곡의** 제목·지은이·장르가 바뀐다 → 팝업 · 차트 · 저장본이 모두 같다
   · 카드에서 무엇이든 고친 곡은 **그 카드에 붙는다** → 표를 줄여도 카드가 다른 곡으로 안 바뀐다
     (다시 표 1등을 보이려면 👑 카드 설정 → 「자동」) */
function 쪽이름(카드){ return 카드.classList.contains('glob')?'오른쪽':'왼쪽'; }
window.__고친곡=window.__고친곡||{};
function 카드붙이기(c){
  if(!c||!c.id) return;
  window.__고친곡[c.id]=1;   /* 판 588 : 고친 곡은 목록에서 노란 줄 */
  [].forEach.call(document.querySelectorAll('.champion'), function(카드){
    if(카드.dataset.k!==c.id) return;
    var 쪽=쪽이름(카드);
    원본.카드=원본.카드||{}; 원본.카드[쪽]=원본.카드[쪽]||{};
    원본.카드[쪽].곡=c.id;
  });
}
/* 「@RayD · 팝/블루스 · 9-AI 심사 83점」 → 지은이 · 장르 · 점수 */
function 아랫줄읽기(c, 글){
  var 조각=String(글||'').split(/\s*·\s*/).map(function(x){ return x.trim(); }).filter(Boolean), 나머지=[];
  var 점수조각=null;
  조각.forEach(function(x){
    var m=x.match(/(?:9\s*-?\s*AI|심사|evaluation|score|points?)[^\d]*([\d.]+)/i) || x.match(/^([\d.]+)\s*(?:점|points?|pts?)$/i);
    if(점수조각==null && m && isFinite(parseFloat(m[1]))){ c.점수=parseFloat(m[1]); 점수조각=x.replace(m[1],'{점}'); } else 나머지.push(x);
  });
  /* 판 583 : 점수 글씨도 **쓴 그대로** — 「9-AI Evaluation: 87 Points」 를 한국말로 바꾸지 않는다.
     기본 꼴(9-AI 심사 87점)이면 저장하지 않고, 점수를 빼고 쓰면 카드에서도 뺀다. */
  if(점수조각==null) c.점수말='';
  else if(/^9-AI 심사 \{점\}점$/.test(점수조각)) delete c.점수말;
  else c.점수말=점수조각;
  if(나머지[0]!=null) c.by=나머지[0];
  if(나머지.length>1) c.g=나머지.slice(1).join(' · ');
}
function 카드글씨옮기기(){
  var 카=원본.카드||{}, 옮김=[];
  [].forEach.call(document.querySelectorAll('.champion'), function(카드){
    var 쪽=쪽이름(카드), 덧=카[쪽]; if(!덧||!(덧.제목||덧.부제)) return;
    var c=곡찾기(카드.dataset.k); if(!c) return;
    if(덧.제목) c.t=String(덧.제목).trim();
    if(덧.부제) 아랫줄읽기(c, 덧.부제);
    delete 덧.제목; delete 덧.부제; 덧.곡=c.id;
    옮김.push('「'+c.t+'」');
  });
  if(옮김.length){ 바꿨다(); 다시(); 띠그리기('🔁 카드에 쓰신 글씨를 곡 '+옮김.join(' · ')+' 에 옮겼습니다 — 💾 저장을 눌러 주세요'); }
}

function 손글씨(){
  [].forEach.call(document.querySelectorAll('.champion'), function(카드){
    var 손=카드.querySelector('.주편-손'); if(!손) return;
    var c=곡찾기(카드.dataset.k)||{};
    var 음=손.querySelector('[data-w="음악"]'), 사=손.querySelector('[data-w="사진"]');
    if(음) 음.textContent='🎵 음악'+(c.음악?(' ✅'+(c.길이?' '+분초(c.길이):'')+(새파일[c.id+'.mp3']?' (저장 전)':'')):'');
    if(사) 사.textContent='🖼 사진'+(c.사진?(' ✅'+(새파일[c.id+'.jpg']?' (저장 전)':'')):'');
  });
}
function 바꿨다(){ 바뀜++; 띠그리기(); }

/* ── 모양 ── */
var css=document.createElement('style');
css.textContent=
'body.주란편집 .champion,body.주란편집 .rise,body.주란편집 .item,body.주란편집 .hero h1,body.주란편집 .hero .lede{outline:2px dashed rgba(234,166,27,.85);outline-offset:3px;cursor:pointer}'+
'body.주란편집 .rise:hover,body.주란편집 .item:hover{background:rgba(234,166,27,.10)}'+
'body.주란편집 .champion .lbl,body.주란편집 .champion .live .상태,body.주란편집 .champion h2,body.주란편집 .champion .by{outline:2px dashed rgba(255,217,138,.9);outline-offset:3px;border-radius:4px;cursor:text}'+
'body.주란편집 .champion [contenteditable]:focus{outline:2px solid #ffcf5c;background:rgba(255,255,255,.12)}'+
'body.주란편집 .champion.끌림{outline:3px solid #ffcf5c;box-shadow:0 0 0 6px rgba(255,207,92,.35)}'+
'.주편-손{position:relative;z-index:3;display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}'+
'.주편-손 button{border:0;border-radius:999px;padding:7px 11px;font:700 12.5px system-ui,sans-serif;background:rgba(255,255,255,.92);color:#0d2b28;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}'+
'#주편-띠{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9998;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;'+
'  background:#0d2b28;color:#eafff8;border-radius:16px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:600 13px system-ui,sans-serif;width:calc(100vw - 24px);max-width:820px;box-sizing:border-box}'+
'#주편-띠 button{border:0;border-radius:10px;min-height:38px;padding:0 13px;font:700 13px system-ui,sans-serif;cursor:pointer;background:#1d4a44;color:#eafff8}'+
'#주편-띠 button.저장{background:#eaa61b;color:#1c1300}'+
'#주편-띠 .말{padding:0 4px;flex:1 1 100%;text-align:center;font-size:12.5px;line-height:1.4}'+
'@media(min-width:760px){#주편-띠 .말{flex:0 1 auto;white-space:nowrap}}'+
'#주편-막{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}'+
'#주편-창{background:#fff;color:#0d2b28;width:min(640px,100%);max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:16px 16px 22px;font:14px/1.55 system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;box-shadow:0 -10px 30px rgba(0,0,0,.25)}'+
'@media(min-width:700px){#주편-막{align-items:center}#주편-창{border-radius:18px}}'+
'#주편-창 h3{margin:0 0 10px;font-size:17px}'+
'#주편-창 label{display:block;font-size:12px;color:#5b7a74;margin:10px 0 4px}'+
'#주편-창 input[type=text],#주편-창 input[type=number],#주편-창 input[type=date],#주편-창 select,#주편-창 textarea{width:100%;box-sizing:border-box;font:15px system-ui,sans-serif;padding:9px 10px;border:1px solid rgba(8,60,55,.2);border-radius:10px;background:#f3f7f6;color:#0d2b28}'+
'#주편-창 textarea{min-height:140px;resize:vertical;line-height:1.55}'+
'#주편-창 .두칸{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
'#주편-창 .짐{border:2px dashed rgba(8,60,55,.25);border-radius:12px;padding:12px;margin-top:6px;text-align:center;font-size:13px;color:#5b7a74;cursor:pointer}'+
'#주편-창 .짐.끌림{border-color:#eaa61b;background:#fff7e6}'+
'#주편-창 .짐 b{color:#0d2b28}'+
'#주편-창 .st{font-size:12.5px;margin-top:6px;color:#03897d;font-weight:700;word-break:break-all}'+
'#주편-창 .st.bad{color:#d6453f}'+
'#주편-창 audio{width:100%;margin-top:6px}'+
'#주편-창 img.미리{display:block;max-width:100%;max-height:180px;border-radius:10px;margin:8px auto 0}'+
'#주편-창 .단추들{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}'+
'#주편-창 .단추들 button{flex:1;min-height:44px;border-radius:12px;border:1px solid rgba(8,60,55,.2);background:#eef5f3;font:700 14px system-ui,sans-serif;cursor:pointer;color:#0d2b28}'+
'#주편-창 .단추들 button.확인{background:#03897d;color:#fff;border-color:#03897d}'+
'#주편-창 .단추들 button.지우기{flex:0 0 auto;color:#d6453f;background:#fff}'+
'#주편-창 .풀이{font-size:12px;color:#5b7a74;margin-top:4px}'+
'body.주란편집 .champion .foot .v,body.주란편집 .rise .vt,body.주란편집 .item .votes{outline:2px dashed #ffcf5c;outline-offset:2px;border-radius:6px;cursor:pointer}'+
'#주편-창 input.큰수{font:800 26px system-ui,sans-serif;text-align:center;padding:12px}'+
'body.주란편집 [data-글]{outline:2px dashed #ffcf5c;outline-offset:2px;border-radius:5px;cursor:text}'+
'body.주란편집 [data-글]:focus{outline-style:solid;background:rgba(255,207,92,.18)}';
document.head.appendChild(css);
document.body.classList.add('주란편집');

/* ── 아래 띠 ── */
var 띠=document.createElement('div'); 띠.id='주편-띠';
띠.innerHTML='<span class="말" id="주편-말">✏️ 편집 모드 — 곡이나 글씨를 누르세요</span>'+
  '<button type="button" id="주편-새곡">+ 곡</button>'+
  '<button type="button" id="주편-찾기">🔍 찾기</button>'+
  '<button type="button" id="주편-멈춤">⏸ 순위 멈춤</button>'+
  '<button type="button" class="저장" id="주편-저장">💾 저장</button>'+
  '<button type="button" id="주편-표">표로 보기</button>'+
  '<button type="button" id="주편-나감">나가기</button>';
document.body.appendChild(띠);
function 띠그리기(말){
  var n=Object.keys(새파일).length;
  document.getElementById('주편-말').textContent= 말 || (바뀜? '✏️ 바뀐 것 '+바뀜+'곳'+(n?' · 새 파일 '+n+'개':'')+' — 💾 저장을 눌러야 사이트에 나옵니다' : '✏️ 편집 모드 — 곡이나 글씨를 누르세요');
}
window.addEventListener('beforeunload', function(e){ if(바뀜){ e.preventDefault(); e.returnValue=''; } });
document.getElementById('주편-나감').onclick=function(){
  if(바뀜 && !confirm('저장하지 않은 것이 있습니다. 그래도 나갈까요?')) return;
  바뀜=0; location.href=location.pathname;
};
document.getElementById('주편-표').onclick=function(){
  if(바뀜 && !confirm('저장하지 않은 것이 있습니다. 표 화면으로 갈까요?')) return;
  바뀜=0; location.href='LEE.html?표';
};
document.getElementById('주편-새곡').onclick=function(){
  if(!원본) return;
  var c={id:다음번호(), t:'', by:'', g:장르들[0], 나라:'KR', 표:0, 전표:0, 점수:90, 링크:''};
  곡창(c, true);
};
document.getElementById('주편-저장').onclick=저장;

/* ── 판 588 : ⏸ 순위 멈춤 · 🔍 찾기 ── */
function 멈춤그리기(켬){
  var b=document.getElementById('주편-멈춤'); if(!b) return;
  b.textContent=켬?'⏸ 순위 멈춤 중':'▶ 순위 움직임';
  b.style.background=켬?'#eaa61b':''; b.style.color=켬?'#1c1300':'';
}
document.getElementById('주편-멈춤').onclick=function(){
  var 켬=false; try{ 켬=!JN.멈춤인가(); 켬=JN.순위멈춤(켬); }catch(e){}
  멈춤그리기(켬);
  띠그리기(켬?'⏸ 순위를 멈췄습니다 — 고쳐도 줄이 제자리에 있습니다':'▶ 순위를 다시 표대로 줄 세웠습니다');
};
document.getElementById('주편-찾기').onclick=function(){ 찾기창(); };
function 자리글(w){
  if(!w) return '아직 목록에 없습니다 (확인을 눌렀나요?)';
  var 줄=[];
  if(w.카드.length) 줄.push('👑 '+w.카드.map(function(x){ return x+' 카드'; }).join(' · '));
  줄.push('📌 올린 차트: '+((w.자리||[]).map(곳이름).join(' · ')||'없음'));
  줄.push('🇰🇷 국내 급상승 '+(w.국급? w.국급+'위'+(w.국급>w.급수?' (첫 화면엔 '+w.급수+'위까지)':'') : '— '+((w.자리||[]).indexOf('국내')<0?'(국내 차트에 안 올림)':'(나라가 '+(w.나라||'없음')+')')));
  줄.push('🌍 글로벌 급상승 '+(w.글급? w.글급+'위'+(w.글급>w.급수?' (첫 화면엔 '+w.급수+'위까지)':'') : '— (글로벌 차트에 안 올림)'));
  줄.push('🎧 차트 「'+w.칸+'」 칸 — 국내 '+(w.국차?w.국차+'위':'—')+' · 글로벌 '+(w.글차?w.글차+'위':'—')+((w.국차>50||w.글차>50)?' (차트는 50위까지)':''));
  if(w.장르 && w.장르!==w.칸) 줄.push('ⓘ 장르 「'+w.장르+'」 는 차트 칸 목록에 없어서 「'+w.칸+'」 칸에 있습니다');
  return 줄.join('<br>');
}
function 찾기창(){
  var w=창열기('<h3>🔍 곡 찾기</h3>'+
    '<input type="text" id="f-q" placeholder="제목이나 지은이 몇 글자">'+
    '<div id="f-l" style="margin-top:10px"></div>'+
    '<div class="단추들"><button type="button" id="f-no">닫기</button></div>');
  var 입=w.querySelector('#f-q'), 목록=w.querySelector('#f-l');
  function 그리기(){
    var q=입.value.trim().toLowerCase();
    var 곡들=(원본.곡||[]).filter(function(c){ return !q || (String(c.t||'')+' '+String(c.by||'')+' '+c.id).toLowerCase().indexOf(q)>=0; });
    if(!q){ var 고=window.__고친곡||{}; 곡들=곡들.filter(function(c){ return 고[c.id]; }); }
    곡들=곡들.slice(0,15);
    목록.innerHTML=곡들.length? 곡들.map(function(c){
      var 자=null; try{ 자=JN.어디(c.id); }catch(e){}
      return '<div style="border:1px solid rgba(8,60,55,.15);border-radius:12px;padding:10px 12px;margin-top:8px">'+
        '<b>'+글(c.t||c.id)+'</b> <span style="color:#5b7a74;font-size:12px">'+글(c.by||'')+' · '+c.id+'</span>'+
        '<div style="font-size:12.5px;line-height:1.7;margin-top:4px">'+자리글(자)+'</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">'+
          (자&&자.카드.length?'<button type="button" data-k="'+c.id+'" data-곳="카드">👑 카드로</button>':'')+
          (자&&자.국급?'<button type="button" data-k="'+c.id+'" data-곳="국급">국내 급상승으로</button>':'')+
          '<button type="button" data-k="'+c.id+'" data-곳="글급">글로벌 급상승으로</button>'+
          '<button type="button" data-k="'+c.id+'" data-곳="'+(자&&자.국차?'국차':'글차')+'">차트로</button>'+
          '<button type="button" data-k="'+c.id+'" data-곳="고침">✏️ 고치기</button>'+
        '</div></div>';
    }).join('') : '<p class="풀이">'+(q?'맞는 곡이 없습니다':'오늘 고친 곡이 아직 없습니다 — 제목을 써 보세요')+'</p>';
    [].forEach.call(목록.querySelectorAll('button[data-곳]'), function(b){
      b.style.cssText='border:1px solid rgba(8,60,55,.2);background:#eef5f3;border-radius:9px;min-height:34px;padding:0 10px;font:700 12.5px system-ui,sans-serif;cursor:pointer;color:#0d2b28';
      b.onclick=function(){
        var c=곡찾기(b.dataset.k); if(!c) return;
        if(b.dataset.곳==='고침'){ 곡창(c); return; }
        닫기(); try{ JN.가기(c.id, b.dataset.곳); }catch(e){}
      };
    });
  }
  입.addEventListener('input', 그리기); 그리기();
  w.querySelector('#f-no').onclick=닫기;
  setTimeout(function(){ 입.focus(); },50);
}

/* ── 목록 받기 ── */
function 받기(u){ return fetch(u+(u.indexOf('?')<0?'?':'&')+'t='+Date.now(),{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
function 준비(j){
  원본=(j&&typeof j==='object')? j : {};
  if(!Array.isArray(원본.곡)) 원본.곡=[];
  원본.문구=원본.문구||{}; 원본.시즌=원본.시즌||{};
  원본.곡.forEach(function(c){ if(!c.id) c.id=다음번호(); });
  다시(); 카드손달기(); 손글씨(); 카드글씨옮기기(); 정한글씨쓰기();
  멈춤그리기(JN.순위멈춤(true));   /* 판 588 : 편집에 들어오면 순위는 멈춘 채로 */
  setInterval(손글씨, 3000);   /* 카드 곡이 저절로 바뀌어도 단추 글씨가 따라가게 */
}
(function 기다리기(n){
  var j=null; try{ j=JN.원본(); }catch(e){}
  if(j){ 준비(j); return; }
  if(n<30){ setTimeout(function(){ 기다리기(n+1); },100); return; }
  받기(공개+'/juran.json').catch(function(){ return 받기('juran.json'); }).then(준비).catch(function(){ 준비({보기용:true,곡:[]}); });
})(0);

/* ── 챔피언 카드에 🎵 🖼 ✏️ ── */
function 카드손달기(){
  [].forEach.call(document.querySelectorAll('.champion'), function(카드){
    if(카드.querySelector('.주편-손')) return;
    var 손=document.createElement('div'); 손.className='주편-손';
    손.innerHTML='<button type="button" data-w="음악">🎵 음악</button><button type="button" data-w="사진">🖼 사진</button><button type="button" data-w="고침">✏️ 곡 고치기</button><button type="button" data-w="카드">👑 카드 설정</button>';
    글씨바로쓰기(카드);
    카드.appendChild(손);
    손.addEventListener('click', function(ev){
      var b=ev.target.closest('button'); if(!b) return;
      ev.preventDefault(); ev.stopPropagation();
      if(b.dataset.w==='카드'){ 카드창(); return; }
      var c=곡찾기(카드.dataset.k);
      if(!c){ alert('이 카드에는 아직 곡이 없습니다. 「👑 카드 설정」에서 곡을 고르거나 아래 「+ 곡」으로 곡을 넣어 주세요.'); return; }
      if(b.dataset.w==='고침') 곡창(c);
      else 파일고르기(b.dataset.w==='음악'?'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg':'image/*', function(f){ 파일넣기(c,f); });
    });
    카드.addEventListener('dragover', function(e){ e.preventDefault(); 카드.classList.add('끌림'); });
    카드.addEventListener('dragleave', function(){ 카드.classList.remove('끌림'); });
    카드.addEventListener('drop', function(e){
      e.preventDefault(); 카드.classList.remove('끌림');
      var c=곡찾기(카드.dataset.k); if(!c){ alert('이 카드에는 아직 곡이 없습니다.'); return; }
      [].forEach.call(e.dataTransfer.files||[], function(f){ 파일넣기(c,f); });
    });
  });
}

/* ── 판 579 : 카드 글씨를 **그 자리에서 바로** 쓴다 (이름 · 제목 · 아랫줄) ──
   파트너 — 「텍스트를 써야 하는데 다운 바로 정해진 것만… 자유롭게 수정하게」
   쓴 글은 그 카드에만 붙는다(곡 이름은 그대로). 다 지우면 곡에서 저절로 나오는 글로 돌아간다. */
function 글씨바로쓰기(카드){
  var 쪽=카드.classList.contains('glob')?'오른쪽':'왼쪽';
  [['.lbl','이름'],['.live .상태','상태'],['h2','제목'],['.by','부제']].forEach(function(x){
    var el=카드.querySelector(x[0]); if(!el||el.dataset.쓰기) return;
    el.dataset.쓰기='1';
    try{ el.contentEditable='plaintext-only'; }catch(e){}
    if(el.contentEditable!=='plaintext-only') el.contentEditable='true';
    el.spellcheck=false;
    var 처음='';
    el.addEventListener('focus', function(){ 처음=el.textContent; });
    el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
    el.addEventListener('blur', function(){
      var 글=el.textContent.replace(/\s+/g,' ').trim();
      if(글===처음.replace(/\s+/g,' ').trim()) return;
      if(x[1]==='이름' && 쪽==='왼쪽'){
        var 나=''; try{ 나=JN.나라말(); }catch(e){}
        if(나 && 글.indexOf(나)>=0) 글=글.split(나).join('{나라}');   /* 「🇰🇷 대한민국 …」 → 「{나라} …」 — 손님 나라대로 */
      }
      var c=곡찾기(카드.dataset.k);
      if((x[1]==='제목'||x[1]==='부제') && c){
        /* 판 582 : 제목·아랫줄은 **곡에** 쓴다 */
        if(!글){ 다시(); return; }                    /* 비우면 그대로 둔다 */
        if(x[1]==='제목') c.t=글; else 아랫줄읽기(c, 글);
        if(원본.카드&&원본.카드[쪽]){ delete 원본.카드[쪽].제목; delete 원본.카드[쪽].부제; }
        카드붙이기(c); 바꿨다(); 다시(); return;
      }
      원본.카드=원본.카드||{}; 원본.카드[쪽]=원본.카드[쪽]||{};
      if(글) 원본.카드[쪽][x[1]]=글; else delete 원본.카드[쪽][x[1]];
      바꿨다(); 다시();
    });
  });
}

/* ── 판 586 : 화면의 정해진 글씨는 **모두** 바로 고친다 (data-글) ──
   표 단위 「표」 · 투표 단추 「👆 투표」 · LIVE · 급상승 · 「국내 차트 50위까지 →」 · 맨 위 머리띠 …
   단추 안의 글씨는 단추가 눌리지 않게 작은 창으로, 나머지는 그 자리에서 쓴다. 비우면 처음 글씨로. */
function 글씨넣기(k, 글){
  원본.글씨=원본.글씨||{};
  글=String(글||'').replace(/\s+/g,' ').trim();
  if(글) 원본.글씨[k]=글; else delete 원본.글씨[k];
  if(!Object.keys(원본.글씨).length) delete 원본.글씨;
  바꿨다(); 다시();
}
function 정한글씨쓰기(){
  [].forEach.call(document.querySelectorAll('[data-글]'), function(el){
    if(el.dataset.쓰기 || el.closest('button')) return;
    el.dataset.쓰기='1';
    try{ el.contentEditable='plaintext-only'; }catch(e){}
    if(el.contentEditable!=='plaintext-only') el.contentEditable='true';
    el.spellcheck=false;
    var 처음='';
    el.addEventListener('focus', function(){ 처음=el.textContent; });
    el.addEventListener('click', function(e){ e.stopPropagation(); });
    el.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
    el.addEventListener('blur', function(){
      var 글=el.textContent.replace(/\s+/g,' ').trim();
      if(글===처음.replace(/\s+/g,' ').trim()) return;
      if(글===String(el.dataset.기본||'').trim()) 글='';
      글씨넣기(el.dataset.글, 글);
    });
  });
}
function 글씨창(el){
  var k=el.dataset.글, 기본=el.dataset.기본||el.textContent;
  var w=창열기('<h3>✏️ 단추 글씨</h3>'+
    '<label>지금 글씨</label><input type="text" id="g-t" value="'+글(el.textContent)+'">'+
    '<p class="풀이">비워 두면 처음 글씨(「'+글(기본)+'」)로 돌아갑니다. 어느 나라 말로 써도 됩니다.</p>'+
    (el.dataset.크기? 크기줄HTML(el.dataset.크기) : '')+
    (el.closest('button')&&el.closest('button').onclick? '<button type="button" id="g-go" style="margin-top:12px;width:100%;min-height:40px;border-radius:10px;border:1px dashed rgba(8,60,55,.3);background:#fff;font:700 13.5px system-ui,sans-serif;cursor:pointer;color:#0d2b28">➡ 이 단추가 하는 일 하기 (예: 차트로 가기)</button>' : '')+
    '<div class="단추들"><button type="button" id="g-no">닫기</button><button type="button" class="확인" id="g-ok">확인</button></div>');
  크기줄달기(w);
  var 가=w.querySelector('#g-go'); if(가) 가.onclick=function(){ var bt=el.closest('button'); 닫기(); try{ bt.onclick.call(bt); }catch(e){} };
  var 입=w.querySelector('#g-t');
  function 확인(){ var v=입.value.trim(); 글씨넣기(k, v===기본.trim()?'':v); 닫기(); }
  w.querySelector('#g-no').onclick=닫기; w.querySelector('#g-ok').onclick=확인;
  입.addEventListener('keydown',function(e){ if(e.key==='Enter') 확인(); });
  setTimeout(function(){ 입.focus(); 입.select(); },50);
}
document.addEventListener('click', function(ev){
  if(!원본) return;
  var b=ev.target.closest && ev.target.closest('button'); if(!b||b.closest('#주편-띠,#주편-막,.주편-손,.재생줄')) return;
  var el=b.querySelector('[data-글]'); if(!el) return;
  ev.preventDefault(); ev.stopPropagation(); 글씨창(el);
}, true);

/* ── 판 587 : 글자 크기 — 글씨를 누르면 위에 [A− 100% A+ ↔한 줄 ↺] 가 뜬다 ──
   파트너 — 「글자 축소 기능도… 중국 노래 제목이 폰에서 줄바꿈」
   크기는 「처음 크기의 몇 %」 로 적어서 폰·컴퓨터 어디서나 같은 비율. 「↔ 한 줄」 은 보는 화면마다 한 줄에 맞춘다. */
function 크기값(k){ return (원본&&원본.크기||{})[k]; }
function 크기넣기(k, v){
  원본.크기=원본.크기||{};
  if(v==null||v===100) delete 원본.크기[k]; else 원본.크기[k]=v;
  if(!Object.keys(원본.크기).length) delete 원본.크기;
  try{ JN.크기칠하기(); }catch(e){}
  바꿨다();
}
function 크기글(v){ return v==='fit'?'한 줄 맞춤':((v==null?100:v)+'%'); }
function 크기한칸(k, 뒤){
  var v=크기값(k), n=(v==null||v==='fit')?100:+v;
  if(뒤==='작게') 크기넣기(k, Math.max(40, n-5));
  else if(뒤==='크게') 크기넣기(k, Math.min(180, n+5));
  else if(뒤==='한줄') 크기넣기(k, v==='fit'?null:'fit');
  else 크기넣기(k, null);
}
function 크기줄HTML(k, 이름){
  return '<div class="크기줄" data-k="'+글(k)+'" style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">'+
    (이름?'<span style="font-size:12px;color:#5b7a74;min-width:70px">'+글(이름)+'</span>':'<span style="font-size:12px;color:#5b7a74">글자 크기</span>')+
    '<button type="button" data-w="작게" style="flex:0 0 auto;min-height:34px;padding:0 12px">A−</button>'+
    '<b class="값" style="min-width:58px;text-align:center;font-size:13px">'+크기글(크기값(k))+'</b>'+
    '<button type="button" data-w="크게" style="flex:0 0 auto;min-height:34px;padding:0 12px">A+</button>'+
    '<button type="button" data-w="한줄" style="flex:0 0 auto;min-height:34px;padding:0 10px">↔ 한 줄</button>'+
    '<button type="button" data-w="처음" style="flex:0 0 auto;min-height:34px;padding:0 10px">↺</button></div>';
}
function 크기줄달기(w){
  [].forEach.call(w.querySelectorAll('.크기줄'), function(z){
    z.addEventListener('click', function(e){
      var b=e.target.closest('button[data-w]'); if(!b) return;
      e.preventDefault(); 크기한칸(z.dataset.k, b.dataset.w);
      z.querySelector('.값').textContent=크기글(크기값(z.dataset.k));
    });
  });
}
/* 떠 있는 글자 크기 띠 — 그 자리에서 쓰는 글씨에 */
var 크기띠=document.createElement('div'); 크기띠.id='주편-크기';
크기띠.style.cssText='position:fixed;z-index:9997;display:none;gap:4px;align-items:center;background:#0d2b28;color:#eafff8;border-radius:12px;padding:5px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:700 12.5px system-ui,sans-serif';
크기띠.innerHTML='<button data-w="작게">A−</button><b class="값" style="min-width:64px;text-align:center">100%</b><button data-w="크게">A+</button><button data-w="한줄">↔ 한 줄</button><button data-w="처음" title="처음 크기">↺</button>';
[].forEach.call(크기띠.querySelectorAll('button'), function(b){ b.type='button'; b.style.cssText='border:0;border-radius:8px;min-height:34px;padding:0 10px;background:#1d4a44;color:#eafff8;font:700 13px system-ui,sans-serif;cursor:pointer'; });
document.body.appendChild(크기띠);
var 크기대상=null;
function 크기띠놓기(){
  if(!크기대상){ 크기띠.style.display='none'; return; }
  var 지금=크기값(크기대상.dataset.크기);
  크기띠.querySelector('.값').textContent=크기글(지금);
  var 한=크기띠.querySelector('[data-w=한줄]'); 한.style.background=(지금==='fit')?'#eaa61b':'#1d4a44'; 한.style.color=(지금==='fit')?'#1c1300':'#eafff8';
  크기띠.style.display='flex';
  var r=크기대상.getBoundingClientRect(), h=크기띠.offsetHeight||44, w=크기띠.offsetWidth||260;
  var top=r.top-h-8; if(top<8) top=r.bottom+8;
  크기띠.style.top=top+'px'; 크기띠.style.left=Math.max(8,Math.min(window.innerWidth-w-8, r.left))+'px';
}
크기띠.addEventListener('pointerdown', function(e){ e.preventDefault(); });   /* 쓰던 글씨에서 커서가 빠지지 않게 */
크기띠.addEventListener('mousedown', function(e){ e.preventDefault(); });
크기띠.addEventListener('click', function(e){
  var b=e.target.closest('button[data-w]'); if(!b||!크기대상) return;
  e.preventDefault(); e.stopPropagation(); 크기한칸(크기대상.dataset.크기, b.dataset.w); 크기띠놓기();
});
document.addEventListener('focusin', function(e){
  var t=e.target; if(t&&t.dataset&&t.dataset.크기&&t.isContentEditable){ 크기대상=t; 크기띠놓기(); }
});
document.addEventListener('focusout', function(e){
  setTimeout(function(){ var a=document.activeElement; if(!(a&&a.dataset&&a.dataset.크기&&a.isContentEditable)){ 크기대상=null; 크기띠놓기(); } },0);
});
window.addEventListener('scroll', function(){ if(크기대상) 크기띠놓기(); }, true);

/* ── 누르면 고치기 (점선 친 곳) ── */
document.addEventListener('click', function(ev){
  if(!원본) return;
  var t=ev.target;
  if(t.closest('#주편-띠,#주편-막,.주편-손,.playc,.재생줄,.votec,a,button,select,input,textarea,[contenteditable="true"],[contenteditable="plaintext-only"]')) return;
  if(t.closest('.champion .top')) return;   /* 판 579 : 카드 이름은 그 자리에서 바로 쓴다 */
  /* 판 581 : 표 숫자를 누르면 표만 고치는 작은 창 */
  var 표칸=t.closest('.champion .foot .v,.rise .vt,.item .votes');
  if(표칸){ var 임자=표칸.closest('.champion,.rise[data-k],.item[data-k]'); var c0=임자&&곡찾기(임자.dataset.k);
    if(c0){ ev.preventDefault(); ev.stopPropagation(); 표창(c0); } return; }
  var 카드=t.closest('.champion');
  if(카드){ var c=곡찾기(카드.dataset.k); if(c){ ev.preventDefault(); 곡창(c, false, 카드.classList.contains('glob')?'글로벌':'국내'); } return; }
  var 줄=t.closest('.rise[data-k],.item[data-k]');
  if(줄 && 줄.dataset.k){ var c2=곡찾기(줄.dataset.k); if(c2){ ev.preventDefault(); 곡창(c2, false, 어느목록(줄)); } return; }
  if(t.closest('.hero h1,.hero .lede')){ ev.preventDefault(); 문구창(); }
}, true);

/* 판 609 : 누른 줄이 국내 목록인가 글로벌 목록인가 */
function 어느목록(el){
  if(el.closest('#rise-glob')) return '글로벌';
  if(el.closest('#rise-home')) return '국내';
  var 보={급:'home',차:'home'}; try{ 보=JN.보기들(); }catch(e){}
  if(el.closest('#rise')) return 보.급==='home'?'국내':'글로벌';
  if(el.closest('.item')) return 보.차==='home'?'국내':'글로벌';
  return '';
}

/* ── 파일 ── */
function 파일고르기(accept, 손, 여럿){
  var i=document.createElement('input'); i.type='file'; i.accept=accept; i.style.display='none';
  if(여럿) i.multiple=true;
  i.onchange=function(){ [].forEach.call(i.files||[], function(f){ 손(f); }); i.remove(); };
  document.body.appendChild(i); i.click();
}
function 종류(f){
  var n=(f.name||'').toLowerCase(), t=f.type||'';
  if(/^image\//.test(t)||/\.(jpe?g|png|webp|gif|heic|avif)$/.test(n)) return '사진';
  if(/midi/.test(t)||/\.midi?$/.test(n)) return '악보';
  if(/pdf/.test(t)||/\.pdf$/.test(n)) return '악보';
  if(/musicxml/.test(t)||/\.(musicxml|xml)$/.test(n)) return '악보';
  if(/^audio\//.test(t)||/\.(mp3|wav|m4a|aac|flac|ogg)$/.test(n)) return '음악';
  return '';
}
/* 판 580 : 악보는 **여러 개** — MIDI · PDF · MusicXML · 악보 사진. 곡마다 「악보들」 목록에 쌓인다.
   파일 이름은 s021-1.pdf, s021-2.mid … 처럼 저절로. */
function 악보번호(c){
  var m=0;
  (c.악보들||[]).forEach(function(x){ var k=String(x.키||x.주소||''), r=k.match(/-(\d+)\.\w+(\?|$)/); if(r) m=Math.max(m,+r[1]); });
  Object.keys(새파일).forEach(function(k){ var r=k.match(new RegExp('^'+c.id+'-(\\d+)\\.')); if(r) m=Math.max(m,+r[1]); });
  return m+1;
}
async function 악보넣기(c, f){
  var n=(f.name||'').toLowerCase(), 머리=new Uint8Array(await f.slice(0,4096).arrayBuffer());
  var 첫4=String.fromCharCode(머리[0],머리[1],머리[2],머리[3]), 끝, 종, 몸=f;
  if(첫4==='MThd'){ 끝='mid'; 종='MIDI'; }
  else if(첫4==='%PDF'){ 끝='pdf'; 종='PDF'; }
  else if(/^image\//.test(f.type||'')||/\.(jpe?g|png|webp|gif|heic|avif)$/.test(n)){ 몸=await 사진만들기(f, 2400); 끝='jpg'; 종='악보 사진'; }
  else {
    var 글머리=new TextDecoder('utf-8').decode(머리);
    if(/score-(partwise|timewise)/.test(글머리)){ 끝='musicxml'; 종='MusicXML'; }
    else throw new Error((f.name||'이 파일')+' — 악보 파일이 아닙니다 (MIDI · PDF · MusicXML · 악보 사진)');
  }
  var 키=c.id+'-'+악보번호(c)+'.'+끝;
  새파일[키]=몸;
  c.악보들=c.악보들||[];
  c.악보들.push({이름:f.name||키, 종류:종, 키:키, 주소:URL.createObjectURL(몸)});
  return 종+' · '+(f.name||키);
}
async function 파일넣기(c, f, 알림, 쪽){
  알림=알림||function(x){ 띠그리기(x); };
  var k=(쪽==='악보')? '악보' : 종류(f);
  /* 판 581 : ✅ 알림을 **맨 나중에** — 전에는 바로 뒤의 「바뀐 것 n곳」 이 ✅ 를 덮어서
     음악을 넣어도 아무 일 없는 것처럼 보였다 (파트너 — 「메인 음악 올리는 것 안 되고」) */
  var 끝말='';
  try{
    if(k==='음악'){
      알림('🔧 음악 읽는 중… '+f.name+' — 긴 곡은 1~2분 걸립니다');
      var r=await mp3만들기(f, 알림);
      if(c.음악&&/^blob:/.test(c.음악)){ try{ URL.revokeObjectURL(c.음악); }catch(e){} }
      새파일[c.id+'.mp3']=r.blob; c.음악=URL.createObjectURL(r.blob); c.길이=Math.round(r.길이);
      끝말='✅ 음악 들어감 · 「'+(c.t||c.id)+'」 · '+분초(r.길이)+' · '+크기(r.blob.size)+(r.줄임?' (128k 로 줄임)':'')+' — 💾 저장을 누르면 올라갑니다';
    } else if(k==='사진'){
      알림('🔧 사진 줄이는 중…');
      var b=await 사진만들기(f);
      새파일[c.id+'.jpg']=b; c.사진=URL.createObjectURL(b);
      끝말='✅ 사진 들어감 · 「'+(c.t||c.id)+'」 · '+크기(b.size)+' — 💾 저장을 누르면 올라갑니다';
    } else if(k==='악보'){
      끝말='✅ 악보 '+(await 악보넣기(c,f));
    } else throw new Error((f.name||'이 파일')+' — 음악(mp3·wav·m4a)이나 그림 파일이 아닙니다');
    카드붙이기(c); 바꿨다(); 다시();
    알림(끝말);
    return true;
  }catch(err){ 알림('⚠️ '+((err&&err.message)||err)); return false; }
}

/* 음악 → 128k mp3 (이미 가벼운 mp3 면 그대로) */
function 라메받기(){
  if(window.lamejs) return Promise.resolve();
  return new Promise(function(ok,no){
    var s=document.createElement('script'); s.src=라메주소; s.async=true;
    s.onload=function(){ window.lamejs?ok():no(new Error('MP3 도구가 비어 있습니다')); };
    s.onerror=function(){ no(new Error('MP3 도구를 못 받았습니다 — 인터넷을 확인해 주세요')); };
    document.head.appendChild(s);
  });
}
function 쉼(){ return new Promise(function(r){ setTimeout(r,0); }); }
async function mp3만들기(file, 알림){
  var buf=await file.arrayBuffer();
  var AC=window.AudioContext||window.webkitAudioContext, ac;
  try{ ac=new AC({sampleRate:44100}); }catch(e){ ac=new AC(); }
  var ab;
  try{ ab=await new Promise(function(ok,no){ var p=ac.decodeAudioData(buf.slice(0),ok,no); if(p&&p.then) p.then(ok,no); }); }
  catch(e){ throw new Error((file.name||'이 음악')+' — 이 브라우저가 못 읽는 음악입니다. mp3 나 wav 로 넣어 주세요 (크롬이면 m4a 도 됩니다)'); }
  finally{ try{ ac.close(); }catch(e){} }
  var 길이=ab.duration, kbps=file.size*8/길이/1000;
  if((/mpeg|mp3/i.test(file.type)||/\.mp3$/i.test(file.name)) && kbps<=150) return {blob:file, 길이:길이, 줄임:false};
  알림('🔧 MP3 도구를 받는 중…'); await 라메받기();
  var ch=Math.min(2,ab.numberOfChannels), enc=new lamejs.Mp3Encoder(ch, ab.sampleRate, 128);
  var L=ab.getChannelData(0), R=ch>1?ab.getChannelData(1):null, n=L.length, 한=1152*40, parts=[], 번=0;
  function i16(f,a,b){ var o=new Int16Array(b-a); for(var i=a;i<b;i++){ var x=f[i]; x=x<-1?-1:(x>1?1:x); o[i-a]=x<0?x*32768:x*32767; } return o; }
  for(var a=0;a<n;a+=한){
    var b=Math.min(n,a+한), o=R? enc.encodeBuffer(i16(L,a,b),i16(R,a,b)) : enc.encodeBuffer(i16(L,a,b));
    if(o.length) parts.push(new Uint8Array(o));
    if((++번)%8===0){ 알림('🔧 128k 로 줄이는 중… '+Math.round(a/n*100)+'%'); await 쉼(); }
  }
  var e=enc.flush(); if(e.length) parts.push(new Uint8Array(e));
  return {blob:new Blob(parts,{type:'audio/mpeg'}), 길이:길이, 줄임:true};
}
/* 사진 → 긴 변 1280 jpg */
function 사진만들기(file, 긴변){
  긴변=긴변||1280;
  return new Promise(function(ok,no){
    var u=URL.createObjectURL(file), im=new Image();
    im.onload=function(){
      try{
        var w=im.naturalWidth, h=im.naturalHeight, r=Math.min(1,긴변/Math.max(w,h));
        var cv=document.createElement('canvas'); cv.width=Math.max(1,Math.round(w*r)); cv.height=Math.max(1,Math.round(h*r));
        var g=cv.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,cv.width,cv.height); g.drawImage(im,0,0,cv.width,cv.height);
        cv.toBlob(function(b){ URL.revokeObjectURL(u); b?ok(b):no(new Error('사진을 못 만들었습니다')); },'image/jpeg',0.86);
      }catch(e){ URL.revokeObjectURL(u); no(e); }
    };
    im.onerror=function(){ URL.revokeObjectURL(u); no(new Error('이 그림은 열 수 없습니다 (jpg·png 로 해 주세요)')); };
    im.src=u;
  });
}

/* ── 곡 고치기 창 ── */
function 창열기(html){
  닫기();
  var 막=document.createElement('div'); 막.id='주편-막';
  막.innerHTML='<div id="주편-창" role="dialog" aria-modal="true">'+html+'</div>';
  막.addEventListener('click', function(e){ if(e.target===막) 닫기(); });
  document.body.appendChild(막);
  return 막.firstChild;
}
function 닫기(){ var m=document.getElementById('주편-막'); if(m) m.remove(); 띠그리기(); }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') 닫기(); });

/* 판 609 : 곡이 어느 차트에 오르나 — 국내 · 글로벌을 따로 고른다 */
function 자리들(c){
  if(Array.isArray(c.자리)) return c.자리.filter(function(x){ return x==='국내'||x==='글로벌'; });
  return String(c.나라||'').trim()? ['국내'] : ['글로벌'];
}
function 곳이름(곳){ return 곳==='국내'?'🇰🇷 국내 차트':'🌍 글로벌 차트'; }
function 곡창(c, 새로, 곳){
  var 장=장르들.map(function(x){ return '<option'+(x===c.g?' selected':'')+'>'+x+'</option>'; }).join('');
  var ks=Object.keys(나라들).sort(function(a,b){ return 나라들[a].localeCompare(나라들[b],'ko'); });
  var 나=ks.map(function(k){ return '<option value="'+k+'"'+(k===(c.나라||'')?' selected':'')+'>'+깃발(k)+' '+나라들[k]+'</option>'; }).join('');
  var w=창열기(
    '<h3>'+(새로?'＋ 새 곡':'✏️ 곡 고치기')+' <span style="font-weight:400;color:#93aba6;font-size:12px">'+c.id+'</span></h3>'+
    '<label>제목</label><input type="text" id="e-t" value="'+글(c.t)+'" placeholder="곡 제목">'+
    '<label>지은이</label><input type="text" id="e-by" value="'+글(c.by)+'" placeholder="@이름">'+
    '<div class="두칸"><div><label>장르 (써도 되고 골라도 됩니다)</label><input type="text" id="e-g" list="e-g-l" value="'+글(c.g||'')+'"><datalist id="e-g-l">'+장르들.map(function(x){ return '<option value="'+x+'">'; }).join('')+'</datalist></div>'+
      '<div><label>나라</label><select id="e-n"><option value="">🌍 없음</option>'+나+'</select></div></div>'+
    '<label>올릴 차트 — 원하는 곳만 고르세요</label>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:2px">'+
      '<label style="display:flex;gap:6px;align-items:center;font-weight:700;margin:0;padding:9px 12px;border:1px solid #cfe2dd;border-radius:10px;cursor:pointer"><input type="checkbox" id="e-p-home"'+(자리들(c).indexOf('국내')>=0||(새로&&!c.자리)?' checked':'')+'> 🇰🇷 국내 차트</label>'+
      '<label style="display:flex;gap:6px;align-items:center;font-weight:700;margin:0;padding:9px 12px;border:1px solid #cfe2dd;border-radius:10px;cursor:pointer"><input type="checkbox" id="e-p-glob"'+(!새로&&자리들(c).indexOf('글로벌')>=0?' checked':'')+'> 🌍 글로벌 차트</label>'+
    '</div><p class="풀이">국내 차트는 <b>위에 고른 나라</b>의 손님에게 보입니다. 둘 다 고르면 두 차트에 함께 오릅니다.</p>'+
    '<div class="두칸"><div><label>표</label><input type="number" id="e-v" value="'+(+c.표||0)+'"></div>'+
      '<div><label>9-AI 점수</label><input type="number" id="e-s" step="0.1" value="'+(c.점수!=null?c.점수:90)+'"></div></div>'+
    '<label>🎵 음악</label><div class="짐" id="e-mus"><b>눌러서 고르기</b> 또는 여기에 끌어다 놓기 · mp3 · wav · m4a</div>'+
      '<div class="st" id="e-mus-st"></div><audio id="e-mus-a" controls preload="none" hidden></audio>'+
    '<label>🖼 사진 (카드 바탕)</label><div class="짐" id="e-img"><b>눌러서 고르기</b> 또는 여기에 끌어다 놓기 · jpg · png</div>'+
      '<div class="st" id="e-img-st"></div><img class="미리" id="e-img-p" hidden alt="">'+
    '<label>✍️ 가사</label><textarea id="e-gas" placeholder="[Verse 1]&#10;…">'+글(c.가사)+'</textarea>'+
    '<label>🎼 악보 — 여러 개 넣을 수 있습니다</label><div class="짐" id="e-mid"><b>눌러서 고르기</b> 또는 여러 개를 한꺼번에 끌어다 놓기<br>MIDI · PDF · MusicXML · 악보 사진</div>'+
      '<div class="st" id="e-mid-st"></div><div id="e-mid-l"></div>'+
    '<div class="단추들">'+(새로?'':'<button type="button" class="지우기" id="e-del">🗑 곡 지우기</button>')+
      ((!새로 && 곳 && 자리들(c).indexOf(곳)>=0 && 자리들(c).length>1)? '<button type="button" class="지우기" id="e-out">'+곳이름(곳)+'에서만 빼기</button>' : '')+
      '<button type="button" id="e-no">닫기</button><button type="button" class="확인" id="e-ok">확인</button></div>'+
    '<p class="풀이">「확인」은 화면에만 바꿉니다. 다 고치신 뒤 아래 <b>💾 저장</b>을 눌러야 사이트에 나옵니다.</p>');
  function 그리기(){
    var mst=w.querySelector('#e-mus-st'), au=w.querySelector('#e-mus-a');
    if(c.음악){ mst.textContent=(새파일[c.id+'.mp3']?'✅ 새 음악 · '+크기(새파일[c.id+'.mp3'].size):'🔗 들어 있음')+(c.길이?' · '+분초(c.길이):''); if(au.getAttribute('src')!==c.음악) au.src=c.음악; au.hidden=false; }
    else { mst.textContent=''; au.hidden=true; }
    var ist=w.querySelector('#e-img-st'), ip=w.querySelector('#e-img-p');
    if(c.사진){ ist.textContent=새파일[c.id+'.jpg']?'✅ 새 사진 · '+크기(새파일[c.id+'.jpg'].size):'🔗 들어 있음'; ip.src=c.사진; ip.hidden=false; }
    else { ist.textContent=''; ip.hidden=true; }
    var 목록=w.querySelector('#e-mid-l'), 모음=[];
    if(c.악보) 모음.push({이름:'MIDI (예전에 넣은 것)', 종류:'MIDI', 주소:c.악보, 옛:true});
    (c.악보들||[]).forEach(function(x){ 모음.push(x); });
    목록.innerHTML=모음.length? 모음.map(function(x,i){
      return '<div style="display:flex;gap:8px;align-items:center;padding:7px 9px;margin-top:6px;border-radius:9px;background:#eef5f3;font-size:13px">'+
        '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(x.키&&새파일[x.키]?'🆕 ':'🔗 ')+글(x.종류)+' · '+글(x.이름)+'</span>'+
        '<button type="button" data-i="'+i+'" style="border:0;background:none;color:#d6453f;font-weight:700;cursor:pointer;font-size:13px">지우기</button></div>';
    }).join('') : '';
    [].forEach.call(목록.querySelectorAll('button[data-i]'), function(b){
      b.onclick=function(){
        var x=모음[+b.dataset.i]; if(!x) return;
        if(x.옛) delete c.악보;
        else { c.악보들=(c.악보들||[]).filter(function(y){ return y!==x; }); if(x.키) delete 새파일[x.키]; if(!c.악보들.length) delete c.악보들; }
        바꿨다(); 그리기();
      };
    });
  }
  function 짐(id, accept, stid, 쪽){
    var z=w.querySelector(id), st=w.querySelector(stid), 여럿=(쪽==='악보');
    function 넣기(f){
      /* 악보는 여러 개라 알림을 쌓는다 — 하나가 틀려도 다른 것의 ✅ 에 묻히지 않게 */
      return 파일넣기(c,f,function(x){
        if(여럿){ if(/^✅|^⚠️/.test(x)){ st.className='st'+(/⚠️/.test(st.textContent+x)?' bad':''); st.textContent=(st.dataset.쌓임?st.textContent+'\n':'')+x; st.dataset.쌓임='1'; st.style.whiteSpace='pre-line'; } }
        else { st.className='st'+(/⚠️/.test(x)?' bad':''); st.textContent=x; }
      },쪽).then(function(ok){ if(ok) 그리기(); });
    }
    z.onclick=function(){ 파일고르기(accept, 넣기, 여럿); };
    z.addEventListener('dragover',function(e){ e.preventDefault(); z.classList.add('끌림'); });
    z.addEventListener('dragleave',function(){ z.classList.remove('끌림'); });
    z.addEventListener('drop',function(e){ e.preventDefault(); z.classList.remove('끌림');
      var fs=[].slice.call(e.dataTransfer.files||[]); (여럿?fs:fs.slice(0,1)).reduce(function(p,f){ return p.then(function(){ return 넣기(f); }); }, Promise.resolve()); });
  }
  짐('#e-mus','audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg','#e-mus-st');
  짐('#e-img','image/*','#e-img-st');
  짐('#e-mid','.mid,.midi,audio/midi,.pdf,application/pdf,.musicxml,.xml,image/*','#e-mid-st','악보');
  그리기();
  w.querySelector('#e-no').onclick=function(){ 닫기(); };
  w.querySelector('#e-ok').onclick=function(){
    var t=w.querySelector('#e-t').value.trim();
    if(!t){ alert('제목을 넣어 주세요.'); return; }
    c.t=t; c.by=w.querySelector('#e-by').value.trim(); c.g=w.querySelector('#e-g').value.trim()||장르들[0];
    c.나라=(w.querySelector('#e-n').value||'').toUpperCase();
    var 새자리=[]; if(w.querySelector('#e-p-home').checked) 새자리.push('국내'); if(w.querySelector('#e-p-glob').checked) 새자리.push('글로벌');
    if(!새자리.length){ alert('국내 차트나 글로벌 차트 가운데 하나는 골라 주세요.\n(곡을 아예 내리려면 「🗑 곡 지우기」를 누르세요)'); return; }
    if(새자리.indexOf('국내')>=0 && !c.나라){ alert('국내 차트에 올리려면 나라를 골라 주세요.'); return; }
    c.자리=새자리;
    c.표=Math.max(0,parseInt(w.querySelector('#e-v').value,10)||0); c.전표=Math.min(+c.전표||0,c.표);
    c.점수=parseFloat(w.querySelector('#e-s').value)||0;
    var gas=w.querySelector('#e-gas').value.replace(/\r/g,'').trim(); if(gas) c.가사=gas; else delete c.가사;
    c.자켓={gi:(자켓장르[c.g]||0), img:해시(c.t)%40, 색:0, 결:null};
    if(새로 && !곡찾기(c.id)) 원본.곡.push(c);
    카드붙이기(c); 바꿨다(); 다시(); 닫기();
    if(새로) 띠그리기('🆕 「'+c.t+'」 — 목록 맨 위에 노란 줄로 있습니다 · 🔍 찾기로 자리를 볼 수 있습니다');
  };
  var d=w.querySelector('#e-del');
  if(d) d.onclick=function(){
    if(!confirm('「'+(c.t||c.id)+'」 을(를) 곡째로 지울까요?\n국내 · 글로벌 차트 모두에서 사라집니다.\n(한 차트에서만 내리려면 닫고, 체크를 빼고 확인을 누르세요)\n\n💾 저장을 눌러야 사이트에서도 지워집니다.')) return;
    원본.곡=원본.곡.filter(function(x){ return x!==c; });
    ['.mp3','.jpg','.mid'].forEach(function(x){ delete 새파일[c.id+x]; });
    바꿨다(); 다시(); 닫기();
  };
  var o=w.querySelector('#e-out');
  if(o) o.onclick=function(){
    c.자리=자리들(c).filter(function(x){ return x!==곳; });
    바꿨다(); 다시(); 닫기();
    띠그리기('「'+(c.t||c.id)+'」 — '+곳이름(곳)+'에서 뺐습니다 (곡은 '+c.자리.map(곳이름).join(' · ')+'에 그대로) · 💾 저장을 눌러 주세요');
  };
  setTimeout(function(){ var i=w.querySelector('#e-t'); if(i&&새로) i.focus(); },50);
}

/* ── 판 581 : 표 고치기 — 숫자만 크게 ──
   파트너 — 「투표도 직접 수정하게」 */
function 표창(c){
  var w=창열기('<h3>🗳 표 고치기 <span style="font-weight:400;color:#93aba6;font-size:12px">'+글(c.t||c.id)+'</span></h3>'+
    '<label>운영자 표 (숫자만)</label><input type="number" inputmode="numeric" min="0" class="큰수" id="v-n" value="'+(+c.표||0)+'">'+
    '<p class="풀이" id="v-g" style="font-size:13px;color:#0d2b28"></p>'+
    '<p class="풀이">지금은 운영자가 정하는 숫자입니다. <b>손님 투표가 열리면 표는 손님 투표로만 오르게</b> 두세요 — 「공정한 무대」라는 말과 맞아야 합니다.</p>'+
    '<div class="단추들"><button type="button" id="v-no">닫기</button><button type="button" class="확인" id="v-ok">확인</button></div>'+
    '<p class="풀이">「확인」은 화면에만 바꿉니다. 아래 <b>💾 저장</b>을 눌러야 사이트에 나옵니다.</p>');
  var 입=w.querySelector('#v-n'), 손=0; try{ 손=JN.손님표(c.id); }catch(e){}
  function 합(){ var n=parseInt(String(입.value).replace(/[^\d]/g,''),10)||0;
    w.querySelector('#v-g').innerHTML='👆 손님 투표 <b>+'+손.toLocaleString()+'</b> → 카드에는 <b>'+(n+손).toLocaleString()+'표</b>'; }
  입.addEventListener('input',합); 합();
  function 확인(){
    var n=parseInt(String(입.value).replace(/[^\d]/g,''),10);
    if(!isFinite(n)||n<0){ alert('숫자를 넣어 주세요.'); return; }
    c.표=n; c.전표=Math.min(+c.전표||0,n);
    카드붙이기(c); 바꿨다(); 다시(); 닫기();
  }
  w.querySelector('#v-no').onclick=닫기;
  w.querySelector('#v-ok').onclick=확인;
  입.addEventListener('keydown',function(e){ if(e.key==='Enter') 확인(); });
  setTimeout(function(){ 입.focus(); 입.select(); },50);
}

/* ── 판 578 : 챔피언 카드 이름 · 카드에 보일 곡 ── */
function 카드창(){
  var 카=원본.카드||{}, 왼=카.왼쪽||{}, 오=카.오른쪽||{};
  var 곡들=(원본.곡||[]).slice().sort(function(a,b){ return (+b.표||0)-(+a.표||0); });
  var 내=''; try{ 내=JN.내나라(); }catch(e){}
  function 고르기(id, 지금){
    /* 판 582 : 왼쪽은 「내 나라」 카드 — 그 나라 곡만 고를 수 있다 (다른 나라 곡은 거기 손님에게 안 보이니까) */
    var 목록=(id==='k-ls'&&내)? 곡들.filter(function(c){ return !c.나라||c.나라===내||c.id===지금; }) : 곡들;
    return '<select id="'+id+'"><option value="">자동 — 표 1등</option>'+
      목록.map(function(c){ return '<option value="'+글(c.id)+'"'+(c.id===지금?' selected':'')+'>'+글(c.t||c.id)+' · '+글(c.by||'')+'</option>'; }).join('')+'</select>';
  }
  var w=창열기('<h3>👑 챔피언 카드</h3>'+
    '<label>왼쪽 카드 이름</label><input type="text" id="k-ln" value="'+글(왼.이름||'')+'" placeholder="{나라} 챔피언">'+
    '<p class="풀이">카드 제목·아랫줄은 <b>카드 위 글씨를 눌러 바로</b> 쓰세요 — 그 곡의 제목·지은이·장르가 함께 바뀝니다. 카드 이름을 비워 두면 「🇰🇷 대한민국 챔피언」처럼 보는 사람 나라로 나옵니다. <b>{나라}</b> 라고 쓰면 그 자리에 나라 이름이 들어갑니다.</p>'+
    '<label>왼쪽 카드의 곡 (음악 · 사진 · ▶)</label>'+고르기('k-ls', 왼.곡)+
    '<hr style="border:0;border-top:1px solid rgba(8,60,55,.12);margin:16px 0 4px">'+
    '<label>오른쪽 카드 이름</label><input type="text" id="k-rn" value="'+글(오.이름||'')+'" placeholder="🌍 글로벌 챔피언">'+
    '<label>오른쪽 카드의 곡 (음악 · 사진 · ▶)</label>'+고르기('k-rs', 오.곡)+
    '<p class="풀이">「자동」이면 표가 가장 많은 곡이 나옵니다. 곡을 고르면 표와 상관없이 그 곡이 나옵니다 — '+
      '진짜 투표가 시작되면 <b>「자동」으로 돌려 두세요</b>. 공정한 무대라는 말과 맞아야 합니다.</p>'+
    '<hr style="border:0;border-top:1px solid rgba(8,60,55,.12);margin:16px 0 4px">'+
    '<label>👆 투표하면 나오는 말</label><input type="text" id="k-v1" value="'+글((원본.글씨||{}).투표됨말||'')+'" placeholder="👆 투표했습니다 — 고맙습니다!">'+
    '<label>👆 이미 투표했을 때 나오는 말</label><input type="text" id="k-v2" value="'+글((원본.글씨||{}).투표또말||'')+'" placeholder="오늘은 이 곡에 투표하셨습니다 — 내일 또 눌러 주세요">'+
    '<p class="풀이">단추 글씨 「👆 투표」 · 「표」 · 「투표중」 은 카드 위에서 바로 누르면 고칠 수 있습니다.</p>'+
    '<div class="단추들"><button type="button" id="k-no">닫기</button><button type="button" class="확인" id="k-ok">확인</button></div>');
  w.querySelector('#k-no').onclick=닫기;
  w.querySelector('#k-ok').onclick=function(){
    function 값(id){ return w.querySelector(id).value.trim(); }
    var 옛=원본.카드||{};
    원본.카드={ 왼쪽:Object.assign({}, 옛.왼쪽||{}, { 이름:값('#k-ln'), 곡:w.querySelector('#k-ls').value }),
               오른쪽:Object.assign({}, 옛.오른쪽||{}, { 이름:값('#k-rn'), 곡:w.querySelector('#k-rs').value }) };
    원본.글씨=원본.글씨||{};
    [['#k-v1','투표됨말'],['#k-v2','투표또말']].forEach(function(x){ var v=값(x[0]); if(v) 원본.글씨[x[1]]=v; else delete 원본.글씨[x[1]]; });
    if(!Object.keys(원본.글씨).length) delete 원본.글씨;
    바꿨다(); 다시(); 닫기();
  };
}

/* ── 첫 화면 문구 창 ── */
function 문구창(){
  var m=원본.문구||{}, 시=원본.시즌||{};
  var w=창열기('<h3>✏️ 첫 화면 문구</h3>'+
    '<label>첫 줄</label><input type="text" id="m-1" value="'+글(m.제목1||'누구나 작곡가가 되는')+'">'+
    '<label>둘째 줄 (색 들어가는 줄)</label><input type="text" id="m-2" value="'+글(m.제목2||'지구에서 가장 공정한 무대')+'">'+
    크기줄HTML('문구제목','큰 글씨')+
    '<label>설명</label><textarea id="m-3" style="min-height:90px">'+글(m.설명||'')+'</textarea>'+
    크기줄HTML('문구설명','설명')+
    '<div class="두칸"><div><label>시즌 이름</label><input type="text" id="m-sn" value="'+글(시.이름||'')+'"></div>'+
      '<div><label>시즌 끝나는 날</label><input type="date" id="m-se" value="'+글(시.끝||'')+'"></div></div>'+
    '<label style="display:flex;gap:8px;align-items:center;color:#0d2b28;font-size:14px;margin-top:14px">'+
      '<input type="checkbox" id="m-demo" style="width:20px;height:20px"'+(원본.보기용!==false?' checked':'')+'> 「아직 보기용입니다」 띠 보이기</label>'+
    '<p class="풀이">진짜 곡이 올라오면 띠를 꺼 주세요. 켜 두는 것이 속이지 않는 길입니다.</p>'+
    '<div class="단추들"><button type="button" id="m-no">닫기</button><button type="button" class="확인" id="m-ok">확인</button></div>');
  크기줄달기(w);
  w.querySelector('#m-no').onclick=닫기;
  w.querySelector('#m-ok').onclick=function(){
    원본.문구={제목1:w.querySelector('#m-1').value.trim(), 제목2:w.querySelector('#m-2').value.trim(), 설명:w.querySelector('#m-3').value.trim()};
    원본.시즌=원본.시즌||{}; 원본.시즌.이름=w.querySelector('#m-sn').value.trim(); 원본.시즌.끝=w.querySelector('#m-se').value;
    원본.보기용=!!w.querySelector('#m-demo').checked;
    바꿨다(); 다시(); 닫기();
  };
}

/* ── 판 580 : 열쇠 시간이 지나면 그 자리에서 열쇠말만 다시 — 고친 것은 그대로 두고 이어서 저장 ──
   (서버의 R2 열쇠를 바꾸면 그 전에 받은 표도 못 쓰게 된다. 그때도 여기서 풀린다) */
function 다시들어오기(처음){
  return new Promise(function(ok,no){
    var w=창열기('<h3>🔑 열쇠말을 한 번 더</h3>'+
      '<p class="풀이" style="font-size:13.5px;color:#0d2b28">'+(처음?'서버 열쇠가 바뀌어서, 들어올 때 받은 확인이 낡았습니다. <b>열쇠말을 한 번만 더</b> 넣어 주세요.':'들어온 지 오래됐거나 서버 열쇠가 바뀌어서 확인이 다시 필요합니다. <b>고치신 것은 그대로 있습니다.</b>')+'</p>'+
      '<label>열쇠말</label><input type="password" id="r-pw" autocomplete="off">'+
      '<div class="st bad" id="r-st"></div>'+
      '<div class="단추들"><button type="button" id="r-no">그만두기</button><button type="button" class="확인" id="r-ok">'+(처음?'확인':'확인하고 이어서 저장')+'</button></div>');
    var 입=w.querySelector('#r-pw'), 말=w.querySelector('#r-st');
    function 확인(){
      말.className='st'; 말.textContent='확인하는 중…';
      fetch(서버+'/lee/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pw:입.value})})
        .then(function(r){ return r.json().then(function(j){ return {c:r.status,j:j}; }); })
        .then(function(x){
          if(x.j&&x.j.ok&&x.j.token){
            try{ sessionStorage.setItem('lee-t', x.j.exp+'|'+x.j.token); sessionStorage.setItem('lee','1'); }catch(e){}
            닫기(); ok(x.j.token); return;
          }
          말.className='st bad'; 말.textContent=(x.j&&x.j.why)||'열쇠말이 다릅니다';
        })
        .catch(function(){ 말.className='st bad'; 말.textContent='서버에 닿지 못했습니다 — 인터넷을 확인해 주세요'; });
    }
    w.querySelector('#r-ok').onclick=확인;
    입.addEventListener('keydown',function(e){ if(e.key==='Enter') 확인(); });
    w.querySelector('#r-no').onclick=function(){ 닫기(); no(new Error(처음?'열쇠말은 저장할 때 다시 묻습니다':'저장을 그만두었습니다 — 고친 것은 이 화면에 그대로 있습니다')); };
    setTimeout(function(){ 입.focus(); },50);
  });
}

/* 판 581 : 들어오자마자 확인이 살아 있나 본다 — 낡았으면 **처음에** 열쇠말을 묻는다
   (서버에 이름이 틀린 빈 파일을 보내 본다: 확인이 살아 있으면 400, 낡았으면 401. 아무것도 쓰지 않는다) */
function 열쇠살았나(t){
  if(!t) return Promise.resolve(false);
  return fetch(서버+'/lee/file?name=check',{method:'POST',headers:{'x-lee-token':t,'Content-Type':'application/octet-stream'},body:''})
    .then(function(r){ return r.status!==401; }).catch(function(){ return true; });
}
열쇠살았나(표()).then(function(산){
  if(산) return;
  띠그리기('🔑 열쇠말을 한 번 더 넣어 주세요');
  다시들어오기(true).then(function(){ 띠그리기(); }, function(e){ 띠그리기('🔑 '+e.message); });
});

/* ── 💾 저장 ── */
var 저장중=false;
async function 저장(){
  if(저장중||!원본) return;
  var 열쇠=표();
  저장중=true; var 단추=document.getElementById('주편-저장'); 단추.disabled=true;
  /* 보내기 — 401 이면 열쇠말을 다시 받아 **한 번 더** 보낸다 */
  async function 보내기(주소, 머리, 몸){
    if(!열쇠) 열쇠=await 다시들어오기();
    var h=Object.assign({'x-lee-token':열쇠}, 머리);
    var r=await fetch(주소,{method:'POST',headers:h,body:몸});
    if(r.status===401){ 열쇠=await 다시들어오기(); h['x-lee-token']=열쇠; r=await fetch(주소,{method:'POST',headers:h,body:몸}); }
    var x={}; try{ x=await r.json(); }catch(e){}
    return {r:r, x:x};
  }
  try{
    var 이름들=Object.keys(새파일).sort();
    for(var i=0;i<이름들.length;i++){
      var n=이름들[i];
      띠그리기('⏫ 올리는 중 '+(i+1)+'/'+이름들.length+' · '+n);
      var 답=await 보내기(서버+'/lee/file?name='+encodeURIComponent(n), {'Content-Type':'application/octet-stream'}, 새파일[n]);
      var r=답.r, x=답.x;
      if(r.status===401) throw new Error('열쇠말 확인이 안 됐습니다 — 고친 것은 이 화면에 그대로 있습니다');
      if(!r.ok||!x.ok) throw new Error(n+' 을(를) 못 올렸습니다 — '+(x.why||('서버 '+r.status)));
      var 주소=음악집+n+'?v='+Date.now().toString(36), 악=n.match(/^(s\d+)-\d+\./);
      if(악){
        var ca=곡찾기(악[1]);
        (ca&&ca.악보들||[]).forEach(function(y){ if(y.키===n){ try{ URL.revokeObjectURL(y.주소); }catch(e){} y.주소=주소; } });
      } else {
        var id=n.replace(/\.\w+$/,''), 끝=n.slice(id.length), c=곡찾기(id);
        if(c){ var 칸={'.mp3':'음악','.jpg':'사진','.mid':'악보'}[끝]; if(칸){ try{ if(/^blob:/.test(c[칸])) URL.revokeObjectURL(c[칸]); }catch(e){} c[칸]=주소; } }
      }
      delete 새파일[n];
    }
    /* 아직 blob: 이 남은 칸은 저장하지 않는다 (올라가지 못한 것) */
    var 보낼=JSON.parse(JSON.stringify(원본));
    보낼.곡.forEach(function(c){
      ['음악','사진','악보'].forEach(function(k){ if(c[k]&&/^blob:/.test(c[k])) delete c[k]; });
      if(c.악보들){ c.악보들=c.악보들.filter(function(y){ return y.주소&&!/^blob:/.test(y.주소); }).map(function(y){ return {이름:y.이름, 종류:y.종류, 주소:y.주소}; }); if(!c.악보들.length) delete c.악보들; }
    });
    띠그리기('💾 목록 저장 중…');
    var 답2=await 보내기(서버+'/lee/save', {'Content-Type':'application/json'}, JSON.stringify(보낼));
    var r2=답2.r, y=답2.x;
    if(r2.status===401) throw new Error('열쇠말 확인이 안 됐습니다 — 고친 것은 이 화면에 그대로 있습니다');
    if(!r2.ok||!y.ok) throw new Error('목록을 못 썼습니다 — '+(y.why||('서버 '+r2.status)));
    바뀜=0; 다시();
    띠그리기('✅ 사이트에 반영됐습니다 — 곡 '+y.곡+'곡');
  }catch(err){
    띠그리기('⚠️ '+((err&&err.message)||err));
  }finally{ 저장중=false; 단추.disabled=false; }
}
})();
