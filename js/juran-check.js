/* ══════════════════════════════════════════════════════════════════════════
   JURAN · 검사기 (juran-check.js)
   ──────────────────────────────────────────────────────────────────────────
   【파트너 지시】
     "저작권 검사 메뉴는 전문적으로 검사만 하고, 내곡 올리기는 내곡 올리기만 하고 …
      내곡 올리기에서 저작권 검사를 하려면 작은 카드를 클릭하면 … 클릭한 페이지의
      팝업에 나타나는 구조"
     "가사 카드 또는 악보 카드 선택 또는 둘다 같이 선택 구조"

   【그래서 이렇게 만든다】
     · 재는 손은 **하나**다. 화면만 넷이다 (검사기 페이지 · 내 곡 올리기 · VVIP 가사 · VVIP 악보).
     · 어디서 누르든 **페이지를 안 옮긴다.** 누른 자리에 팝업이 뜬다.
     · 팝업도 **하나**다. 세 개를 만들면 한 줄 고칠 때 세 군데가 어긋난다.

   【무엇과 견주는가 — 거짓말을 안 하기 위해 적어 둔다】
     견주는 것   : 우리 씨앗 2,995곡 · 실명 896개 · 금기어 68개 · 손님이 넣은 곡끼리
     안 견주는 것: **세상에 나와 있는 곡들.** 그 목록이 우리에게 없다.
     그래서 **「안전합니다」라는 말을 쓰지 않는다.** 잰 값만 적는다.

   【주파수 그림은 구경거리다】
     주파수로 표절을 재면 양쪽으로 틀린다 — 같은 곡 다른 가수는 못 잡고,
     다른 곡 같은 믹싱은 잘못 잡는다. 그래서 **그림은 보여 주되 판정에 안 쓴다.**
     판정에 쓰는 것은 **음원 지문**(같은 음원인가)뿐이다.

   【재 본 것 — 음원 지문】 (3분 노래, 같은 크기로 맞춘 뒤)
       같은 파일 656 · 음량 절반 656 · 7초만 자름 377 · 64kbps 재압축 596
       드럼만 바꿈 48 · 아주 다른 곡 2.5      → 같은 음원과 다른 음원이 260배 벌어진다
       지문 뜨는 데 폰에서 1.5~4초 (음 따기는 15~40분이다)

   【판 558】 누른 자리의 가사를 잰다 · 검사증 제목은 「내 곡 올리기」에서만 가져온다
   【판 560】 악보 겹치기 그림 — 닮은 씨앗과 같은 토막을 같은 칸에 세워 빨갛게 칠한다
   【판 561】 지문 별자리 그림 — 「같은 음원」 판정이 기댄 봉우리 짝을 금색 선으로 보여 준다
   【판 563】 공개 곡 밭(js/field · Lakh MIDI 13,671곡)과 견주기 — 불은 여기서 켠다.
   【판 564】 닮은 공개 곡을 **다섯**까지 이름 그대로 보여 준다 (파트너 — 「공정하려면 닮았으면 닮았다고」)
             📏 읽는 법 한 줄 · 검사증은 금빛 PDF · 파일마다 판 번호를 붙여 폰이 옛 파일을 안 쥔다
   【판 565】 밭 field-4 — clean_midi + LMD-matched. 곡 수(이름 기준)와 편곡 수를 나눠 말한다.
             씨앗은 참고로만(재 보니 진짜 노래도 짧은 씨앗을 대개 품고 있다).

   끄기 : window.JC끔 = true
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if (window.JC) return;

/* ───────────────────────────────────────────────────────────── ① 해시 ── */
/* 실명·금기어는 해시로만 들고 다닌다. 읽을 수는 없고 맞춰 볼 수만 있다.
   ⚠️ 그냥 곱하기(*)를 쓰면 안 된다 — 32비트 곱은 2^53 을 넘어 자리가 깨진다.
      Math.imul 이라야 셈이 맞는다. (만들 때 쓴 python 과 값이 똑같은 것을 확인했다) */
function 해시(s){
  var h1=2166136261>>>0, h2=2166136333>>>0;
  for(var i=0;i<s.length;i++){
    var c=s.charCodeAt(i);
    h1=Math.imul(h1^c,16777619)>>>0;
    h2=Math.imul(h2^c,2246822519)>>>0;
    h2=((h2<<13)|(h2>>>19))>>>0;
  }
  return h1.toString(36)+'.'+h2.toString(36);
}
/* 작품 지문 — 글과 가락을 통째로 셈해 긴 번호 하나를 만든다.
   같은 작품이면 늘 같은 번호, 한 글자만 달라도 완전히 다른 번호가 나온다. */
function 작품지문(글){
  var a=2166136261>>>0,b=2166136333>>>0,c=2654435761>>>0,d=40503>>>0;
  for(var i=0;i<글.length;i++){
    var x=글.charCodeAt(i);
    a=Math.imul(a^x,16777619)>>>0;
    b=Math.imul(b^(x+i),2246822519)>>>0; b=((b<<7)|(b>>>25))>>>0;
    c=Math.imul(c^(x*3+1),3266489917)>>>0; c=((c<<11)|(c>>>21))>>>0;
    d=Math.imul(d^(x^a),668265263)>>>0;
  }
  function p(n){ var s=(n>>>0).toString(16); while(s.length<8) s='0'+s; return s; }
  return (p(a)+p(b)+p(c)+p(d)).replace(/(.{8})(?=.)/g,'$1-');
}

/* ─────────────────────────────────────────────────────────── ② 씨앗 ── */
var 씨 = null, 씨가는중 = null;
/* 판 564 : 파일 주소에 판 번호를 붙인다 — 폰이 옛 파일을 쥐고 안 놓는 일을 막는다.
   판 번호는 index.html 이 window.JURAN판 에 적는다. */
function 판표(){ return '?v='+encodeURIComponent(window.JURAN판||'566'); }
/* 씨앗 통은 161KB 다. 검사를 누르기 전에는 **안 받는다.**
   보이지 않는 것은 살리지 않는다 — 우리 특허와 같은 생각이다. */
function 씨앗불러오기(){
  if(window['JURAN씨앗']) return Promise.resolve(true);
  if(씨가는중) return 씨가는중;
  씨가는중 = new Promise(function(ok){
    var s=document.createElement('script');
    s.src='js/juran-seed.js'+판표(); s.async=false;
    s.onload=function(){ ok(true); };
    s.onerror=function(){ 씨가는중=null; ok(false); };
    document.head.appendChild(s);
  });
  return 씨가는중;
}
function 씨앗준비(){
  if(씨) return 씨;
  var S = window['JURAN씨앗']; if(!S) return null;
  var 제목 = S['제목'].split('\t');
  var 가락 = S['가락'].split('\t');
  var 이름 = Object.create(null); S['이름'].split(',').forEach(function(h){ 이름[h]=1; });
  var 금기 = Object.create(null); S['금기'].split(',').forEach(function(h){ 금기[h]=1; });
  /* 3음 토막이 씨앗 전체에서 몇 번 나오나 — 「흔한 정도」를 재는 자 */
  var 흔함 = Object.create(null);
  for(var i=0;i<가락.length;i++){
    var v=가락[i];
    for(var j=0;j+3<=v.length;j++){ var k=v.substr(j,3); 흔함[k]=(흔함[k]||0)+1; }
  }
  씨 = {제목:제목, 가락:가락, 이름:이름, 금기:금기, 흔함:흔함, 곡수:가락.length};
  return 씨;
}

/* ─────────────────────────────────────────────────── ③ 가사 검사 ── */
function 가사검사(글){
  var S=씨앗준비();
  var 줄들=(글||'').split(/\r?\n/);
  var 몸=(글||'').replace(/\s+/g,'');
  var 결과={종류:'가사', 글자수:(글||'').replace(/\s/g,'').length, 줄수:줄들.filter(function(x){return x.trim();}).length};
  if(!S){ 결과.탈='씨앗 통을 못 불러왔습니다'; return 결과; }

  /* 금기어 · 실명 — 글을 2~10글자 토막으로 훑으며 해시를 맞춰 본다.
     ⚠️ 실명은 3글자부터 본다. 2글자는 흔한 말과 부딪쳐 애먼 사람을 잡는다. */
  var 금기찾음=[], 이름찾음=[], 본것=Object.create(null);
  for(var L=2; L<=10; L++){
    for(var i=0; i+L<=몸.length; i++){
      var t=몸.substr(i,L);
      if(본것[t]) continue; 본것[t]=1;
      var h=해시(t);
      if(S.금기[h]) 금기찾음.push(t);
      if(L>=3 && S.이름[h]) 이름찾음.push(t);
    }
  }
  /* 긴 것이 잡혔으면 그 안에 든 짧은 것은 뺀다 */
  function 추리기(a){
    a.sort(function(x,y){ return y.length-x.length; });
    var o=[]; a.forEach(function(x){ if(!o.some(function(y){ return y.indexOf(x)>=0; })) o.push(x); });
    return o;
  }
  금기찾음=추리기(금기찾음); 이름찾음=추리기(이름찾음);

  /* 그 말이 몇 번째 줄에 있나 */
  function 자리(말){
    for(var i=0;i<줄들.length;i++) if(줄들[i].replace(/\s+/g,'').indexOf(말)>=0) return i+1;
    return 0;
  }
  결과.금기 = 금기찾음.map(function(w){ return {말:w, 줄:자리(w)}; });
  결과.실명 = 이름찾음.map(function(w){ return {말:w, 줄:자리(w)}; });

  /* 제 안에서 되풀이 — 똑같은 줄이 몇 번 */
  var 본줄=Object.create(null), 겹친줄=0, 쓸줄=0;
  줄들.forEach(function(x){
    var t=x.replace(/\s+/g,''); if(t.length<4) return; 쓸줄++;
    if(본줄[t]) 겹친줄++; else 본줄[t]=1;
  });
  결과.되풀이 = 쓸줄 ? Math.round(100*겹친줄/쓸줄) : 0;
  return 결과;
}

