/* ═══════════════════════════════════════════════════════════════════════
   JURAN 편집 모드 — 판 577 (2026-10-14)
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
function 다시(){ try{ JN.다시그리기(원본); }catch(e){} }
function 바꿨다(){ 바뀜++; 띠그리기(); }

/* ── 모양 ── */
var css=document.createElement('style');
css.textContent=
'body.주란편집 .champion,body.주란편집 .rise,body.주란편집 .item,body.주란편집 .hero h1,body.주란편집 .hero .lede{outline:2px dashed rgba(234,166,27,.85);outline-offset:3px;cursor:pointer}'+
'body.주란편집 .rise:hover,body.주란편집 .item:hover{background:rgba(234,166,27,.10)}'+
'body.주란편집 .champion .lbl{outline:2px dashed rgba(255,217,138,.9);outline-offset:3px;border-radius:4px;cursor:pointer}'+
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
'#주편-창 .풀이{font-size:12px;color:#5b7a74;margin-top:4px}';
document.head.appendChild(css);
document.body.classList.add('주란편집');

/* ── 아래 띠 ── */
var 띠=document.createElement('div'); 띠.id='주편-띠';
띠.innerHTML='<span class="말" id="주편-말">✏️ 편집 모드 — 곡이나 글씨를 누르세요</span>'+
  '<button type="button" id="주편-새곡">+ 곡</button>'+
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

