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
/* 씨앗 통은 161KB 다. 검사를 누르기 전에는 **안 받는다.**
   보이지 않는 것은 살리지 않는다 — 우리 특허와 같은 생각이다. */
function 씨앗불러오기(){
  if(window['JURAN씨앗']) return Promise.resolve(true);
  if(씨가는중) return 씨가는중;
  씨가는중 = new Promise(function(ok){
    var s=document.createElement('script');
    s.src='js/juran-seed.js'; s.async=false;
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
  var 내것=토막모음(v,3);
  var 제일={닮음:-1, 번호:-1};
  for(var i=0;i<S.가락.length;i++){
    var w=S.가락[i]; if(w.length<3) continue;
    /* ⚠️ 같은 토막이 저쪽에서 두 번 나와도 **한 번만** 센다.
       안 그러면 100%를 넘는 값이 나온다 (처음에 그렇게 틀렸다). */
    var 봄=Object.create(null), 겹=0;
    for(var j=0;j+3<=w.length;j++){ var kk=w.substr(j,3); if(내것.s[kk] && !봄[kk]){ 봄[kk]=1; 겹++; } }
    var d = 내것.n ? 겹/내것.n : 0;
    if(d>제일.닮음){ 제일={닮음:d, 번호:i}; }
  }
  결과.닮음 = Math.round(제일.닮음*100);
  결과.닮은곡 = 제일.번호>=0 ? S.제목[제일.번호] : '';
  var 자리 = 제일.번호>=0 ? 같은토막찾기(v, S.가락[제일.번호]) : {음수:0};
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
        끝({통:통, 알수:알수, 그림:그림});
      }
    }
    한토막();
  });
}
function 지문맞춰보기(A,B){
  var 몰림=Object.create(null), 겹=0, 최대=0;
  for(var key in A.통){
    var tb=B.통[key]; if(!tb) continue;
    var ta=A.통[key];
    for(var i=0;i<ta.length;i++) for(var j=0;j<tb.length;j++){
      겹++; var d=tb[j]-ta[i];
      var c=(몰림[d]=(몰림[d]||0)+1); if(c>최대) 최대=c;
    }
  }
  var 작은쪽=Math.min(A.알수,B.알수)||1;
  var 점수=Math.round(1000*최대/작은쪽)/10;
  return {겹친알:겹, 한줄로선것:최대, 점수:점수,
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
          'background:#0f241e;color:#9fe8d2;font-weight:700;cursor:pointer">⬇ 검사증 받기</button>'+
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
var 잣대 = { 닮음노랑:80, 닮음빨강:100, 토막노랑:9, 토막빨강:16 };
function 빛(참){ return 참?'🟢':'🟡'; }
function 세빛(v, 노, 빨){ return v>=빨 ? '🔴' : (v>=노 ? '🟡' : '🟢'); }
function 그리기(R){
  var h='';
  if(R.악보){
    var a=R.악보;
    h+='<div class="sec">🎼 곡 <span style="font-weight:400;opacity:.8">— 「나도 작곡가」에서 만든 악보</span></div>';
    if(a.탈){ h+='<div class="row"><b>잴 수 없음</b><span>'+a.탈+'</span></div>'; }
    else{
      h+='<div class="row"><b>가장 닮은 곡</b><span>'+세빛(a.닮음,잣대.닮음노랑,잣대.닮음빨강)+
         ' <b style="color:#e6f4ef">'+a.닮음+'%</b> — 「'+a.닮은곡+'」<br>'+
         '<span style="color:#7fae9f;font-size:11.5px">씨앗끼리도 가운데가 50%, 넷 중 셋은 80% 아래입니다</span></span></div>';
      h+='<div class="row"><b>연달아 같은 토막</b><span>'+세빛(a.같은토막,잣대.토막노랑,잣대.토막빨강)+
         ' <b style="color:#e6f4ef">'+a.같은토막+'음</b><br>'+
         '<span style="color:#7fae9f;font-size:11.5px">씨앗끼리도 가운데가 7음, 열에 아홉은 16음 아래입니다</span></span></div>';
      if(a.자리){
        h+='<div class="over"><div class="ovh">🎼 악보 겹쳐 보기 <span>— 빨간 음 '+a.같은토막+'개가 똑같이 오르내립니다</span></div>'+
           '<canvas id="jc-over" style="width:100%;height:196px;display:block"></canvas>'+
           '<div class="ovn">위는 <b>내 곡</b> '+(a.자리.내시작+1)+'~'+(a.자리.내시작+a.자리.음수)+'번째 음, 아래는 씨앗 「'+그글(a.닮은곡)+'」입니다. '+
           '씨앗은 조를 옮겨 내 곡 높이에 맞춰 그렸습니다. 음 길이는 견주지 않아 고르게 늘어놓았습니다.</div></div>';
      }
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
  h+='<div class="note">견준 것 : 우리 씨앗 '+(씨앗준비()?씨앗준비().곡수.toLocaleString():'—')+'곡 · 실명 목록 · 금기어 목록<br>'+
      '<b style="color:#9ac7b8">안 견준 것 : 세상에 나와 있는 곡들.</b> 그 목록은 우리에게 없습니다. '+
      '그래서 이 검사는 「안전하다」고 말하지 않습니다. 잰 값만 적습니다.</div>';
  팝.querySelector('#jc-out').innerHTML=h;
  if(R.악보 && R.악보.자리){ try{ 겹치기그리기(document.getElementById('jc-over'), R.악보); }catch(e){} }
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
           {이름:'씨앗', 밑:160, 음:function(c){ var j=c+씨밀림; return (j>=0&&j<씨.length)?씨[j]:null; }}];
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
  var W=1000, H=1400, r=2;
  var cv=document.createElement('canvas'); cv.width=W*r; cv.height=H*r;
  var g=cv.getContext('2d'); g.setTransform(r,0,0,r,0,0);
  g.fillStyle='#ffffff'; g.fillRect(0,0,W,H);
  g.fillStyle='#064e3b'; g.fillRect(0,0,W,170);
  g.fillStyle='#d1fae5'; g.font='800 44px system-ui,sans-serif';
  g.fillText('JURAN 저작권 1차 검사증', 60, 86);
  g.fillStyle='#86efac'; g.font='400 21px system-ui,sans-serif';
  g.fillText('juranaimusic.com · 누구나 작곡가가 되는 가장 공정한 무대', 60, 126);

  var y=236;
  function 칸(k,v,굵){
    g.fillStyle='#64748b'; g.font='400 21px system-ui,sans-serif'; g.fillText(k, 60, y);
    g.fillStyle='#0f172a'; g.font=(굵?'700 ':'400 ')+'25px system-ui,sans-serif';
    g.fillText(String(v), 320, y); y+=48;
  }
  function 줄긋기(){ g.strokeStyle='#e2e8f0'; g.lineWidth=1; g.beginPath(); g.moveTo(60,y-24); g.lineTo(W-60,y-24); g.stroke(); y+=12; }
  function 제목글(t){ g.fillStyle='#059669'; g.font='800 27px system-ui,sans-serif'; g.fillText(t,60,y); y+=46; }

  칸('작품 이름', 담은것.제목, true);
  if(담은것.지은이) 칸('지은이', 담은것.지은이);
  칸('잰 때', 날짜글(R.때), true);
  줄긋기();
  if(R.악보 && !R.악보.탈){
    제목글('🎼 곡');
    칸('가장 닮은 곡', R.악보.닮음+'%  「'+R.악보.닮은곡+'」');
    칸('연달아 같은 토막', R.악보.같은토막+'음');
    칸('흔한 정도', R.악보.흔함+'%');
    칸('제 되풀이', R.악보.되풀이+'%  (음 '+R.악보.음수+'개)');
    줄긋기();
  }
  if(R.가사 && !R.가사.탈 && R.가사.글자수){
    제목글('✍️ 가사');
    칸('금기어', R.가사.금기.length? (R.가사.금기.length+'곳') : '없음');
    칸('실명', R.가사.실명.length? (R.가사.실명.length+'곳') : '없음');
    칸('줄 되풀이', R.가사.되풀이+'%  ('+R.가사.줄수+'줄 '+R.가사.글자수+'자)');
    줄긋기();
  }
  제목글('🔒 작품 지문');
  g.fillStyle='#0f172a'; g.font='500 23px ui-monospace,Menlo,monospace';
  var 지=R.지문.split('-');
  g.fillText(지.slice(0,2).join('-'), 60, y); y+=36;
  g.fillText(지.slice(2).join('-'), 60, y); y+=50;
  g.fillStyle='#475569'; g.font='400 19px system-ui,sans-serif';
  g.fillText('같은 작품을 다시 넣으면 같은 번호가 나옵니다. 한 글자만 달라도 다른 번호가 됩니다.', 60, y); y+=56;

  g.fillStyle='#fef3c7'; g.fillRect(50, y-26, W-100, 190);
  g.strokeStyle='#fcd34d'; g.strokeRect(50, y-26, W-100, 190);
  g.fillStyle='#92400e'; g.font='700 22px system-ui,sans-serif';
  g.fillText('이 검사증이 말하는 것', 74, y+8); y+=46;
  g.font='400 20px system-ui,sans-serif'; g.fillStyle='#78350f';
  ['견준 것 : JURAN 씨앗 '+(씨앗준비()?씨앗준비().곡수.toLocaleString():'')+'곡 · 실명 목록 · 금기어 목록',
   '안 견준 것 : 세상에 나와 있는 곡들. 그 목록은 우리에게 없습니다.',
   '그래서 이 종이는 「안전하다」고 말하지 않습니다. 잰 값만 적습니다.'
  ].forEach(function(t){ g.fillText(t, 74, y); y+=32; });

  y=H-70;
  g.fillStyle='#94a3b8'; g.font='400 18px system-ui,sans-serif';
  g.fillText('JURAN · 무료 저작권 1차 검사 · 더 정확한 검사증이 필요하면 바깥 검사 기관으로 이어 드립니다.', 60, y);

  cv.toBlob(function(b){
    if(!b) return;
    var u=URL.createObjectURL(b), a=document.createElement('a');
    a.href=u; a.download='JURAN_검사증_'+담은것.제목.replace(/[^\w가-힣]+/g,'_')+'.png';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ try{a.remove();}catch(e){} URL.revokeObjectURL(u); },1500);
  },'image/png');
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
     /* 빈 까만 칸이 먼저 보이면 고장 난 줄 안다. 견주고 나서 보여 준다. */
     '<div id="jc-wavebox" style="margin-top:12px;display:none"><div style="font-size:12px;color:var(--muted);margin-bottom:5px">소리 생김새</div>'+
       '<canvas id="jc-wave" style="width:100%;height:96px;border-radius:10px;background:#0b1512"></canvas>'+
       '<p class="hint" style="margin-top:6px">ⓘ 이 그림은 <b>소리의 생김새</b>입니다. 저작권 판정에는 쓰지 않습니다.</p></div>'+
   '</div>'+
   '<div class="end"><button id="jc-run" style="width:100%">🔍 가사·악보 검사하기</button></div>';
  document.getElementById('jc-run').onclick=function(){ 열기('고르기', document.getElementById('jc-ly')); };
  document.getElementById('jc-cmp').onclick=곡견주기;
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
  작품지문:작품지문, 해시:해시, 씨앗준비:씨앗준비
};
/* 화면이 바뀔 때마다 띠가 붙을 자리가 생긴다. 고리를 돌지 않고 **그때 한 번** 본다. */
document.addEventListener('DOMContentLoaded', 띠붙이기);
setTimeout(띠붙이기, 1200);
window.addEventListener('juran:view', function(){ 띠붙이기(); 검사기페이지(); });
})();