/* ─────────────────────────────────────────────────── ④ 악보 검사 ── */
/* 가락을 「음 사이 뛴 폭」 글자줄로 바꾼다. 조를 옮겨도 같은 가락이면 같은 줄이 된다. */
var 음값={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function 이름을미디(n){
  var m=String(n).match(/^([A-G])([#b]?)(-?\d)$/); if(!m) return null;
  return (+m[3]+1)*12 + 음값[m[1]] + (m[2]==='#'?1:(m[2]==='b'?-1:0));
}
function 가락줄(미디들){
  var o=''; for(var i=1;i<미디들.length;i++){
    var v=미디들[i]-미디들[i-1]; if(v>12)v=12; if(v<-12)v=-12;
    o+=String.fromCharCode(48+v+12);
  } return o;
}
function 지금가락(){
  var ev=window._cgoMelodyEvents;
  if(ev && ev.length){
    var a=[]; for(var i=0;i<ev.length;i++){ if(!ev[i].name) continue; var m=이름을미디(ev[i].name); if(m!=null) a.push(m); }
    if(a.length>=4) return a;
  }
  try{
    var p=window._cgo악보판;
    if(p && p['음표'] && p['음표'].length){
      var b=[]; for(var j=0;j<p['음표'].length;j++){ var mm=이름을미디(p['음표'][j].n||p['음표'][j].name); if(mm!=null) b.push(mm); }
      if(b.length>=4) return b;
    }
  }catch(e){}
  return null;
}
/* 연달아 똑같은 토막이 몇 음인가 — 그리고 **어디인가** (판 560)
   음 수 = 뛴 폭 수 + 1. 뛴 폭이 9개 같으면 음 10개가 같은 차례로 오르내린다. */
function 같은토막찾기(a,b){
  if(!a.length||!b.length) return {음수:0};
  var 앞=new Int32Array(b.length+1), 이번=new Int32Array(b.length+1), 최대=0, ai=0, bi=0;
  for(var i=1;i<=a.length;i++){
    for(var t=1;t<=b.length;t++){
      이번[t]=(a.charCodeAt(i-1)===b.charCodeAt(t-1))?앞[t-1]+1:0;
      if(이번[t]>최대){ 최대=이번[t]; ai=i-최대; bi=t-최대; }
    }
    var tmp=앞; 앞=이번; 이번=tmp; 이번.fill(0);
  }
  return 최대? {음수:최대+1, 내시작:ai, 씨시작:bi} : {음수:0};
}
function 가장긴같은토막(a,b){ return 같은토막찾기(a,b).음수; }
function 토막모음(v,N){ var s=Object.create(null),n=0; for(var i=0;i+N<=v.length;i++){ var k=v.substr(i,N); if(!s[k]){s[k]=1;n++;} } return {s:s,n:n}; }
function 악보검사(미디들){
  var S=씨앗준비();
  var 결과={종류:'악보', 음수:(미디들?미디들.length:0)};
  if(!미디들 || 미디들.length<5){ 결과.탈='잴 가락이 없습니다 — 곡을 먼저 만들어 주세요'; return 결과; }
  if(!S){ 결과.탈='씨앗 통을 못 불러왔습니다'; return 결과; }
  var v=가락줄(미디들);
  /* 판 563 : 「씨앗 가락이 내 곡 안에 **연달아 그대로** 몇 % 들어 있나」로 잰다.
     ① 예전 셈(내 곡 토막 가운데 씨앗에도 있는 몫)은 곡이 길수록 저절로 작아졌다 — 460음 곡에
        씨앗 하나를 통째로 넣어도 5%.
     ② 그렇다고 토막을 흩어서 세면(씨앗 토막이 내 곡 어딘가에 있나) 긴 곡은 흔한 토막을 다 가지고
        있어서 거꾸로 거의 100%가 된다. 재 보고 버렸다.
     ③ 그래서 **이어진 채로** 들어 있는 길이를 씨앗 길이로 나눈다. 곡 길이에 안 흔들리고,
        씨앗을 통째로 넣으면 100%, 흔한 토막 몇 개가 흩어져 있으면 낮다. */
  var 제일={닮음:-1, 번호:-1, 자리:{음수:0}};
  for(var i=0;i<S.가락.length;i++){
    var w=S.가락[i]; if(w.length<3) continue;
    var 자=같은토막찾기(v, w), 이은=Math.max(0,자.음수-1);
    var d=이은/w.length;
    if(d>제일.닮음 || (d===제일.닮음 && 자.음수>제일.자리.음수)){ 제일={닮음:d, 번호:i, 자리:자}; }
  }
  결과.닮음 = Math.round(제일.닮음*100);
  결과.닮은곡 = 제일.번호>=0 ? S.제목[제일.번호] : '';
  결과.씨앗음수 = 제일.번호>=0 ? S.가락[제일.번호].length+1 : 0;
  var 자리 = 제일.자리;
  결과.같은토막 = 자리.음수;
  /* 겹치기 그림에 쓸 것 (판 560) */
  결과.자리 = 자리.음수>=3 ? 자리 : null;
  결과.씨줄 = 제일.번호>=0 ? S.가락[제일.번호] : '';
  결과.미디 = 미디들.slice();
  /* 흔한 정도 — 내 3음 토막 가운데 씨앗에 10번 넘게 나오는 것이 몇 % */
  var 모두=0, 흔한것=0;
  for(var k=0;k+3<=v.length;k++){ 모두++; if((S.흔함[v.substr(k,3)]||0)>=10) 흔한것++; }
  결과.흔함 = 모두 ? Math.round(100*흔한것/모두) : 0;
  /* 제 안 되풀이 */
  var 네음=토막모음(v,4);
  결과.되풀이 = v.length>3 ? Math.round(100*(1 - 네음.n/(v.length-3))) : 0;
  결과.줄 = v;
  return 결과;
}

/* ─────────────────────────────────────── ④-2 공개 곡 밭 (판 563) ──
   파트너 — 「17만 곡에 빗대어 저작권을 찾아야 하는 것 아닌가여」 맞다.
   씨앗은 우리 엔진의 가락 틀이고, 세상 노래가 아니다. 진짜 견줄 곳은 공개 곡 밭이다.
   밭은 「밭 만들기」 페이지가 Lakh MIDI(CC-BY 4.0)에서 가락 지문만 뽑아 만든다.
     js/field/info.js   머리표      js/field/net.bin   거친 그물      js/field/f000.js…  곡별 조각
   찾는 차례
     ① 거친 그물(1.6MB)을 받는다 — 검사를 누를 때 처음 한 번만
     ② 내 가락의 8칸 토막마다 그물에서 찾아 「같은 토막이 많은 곡」 열다섯을 고른다 (몇 ms)
     ③ 그 곡들이 든 조각만 받아, 같은 음은 하나로 보고 「연달아 똑같이 오르내리는 곳」을 잰다
   ⚠️ 해시는 밭 만들기 페이지와 **글자 하나까지 같아야** 한다.
   ⚠️ 같은 음이 이어지는 것은 하나로 본다. MIDI 편곡과 노래에서 뽑은 음은 한 음을 몇 번으로
      나누는 데가 늘 다르다. 그걸 그대로 견주면 같은 가락이 다른 가락으로 보인다.
   ⚠️ 두 음만 오가는 토막(떨기·반주)은 「똑같다」에 안 센다. 오르내림이 세 가지는 넘어야 한다. */
var 밭집='js/field/', 밭=null, 밭가는중=null, 밭조각={}, 밭나눔={};
function 글받기(src){ return new Promise(function(ok){ var s=document.createElement('script'); s.src=src; s.async=true;
  s.onload=function(){ ok(true); }; s.onerror=function(){ ok(false); }; document.head.appendChild(s); }); }
/* info.js 는 작다(0.4KB). 한 시간마다 새로 묻는다 — 밭을 넓히면 바로 알아채게.
   net.bin · 조각은 크다. 밭의 「만든때」가 바뀔 때만 새로 받는다. */
function 정보주소(){ return 밭집+'info.js?h='+Math.floor(Date.now()/36e5); }
function 밭표(){ var j=window['JURAN밭정보']; return '?v='+encodeURIComponent((j&&(j.만든때||j.판))||'1'); }
function 밭불러오기(){
  if(밭) return Promise.resolve(밭);
  if(밭가는중) return 밭가는중;
  밭가는중 = (window['JURAN밭정보']? Promise.resolve(true) : 글받기(정보주소())).then(function(ok){
    var 정보=window['JURAN밭정보']; if(!ok||!정보) return null;
    return fetch(밭집+'net.bin'+밭표()).then(function(r){ if(!r.ok) throw new Error('net'); return r.arrayBuffer(); }).then(function(buf){
      var d=new Uint8Array(buf), dv=new DataView(buf);
      if(d[0]!==74||d[1]!==78||d[2]!==69||d[3]!==84) return null;
      var n=dv.getUint32(12,true), H=new Uint32Array(n), S=new Uint32Array(n), p=16, 앞=0, i, v, m, b;
      for(i=0;i<n;i++){ v=0; m=1; do{ b=d[p++]; v+=(b&127)*m; m*=128; }while(b&128); 앞+=v; H[i]=앞; }
      for(i=0;i<n;i++){ v=0; m=1; do{ b=d[p++]; v+=(b&127)*m; m*=128; }while(b&128); S[i]=v; }
      밭={정보:정보, 그물판:d[4], k:d[5], 곡수:dv.getUint32(8,true), H:H, S:S};
      return 밭;
    });
  }).catch(function(){ return null; }).then(function(x){ if(!x) 밭가는중=null; return x; });
  return 밭가는중;
}
function 밭해시(s,i,K){ var h=2166136261; for(var j=0;j<K;j++){ h^=s.charCodeAt(i+j); h=Math.imul(h,16777619); } return (h>>>8)&0xFFFFFF; }
function 첫자리(H,x){ var lo=0,hi=H.length; while(lo<hi){ var mid=(lo+hi)>>1; if(H[mid]<x) lo=mid+1; else hi=mid; } return lo; }
function 밭후보(v, 수){
  var K=밭.k, 본=Object.create(null), 셈=Object.create(null);
  for(var i=0;i+K<=v.length;i++){
    var h=밭해시(v,i,K); if(본[h]) continue; 본[h]=1;
    for(var a=첫자리(밭.H,h); a<밭.H.length && 밭.H[a]===h; a++){ var s=밭.S[a]; 셈[s]=(셈[s]||0)+1; }
  }
  return Object.keys(셈).map(function(s){ return [+s, 셈[s]]; })
    .filter(function(x){ return x[1]>=2; })
    .sort(function(x,y){ return y[1]-x[1]; }).slice(0,수);
}
function 밭조각받기(c){
  if(window['JURAN밭'] && window['JURAN밭'][c]!=null) return Promise.resolve(true);
  if(!밭조각[c]) 밭조각[c]=글받기(밭집+'f'+('00'+c).slice(-3)+'.js'+밭표());
  return 밭조각[c];
}
function 밭곡(id){
  var c=Math.floor(id/밭.정보.조각곡수), 통=(window['JURAN밭']||{})[c]; if(통==null) return null;
  var 줄들=밭나눔[c]||(밭나눔[c]=통.split('\n'));
  var 칸=(줄들[id-c*밭.정보.조각곡수]||'').split('\t');
  return 칸.length>=3? {가수:칸[0], 곡명:칸[1], 줄:칸[2]} : null;
}
/* 같은 음이 이어지면 하나로 — 높이 목록과 뛴 폭 글자줄을 같이 만든다 */
function 이음접기(높이들){ var o=[]; for(var i=0;i<높이들.length;i++) if(!o.length||o[o.length-1]!==높이들[i]) o.push(높이들[i]); return o; }
function 줄접기(줄){ return 줄.replace(/</g,''); }
/* 연달아 똑같이 오르내리는 가장 긴 곳 — 오르내림이 세 가지 넘는 것만 */
function 진짜같은토막(a,b){
  if(!a.length||!b.length) return {음수:0};
  var 앞=new Int32Array(b.length+1), 이번=new Int32Array(b.length+1), 최대=0, ai=0, bi=0;
  for(var i=1;i<=a.length;i++){
    var ac=a.charCodeAt(i-1);
    for(var t=1;t<=b.length;t++){
      if(ac===b.charCodeAt(t-1)){
        var L=앞[t-1]+1; 이번[t]=L;
        if(L>최대){ var 본={},가지=0; for(var q=i-L;q<i;q++){ var ch=a[q]; if(!본[ch]){ 본[ch]=1; 가지++; if(가지>=3) break; } }
          if(가지>=3){ 최대=L; ai=i-L; bi=t-L; } }
      } else 이번[t]=0;
    }
    var tmp=앞; 앞=이번; 이번=tmp;
  }
  return 최대? {음수:최대+1, 내시작:ai, 씨시작:bi} : {음수:0};
}
function 밭검사(미디들){
  return 밭불러오기().then(function(B){
    if(!B) return {탈:'공개 곡 밭(js/field)을 못 불러왔습니다'};
    /* 그물 판 2(field-3 부터)는 같은 음을 접은 줄로 짰다 — 찾을 때도 접는다 */
    var v=가락줄(미디들), 후보=밭후보(B.그물판>=2? 줄접기(v) : v, 15);
    var 조각들={}; 후보.forEach(function(x){ 조각들[Math.floor(x[0]/B.정보.조각곡수)]=1; });
    return Promise.all(Object.keys(조각들).map(function(c){ return 밭조각받기(+c); })).then(function(){
      var 내접힌=이음접기(미디들), 내줄=가락줄(내접힌), 본이름={}, 결과=[];
      후보.forEach(function(x){
        var g=밭곡(x[0]); if(!g) return;
        var 씨줄=줄접기(g.줄), 자리=진짜같은토막(내줄, 씨줄);
        var 열쇠=(g.가수+'\u0001'+g.곡명).toLowerCase();
        if(본이름[열쇠] && 본이름[열쇠].같은토막>=자리.음수) return;
        var r={가수:g.가수, 곡명:g.곡명, 같은토막:자리.음수, 자리:자리.음수>=3?자리:null, 씨줄:씨줄, 미디:내접힌, 그물:x[1]};
        if(본이름[열쇠]) 결과.splice(결과.indexOf(본이름[열쇠]),1);
        본이름[열쇠]=r; 결과.push(r);
      });
      결과.sort(function(x,y){ return y.같은토막-x.같은토막; });
      /* 판 565 : 한 곡에 편곡(MIDI)이 여럿 있다. 손님에게는 **곡 수**를 말하고 편곡 수는 곁에 둔다 */
      return {곡수:B.정보.곡이름수||B.곡수, 편곡수:B.곡수, 판:B.정보.판, 목록:결과.slice(0,5)};
    });
  });
}

/* ─────────────────────────────────────────────── ⑤ 음원 지문 ── */
/* 샤잠이 쓰는 「봉우리 짝짓기」. 바깥 꾸러미를 하나도 안 쓴다.
   ⚠️ 한 번에 다 돌리면 화면이 멎는다. 토막을 끊어 돌리고 사이에 숨을 쉰다. */
function fft(re,im){
  var n=re.length,i,j,b,len,ang,wr,wi,cr,ci,k,ur,ui,vr,vi,t,ncr;
  for(i=1,j=0;i<n;i++){ b=n>>1; for(;j&b;b>>=1) j^=b; j^=b;
    if(i<j){ t=re[i];re[i]=re[j];re[j]=t; t=im[i];im[i]=im[j];im[j]=t; } }
  for(len=2;len<=n;len<<=1){
    ang=-2*Math.PI/len; wr=Math.cos(ang); wi=Math.sin(ang);
    for(i=0;i<n;i+=len){ cr=1; ci=0;
      for(k=0;k<len/2;k++){
        ur=re[i+k]; ui=im[i+k];
        vr=re[i+k+len/2]*cr-im[i+k+len/2]*ci;
        vi=re[i+k+len/2]*ci+im[i+k+len/2]*cr;
        re[i+k]=ur+vr; im[i+k]=ui+vi;
        re[i+k+len/2]=ur-vr; im[i+k+len/2]=ui-vi;
        ncr=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=ncr;
      } } }
}
var 지문N=1024, 지문H=256, 지문띠=[[0,10],[10,20],[20,40],[40,80],[80,160],[160,512]];
function 지문뜨기(x, 알림){
  return new Promise(function(끝){
    var 창=new Float32Array(지문N);
    for(var i=0;i<지문N;i++) 창[i]=0.5-0.5*Math.cos(2*Math.PI*i/(지문N-1));
    var re=new Float32Array(지문N), im=new Float32Array(지문N);
    var 봉=[], t=0, f=0, 전체=Math.max(1,Math.floor((x.length-지문N)/지문H));
    /* 소리 생김새 그림도 같이 모은다 (구경거리용) */
    var 그림=[];
    function 한토막(){
      var 센것=0;
      while(t+지문N<=x.length && 센것<300){
        for(var q=0;q<지문N;q++){ re[q]=x[t+q]*창[q]; im[q]=0; }
        fft(re,im);
        for(var b=0;b<지문띠.length;b++){
          var a=지문띠[b][0], e=지문띠[b][1], best=-1, bv=0;
          for(var k=a;k<e;k++){ var m=re[k]*re[k]+im[k]*im[k]; if(m>bv){bv=m;best=k;} }
          if(best>=0 && bv>1e-9) 봉.push({f:f,k:best,v:bv});
        }
        if(f%8===0){ var s=0; for(var z=0;z<64;z++) s+=re[z]*re[z]+im[z]*im[z]; 그림.push(Math.sqrt(s)); }
        t+=지문H; f++; 센것++;
      }
      if(알림) 알림(Math.min(99,Math.round(100*f/전체)));
      if(t+지문N<=x.length) setTimeout(한토막,0);
      else {
        var vs=봉.map(function(p){return p.v;}).sort(function(a,b){return a-b;});
        var 턱=vs[Math.floor(vs.length*0.45)]||0;
        var P=봉.filter(function(p){return p.v>턱;});
        var 통=Object.create(null), 알수=0;
        for(var i2=0;i2<P.length;i2++){
          var 짝=0;
          for(var j2=i2+1;j2<P.length&&짝<5;j2++){
            var dt=P[j2].f-P[i2].f;
            if(dt<1) continue;
            if(dt>60) break;
            짝++;
            var key=(P[i2].k*4096 + P[j2].k)*64 + dt;
            if(!통[key]){ 통[key]=[]; 알수++; }
            통[key].push(P[i2].f);
          }
        }
        /* 판 561 : 봉우리 자리(때·높이)도 돌려준다 — 별자리 그림에 쓴다 */
        var 점=new Int32Array(P.length*2);
        for(var i3=0;i3<P.length;i3++){ 점[i3*2]=P[i3].f; 점[i3*2+1]=P[i3].k; }
        끝({통:통, 알수:알수, 그림:그림, 점:점, 길이:f});
      }
    }
    한토막();
  });
}
function 지문맞춰보기(A,B){
  var 몰림=Object.create(null), 겹=0, 최대=0, 어긋=0;
  for(var key in A.통){
    var tb=B.통[key]; if(!tb) continue;
    var ta=A.통[key];
    for(var i=0;i<ta.length;i++) for(var j=0;j<tb.length;j++){
      겹++; var d=tb[j]-ta[i];
      var c=(몰림[d]=(몰림[d]||0)+1); if(c>최대){ 최대=c; 어긋=d; }
    }
  }
  var 작은쪽=Math.min(A.알수,B.알수)||1;
  var 점수=Math.round(1000*최대/작은쪽)/10;
  /* 판 561 : 그 어긋남에 「한 줄로 선」 짝을 모은다 — 판정이 기댄 바로 그 짝들이다.
     열쇠 = (첫 봉우리 높이 × 4096 + 둘째 봉우리 높이) × 64 + 사이 간격 */
  var 짝=[];
  if(최대>0){
    for(var key2 in A.통){
      var tb2=B.통[key2]; if(!tb2) continue;
      var ta2=A.통[key2], kn=+key2, dt=kn%64, k2=Math.floor(kn/64)%4096, k1=Math.floor(kn/64/4096);
      for(var i2=0;i2<ta2.length;i2++) for(var j2=0;j2<tb2.length;j2++){
        if(tb2[j2]-ta2[i2]!==어긋) continue;
        짝.push(ta2[i2], k1, ta2[i2]+dt, k2);
      }
    }
  }
  return {겹친알:겹, 한줄로선것:최대, 점수:점수, 어긋남:어긋, 짝:짝,
          판정: 점수>=8 ? '같은 음원' : (점수>=2.5 ? '가까움' : '다른 음원'),
          빛: 점수>=8 ? '🔴' : (점수>=2.5 ? '🟡' : '🟢')};
}
function 파일을소리로(file, 알림){
  return new Promise(function(끝, 탈){
    var fr=new FileReader();
    fr.onerror=function(){ 탈(new Error('파일을 못 읽었습니다')); };
    fr.onload=function(){
      var ctx=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,11025,11025);
      ctx.decodeAudioData(fr.result, function(buf){
        /* 11,025Hz 한 귀로 줄인다 — 지문에는 이걸로 충분하고 훨씬 빠르다 */
        var sr=buf.sampleRate, ch=buf.getChannelData(0);
        var 비=sr/11025, n=Math.floor(ch.length/비), out=new Float32Array(n);
        for(var i=0;i<n;i++) out[i]=ch[Math.floor(i*비)];
        끝({소리:out, 초:buf.duration});
      }, function(){ 탈(new Error('소리 파일이 아닙니다')); });
    };
    fr.readAsArrayBuffer(file);
  });
}

/* ─────────────────────────────────────────── ⑥-1 지문 별자리 (판 561) ──
   파트너 — 「주파수 비교 같은 것을 넣으면 일반인들은 기술력이 뛰어나게 본다」
   그런데 「소리 생김새」는 판정에 못 쓴다. 이 그림은 다르다 —
   **판정이 실제로 기댄 근거**를 그대로 보여 준다. 폼도 나고 거짓도 없다.
     · 점 하나 = 소리가 툭 튀어나온 자리 (때 × 높이). 샤잠이 듣는 그 점이다.
     · 금색 선 = 두 곡에서 **같은 간격으로 짝지어 선** 봉우리. 판정은 이 선의 수로 한다.
     · 둘째 곡은 맞은 어긋남만큼 옮겨 그린다. 같은 음원이면 선이 곧게 위아래로 선다.
   ⚠️ 한 번 그리고 끝. 고리를 돌지 않는다. 점이 수만 개여도 한 번이면 0.05초 안팎이다. */
function 별자리그리기(cv, A, B, r){
  if(!cv||!A||!B||!A.점||!B.점) return 0;
  var W=cv.clientWidth||340, H=210, px=Math.min(window.devicePixelRatio||1,3);
  cv.width=Math.round(W*px); cv.height=Math.round(H*px);
  var g=cv.getContext('2d'); g.setTransform(px,0,0,px,0,0);
  g.fillStyle='#07120f'; g.fillRect(0,0,W,H);
  var d=r.어긋남||0;
  /* 가로 = 때. 첫째 곡의 때로 맞추고, 둘째 곡은 어긋남만큼 당겨 그린다 */
  var x0=Math.min(0,-d), x1=Math.max(A.길이||1,(B.길이||1)-d), 폭=Math.max(1,x1-x0);
  var 왼=8, 오=8, 판=W-왼-오;
  function X(f){ return 왼+(f-x0)/폭*판; }
  /* 세로 = 높이. 낮은 소리가 몰려 있어 제곱근으로 편다 */
  var 위띠={위:22,밑:92}, 아래띠={위:122,밑:192};
  function Y(띠,k){ return 띠.밑-Math.sqrt(Math.min(512,Math.max(0,k))/512)*(띠.밑-띠.위); }
  function 점찍기(P,띠,옮김,색){
    g.fillStyle=색;
    for(var i=0;i<P.length;i+=2){ var x=X(P[i]-옮김); if(x<왼||x>W-오) continue; g.fillRect(x,Y(띠,P[i+1]),1.1,1.1); }
  }
  점찍기(A.점,위띠,0,'rgba(52,211,153,.42)');
  점찍기(B.점,아래띠,d,'rgba(251,191,36,.40)');
  /* 금색 선 — 너무 많으면 고르게 솎는다 (그림만 솎는다. 판정 숫자는 그대로) */
  /* 선이 빽빽하면 금색 벽이 되어 아무것도 안 읽힌다 — 그림에는 240줄까지만 */
  var 짝=r.짝||[], 수=짝.length/4, 걸음=Math.max(1,Math.ceil(수/240));
  g.lineWidth=0.6; g.strokeStyle='rgba(252,211,77,.30)';
  g.beginPath();
  for(var n=0;n<수;n+=걸음){
    var f=짝[n*4], k=짝[n*4+1];
    var xa=X(f); g.moveTo(xa,Y(위띠,k)); g.lineTo(xa,Y(아래띠,k));
  }
  g.stroke();
  g.fillStyle='#fde68a'; g.shadowColor='rgba(252,211,77,.85)'; g.shadowBlur=3;
  for(var m=0;m<수;m+=걸음){
    var fa=짝[m*4], ka=짝[m*4+1], fb=짝[m*4+2], kb=짝[m*4+3];
    g.fillRect(X(fa)-.8,Y(위띠,ka)-.8,1.6,1.6); g.fillRect(X(fb)-.8,Y(위띠,kb)-.8,1.6,1.6);
    g.fillRect(X(fa)-.8,Y(아래띠,ka)-.8,1.6,1.6); g.fillRect(X(fb)-.8,Y(아래띠,kb)-.8,1.6,1.6);
  }
  g.shadowBlur=0;
  function 이름표(글,x,y,색){ g.font='700 10.5px system-ui,sans-serif'; g.textAlign='left';
    var w=g.measureText(글).width+10; g.fillStyle='rgba(7,18,15,.85)'; g.fillRect(x-2,y-11,w,15);
    g.fillStyle=색; g.fillText(글,x+3,y); }
  이름표('첫째 곡', 왼, 14, 'rgba(110,231,183,.95)');
  이름표('둘째 곡', 왼, 114, 'rgba(252,211,77,.95)');
  g.textAlign='right'; g.fillStyle='rgba(230,244,239,.55)';
  g.fillText('높은 소리 ↑', W-오, 14); g.fillText('때 →', W-오, H-6);
  return 수;
}

/* ──────────────────────────────────────────── ⑥ 생김새 그림 ── */
function 생김새그리기(cv, 줄들, 이름들){
  if(!cv) return;
  var w=cv.clientWidth||320, h=96;
  var r=window.devicePixelRatio||1;
  cv.width=w*r; cv.height=h*r;
  var g=cv.getContext('2d'); g.setTransform(r,0,0,r,0,0);
  g.clearRect(0,0,w,h);
  var 색=['#10b981','#f59e0b'];
  for(var s=0;s<줄들.length;s++){
    var v=줄들[s]; if(!v||!v.length) continue;
    var 큰=0; for(var i=0;i<v.length;i++) if(v[i]>큰) 큰=v[i];
    if(!(큰>0)) 큰=1;
    var y0=4+s*(h/2), hh=(h/2)-8;
    g.fillStyle=색[s%2];
    for(var x=0;x<w;x++){
      var k=Math.floor(x/w*v.length);
      var a=Math.min(1,v[k]/큰);
      g.fillRect(x, y0+hh-a*hh, 1, Math.max(1,a*hh));
    }
    g.fillStyle='rgba(255,255,255,.75)'; g.font='10px system-ui';
    g.fillText(이름들[s]||'', 4, y0+10);
  }
}

/* ──────────────────────────────────────────────── ⑦ 팝업 ── */
var 팝=null, 담은것={가사:'', 미디:null, 결과:null, 제목:'', 지은이:''};
function 만들기팝(){
  if(팝) return 팝;
  var o=document.createElement('div');
  o.id='jc-pop'; o.hidden=true;
  o.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(2,10,8,.72);'+
    'display:flex;align-items:center;justify-content:center;padding:14px;overflow:auto';
  o.innerHTML =
   '<div id="jc-card" style="width:min(520px,100%);max-height:92vh;overflow:auto;background:#0b1512;'+
     'border:1px solid #1f3b32;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.5);color:#e6f4ef">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:15px 17px;border-bottom:1px solid #16302a">'+
      '<b style="font-size:15px">🔍 무료 저작권 검사</b>'+
      '<button id="jc-x" style="border:0;background:#16302a;color:#9fd8c8;width:32px;height:32px;border-radius:999px;font-size:15px;cursor:pointer">✕</button>'+
    '</div>'+
    '<div style="padding:15px 17px">'+
      '<div id="jc-pick" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
        '<button class="jc-sw" data-k="가사" style="flex:1;min-width:120px">✍️ 가사</button>'+
        '<button class="jc-sw" data-k="악보" style="flex:1;min-width:120px">🎼 악보</button>'+
      '</div>'+
      '<button id="jc-go" style="width:100%;padding:12px;border:0;border-radius:12px;font-weight:800;'+
        'font-size:14px;cursor:pointer;background:linear-gradient(135deg,#10b981,#059669);color:#04221a">검사 돌리기</button>'+
      '<div id="jc-out" style="margin-top:13px"></div>'+
      '<div id="jc-foot" style="margin-top:13px;display:none;gap:8px;flex-wrap:wrap">'+
        '<button id="jc-cert" style="flex:1;min-width:150px;padding:11px;border:1px solid #2a5a4c;border-radius:11px;'+
          'background:linear-gradient(135deg,#3a2a08,#5c4310);color:#f3dc8c;border-color:#8a6a1f;font-weight:700;cursor:pointer">⬇ 검사증 받기 (PDF)</button>'+
        '<button id="jc-close2" style="flex:1;min-width:120px;padding:11px;border:1px solid #2a5a4c;border-radius:11px;'+
          'background:#0f241e;color:#9fd8c8;cursor:pointer">닫기</button>'+
      '</div>'+
    '</div></div>';
  document.body.appendChild(o);
  var st=document.createElement('style');
  st.textContent='.jc-sw{padding:11px 12px;border-radius:11px;border:1px solid #2a5a4c;background:#0f241e;'+
    'color:#8fbdb0;font-weight:700;font-size:13px;cursor:pointer}'+
    '.jc-sw[aria-pressed="true"]{background:#10b981;color:#04221a;border-color:#10b981}'+
    '#jc-out .row{display:flex;gap:9px;align-items:flex-start;padding:9px 11px;border-radius:10px;'+
    'background:#0f241e;border:1px solid #1d3a32;margin-bottom:7px;font-size:13px;line-height:1.5}'+
    '#jc-out .row b{min-width:76px;color:#9fd8c8;font-weight:700}'+
    '#jc-out .sec{font-size:12px;color:#7fae9f;margin:12px 0 7px;font-weight:700}'+
    '#jc-out .note{font-size:11px;color:#6f9b8d;line-height:1.6;margin-top:9px}'+
    '#jc-out .sub2{font-size:12.5px;font-weight:800;color:#d7ece5;margin:6px 0 7px}'+
    '#jc-out .sub2 span{font-weight:600;color:#7fae9f}'+
    '#jc-out .over{padding:10px 11px;border-radius:10px;background:#0a1d18;border:1px solid #3b2a2a;margin-bottom:7px}'+
    '#jc-out .ovh{font-size:12.5px;font-weight:800;color:#fca5a5;margin-bottom:6px}'+
    '#jc-out .ovh span{font-weight:600;color:#e6c0c0}'+
    '#jc-out .ovn{font-size:11px;color:#7fae9f;line-height:1.6;margin-top:6px}'+
    '#jc-out .ovn b{color:#d7ece5}';
  document.head.appendChild(st);
  o.addEventListener('click',function(e){ if(e.target===o) 닫기(); });
  o.querySelector('#jc-x').onclick=닫기;
  o.querySelector('#jc-close2').onclick=닫기;
  o.querySelector('#jc-cert').onclick=검사증;
  Array.prototype.forEach.call(o.querySelectorAll('.jc-sw'),function(b){
    b.onclick=function(){ b.setAttribute('aria-pressed', b.getAttribute('aria-pressed')==='true'?'false':'true'); };
  });
  o.querySelector('#jc-go').onclick=돌리기;
  팝=o; return o;
}
function 닫기(){ if(팝){ 팝.hidden=true; document.body.style.overflow=''; } }
function 켜기(k,on){ var b=팝.querySelector('.jc-sw[data-k="'+k+'"]'); if(b) b.setAttribute('aria-pressed',on?'true':'false'); }
function 켜졌나(k){ var b=팝.querySelector('.jc-sw[data-k="'+k+'"]'); return !!b && b.getAttribute('aria-pressed')==='true'; }

/* (판 558) 열기(어디, 가사칸)
   ⚠️ 전에는 가사 칸 셋(VVIP · 내 곡 올리기 · 검사기) 가운데 **가장 긴 것**을 가져왔다.
      그래서 「내 곡 올리기」에서 눌러도 작곡실 가사가 더 길면 **그쪽을** 쟀다.
      이제 **누른 자리의 칸**을 잰다. 칸을 못 받으면 옛 길로 간다.
   ⚠️ 제목·지은이도 「내 곡 올리기」에서 눌렀을 때만 그 칸에서 가져온다.
      전에는 어디서 누르든 그 칸의 보기 글(「새벽 세 시의 고백 · @달토끼」)이
      검사증에 찍혔다 — 남의 이름이 박힌 검사증이 나갈 뻔했다.
   ⚠️ 악보는 늘 「나도 작곡가」에서 만든 것이다. 올린 곡에서 악보를 뽑는 길은 아직 없다.
      그래서 「내 곡 올리기」에서 열면 악보를 **꺼 두고**, 켜면 어디서 온 악보인지 적는다. */
function 열기(어디, 가사칸){
  만들기팝();
  var 올리기에서 = !!(가사칸 && 가사칸.id && 가사칸.id.indexOf('up-')===0);
  담은것.가사 = 가사모으기(어디, 가사칸);
  담은것.미디 = 지금가락();
  담은것.올리기에서 = 올리기에서;
  담은것.제목 = 올리기에서 ? ((document.getElementById('up-t')||{}).value || 'JURAN 작품') : 'JURAN 작품';
  담은것.지은이 = 올리기에서 ? ((document.getElementById('up-by')||{}).value || '') : '';
  켜기('가사', 어디!=='악보');
  켜기('악보', 어디!=='가사' && !올리기에서);
  /* 없는 것을 켜 두면 「잴 수 없음」만 뜬다. 없으면 꺼 두고, 단추에 까닭을 적는다. */
  var 가b=팝.querySelector('.jc-sw[data-k="가사"]'), 악b=팝.querySelector('.jc-sw[data-k="악보"]');
  if(!담은것.미디){ if(어디!=='악보') 켜기('악보',false); 악b.innerHTML='🎼 악보 <span style="font-weight:400;opacity:.75">· 아직 없음</span>'; }
  else 악b.innerHTML='🎼 악보 <span style="font-weight:400;opacity:.75">· '+(올리기에서?'작곡실 곡 · ':'')+'음 '+담은것.미디.length+'개</span>';
  if(!담은것.가사){ if(어디!=='가사') 켜기('가사',false); 가b.innerHTML='✍️ 가사 <span style="font-weight:400;opacity:.75">· 아직 없음</span>'; }
  else 가b.innerHTML='✍️ 가사 <span style="font-weight:400;opacity:.75">· '+담은것.가사.replace(/\s/g,'').length+'자</span>';
  팝.querySelector('#jc-out').innerHTML='';
  팝.querySelector('#jc-foot').style.display='none';
  팝.hidden=false; document.body.style.overflow='hidden';
  if(어디!=='고르기') 돌리기();
}
function 가사모으기(어디, 가사칸){
  if(가사칸 && 'value' in 가사칸) return 가사칸.value||'';
  var a=document.getElementById('cgo-vvip-lyrics');
  var b=document.getElementById('up-ly');
  var c=document.getElementById('jc-ly');
  var 글=[a&&a.value, b&&b.value, c&&c.value].filter(Boolean);
  return 글.length? 글.sort(function(x,y){return y.length-x.length;})[0] : '';
}

function 돌리기(){
  var out=팝.querySelector('#jc-out');
  var 할것=[]; if(켜졌나('가사')) 할것.push('가사'); if(켜졌나('악보')) 할것.push('악보');
  if(!할것.length){ out.innerHTML='<div class="row"><b>알림</b><span>가사나 악보 가운데 하나는 고르셔야 합니다.</span></div>'; return; }
  out.innerHTML='<div class="row"><b>검사 중</b><span>씨앗 통을 여는 중입니다…</span></div>';
  씨앗불러오기().then(function(왔나){
    if(!왔나){ out.innerHTML='<div class="row"><b>못 열었습니다</b><span>씨앗 통(js/juran-seed.js)을 못 가져왔습니다. 잠시 뒤 다시 눌러 주세요.</span></div>'; return; }
    out.innerHTML='<div class="row"><b>검사 중</b><span>씨앗 '+(씨앗준비()?씨앗준비().곡수.toLocaleString():'')+'곡과 견주는 중입니다…</span></div>';
    setTimeout(돌리기속,20);
  });
}
function 돌리기속(){
    var out=팝.querySelector('#jc-out');
    var 할것=[]; if(켜졌나('가사')) 할것.push('가사'); if(켜졌나('악보')) 할것.push('악보');
    var R={때:new Date(), 가사:null, 악보:null};
    if(할것.indexOf('가사')>=0) R.가사=가사검사(담은것.가사);
    if(할것.indexOf('악보')>=0) R.악보=악보검사(담은것.미디);
    R.지문=작품지문((담은것.가사||'')+'\u0001'+((담은것.미디||[]).join(',')));
    담은것.결과=R;
    if(R.악보 && !R.악보.탈){
      R.세상={기다림:true};
      밭검사(담은것.미디).then(function(x){ R.세상=x; if(담은것.결과===R) 그리기(R); })
        .catch(function(){ R.세상={탈:'공개 곡 밭과 견주다 걸렸습니다'}; if(담은것.결과===R) 그리기(R); });
    }
    그리기(R);
    팝.querySelector('#jc-foot').style.display='flex';
}
/* ═══ 잣대 — 눈대중이 아니라 **씨앗으로 재서** 정했다 ═══════════════════
   씨앗 599곡을 저희끼리 견줘 「보통」이 얼마인지 먼저 쟀다.
     닮음(%)   : 가운데 50 · 넷 중 셋 80 아래 · 열에 아홉 100 아래
     같은토막  : 가운데 7음 · 넷 중 셋 8음 아래 · 열에 아홉 16음 아래
   ⚠️ 처음에 「35% 넘으면 노란불」로 잡았다가 흔한 가락이 다 걸렸다.
      씨앗끼리도 가운데가 50인데 35로 자르면 **겁만 준다.**
   ⚠️ 「흔한 정도」와 「제 되풀이」는 **불을 안 켠다.** 그건 위험이 아니라
      그냥 성질이다. 흔한 가락은 겹치기 쉽지만 동시에 아무도 못 가진다. */
var 잣대 = { 닮음노랑:80, 닮음빨강:100, 토막노랑:9, 토막빨강:16,
  /* 판 563 — 공개 곡 밭 13,671곡에서 아무 곡 1,500곡을 골라, **곡명 낱말이 하나도 안 겹치는** 곡과 견줘 쟀다.
     같은 음을 하나로 접고 「연달아 똑같이 오르내리는 음」 수.
       가운데 14음 · 넷 중 셋 16음 · 열에 아홉 21음 · 백에 아흔다섯 25음 · 백에 아흔아홉 43음
       22음을 넘는 몫 약 9% · 30음을 넘는 몫 2.8%
     → 🟡 22음 (열에 아홉 위)  🔴 30음 (백에 셋이 안 되는 자리)
     위쪽 끝을 들여다보니 **진짜로 가락이 같은 곡**들이었다 —
       「It's Now or Never」↔「O sole mio」, 바흐 「Prelude in C」↔구노 「Ave Maria」, 「Copacabana」↔번안곡.
       밭이 닮은 노래를 제대로 찾는다는 뜻이고, 그래서 빨강을 36 이 아니라 30 에 둔다.
     시험 : 「Let It Be」 45음을 음 나눔까지 흔들어 숨겨 넣으니 27음으로 맨 위에 찾았다(🟡).
   씨앗은 불을 안 켠다 — 진짜 노래 400곡을 씨앗과 견주니 가운데가 78% 였다.
     씨앗이 짧아서(7~29음) 긴 노래 안에 우연히 통째로 들어 있다. 그리고 씨앗은 우리 엔진의 틀이다. */
  /* 판 565 — 밭이 field-4(곡 22,000 · 편곡 32,000)로 커져 다시 쟀다. 같은 방법 · 같은 1,500곡.
       가운데 14음 · 넷 중 셋 17음 · 열에 아홉 24음 · 백에 아흔다섯 32음 · 백에 아흔아홉 53음
       30음을 넘는 몫 6.4% · 36음을 넘는 몫 3.3%
     곡이 많아지면 「우연히 가장 닮은 곡」도 조금 더 닮게 나온다(고를 곡이 많으니까).
     30~37음 칸을 하나하나 들여다보니 진짜 같은 곡(베토벤 5번↔벤처스, 파헬벨↔쿨리오)과
     우연(되풀이 리프끼리)이 섞여 있었다. 그래서 **뜻은 그대로**(열에 아홉 위 = 🟡, 백에 셋 = 🔴) 두고 숫자를 옮긴다.
     → 🟡 25음  🔴 36음 */
  세상노랑:25, 세상빨강:36 };
function 빛(참){ return 참?'🟢':'🟡'; }
function 세빛(v, 노, 빨){ return v>=빨 ? '🔴' : (v>=노 ? '🟡' : '🟢'); }
function 그리기(R){
  var h='';
  if(R.악보){
    var a=R.악보;
    h+='<div class="sec">🎼 곡 <span style="font-weight:400;opacity:.8">— 「나도 작곡가」에서 만든 악보</span></div>';
    if(a.탈){ h+='<div class="row"><b>잴 수 없음</b><span>'+a.탈+'</span></div>'; }
    else{
      /* ── 🌍 공개 곡 (판 563) — 불은 여기서 켠다 ── */
      var W=R.세상||{};
      h+='<div class="sub2">🌍 공개 곡과 견주기'+(W.곡수?' <span>— '+W.곡수.toLocaleString()+'곡'+(W.편곡수>W.곡수?' · 편곡 '+W.편곡수.toLocaleString()+'개':'')+'</span>':'')+'</div>';
      if(W.기다림){ h+='<div class="row"><b>견주는 중</b><span>공개 곡 밭을 여는 중입니다… 처음 한 번은 1~2초 걸립니다</span></div>'; }
      else if(W.탈){ h+='<div class="row"><b>잴 수 없음</b><span>'+W.탈+'</span></div>'; }
      else if(W.목록){
        if(!W.목록.length) h+='<div class="row"><b>가장 긴 곳</b><span>🟢 눈에 띄게 겹치는 공개 곡이 없습니다</span></div>';
        W.목록.forEach(function(x,i){
          h+='<div class="row"><b>'+(i===0?'가장 닮은 곡':(i+1)+'번째')+'</b><span>'+세빛(x.같은토막,잣대.세상노랑,잣대.세상빨강)+
             ' <b style="color:#e6f4ef">'+x.같은토막+'음</b> 연달아 똑같이 — 「'+그글(x.곡명)+'」'+(x.가수?' · '+그글(x.가수):'')+'</span></div>';
        });
        h+='<div class="note" style="margin:-2px 0 8px">📏 <b style="color:#9ac7b8">읽는 법</b> — 서로 관계없는 공개 곡끼리도 <b style="color:#e6f4ef">보통 14음</b>은 겹칩니다. '+
           '🟡 '+잣대.세상노랑+'음부터 · 🔴 '+잣대.세상빨강+'음부터입니다. 같은 음이 이어지면 하나로 셉니다. 판단은 보시는 분이 하십니다.</div>';
        var 첫=W.목록[0];
        if(첫 && 첫.자리){
          h+='<div class="over"><div class="ovh">🎼 악보 겹쳐 보기 <span>— 빨간 음 '+첫.같은토막+'개가 똑같이 오르내립니다</span></div>'+
             '<canvas id="jc-over" style="width:100%;height:196px;display:block"></canvas>'+
             '<div class="ovn">위는 <b>내 곡</b>, 아래는 공개 곡 「'+그글(첫.곡명)+'」입니다. 공개 곡은 조를 옮겨 내 곡 높이에 맞췄고, '+
             '같은 음이 이어진 것은 하나로 그렸습니다. 음 길이는 견주지 않습니다.</div></div>';
        }
      }
      /* ── 🌱 우리 씨앗 — 참고만, 불 없음 ── */
      h+='<div class="row"><b>우리 씨앗</b><span>ⓘ 「'+그글(a.닮은곡)+'」 — 씨앗 '+a.씨앗음수+'음 가운데 <b style="color:#e6f4ef">'+a.같은토막+'음</b>이 연달아 들어 있음<br>'+
         '<span style="color:#7fae9f;font-size:11.5px">씨앗은 우리 엔진이 쓰는 짧은 가락 틀이라 참고로만 봅니다. 진짜 노래도 대개 씨앗 하나쯤은 품고 있습니다.</span></span></div>';
      h+='<div class="row"><b>흔한 정도</b><span>ⓘ <b style="color:#e6f4ef">'+a.흔함+'%</b><br>'+
         '<span style="color:#7fae9f;font-size:11.5px">가락 토막 가운데 흔히 쓰이는 것의 몫. 흔하면 겹치기 쉽지만, '+
         '<b style="color:#9ac7b8">흔한 가락은 아무도 가질 수 없습니다.</b></span></span></div>';
      h+='<div class="row"><b>제 되풀이</b><span>ⓘ <b style="color:#e6f4ef">'+a.되풀이+'%</b> · 음 '+a.음수+'개<br>'+
         '<span style="color:#7fae9f;font-size:11.5px">같은 토막을 몇 번 다시 쓰나. 위험이 아니라 곡의 성질입니다.</span></span></div>';
    }
  }
  if(R.가사){
    var g=R.가사;
    h+='<div class="sec">✍️ 가사</div>';
    if(g.탈){ h+='<div class="row"><b>잴 수 없음</b><span>'+g.탈+'</span></div>'; }
    else if(!g.글자수){ h+='<div class="row"><b>가사 없음</b><span>넣은 가사가 없습니다.</span></div>'; }
    else{
      h+='<div class="row"><b>금기어</b><span>'+(g.금기.length?('🔴 <b style="color:#fca5a5">'+g.금기.length+'곳</b> — '+
          g.금기.map(function(x){return (x.줄?x.줄+'번째 줄':'')}).join(' · ')):'🟢 없음')+'</span></div>';
      h+='<div class="row"><b>실명</b><span>'+(g.실명.length?('🟡 <b style="color:#fcd34d">'+g.실명.length+'곳</b> — '+
          g.실명.map(function(x){return (x.줄?x.줄+'번째 줄':'')}).join(' · ')):'🟢 없음')+'</span></div>';
      h+='<div class="row"><b>줄 되풀이</b><span>ⓘ <b style="color:#e6f4ef">'+g.되풀이+'%</b> · '+g.줄수+'줄 · '+g.글자수+'자<br>'+
         '<span style="color:#7fae9f;font-size:11.5px">똑같은 줄이 몇 번. 후렴이 있으면 당연히 올라갑니다.</span></span></div>';
    }
  }
  h+='<div class="sec">🔒 내 지문</div>';
  h+='<div class="row"><b>번호</b><span style="font-family:ui-monospace,monospace;font-size:11px;word-break:break-all">'+R.지문+'</span></div>';
  h+='<div class="row"><b>잰 때</b><span>'+날짜글(R.때)+'</span></div>';
  h+='<div class="note">'+견준글(R,true)+'</div>';
  팝.querySelector('#jc-out').innerHTML=h;
  if(R.세상 && R.세상.목록 && R.세상.목록[0] && R.세상.목록[0].자리){
    var 첫=R.세상.목록[0];
    try{ 겹치기그리기(document.getElementById('jc-over'), {미디:첫.미디, 자리:첫.자리, 씨줄:첫.씨줄, 아래이름:'공개 곡'}); }catch(e){}
  }
}
/* 견준 것 · 안 견준 것 — 팝업과 검사증이 같은 말을 쓴다 */
function 견준글(R, 꾸밈){
  var 밭수=(R&&R.세상&&R.세상.곡수)||0, 씨=(씨앗준비()?씨앗준비().곡수.toLocaleString():'—');
  var 굵=function(t){ return 꾸밈? '<b style="color:#9ac7b8">'+t+'</b>' : t; }, 줄=꾸밈?'<br>':'\n';
  var 견=(밭수? '공개 곡 '+밭수.toLocaleString()+'곡(Lakh MIDI · Colin Raffel · CC-BY 4.0) · ' : '')+'우리 씨앗 '+씨+'곡 · 실명 목록 · 금기어 목록';
  var 안=밭수? 'K팝과 2010년대 뒤 노래는 이 밭에 거의 없습니다. 서양 옛 노래가 두껍습니다.' : '세상에 나와 있는 곡들. 그 목록을 아직 못 불러왔습니다.';
  return '견준 것 : '+견+줄+굵('안 견준 것 : '+안)+줄+'그래서 이 검사는 「안전하다」고 말하지 않습니다. 잰 값만 적습니다.';
}
function 그글(t){ return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ═══ 악보 겹치기 (판 560) ═══════════════════════════════════════════════
   파트너 — 「주파수 그림은 널렸고 아무도 못 읽는다. 악보 겹치기는 읽힌다.」
   위 줄은 내 곡, 아래 줄은 가장 닮은 씨앗. 같은 차례로 오르내리는 토막을
   **같은 칸**에 세우고 빨갛게 칠한다. 보는 사람이 「아, 진짜 똑같네」 하고 스스로 안다.
   ⚠️ 씨앗은 「뛴 폭」만 갖고 있다. 첫 음은 내 곡의 같은 자리 음에 맞춰 세운다.
      그래서 빨간 음은 위아래가 **같은 높이**에 선다 — 조를 옮겨도 같은 가락이라는 뜻.
   ⚠️ 음 길이는 견주지 않으니 그림도 고르게 늘어놓는다. 아는 척하지 않는다.
   ⚠️ 한 번 그리고 끝. 고리를 돌지 않는다. */
var 계단={0:0,1:0,2:1,3:1,4:2,5:3,6:3,7:4,8:4,9:5,10:5,11:6}, 검은건반={1:1,3:1,6:1,8:1,10:1};
function 겹치기그리기(cv, a){
  if(!cv||!a||!a.자리) return;
  var 내=a.미디, z=a.자리, 줄=a.씨줄||'';
  /* 씨앗 음 높이 — 뛴 폭을 쌓고, 같은 토막 첫 음을 내 곡에 맞춘다 */
  var 씨=[0]; for(var k=0;k<줄.length;k++) 씨.push(씨[k]+(줄.charCodeAt(k)-60));
  var 맞춤=내[z.내시작]-씨[z.씨시작];
  for(var k2=0;k2<씨.length;k2++) 씨[k2]+=맞춤;
  /* 보여 줄 칸 — 같은 토막 앞뒤로 넉넉히, 그러나 폰에서 읽힐 만큼만 */
  var 칸수최대=24, 곁=Math.max(2,Math.min(5,Math.floor((칸수최대-z.음수)/2)));
  var c0=Math.max(0,z.내시작-곁), c1=Math.min(내.length,z.내시작+z.음수+곁);
  if(c1-c0>칸수최대){ c0=z.내시작; c1=Math.min(내.length,z.내시작+칸수최대); }
  var 칸=c1-c0, 씨밀림=z.씨시작-z.내시작;
  /* 높이를 보기 좋게 — 두 줄을 **똑같이** 옥타브째 옮긴다 */
  var 합=0,수=0;
  for(var c=c0;c<c1;c++){ 합+=내[c]; 수++; var j=c+씨밀림; if(j>=0&&j<씨.length){ 합+=씨[j]; 수++; } }
  var 옮김=수? 12*Math.round((71-합/수)/12) : 0;

  var W=cv.clientWidth||460, H=196, r=Math.min(window.devicePixelRatio||1,3);
  cv.width=Math.round(W*r); cv.height=Math.round(H*r);
  var g=cv.getContext('2d'); g.setTransform(r,0,0,r,0,0); g.clearRect(0,0,W,H);
  var 왼=46, 오=10, 칸폭=(W-왼-오)/Math.max(1,칸), 간=6.5;
  var 줄들=[{이름:'내 곡', 밑:66, 음:function(c){ return 내[c]; }},
           {이름:(a.아래이름||'씨앗'), 밑:160, 음:function(c){ var j=c+씨밀림; return (j>=0&&j<씨.length)?씨[j]:null; }}];
  function 같은칸(c){ return c>=z.내시작 && c<z.내시작+z.음수; }
  /* 빨간 띠 — 두 줄을 꿰뚫는다 */
  var x빨0=왼+(z.내시작-c0)*칸폭, x빨1=Math.min(W-오, 왼+(z.내시작+z.음수-c0)*칸폭);
  g.fillStyle='rgba(248,113,113,.13)'; g.fillRect(x빨0,8,x빨1-x빨0,H-16);
  g.strokeStyle='rgba(248,113,113,.55)'; g.lineWidth=1; g.strokeRect(x빨0+.5,8.5,x빨1-x빨0-1,H-17);
  줄들.forEach(function(오선){
    var 밑=오선.밑;
    g.strokeStyle='rgba(159,216,200,.32)'; g.lineWidth=1;
    for(var l=0;l<5;l++){ var y=Math.round(밑-l*간)+.5; g.beginPath(); g.moveTo(왼-6,y); g.lineTo(W-오,y); g.stroke(); }
    g.fillStyle='#7fae9f'; g.font='700 11px system-ui,sans-serif'; g.textAlign='left';
    g.fillText(오선.이름, 2, 밑-간*1.6);
    for(var c=c0;c<c1;c++){
      var m=오선.음(c); if(m==null) continue;
      m+=옮김;
      var 단=(Math.floor(m/12)-1)*7+계단[((m%12)+12)%12];
      var y=밑-(단-30)*(간/2), x=왼+(c-c0+0.5)*칸폭;
      var 빨=같은칸(c);
      /* 덧줄 */
      g.strokeStyle='rgba(159,216,200,.45)'; g.lineWidth=1;
      for(var d=28; d>=단; d-=2){ var yy=Math.round(밑-(d-30)*(간/2))+.5; g.beginPath(); g.moveTo(x-6,yy); g.lineTo(x+6,yy); g.stroke(); }
      for(var u=40; u<=단; u+=2){ var yu=Math.round(밑-(u-30)*(간/2))+.5; g.beginPath(); g.moveTo(x-6,yu); g.lineTo(x+6,yu); g.stroke(); }
      /* 음표 머리 */
      g.save(); g.translate(x,y); g.rotate(-0.33);
      g.beginPath(); g.ellipse(0,0,4.3,3.1,0,0,Math.PI*2);
      g.fillStyle=빨?'#f87171':'#d7ece5'; g.fill(); g.restore();
      /* 기둥 */
      g.fillStyle=빨?'#f87171':'#d7ece5';
      var 위로=단<34; g.fillRect(위로?x+3.4:x-4.2, 위로?y-20:y, 1.1, 20);
      /* 올림표 — 칸이 좁으면 작게, 아주 좁으면 생략(음표 머리끼리 부딪친다) */
      if(검은건반[((m%12)+12)%12] && 칸폭>=10){ g.font='600 '+(칸폭<16?8:10)+'px system-ui,sans-serif'; g.textAlign='right'; g.fillText('#', x-4.6, y+3); }
    }
  });
  /* 같은 칸끼리 위아래를 잇는다 — 「여기가 겹친다」 */
  g.strokeStyle='rgba(248,113,113,.5)'; g.lineWidth=1; g.setLineDash([2,3]);
  for(var c3=Math.max(c0,z.내시작); c3<Math.min(c1,z.내시작+z.음수); c3++){
    var xx=왼+(c3-c0+0.5)*칸폭; g.beginPath(); g.moveTo(xx,82); g.lineTo(xx,112); g.stroke();
  }
  g.setLineDash([]);
}
function 날짜글(d){
  function p(n){ return (n<10?'0':'')+n; }
  return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+p(d.getHours())+'시 '+p(d.getMinutes())+'분';
}

/* ───────────────────────────────────────────── ⑧ 검사증 ── */
function 검사증(){
  var R=담은것.결과; if(!R) return;
  /* 판 564 : 금빛 검사증 · PDF
     ① 먼저 아무 데도 안 보이는 작은 판에 한 번 그려 길이를 잰다
     ② 그 길이로 진짜 판을 만들어 다시 그린다 (다섯 곡 · 겹쳐 보기 그림이 들어가면 길어진다)
     ③ 그 그림 한 장을 PDF 한 쪽에 넣는다 — 바깥 꾸러미 없이 PDF 를 손으로 짠다.
        한글 글꼴을 PDF 에 심지 않아도 되도록 글은 그림으로 들어간다. */
  var W=1000, 끝=검사증그림(document.createElement('canvas').getContext('2d'), W, 1414, R);
  var H=Math.max(1414, 끝+250), r=2;
  var cv=document.createElement('canvas'); cv.width=W*r; cv.height=H*r;
  var g=cv.getContext('2d'); g.setTransform(r,0,0,r,0,0);
  검사증그림(g, W, H, R);
  var 이름='JURAN_검사증_'+String(담은것.제목||'곡').replace(/[^\w가-힣]+/g,'_');
  function 내려주기(b, 끝말){
    var u=URL.createObjectURL(b), a=document.createElement('a');
    a.href=u; a.download=이름+끝말;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ try{a.remove();}catch(e){} URL.revokeObjectURL(u); },4000);
  }
  try{ 내려주기(PDF짜기(cv, '저작권 예측 분석 검사증 — '+(담은것.제목||'')), '.pdf'); }
  catch(e){ cv.toBlob(function(b){ if(b) 내려주기(b,'.png'); },'image/png'); }
}
function 금빛(g, x0, x1){
  var t=g.createLinearGradient(x0,0,x1,0);
  t.addColorStop(0,'#8a6a1f'); t.addColorStop(.28,'#e8c766'); t.addColorStop(.5,'#b8892b');
  t.addColorStop(.72,'#f3dc8c'); t.addColorStop(1,'#9c7724'); return t;
}
/* 긴 글을 폭에 맞춰 접어 쓴다 — 다음 줄 y 를 돌려준다 */
function 감싸기(g, t, x, y, 폭, 줄높이, 글꼴, 색){
  g.font=글꼴; g.fillStyle=색;
  var 줄='', 낱=String(t).split(' ');
  for(var i=0;i<낱.length;i++){
    var 새=줄?줄+' '+낱[i]:낱[i];
    if(g.measureText(새).width>폭 && 줄){ g.fillText(줄, x, y); y+=줄높이; 줄=낱[i]; } else 줄=새;
  }
  if(줄){ g.fillText(줄, x, y); y+=줄높이; }
  return y;
}
function 줄임(g, t, 폭){
  t=String(t||''); if(g.measureText(t).width<=폭) return t;
  while(t.length>1 && g.measureText(t+'…').width>폭) t=t.slice(0,-1);
  return t+'…';
}
function 검사증그림(g, W, H, R){
  var 글꼴='system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  /* 바탕 · 테두리 */
  g.fillStyle='#fdf8ec'; g.fillRect(0,0,W,H);
  g.save(); g.globalAlpha=.045; g.fillStyle='#8a6a1f'; g.font='900 150px '+글꼴;
  g.translate(W/2,H/2); g.rotate(-0.5); g.textAlign='center'; g.fillText('JURAN MUSIC',0,40); g.restore();
  g.strokeStyle=금빛(g,0,W); g.lineWidth=6; g.strokeRect(22,22,W-44,H-44);
  g.lineWidth=1.2; g.strokeRect(36,36,W-72,H-72);
  /* 머리 띠 */
  var 띠=g.createLinearGradient(0,40,0,236); 띠.addColorStop(0,'#1d160a'); 띠.addColorStop(1,'#2e230f');
  g.fillStyle=띠; g.fillRect(40,40,W-80,196);
  g.fillStyle=금빛(g,40,W-40); g.fillRect(40,232,W-80,4);
  g.textAlign='left';
  g.fillStyle=금빛(g,80,520); g.font='800 58px '+글꼴; g.fillText('JURAN MUSIC', 80, 118);
  g.fillStyle='#f3dc8c'; g.font='700 31px '+글꼴; g.fillText('저작권 예측 분석 검사증', 80, 168);
  g.fillStyle='#b8963e'; g.font='600 15px '+글꼴; g.fillText('MUSIC COPYRIGHT PRE-CHECK REPORT', 82, 204);
  g.textAlign='right'; g.fillStyle='#d9bd72'; g.font='500 16px ui-monospace,Menlo,monospace';
  g.fillText('No. '+String(R.지문||'').split('-')[0].toUpperCase(), W-80, 118);
  g.fillStyle='#b8963e'; g.font='400 15px '+글꼴; g.fillText('juranaimusic.com', W-80, 146);
  g.textAlign='left';

  var y=290;
  /* 판 564 (파트너 글) — 맨 앞 한 줄 */
  y=감싸기(g, '본 검사증은 플랫폼 내 표준 분석 시스템을 통해 산출된 가사 및 악보 데이터의 1차 유사도 검사 결과를 증명합니다.',
           80, y, W-160, 27, '400 18px '+글꼴, '#5c4a20')+22;
  function 칸(k,v,굵){
    g.fillStyle='#8a7a5a'; g.font='400 19px '+글꼴; g.fillText(k, 80, y);
    g.fillStyle='#1c1608'; g.font=(굵?'700 ':'400 ')+'22px '+글꼴; g.fillText(줄임(g,v,W-380), 300, y); y+=42;
  }
  function 제목글(t, 곁){
    y+=14;
    g.fillStyle=금빛(g,80,W-80); g.fillRect(80,y-34,W-160,1.5);
    g.fillStyle='#7a5a14'; g.font='800 24px '+글꼴; g.fillText(t, 80, y);
    if(곁){ var w=g.measureText(t).width; g.fillStyle='#a08850'; g.font='400 17px '+글꼴; g.fillText(곁, 92+w, y); }
    y+=44;
  }
  function 불(v){ return v>=잣대.세상빨강? '#dc2626' : (v>=잣대.세상노랑? '#eab308' : '#16a34a'); }

  칸('작품 이름', 담은것.제목, true);
  if(담은것.지은이) 칸('지은이', 담은것.지은이);
  칸('잰 때', 날짜글(R.때), true);

  if(R.악보 && !R.악보.탈){
    var 세=R.세상||{};
    제목글('공개 곡과 견주기', 세.곡수? '— '+세.곡수.toLocaleString()+'곡'+(세.편곡수>세.곡수?' (편곡 '+세.편곡수.toLocaleString()+'개)':'')+' 가운데 가장 닮은 곳' : '');
    if(!세.목록){ 칸('공개 곡', '못 견줌 (밭을 못 불러옴)'); }
    else if(!세.목록.length){ 칸('공개 곡', '눈에 띄게 겹치는 곳이 없음'); }
    else 세.목록.forEach(function(x,i){
      g.fillStyle='#b8963e'; g.font='700 18px '+글꼴; g.fillText(String(i+1), 84, y);
      g.beginPath(); g.arc(122, y-6, 8, 0, Math.PI*2); g.fillStyle=불(x.같은토막); g.fill();
      g.fillStyle='#1c1608'; g.font='800 22px '+글꼴; g.fillText(x.같은토막+'음', 142, y);
      g.fillStyle='#8a7a5a'; g.font='400 16px '+글꼴; g.fillText('연달아 똑같이', 202, y);
      g.fillStyle='#1c1608'; g.font=(i===0?'700 ':'400 ')+'21px '+글꼴;
      g.fillText(줄임(g,'「'+x.곡명+'」'+(x.가수?' · '+x.가수:''), W-80-310), 310, y);
      y+=40;
    });
    /* 읽는 법 */
    g.fillStyle='#6b5a34'; g.font='400 17px '+글꼴;
    g.fillText('읽는 법 — 서로 관계없는 공개 곡끼리도 보통 14음은 겹칩니다.', 84, y+4); y+=28;
    var lx=84; [['#16a34a',(잣대.세상노랑-1)+'음 아래'],['#eab308',잣대.세상노랑+'음부터'],['#dc2626',잣대.세상빨강+'음부터']].forEach(function(p){
      g.beginPath(); g.arc(lx+7, y-2, 7, 0, Math.PI*2); g.fillStyle=p[0]; g.fill();
      g.fillStyle='#6b5a34'; g.fillText(p[1], lx+20, y+4); lx+=40+g.measureText(p[1]).width;
    });
    g.fillText('· 같은 음이 이어지면 하나로 셉니다.', lx, y+4); y+=40;
    /* 겹쳐 보기 그림 — 팝업에 그려진 것을 그대로 옮긴다 */
    var ov=document.getElementById('jc-over');
    if(ov && ov.width>0 && ov.height>0 && 세.목록 && 세.목록[0]){
      var pw=W-160, ph=Math.round(pw*ov.height/ov.width);
      if(ph>260){ ph=260; }
      g.fillStyle='#0b1512'; g.fillRect(80, y-8, pw, ph+46);
      g.strokeStyle='#b8963e'; g.lineWidth=1; g.strokeRect(80.5, y-7.5, pw-1, ph+45);
      g.fillStyle='#f3dc8c'; g.font='700 16px '+글꼴;
      g.fillText(줄임(g,'악보 겹쳐 보기 — 위: 내 곡 · 아래: 「'+세.목록[0].곡명+'」 · 빨간 음 '+세.목록[0].같은토막+'개가 똑같이 오르내림', pw-30), 96, y+16);
      try{ g.drawImage(ov, 80, y+30, pw, ph); }catch(e){}
      y+=ph+64;
    }
    var a=R.악보;
    칸('우리 씨앗 (참고)', a.같은토막+'음 / 씨앗 '+a.씨앗음수+'음  ·  「'+a.닮은곡+'」');
    칸('흔한 정도 · 되풀이', a.흔함+'%  ·  제 되풀이 '+a.되풀이+'%  (음 '+a.음수+'개)');
  }
  if(R.가사 && !R.가사.탈 && R.가사.글자수){
    var L=R.가사;
    제목글('가사');
    칸('금기어 · 실명', (L.금기.length? L.금기.length+'곳':'없음')+'  ·  '+(L.실명.length? L.실명.length+'곳':'없음'));
    칸('줄 되풀이', L.되풀이+'%  ('+L.줄수+'줄 '+L.글자수+'자)');
  }
  제목글('작품 지문');
  g.fillStyle='#1c1608'; g.font='500 19px ui-monospace,Menlo,monospace';
  g.fillText(줄임(g,R.지문,W-160), 80, y); y+=30;
  g.fillStyle='#8a7a5a'; g.font='400 16px '+글꼴;
  g.fillText('같은 작품을 다시 넣으면 같은 번호가 나옵니다. 한 글자만 달라도 다른 번호가 됩니다.', 80, y); y+=50;

  /* 판 564 (파트너 글) — 대조 범위 · 한계 · 고지 세 마디. 숫자는 그때그때 실제 값을 쓴다 */
  var 밭수=(R.세상&&R.세상.곡수)||0, 씨수=(씨앗준비()?씨앗준비().곡수.toLocaleString():'—');
  var 마디=[
    ['1. 검증 및 대조 데이터 범위 (Reference Data)', [
      '· 공개 참조 음원 : '+(밭수? 밭수.toLocaleString()+'곡 (Lakh MIDI · Colin Raffel · CC-BY 4.0 기준 · 곡 이름 Million Song Dataset)' : '이번 검사에서 불러오지 못함'),
      '· 자체 씨앗 음원 : '+씨수+'곡',
      '· 식별 필터링 : 등록 아티스트 실명 DB 및 지정 금기어 목록']],
    ['2. 검사 한계 및 제외 범위 (Limitation of Test)', [
      '· 본 검사 시스템의 데이터베이스는 서양 고전 및 과거 명곡 데이터를 두껍게 구축하고 있습니다.',
      '· K-Pop 전반 및 2010년대 이후의 현대 대중음악은 분석 범위에서 대다수 제외되어 있으므로 이용에 유의하시기 바랍니다.']],
    ['3. 최종 고지사항 (Disclaimer)', [
      '본 검사증은 구축된 데이터베이스 내에서의 정량적 비교 측정값만을 기록한 리포트입니다. 분석 범위 외의 유통 음원과의 일치 여부까지 판단하는 것은 아니므로, 본 결과가 외부 저작권 분쟁에 대한 완전한 면책권이나 안전성을 보장하지 않음을 밝힙니다.']]
  ];
  /* 먼저 빈 판에 재서 상자 높이를 안다 */
  var 잴=document.createElement('canvas').getContext('2d');
  function 마디그리기(gg, y0){
    var yy=y0;
    마디.forEach(function(m,i){
      if(i) yy+=14;
      gg.fillStyle='#7a5a14'; gg.font='800 19px '+글꼴; gg.fillText(m[0], 102, yy); yy+=32;
      m[1].forEach(function(t){ yy=감싸기(gg, t, 112, yy, W-250, 27, '400 17px '+글꼴, '#3d3015'); });
    });
    return yy;
  }
  var 상자높이=마디그리기(잴, 0)+44;
  g.fillStyle='#f7ecd0'; g.fillRect(80, y-30, W-160, 상자높이);
  g.strokeStyle='#d9b860'; g.lineWidth=1; g.strokeRect(80.5, y-29.5, W-161, 상자높이-1);
  y=마디그리기(g, y+6)+14;
  var 끝=y+10;

  /* 도장 · 꼬리 — 늘 맨 아래 */
  var sx=W-170, sy=H-165;
  g.save(); g.translate(sx,sy); g.rotate(-0.18);
  g.strokeStyle=금빛(g,-80,80); g.lineWidth=4; g.beginPath(); g.arc(0,0,74,0,Math.PI*2); g.stroke();
  g.lineWidth=1.5; g.beginPath(); g.arc(0,0,64,0,Math.PI*2); g.stroke();
  g.textAlign='center'; g.fillStyle='#8a6a1f';
  g.font='900 26px '+글꼴; g.fillText('JURAN',0,-8);
  g.font='700 14px '+글꼴; g.fillText('MUSIC',0,12);
  g.font='700 13px '+글꼴; g.fillText('분석 완료',0,32);
  var d=R.때; g.font='500 11px ui-monospace,Menlo,monospace';
  g.fillText(d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate(),0,49);
  g.restore(); g.textAlign='left';
  g.fillStyle='#a08850'; g.font='400 15px '+글꼴;
  g.fillStyle=금빛(g,80,520); g.font='800 19px '+글꼴; g.fillText('JURAN AI MUSIC ANALYTICS ENGINE', 80, H-112);
  g.fillStyle='#a08850'; g.font='400 15px '+글꼴;
  g.fillText('juranaimusic.com · 누구나 작곡가가 되는 가장 공정한 무대', 80, H-84);
  return 끝;
}
/* PDF 한 쪽을 손으로 짠다 — 그림(JPEG) 하나를 쪽 가득 붙인다.
   쪽 너비는 A4(595.28pt), 높이는 그림 비율대로. */
function PDF짜기(cv, 제목){
  var 주소=cv.toDataURL('image/jpeg', 0.92), 베=atob(주소.split(',')[1]);
  var 그림=new Uint8Array(베.length); for(var i=0;i<베.length;i++) 그림[i]=베.charCodeAt(i);
  var pw=595.28, ph=+(pw*cv.height/cv.width).toFixed(2);
  var 제목16='FEFF'; for(var k=0;k<제목.length;k++) 제목16+=('000'+제목.charCodeAt(k).toString(16)).slice(-4).toUpperCase();
  var 조각=[], 길이=0, 자리=[];
  function 붙(x){ if(typeof x==='string'){ var b=new Uint8Array(x.length); for(var j=0;j<x.length;j++) b[j]=x.charCodeAt(j)&255; x=b; } 조각.push(x); 길이+=x.length; }
  function 몸(n){ 자리[n]=길이; 붙(n+' 0 obj\n'); }
  var 그리기글='q '+pw+' 0 0 '+ph+' 0 0 cm /Im0 Do Q\n';
  붙('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  몸(1); 붙('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  몸(2); 붙('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  몸(3); 붙('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n');
  몸(4); 붙('<< /Type /XObject /Subtype /Image /Width '+cv.width+' /Height '+cv.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+그림.length+' >>\nstream\n');
  붙(그림); 붙('\nendstream\nendobj\n');
  몸(5); 붙('<< /Length '+그리기글.length+' >>\nstream\n'+그리기글+'endstream\nendobj\n');
  몸(6); 붙('<< /Title <'+제목16+'> /Producer (JURAN MUSIC) /Creator (juranaimusic.com) >>\nendobj\n');
  var 표자리=길이, 표='xref\n0 7\n0000000000 65535 f \n';
  for(var n=1;n<=6;n++) 표+=('000000000'+자리[n]).slice(-10)+' 00000 n \n';
  붙(표+'trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n'+표자리+'\n%%EOF\n');
  return new Blob(조각, {type:'application/pdf'});
}

/* ───────────────────────────────── ⑨ 카드 붙이기 ── */
function 띠만들기(글, 눌렀을때){
  var b=document.createElement('button');
  b.className='jc-strip';
  b.innerHTML='<span>🔍</span><span>'+글+'</span><span style="margin-left:auto;opacity:.7">›</span>';
  b.onclick=function(e){ e.preventDefault(); e.stopPropagation(); 눌렀을때(); };
  return b;
}
var 띠꾸밈=false;
function 띠꾸미기(){
  if(띠꾸밈) return; 띠꾸밈=true;
  var st=document.createElement('style');
  st.textContent='.jc-strip{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;'+
    'padding:9px 12px;margin:8px 0;border-radius:11px;cursor:pointer;font:700 12.5px system-ui,sans-serif;'+
    'background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(5,150,105,.10));'+
    'border:1px solid rgba(16,185,129,.42);color:#10b981;text-align:left}'+
    '.jc-strip:hover{filter:brightness(1.12)}';
  document.head.appendChild(st);
}
function 한번만(el, 표){
  if(!el || el.dataset[표]) return false;
  el.dataset[표]='1'; return true;
}
function 띠붙이기(){
  띠꾸미기();
  /* ① 나도 작곡가 — VVIP 가사 */
  var ly=document.getElementById('cgo-vvip-lyrics');
  if(ly && 한번만(ly,'jc')) ly.parentNode.insertBefore(띠만들기('이 가사 검사받기', function(){ 열기('가사', ly); }), ly.nextSibling);
  /* ② 나도 작곡가 — 악보 */
  var sw=document.getElementById('cgo-groove-score-wrap');
  if(sw && 한번만(sw,'jc')) sw.parentNode.insertBefore(띠만들기('이 악보 검사받기', function(){ 열기('악보', document.getElementById('cgo-vvip-lyrics')); }), sw);
  /* ③ 내 곡 올리기 — 가사 */
  var up=document.getElementById('up-ly');
  if(up && 한번만(up,'jc')) up.parentNode.insertBefore(띠만들기('이 가사 검사받기', function(){ 열기('가사', up); }), up.nextSibling);
  /* ④ 내 곡 올리기 — 곡 파일 */
  var inf=document.getElementById('up-info');
  if(inf && 한번만(inf,'jc')) inf.parentNode.insertBefore(띠만들기('이 곡 검사받기 — 지금은 가사만 (곡에서 악보 뽑기는 준비 중)', function(){ 열기('고르기', document.getElementById('up-ly')); }), inf.nextSibling);
}

/* ──────────────────────────── 검사기 페이지 채우기 ── */
function 검사기페이지(){
  var box=document.getElementById('v-check-body'); if(!box || box.dataset.ok) return;
  box.dataset.ok='1';
  box.innerHTML =
   '<div class="step"><div class="sh"><span class="no">1</span><b>가사</b></div>'+
     '<textarea id="jc-ly" placeholder="가사를 붙여 넣으세요. 금기어·실명·되풀이를 봅니다."></textarea></div>'+
   '<div class="step"><div class="sh"><span class="no">2</span><b>악보</b></div>'+
     '<p class="hint" id="jc-scnote">「나도 작곡가」에서 곡을 만들면 그 악보를 그대로 가져와 봅니다. '+
       '지금은 만들어 둔 곡이 없습니다.</p></div>'+
   '<div class="step"><div class="sh"><span class="no">3</span><b>곡끼리 견주기</b>'+
       '<span class="soon" style="color:var(--mint-deep);background:var(--mint-soft)">바로 됩니다</span></div>'+
     '<p class="hint">두 곡이 <b>같은 음원인지</b> 봅니다. 음량을 바꾸거나 잘라도 잡습니다. '+
       '곡은 <b>이 폰 안에서만</b> 열립니다 — 어디로도 안 보냅니다.</p>'+
     '<div class="r" style="margin-top:10px">'+
       '<label style="flex:1;min-width:150px">첫째 곡<input type="file" id="jc-f1" accept="audio/*"></label>'+
       '<label style="flex:1;min-width:150px">둘째 곡<input type="file" id="jc-f2" accept="audio/*"></label>'+
     '</div>'+
     '<button id="jc-cmp" style="width:100%;margin-top:11px;padding:12px;border:0;border-radius:12px;'+
       'font-weight:800;cursor:pointer;background:linear-gradient(135deg,#10b981,#059669);color:#04221a">두 곡 견주기</button>'+
     '<div id="jc-cmpout" style="margin-top:11px"></div>'+
     '<div id="jc-starbox" style="margin-top:12px;display:none"><div style="font-size:12px;font-weight:800;color:var(--fg);margin-bottom:5px">✨ 지문 별자리 <span style="font-weight:600;color:var(--muted)">— 판정의 근거</span></div>'+
       '<canvas id="jc-star" style="width:100%;height:210px;border-radius:10px;background:#07120f;display:block"></canvas>'+
       '<p class="hint" id="jc-starnote" style="margin-top:6px"></p></div>'+
     /* 빈 까만 칸이 먼저 보이면 고장 난 줄 안다. 견주고 나서 보여 준다. */
     '<div id="jc-wavebox" style="margin-top:12px;display:none"><div style="font-size:12px;color:var(--muted);margin-bottom:5px">소리 생김새</div>'+
       '<canvas id="jc-wave" style="width:100%;height:96px;border-radius:10px;background:#0b1512"></canvas>'+
       '<p class="hint" style="margin-top:6px">ⓘ 이 그림은 <b>소리의 생김새</b>입니다. 저작권 판정에는 쓰지 않습니다.</p></div>'+
   '</div>'+
   '<div class="end"><button id="jc-run" style="width:100%">🔍 가사·악보 검사하기</button></div>';
  document.getElementById('jc-run').onclick=function(){ 열기('고르기', document.getElementById('jc-ly')); };
  document.getElementById('jc-cmp').onclick=곡견주기;
  /* 판 563 : 페이지 아래 「세상 곡과는 안 견준다」 글을 밭이 있으면 고쳐 쓴다 */
  (window['JURAN밭정보']? Promise.resolve(true) : 글받기(정보주소())).then(function(){
    var 정보=window['JURAN밭정보'], p=document.querySelector('#v-check-body + p.hint');
    if(정보 && p) p.innerHTML='견주는 것은 <b>공개 곡 '+(정보.곡이름수||정보.곡수).toLocaleString()+'곡</b>(Lakh MIDI · Colin Raffel · CC-BY 4.0)과 '+
      '<b>JURAN 씨앗 · 실명 목록 · 금기어 목록</b>입니다. <b>K팝과 2010년대 뒤 노래는 이 밭에 거의 없습니다</b> — 계속 늘리고 있습니다. '+
      '그래서 이 검사는 「안전하다」고 말하지 않고 <b>잰 값만</b> 적습니다. 더 정확한 검사증이 필요하면 바깥 검사 기관으로 이어 드립니다.';
  });
  var n=document.getElementById('jc-scnote');
  if(지금가락()) n.innerHTML='「나도 작곡가」에서 만든 악보를 <b>가져왔습니다</b> — 음 '+지금가락().length+'개.';
}
function 곡견주기(){
  var out=document.getElementById('jc-cmpout');
  var f1=document.getElementById('jc-f1').files[0], f2=document.getElementById('jc-f2').files[0];
  if(!f1||!f2){ out.innerHTML='<p class="hint">곡 두 개를 다 골라 주세요.</p>'; return; }
  out.innerHTML='<p class="hint">첫째 곡 지문 뜨는 중… 0%</p>';
  var 그림1=null;
  파일을소리로(f1).then(function(a){
    return 지문뜨기(a.소리, function(p){ out.innerHTML='<p class="hint">첫째 곡 지문 뜨는 중… '+p+'%</p>'; })
      .then(function(A){ 그림1=A.그림; return 파일을소리로(f2).then(function(b){
        return 지문뜨기(b.소리, function(p){ out.innerHTML='<p class="hint">둘째 곡 지문 뜨는 중… '+p+'%</p>'; })
          .then(function(B){
            var r=지문맞춰보기(A,B);
            out.innerHTML='<div style="padding:12px;border-radius:12px;background:var(--surface2);border:1px solid var(--line)">'+
              '<div style="font-size:15px;font-weight:800">'+r.빛+' '+r.판정+'</div>'+
              '<div style="font-size:12px;color:var(--muted);margin-top:5px">맞은 점수 '+r.점수+
              ' · 한 줄로 선 지문 '+r.한줄로선것+'알 · 곡 길이 '+Math.round(a.초)+'초 / '+Math.round(b.초)+'초</div>'+
              '<div style="font-size:11px;color:var(--faint);margin-top:7px">8점을 넘으면 같은 음원, 2.5점 아래면 다른 음원으로 봅니다. '+
              '다만 <b>같은 곡을 다른 사람이 다시 부른 것</b>은 이 길로 못 잡습니다.</div></div>';
            var sb=document.getElementById('jc-starbox');
            if(sb){ sb.style.display='block';
              var 선=0; try{ 선=별자리그리기(document.getElementById('jc-star'), A, B, r); }catch(e){}
              var sn=document.getElementById('jc-starnote');
              if(sn) sn.innerHTML='점 하나는 소리가 툭 튀어나온 자리입니다(때 × 높이). '+
                '<b style="color:#d97706">금색 선</b>은 두 곡에서 <b>같은 간격으로 짝지어 선</b> 봉우리 '+
                '<b>'+선.toLocaleString()+'쌍</b>입니다. '+
                (r.판정==='같은 음원' ? '선이 곧게 빽빽이 서면 같은 녹음입니다 — 이 짝이 판정의 근거입니다.'
                 : (r.판정==='가까움' ? '선이 드문드문 섭니다 — 일부만 같은 녹음일 수 있습니다.'
                 : '선이 거의 없습니다 — 짝이 맞는 봉우리가 드뭅니다. 다른 녹음입니다.'));
            }
            var wb=document.getElementById('jc-wavebox'); if(wb) wb.style.display='block';
            생김새그리기(document.getElementById('jc-wave'), [그림1, B.그림], ['첫째 곡','둘째 곡']);
          });
      }); });
  }).catch(function(e){ out.innerHTML='<p class="hint">못 읽었습니다 — '+(e&&e.message||'')+'</p>'; });
}

/* ───────────────────────────────────────────── 내보내기 ── */
window.JC = {
  열기:열기, 닫기:닫기, 띠붙이기:띠붙이기, 검사기페이지:검사기페이지,
  가사검사:가사검사, 악보검사:악보검사, 지금가락:지금가락,
  지문뜨기:지문뜨기, 지문맞춰보기:지문맞춰보기, 파일을소리로:파일을소리로,
  작품지문:작품지문, 해시:해시, 씨앗준비:씨앗준비,
  밭불러오기:밭불러오기, 밭검사:밭검사, 밭후보:밭후보, 밭곡:밭곡, 밭조각받기:밭조각받기,
  진짜같은토막:진짜같은토막, 이음접기:이음접기, 줄접기:줄접기, 가락줄:가락줄
};
/* 화면이 바뀔 때마다 띠가 붙을 자리가 생긴다. 고리를 돌지 않고 **그때 한 번** 본다. */
document.addEventListener('DOMContentLoaded', 띠붙이기);
setTimeout(띠붙이기, 1200);
window.addEventListener('juran:view', function(){ 띠붙이기(); 검사기페이지(); });
})();