/* ── 목록 받기 ── */
function 받기(u){ return fetch(u+(u.indexOf('?')<0?'?':'&')+'t='+Date.now(),{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
function 준비(j){
  원본=(j&&typeof j==='object')? j : {};
  if(!Array.isArray(원본.곡)) 원본.곡=[];
  원본.문구=원본.문구||{}; 원본.시즌=원본.시즌||{};
  원본.곡.forEach(function(c){ if(!c.id) c.id=다음번호(); });
  다시(); 카드손달기();
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
    손.innerHTML='<button type="button" data-w="음악">🎵 음악</button><button type="button" data-w="사진">🖼 사진</button><button type="button" data-w="고침">✏️ 고치기</button>';
    카드.appendChild(손);
    손.addEventListener('click', function(ev){
      var b=ev.target.closest('button'); if(!b) return;
      ev.preventDefault(); ev.stopPropagation();
      var c=곡찾기(카드.dataset.k);
      if(!c){ alert('이 카드에는 아직 곡이 없습니다. 아래 「+ 곡」으로 곡을 먼저 넣어 주세요.'); return; }
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

/* ── 누르면 고치기 (점선 친 곳) ── */
document.addEventListener('click', function(ev){
  if(!원본) return;
  var t=ev.target;
  if(t.closest('#주편-띠,#주편-막,.주편-손,.playc,a,button,select,input,textarea')) return;
  if(t.closest('.champion .top')){ ev.preventDefault(); 카드창(); return; }   /* 판 578 : 카드 이름 줄 */
  var 카드=t.closest('.champion');
  if(카드){ var c=곡찾기(카드.dataset.k); if(c){ ev.preventDefault(); 곡창(c); } return; }
  var 줄=t.closest('.rise[data-k],.item[data-k]');
  if(줄 && 줄.dataset.k){ var c2=곡찾기(줄.dataset.k); if(c2){ ev.preventDefault(); 곡창(c2); } return; }
  if(t.closest('.hero h1,.hero .lede')){ ev.preventDefault(); 문구창(); }
}, true);

/* ── 파일 ── */
function 파일고르기(accept, 손){
  var i=document.createElement('input'); i.type='file'; i.accept=accept; i.style.display='none';
  i.onchange=function(){ if(i.files&&i.files[0]) 손(i.files[0]); i.remove(); };
  document.body.appendChild(i); i.click();
}
function 종류(f){
  var n=(f.name||'').toLowerCase(), t=f.type||'';
  if(/^image\//.test(t)||/\.(jpe?g|png|webp|gif|heic|avif)$/.test(n)) return '사진';
  if(/midi/.test(t)||/\.midi?$/.test(n)) return '악보';
  if(/^audio\//.test(t)||/\.(mp3|wav|m4a|aac|flac|ogg)$/.test(n)) return '음악';
  return '';
}
async function 파일넣기(c, f, 알림){
  알림=알림||function(x){ 띠그리기(x); };
  var k=종류(f);
  try{
    if(k==='음악'){
      알림('🔧 음악 읽는 중… '+f.name);
      var r=await mp3만들기(f, 알림);
      새파일[c.id+'.mp3']=r.blob; c.음악=URL.createObjectURL(r.blob); c.길이=Math.round(r.길이);
      알림('✅ '+c.id+'.mp3 · '+크기(r.blob.size)+' · '+분초(r.길이)+(r.줄임?' (128k 로 줄임)':''));
    } else if(k==='사진'){
      알림('🔧 사진 줄이는 중…');
      var b=await 사진만들기(f);
      새파일[c.id+'.jpg']=b; c.사진=URL.createObjectURL(b);
      알림('✅ '+c.id+'.jpg · '+크기(b.size));
    } else if(k==='악보'){
      var h=new Uint8Array(await f.slice(0,4).arrayBuffer());
      if(String.fromCharCode(h[0],h[1],h[2],h[3])!=='MThd') throw new Error('MIDI 파일이 아닙니다');
      새파일[c.id+'.mid']=f; c.악보=URL.createObjectURL(f);
      알림('✅ '+c.id+'.mid');
    } else throw new Error('음악(mp3·wav)이나 그림 파일이 아닙니다');
    바꿨다(); 다시();
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
function 사진만들기(file){
  return new Promise(function(ok,no){
    var u=URL.createObjectURL(file), im=new Image();
    im.onload=function(){
      try{
        var w=im.naturalWidth, h=im.naturalHeight, r=Math.min(1,1280/Math.max(w,h));
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

function 곡창(c, 새로){
  var 장=장르들.map(function(x){ return '<option'+(x===c.g?' selected':'')+'>'+x+'</option>'; }).join('');
  var ks=Object.keys(나라들).sort(function(a,b){ return 나라들[a].localeCompare(나라들[b],'ko'); });
  var 나=ks.map(function(k){ return '<option value="'+k+'"'+(k===(c.나라||'')?' selected':'')+'>'+깃발(k)+' '+나라들[k]+'</option>'; }).join('');
  var w=창열기(
    '<h3>'+(새로?'＋ 새 곡':'✏️ 곡 고치기')+' <span style="font-weight:400;color:#93aba6;font-size:12px">'+c.id+'</span></h3>'+
    '<label>제목</label><input type="text" id="e-t" value="'+글(c.t)+'" placeholder="곡 제목">'+
    '<label>지은이</label><input type="text" id="e-by" value="'+글(c.by)+'" placeholder="@이름">'+
    '<div class="두칸"><div><label>장르</label><select id="e-g">'+장+'</select></div>'+
      '<div><label>나라</label><select id="e-n"><option value="">🌍 없음</option>'+나+'</select></div></div>'+
    '<div class="두칸"><div><label>표</label><input type="number" id="e-v" value="'+(+c.표||0)+'"></div>'+
      '<div><label>9-AI 점수</label><input type="number" id="e-s" step="0.1" value="'+(c.점수!=null?c.점수:90)+'"></div></div>'+
    '<label>🎵 음악</label><div class="짐" id="e-mus"><b>눌러서 고르기</b> 또는 여기에 끌어다 놓기 · mp3 · wav · m4a</div>'+
      '<div class="st" id="e-mus-st"></div><audio id="e-mus-a" controls preload="none" hidden></audio>'+
    '<label>🖼 사진 (카드 바탕)</label><div class="짐" id="e-img"><b>눌러서 고르기</b> 또는 여기에 끌어다 놓기 · jpg · png</div>'+
      '<div class="st" id="e-img-st"></div><img class="미리" id="e-img-p" hidden alt="">'+
    '<label>✍️ 가사</label><textarea id="e-gas" placeholder="[Verse 1]&#10;…">'+글(c.가사)+'</textarea>'+
    '<label>🎼 악보 (선택 · 앱에서 받은 MIDI)</label><div class="짐" id="e-mid"><b>눌러서 고르기</b> · .mid</div><div class="st" id="e-mid-st"></div>'+
    '<div class="단추들">'+(새로?'':'<button type="button" class="지우기" id="e-del">🗑 지우기</button>')+
      '<button type="button" id="e-no">닫기</button><button type="button" class="확인" id="e-ok">확인</button></div>'+
    '<p class="풀이">「확인」은 화면에만 바꿉니다. 다 고치신 뒤 아래 <b>💾 저장</b>을 눌러야 사이트에 나옵니다.</p>');
  function 그리기(){
    var mst=w.querySelector('#e-mus-st'), au=w.querySelector('#e-mus-a');
    if(c.음악){ mst.textContent=(새파일[c.id+'.mp3']?'✅ 새 음악 · '+크기(새파일[c.id+'.mp3'].size):'🔗 들어 있음')+(c.길이?' · '+분초(c.길이):''); if(au.getAttribute('src')!==c.음악) au.src=c.음악; au.hidden=false; }
    else { mst.textContent=''; au.hidden=true; }
    var ist=w.querySelector('#e-img-st'), ip=w.querySelector('#e-img-p');
    if(c.사진){ ist.textContent=새파일[c.id+'.jpg']?'✅ 새 사진 · '+크기(새파일[c.id+'.jpg'].size):'🔗 들어 있음'; ip.src=c.사진; ip.hidden=false; }
    else { ist.textContent=''; ip.hidden=true; }
    w.querySelector('#e-mid-st').textContent=c.악보?(새파일[c.id+'.mid']?'✅ 새 악보':'🔗 들어 있음'):'';
  }
  function 짐(id, accept, stid){
    var z=w.querySelector(id), st=w.querySelector(stid);
    function 넣기(f){ 파일넣기(c,f,function(x){ st.className='st'+(/⚠️/.test(x)?' bad':''); st.textContent=x; }).then(function(ok){ if(ok) 그리기(); }); }
    z.onclick=function(){ 파일고르기(accept, 넣기); };
    z.addEventListener('dragover',function(e){ e.preventDefault(); z.classList.add('끌림'); });
    z.addEventListener('dragleave',function(){ z.classList.remove('끌림'); });
    z.addEventListener('drop',function(e){ e.preventDefault(); z.classList.remove('끌림'); var f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) 넣기(f); });
  }
  짐('#e-mus','audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg','#e-mus-st');
  짐('#e-img','image/*','#e-img-st');
  짐('#e-mid','.mid,.midi,audio/midi','#e-mid-st');
  그리기();
  w.querySelector('#e-no').onclick=function(){ 닫기(); };
  w.querySelector('#e-ok').onclick=function(){
    var t=w.querySelector('#e-t').value.trim();
    if(!t){ alert('제목을 넣어 주세요.'); return; }
    c.t=t; c.by=w.querySelector('#e-by').value.trim(); c.g=w.querySelector('#e-g').value;
    c.나라=(w.querySelector('#e-n').value||'').toUpperCase();
    c.표=Math.max(0,parseInt(w.querySelector('#e-v').value,10)||0); c.전표=Math.min(+c.전표||0,c.표);
    c.점수=parseFloat(w.querySelector('#e-s').value)||0;
    var gas=w.querySelector('#e-gas').value.replace(/\r/g,'').trim(); if(gas) c.가사=gas; else delete c.가사;
    c.자켓={gi:(자켓장르[c.g]||0), img:해시(c.t)%40, 색:0, 결:null};
    if(새로 && !곡찾기(c.id)) 원본.곡.push(c);
    바꿨다(); 다시(); 닫기();
  };
  var d=w.querySelector('#e-del');
  if(d) d.onclick=function(){
    if(!confirm('「'+(c.t||c.id)+'」 을(를) 목록에서 지울까요? (💾 저장을 눌러야 사이트에서도 지워집니다)')) return;
    원본.곡=원본.곡.filter(function(x){ return x!==c; });
    ['.mp3','.jpg','.mid'].forEach(function(x){ delete 새파일[c.id+x]; });
    바꿨다(); 다시(); 닫기();
  };
  setTimeout(function(){ var i=w.querySelector('#e-t'); if(i&&새로) i.focus(); },50);
}

/* ── 판 578 : 챔피언 카드 이름 · 카드에 보일 곡 ── */
function 카드창(){
  var 카=원본.카드||{}, 왼=카.왼쪽||{}, 오=카.오른쪽||{};
  var 곡들=(원본.곡||[]).slice().sort(function(a,b){ return (+b.표||0)-(+a.표||0); });
  function 고르기(id, 지금){
    return '<select id="'+id+'"><option value="">자동 — 표 1등</option>'+
      곡들.map(function(c){ return '<option value="'+글(c.id)+'"'+(c.id===지금?' selected':'')+'>'+글(c.t||c.id)+' · '+글(c.by||'')+'</option>'; }).join('')+'</select>';
  }
  var w=창열기('<h3>👑 챔피언 카드</h3>'+
    '<label>왼쪽 카드 이름</label><input type="text" id="k-ln" value="'+글(왼.이름||'')+'" placeholder="{나라} 챔피언">'+
    '<p class="풀이">비워 두면 「🇰🇷 대한민국 챔피언」처럼 보는 사람 나라로 나옵니다. <b>{나라}</b> 라고 쓰면 그 자리에 나라 이름이 들어갑니다.</p>'+
    '<label>왼쪽 카드에 보일 곡</label>'+고르기('k-ls', 왼.곡)+
    '<label>오른쪽 카드 이름</label><input type="text" id="k-rn" value="'+글(오.이름||'')+'" placeholder="🌍 글로벌 챔피언">'+
    '<label>오른쪽 카드에 보일 곡</label>'+고르기('k-rs', 오.곡)+
    '<p class="풀이">「자동」이면 표가 가장 많은 곡이 나옵니다. 곡을 고르면 표와 상관없이 그 곡이 나옵니다 — '+
      '진짜 투표가 시작되면 <b>「자동」으로 돌려 두세요</b>. 공정한 무대라는 말과 맞아야 합니다.</p>'+
    '<div class="단추들"><button type="button" id="k-no">닫기</button><button type="button" class="확인" id="k-ok">확인</button></div>');
  w.querySelector('#k-no').onclick=닫기;
  w.querySelector('#k-ok').onclick=function(){
    원본.카드={ 왼쪽:{ 이름:w.querySelector('#k-ln').value.trim(), 곡:w.querySelector('#k-ls').value },
               오른쪽:{ 이름:w.querySelector('#k-rn').value.trim(), 곡:w.querySelector('#k-rs').value } };
    바꿨다(); 다시(); 닫기();
  };
}

/* ── 첫 화면 문구 창 ── */
function 문구창(){
  var m=원본.문구||{}, 시=원본.시즌||{};
  var w=창열기('<h3>✏️ 첫 화면 문구</h3>'+
    '<label>첫 줄</label><input type="text" id="m-1" value="'+글(m.제목1||'누구나 작곡가가 되는')+'">'+
    '<label>둘째 줄 (색 들어가는 줄)</label><input type="text" id="m-2" value="'+글(m.제목2||'지구에서 가장 공정한 무대')+'">'+
    '<label>설명</label><textarea id="m-3" style="min-height:90px">'+글(m.설명||'')+'</textarea>'+
    '<div class="두칸"><div><label>시즌 이름</label><input type="text" id="m-sn" value="'+글(시.이름||'')+'"></div>'+
      '<div><label>시즌 끝나는 날</label><input type="date" id="m-se" value="'+글(시.끝||'')+'"></div></div>'+
    '<label style="display:flex;gap:8px;align-items:center;color:#0d2b28;font-size:14px;margin-top:14px">'+
      '<input type="checkbox" id="m-demo" style="width:20px;height:20px"'+(원본.보기용!==false?' checked':'')+'> 「아직 보기용입니다」 띠 보이기</label>'+
    '<p class="풀이">진짜 곡이 올라오면 띠를 꺼 주세요. 켜 두는 것이 속이지 않는 길입니다.</p>'+
    '<div class="단추들"><button type="button" id="m-no">닫기</button><button type="button" class="확인" id="m-ok">확인</button></div>');
  w.querySelector('#m-no').onclick=닫기;
  w.querySelector('#m-ok').onclick=function(){
    원본.문구={제목1:w.querySelector('#m-1').value.trim(), 제목2:w.querySelector('#m-2').value.trim(), 설명:w.querySelector('#m-3').value.trim()};
    원본.시즌=원본.시즌||{}; 원본.시즌.이름=w.querySelector('#m-sn').value.trim(); 원본.시즌.끝=w.querySelector('#m-se').value;
    원본.보기용=!!w.querySelector('#m-demo').checked;
    바꿨다(); 다시(); 닫기();
  };
}

/* ── 💾 저장 ── */
var 저장중=false;
async function 저장(){
  if(저장중||!원본) return;
  var 열쇠=표();
  if(!열쇠){ alert('열쇠 시간이 지났습니다. LEE 에서 열쇠말을 다시 넣어 주세요.'); location.href='LEE.html'; return; }
  저장중=true; var 단추=document.getElementById('주편-저장'); 단추.disabled=true;
  try{
    var 이름들=Object.keys(새파일).sort();
    for(var i=0;i<이름들.length;i++){
      var n=이름들[i];
      띠그리기('⏫ 올리는 중 '+(i+1)+'/'+이름들.length+' · '+n);
      var r=await fetch(서버+'/lee/file?name='+encodeURIComponent(n),{method:'POST',headers:{'x-lee-token':열쇠,'Content-Type':'application/octet-stream'},body:새파일[n]});
      var x={}; try{ x=await r.json(); }catch(e){}
      if(r.status===401) throw new Error('열쇠 시간이 지났습니다 — LEE 에서 다시 들어와 주세요 (고친 것은 이 화면에 그대로 있습니다)');
      if(!r.ok||!x.ok) throw new Error(n+' 을(를) 못 올렸습니다 — '+(x.why||('서버 '+r.status)));
      var id=n.replace(/\.\w+$/,''), 끝=n.slice(id.length), c=곡찾기(id), 주소=음악집+n+'?v='+Date.now().toString(36);
      if(c){ var 칸={'.mp3':'음악','.jpg':'사진','.mid':'악보'}[끝]; if(칸){ try{ if(/^blob:/.test(c[칸])) URL.revokeObjectURL(c[칸]); }catch(e){} c[칸]=주소; } }
      delete 새파일[n];
    }
    /* 아직 blob: 이 남은 칸은 저장하지 않는다 (올라가지 못한 것) */
    var 보낼=JSON.parse(JSON.stringify(원본));
    보낼.곡.forEach(function(c){ ['음악','사진','악보'].forEach(function(k){ if(c[k]&&/^blob:/.test(c[k])) delete c[k]; }); });
    띠그리기('💾 목록 저장 중…');
    var r2=await fetch(서버+'/lee/save',{method:'POST',headers:{'x-lee-token':열쇠,'Content-Type':'application/json'},body:JSON.stringify(보낼)});
    var y={}; try{ y=await r2.json(); }catch(e){}
    if(r2.status===401) throw new Error('열쇠 시간이 지났습니다 — LEE 에서 다시 들어와 주세요');
    if(!r2.ok||!y.ok) throw new Error('목록을 못 썼습니다 — '+(y.why||('서버 '+r2.status)));
    바뀜=0; 다시();
    띠그리기('✅ 사이트에 반영됐습니다 — 곡 '+y.곡+'곡');
  }catch(err){
    띠그리기('⚠️ '+((err&&err.message)||err));
  }finally{ 저장중=false; 단추.disabled=false; }
}
})();
