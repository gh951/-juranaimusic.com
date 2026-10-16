/* ════════════════════════════════════════════════════════════════════════
   JURAN 곡 창 악보 — juran-score.js(2판)의 그리는 손을 그대로 떼어 온 것  (2026-10-15)
   ⚠️ 작곡실의 window._cgoGenerateScoreOnly368 은 건드리지 않는다 (이름이 겹치면 작곡실 악보가 바뀐다).
      이 파일은 window.JURAN악보그리기(통, 음표들, 조성, 빠르기, 박자) 하나만 내놓는다.
      곡 창(index.html)이 올린 MIDI · MusicXML 에서 가락을 뽑아 이 손에 넘긴다.
   ────────────────────────────────────────────────────────────────────────
   (아래는 원래 머리말)
   JURAN 악보 판 — 만든 곡을 오선지에 그린다              (2026-10-13 · 2판)
   ------------------------------------------------------------------------
   1판은 음표를 찍어만 놓았다. CGO 의 VVIP 악보를 보니 모자란 것이 많았다 —
   이음줄(빔) · 쉼표 · 화음 이름 · 구간 이름(절/후렴/브릿지) · 셈여림 · 조표.
   이 판에서 그 일곱을 넣는다.

   【무엇을 보고 그리나】
     window._cgoMelodyEvents  [{name:'C#4'|null, dur:0.5}, …]  ← 작곡실이 채운다
                               name 이 null 이면 쉼표다
     window._cgoSectionPlan341 [{type,key,start,end,label:'절 1'}, …] start/end 는 **초**
     window._cgoMelodyBpm · _cgoSelectedTimeSig
   【화음은 가락에서 뽑는다】
     JURAN 에는 화음표가 따로 안 온다. 그래서 마디마다 음의 길이를 저울질해
     그 조성의 일곱 화음 중 가장 잘 맞는 것을 고른다. CGO 도 속으로 같은 셈을 한다.
     ⚠️ 이것은 **짐작**이다. 귀가 맞다 하면 맞는 것이고, 아니면 아닌 것이다.
   【음표마다 손잡이】 data-i(몇 번째 음) · data-bar(몇 마디) 를 달아 둔다.
     「음표 고치기」를 붙일 때 이 손잡이로 집는다.
   ⚠️ 고리를 새로 얹지 않는다. 그릴 때 한 번 돌고 끝이다.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var 글자 = ['C','D','E','F','G','A','B'];
  var 반음 = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  var 음이름 = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function 음읽기(이름) {
    if (!이름) return null;
    var m = String(이름).match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
    if (!m) return null;
    var L = m[1].toUpperCase(), 올 = m[2]==='#'?1:(m[2]==='b'?-1:0), 옥 = parseInt(m[3],10);
    if (올 === -1) { var i = 글자.indexOf(L)-1; if (i<0){ i=6; 옥-=1; } L=글자[i]; 올=1; }
    return { 글자:L, 올림:올, 옥타브:옥, 칸:옥*7+글자.indexOf(L), 반음:(반음[L]+올+12)%12 };
  }

  /* ── 조표 ─────────────────────────────────────────────────────────────
     샵 차례 F C G D A E B · 플랫 차례 B E A D G C F                        */
  var 샵차례 = ['F','C','G','D','A','E','B'];
  var 플랫차례 = ['B','E','A','D','G','C','F'];
  var 조표수 = { 'C Major':0,'A Minor':0,'G Major':1,'E Minor':1,'D Major':2,'B Minor':2,
    'A Major':3,'F# Minor':3,'E Major':4,'C# Minor':4,'B Major':5,'G# Minor':5,
    'F# Major':6,'D# Minor':6,'F Major':-1,'D Minor':-1,'A# Major':-2,'G Minor':-2,
    'D# Major':-3,'C Minor':-3,'G# Major':-4,'F Minor':-4,'C# Major':-5,'A# Minor':-5 };

  /* 그 조성의 일곱 화음 (7화음) */
  function 조성화음(조성) {
    var p = String(조성||'C Major').split(/\s+/);
    var 으뜸 = 음이름.indexOf((p[0]||'C').replace('b',''));
    if (으뜸 < 0) 으뜸 = 0;
    var 단조 = /minor/i.test(p[1]||'');
    var 음계 = 단조 ? [0,2,3,5,7,8,10] : [0,2,4,5,7,9,11];
    var 꼴   = 단조 ? ['m7','m7b5','maj7','m7','m7','maj7','7']
                    : ['maj7','m7','m7','maj7','7','m7','m7b5'];
    var 짜임 = { 'maj7':[0,4,7,11], 'm7':[0,3,7,10], '7':[0,4,7,10], 'm7b5':[0,3,6,10] };
    var out = [];
    for (var i=0;i<7;i++){
      var r=(으뜸+음계[i])%12;
      out.push({ 이름: 음이름[r]+꼴[i], 뿌리:r, 음들: 짜임[꼴[i]].map(function(x){return (r+x)%12;}) });
    }
    return out;
  }

  /* 마디 안의 음 길이를 저울질해 화음 하나를 고른다 */
  function 마디화음(마디, 화음들) {
    var 무게 = new Array(12).fill(0);
    for (var i=0;i<마디.length;i++){
      var 음 = 음읽기(마디[i].name); if (!음) continue;
      무게[음.반음] += 마디[i].dur * (i===0 ? 1.6 : 1);     /* 첫 음에 힘을 더 준다 */
    }
    var 모두 = 무게.reduce(function(a,b){return a+b;},0);
    if (모두 <= 0) return null;
    /* ⚠️ 처음에 뿌리에 1.4 배만 줬더니 **F#m7b5 가 온 악보를 뒤덮었다.**
       반감화음은 남의 음을 많이 빌려 쓰기 때문이다 (F#-A-C-E 가 마단조 음과 겹친다).
       그래서 ① 뿌리에 훨씬 큰 힘 ② 반감화음에 벌 ③ 뿌리 음이 아예 안 울리면 탈락. */
    var 벌 = { 'maj7':1.0, 'm7':1.0, '7':0.95, 'm7b5':0.55 };
    var 제일=null, 높=-1;
    for (var k=0;k<화음들.length;k++){
      var c=화음들[k], s=0;
      if (무게[c.뿌리] <= 0) continue;                 /* 뿌리가 한 번도 안 울렸으면 아니다 */
      for (var j=0;j<c.음들.length;j++)
        s += 무게[c.음들[j]] * (j===0 ? 3.0 : (j===1 ? 1.3 : 0.8));
      s *= (벌[c.이름.replace(/^[A-G][#b]?/,'')] || 1);
      if (s>높){ 높=s; 제일=c; }
    }
    return 제일 ? 제일.이름 : null;
  }

  var SVGNS='http://www.w3.org/2000/svg';
  function 만들(n,a){ var e=document.createElementNS(SVGNS,n);
    for (var k in a) if (Object.prototype.hasOwnProperty.call(a,k)) e.setAttribute(k,a[k]); return e; }

  var 줄높이0=138, 선간격=9, 왼여백=62, 바닥칸=4*7+2, 위칸=5*7+3;
  function 칸y(윗,칸){ return 윗 + 4*선간격 - (칸-바닥칸)*(선간격/2); }

  /* 길이 → 모양 (깃 수 = 꼬리 수) */
  function 모양(d){
    if (d>=4)   return {속빔:true , 대:false, 꼬리:0};
    if (d>=3)   return {속빔:true , 대:true , 꼬리:0};
    if (d>=2)   return {속빔:true , 대:true , 꼬리:0};
    if (d>=1)   return {속빔:false, 대:true , 꼬리:0};
    if (d>=0.5) return {속빔:false, 대:true , 꼬리:1};
    if (d>=0.25)return {속빔:false, 대:true , 꼬리:2};
    return {속빔:false, 대:true, 꼬리:3};
  }
  function 점인가(d){ var b=d/1.5; return b>0 && Math.abs(Math.log2(b)-Math.round(Math.log2(b)))<1e-9; }

  function 그리기(통, 음표들, 조성, 빠르기, 박자, 구간표, 설정) {
    설정=설정||{}; var 맨=!!설정.맨악보, 첫마디=설정.첫마디||1;
    var 줄높이=맨? 84 : 줄높이0, 윗첫=맨? 30 : 62;   /* 판 602 : 맞대기 악보는 띠·화음 자리가 없어 촘촘히 */
    통.innerHTML='';
    var 폭 = Math.max(300, 통.clientWidth || 340);

    /* ── 마디로 나눈다 (마디 넘는 음은 끊고 붙임줄로 잇는다) ── */
    var 마디들=[], 이번=[], 쌓=0;
    for (var i=0;i<음표들.length;i++){
      var ev=음표들[i];
      var d=(typeof ev.dur==='number'&&ev.dur>0)?ev.dur:1;
      while (d>0.0001){
        var 쓸=Math.min(d, 박자-쌓);
        이번.push({ name:ev.name||null, dur:쓸, i:i, 뒤로이음:(쓸<d-0.0001), 앞에서이음:false });
        if (이번.length>1 && 이번[이번.length-2].뒤로이음) 이번[이번.length-1].앞에서이음=true;
        쌓+=쓸; d-=쓸;
        if (쌓>=박자-1e-9){ 마디들.push(이번); 이번=[]; 쌓=0;
          if (d>0.0001) { /* 다음 마디 첫 음이 이어받는다 */ }
        }
      }
    }
    if (이번.length) 마디들.push(이번);
    /* 마디를 넘어간 이음 표시 */
    for (var b0=0;b0<마디들.length-1;b0++){
      var 끝음=마디들[b0][마디들[b0].length-1];
      if (끝음 && 끝음.뒤로이음 && 마디들[b0+1][0]) 마디들[b0+1][0].앞에서이음=true;
    }

    /* ── 구간(절·후렴·브릿지) 을 마디 번호로 옮긴다 ── */
    var 마디초 = (60/(빠르기||120))*박자;
    var 구간시작 = {};
    (구간표||[]).forEach(function(s){
      var b=Math.round((s.start||0)/마디초);
      if (b>=0 && b<마디들.length && 구간시작[b]===undefined) 구간시작[b]=s.label||s.type||'';
    });
    var 셈여림 = {};
    Object.keys(구간시작).forEach(function(b){
      var L=구간시작[b];
      셈여림[b] = /후렴|chorus/i.test(L) ? 'f' : (/브릿지|bridge/i.test(L) ? 'mf' : 'mp');
    });
    if (!Object.keys(구간시작).length && !맨) { 구간시작[0]='절 1'; 셈여림[0]='mp'; }

    var 화음들 = 조성화음(조성);
    var 마디화음표 = 맨? [] : 마디들.map(function(m){ return 마디화음(m, 화음들); });   /* 판 602 : 맞대기 악보는 짐작한 화음을 안 적는다 */

    /* ── 머리말 ── */
    var 머리=document.createElement('div');
    머리.style.cssText='display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;'
      +'padding:12px 14px 4px;font-size:12px;color:#5a6472;font-weight:700';
    머리.innerHTML= 설정.제목!=null ? 설정.제목 : '<span style="font-size:14px;color:#111;font-weight:800">🎼 악보</span>'
      +'<span>'+(조성||'C Major')+'</span><span>♩ = '+Math.round(빠르기||120)+'</span>'
      +'<span>'+박자+'/4</span><span>마디 '+마디들.length+' · 음표 '+음표들.length+'</span>';
    통.appendChild(머리);

    if (!마디들.length){
      var 빈=document.createElement('div');
      빈.style.cssText='padding:18px 14px;color:#9aa3ad;font-size:13px';
      빈.textContent='그릴 음표가 없습니다.'; 통.appendChild(빈); return;
    }

    var 줄당 = 설정.줄당 || (폭>=900 ? 4 : (폭>=620 ? 3 : 2));
    var 마디폭 = (폭-왼여백-16)/줄당;
    var 줄수 = Math.ceil(마디들.length/줄당);
    var 높이 = 맨? 윗첫+(줄수-1)*줄높이+4*선간격+30 : 줄수*줄높이 + 30;
    var svg=만들('svg',{width:'100%',height:String(높이),
      viewBox:'0 0 '+폭+' '+높이, preserveAspectRatio:'xMinYMin meet'});
    svg.style.cssText='display:block;background:#fff';

    var 조표 = 조표수[조성] !== undefined ? 조표수[조성] : 0;

    for (var r=0;r<줄수;r++){
      var 윗 = 윗첫 + r*줄높이;   /* 위에 구간 띠·화음·마디번호 세 줄이 앉는다 */
      for (var L=0;L<5;L++)
        svg.appendChild(만들('line',{x1:12,y1:윗+L*선간격,x2:폭-10,y2:윗+L*선간격,
          stroke:'#2b3340','stroke-width':1}));
      var 자리=만들('text',{x:16,y:윗+4*선간격-1,'font-size':46,fill:'#2b3340','font-family':'serif'});
      자리.textContent='𝄞'; svg.appendChild(자리);
      /* 조표 */
      var 샵자리={F:5*7+3,C:5*7+0,G:5*7+4,D:5*7+1,A:4*7+5,E:5*7+2,B:4*7+6};
      var 플랫자리={B:4*7+6,E:5*7+2,A:4*7+5,D:5*7+1,G:4*7+4,C:5*7+0,F:4*7+3};
      for (var q=0;q<Math.abs(조표);q++){
        var 글=조표>0?샵차례[q]:플랫차례[q];
        var 칸=조표>0?샵자리[글]:플랫자리[글];
        var t=만들('text',{x:46+q*7,y:칸y(윗,칸)+4,'font-size':13,fill:'#2b3340'});
        t.textContent=조표>0?'♯':'♭'; svg.appendChild(t);
      }

      for (var c=0;c<줄당;c++){
        var mi=r*줄당+c; if (mi>=마디들.length) break;
        var x0=왼여백+c*마디폭;
        svg.appendChild(만들('line',{x1:x0+마디폭,y1:윗,x2:x0+마디폭,y2:윗+4*선간격,
          stroke:'#2b3340','stroke-width':(mi===마디들.length-1)?2.8:1.2}));
        var 번=만들('text',{x:x0+1,y:윗-6,'font-size':9,fill:'#aab2bb'});
        번.textContent=String(mi+첫마디); svg.appendChild(번);

        /* 화음 이름 */
        if (마디화음표[mi]){
          var ch=만들('text',{x:x0+2,y:윗-20,'font-size':11.5,fill:'#7c3aed','font-weight':'700'});
          ch.textContent=마디화음표[mi]; svg.appendChild(ch);
        }
        /* 구간 이름 */
        if (구간시작[mi]!==undefined){
          var 띠=만들('rect',{x:x0,y:윗-48,rx:3,ry:3,width:Math.max(34,구간시작[mi].length*9+12),
            height:15,fill:'#1e1b4b'});
          svg.appendChild(띠);
          var 글2=만들('text',{x:x0+6,y:윗-37,'font-size':9.5,fill:'#e9d5ff','font-weight':'700'});
          글2.textContent=구간시작[mi]; svg.appendChild(글2);
          var dy=만들('text',{x:x0+2,y:윗+4*선간격+17,'font-size':13,fill:'#111',
            'font-style':'italic','font-weight':'700'});
          dy.textContent=셈여림[mi]||'mp'; svg.appendChild(dy);
        }

        /* ── 자리 잡기 (너무 붙으면 밀어낸다) ── */
        var 마디=마디들[mi], 자리들=[], 누=0;
        for (var z=0;z<마디.length;z++){ 자리들.push(x0+10+(누/박자)*(마디폭-24)); 누+=마디[z].dur; }
        for (var z2=1;z2<자리들.length;z2++)
          if (자리들[z2]-자리들[z2-1]<15) 자리들[z2]=자리들[z2-1]+15;
        var 끝자리=x0+마디폭-12;
        if (자리들.length && 자리들[자리들.length-1]>끝자리){
          var 앞=자리들[0], 뒤=자리들[자리들.length-1], 배=(끝자리-앞)/Math.max(1,뒤-앞);
          for (var z3=0;z3<자리들.length;z3++) 자리들[z3]=앞+(자리들[z3]-앞)*배;
        }

        /* ── 이음줄(빔) 묶음 만들기 — 한 박 안의 짧은 음끼리 ── */
        var 묶음들=[], 지금=null, 박누=0;
        for (var k=0;k<마디.length;k++){
          var nt=마디[k], 짧=(nt.dur<1-1e-9 && nt.name);
          var 박칸=Math.floor(박누+1e-9);
          if (짧 && 지금 && 지금.박===박칸) 지금.들.push(k);
          else if (짧) { 지금={박:박칸, 들:[k]}; 묶음들.push(지금); }
          else 지금=null;
          박누+=nt.dur;
        }
        var 빔안={};
        묶음들.forEach(function(g){ if (g.들.length>1) g.들.forEach(function(k){ 빔안[k]=g; }); });

        /* ── 음표·쉼표 그리기 ── */
        for (var k2=0;k2<마디.length;k2++){
          var nt2=마디[k2], x=자리들[k2], sh=모양(nt2.dur);
          var 묶=만들('g',{'data-i':String(nt2.i),'data-bar':String(mi+1)});

          if (!nt2.name){                       /* 쉼표 */
            var ry=윗+2*선간격;
            if (nt2.dur>=2) 묶.appendChild(만들('rect',{x:x-5,y:ry-선간격,width:11,height:4,fill:'#111'}));
            else if (nt2.dur>=1) 묶.appendChild(만들('rect',{x:x-5,y:ry,width:11,height:4,fill:'#111'}));
            else {
              var 쉼=만들('text',{x:x-5,y:ry+6,'font-size':17,fill:'#111','font-family':'serif'});
              쉼.textContent = nt2.dur>=0.5 ? '𝄾' : '𝄿';
              묶.appendChild(쉼);
            }
            svg.appendChild(묶); continue;
          }

          var 음=음읽기(nt2.name); if(!음) continue;
          var y=칸y(윗,음.칸);
          /* 덧줄 */
          var s2;
          if (음.칸<바닥칸) for (s2=바닥칸-2;s2>=음.칸;s2-=2)
            묶.appendChild(만들('line',{x1:x-7,y1:칸y(윗,s2),x2:x+7,y2:칸y(윗,s2),stroke:'#2b3340','stroke-width':1}));
          if (음.칸>위칸) for (s2=위칸+2;s2<=음.칸;s2+=2)
            묶.appendChild(만들('line',{x1:x-7,y1:칸y(윗,s2),x2:x+7,y2:칸y(윗,s2),stroke:'#2b3340','stroke-width':1}));
          /* 임시표 — 조표에 없는 올림만 */
          if (음.올림===1 && !(조표>0 && 샵차례.slice(0,조표).indexOf(음.글자)>=0)){
            var 샵=만들('text',{x:x-16,y:y+4,'font-size':13,fill:'#2b3340'}); 샵.textContent='♯'; 묶.appendChild(샵);
          }
          /* 머리 */
          묶.appendChild(만들('ellipse',{cx:x,cy:y,rx:5.2,ry:3.9,
            transform:'rotate(-18 '+x+' '+y+')',
            fill:sh.속빔?'#fff':'#111',stroke:'#111','stroke-width':1.5}));
          /* 점 */
          if (점인가(nt2.dur))
            묶.appendChild(만들('circle',{cx:x+10,cy:y-(음.칸%2?0:4),r:1.5,fill:'#111'}));
          /* 대 */
          if (sh.대){
            var g=빔안[k2];
            var 아래로 = g ? (function(){ var s=0; g.들.forEach(function(j){ var o=음읽기(마디[j].name); if(o)s+=o.칸; });
                                          return (s/g.들.length)>=34; })() : (음.칸>=34);
            var sx=아래로?x-5:x+5, 대길=27;
            var sy2=아래로?y+대길:y-대길;
            if (g){ g.끝y = g.끝y===undefined ? sy2 : (아래로?Math.max(g.끝y,sy2):Math.min(g.끝y,sy2));
                    g.아래로=아래로; (g.대들=g.대들||[]).push({x:sx,y:y,k:k2,꼬리:sh.꼬리}); }
            else {
              묶.appendChild(만들('line',{x1:sx,y1:y,x2:sx,y2:sy2,stroke:'#111','stroke-width':1.4}));
              for (var f=0;f<sh.꼬리;f++){
                var fy=아래로?(sy2-f*5.5):(sy2+f*5.5), 휨=아래로?-9:9;
                묶.appendChild(만들('path',{d:'M'+sx+','+fy+' c 5,1.5 7,4 6.5,'+휨,
                  stroke:'#111','stroke-width':1.5,fill:'none','stroke-linecap':'round'}));
              }
            }
          }
          /* 붙임줄 — 앞 마디에서 이어온 음 */
          if (nt2.앞에서이음)
            묶.appendChild(만들('path',{d:'M'+(x-13)+','+(y+6)+' q 6,6 12,0',
              stroke:'#111','stroke-width':1.2,fill:'none'}));
          svg.appendChild(묶);
        }

        /* ── 묶음 대와 이음줄 그리기 ── */
        묶음들.forEach(function(g){
          if (!g.대들 || g.대들.length<2) {
            if (g.대들 && g.대들.length===1){
              var d1=g.대들[0], sy=g.끝y;
              svg.appendChild(만들('line',{x1:d1.x,y1:d1.y,x2:d1.x,y2:sy,stroke:'#111','stroke-width':1.4}));
              for (var f2=0;f2<d1.꼬리;f2++){
                var fy2=g.아래로?(sy-f2*5.5):(sy+f2*5.5), 휨2=g.아래로?-9:9;
                svg.appendChild(만들('path',{d:'M'+d1.x+','+fy2+' c 5,1.5 7,4 6.5,'+휨2,
                  stroke:'#111','stroke-width':1.5,fill:'none','stroke-linecap':'round'}));
              }
            }
            return;
          }
          var sy3=g.끝y;
          g.대들.forEach(function(d){
            svg.appendChild(만들('line',{x1:d.x,y1:d.y,x2:d.x,y2:sy3,stroke:'#111','stroke-width':1.4}));
          });
          var x1=g.대들[0].x, x2b=g.대들[g.대들.length-1].x;
          var 최대꼬리=Math.max.apply(null,g.대들.map(function(d){return d.꼬리;}));
          for (var bi=0;bi<최대꼬리;bi++){
            var by=g.아래로?(sy3-bi*5):(sy3+bi*5);
            svg.appendChild(만들('line',{x1:x1,y1:by,x2:x2b,y2:by,stroke:'#111','stroke-width':3.1,
              'stroke-linecap':'butt'}));
          }
        });
      }
    }
    /* 끝 표시 */
    var fine=만들('text',{x:폭-44,y:윗첫+(줄수-1)*줄높이-56,'font-size':11,fill:'#5a6472',
      'font-style':'italic','font-weight':'700'});
    if(!맨){ fine.textContent='Fine'; svg.appendChild(fine); }

    통.appendChild(svg);
    if(맨) return;
    var 꼬=document.createElement('div');
    꼬.style.cssText='padding:4px 14px 12px;font-size:11px;color:#9aa3ad';
    꼬.textContent='올린 파일에서 가락(맨 윗소리)만 뽑아 그린 악보입니다. 화음 이름은 짐작입니다.';
    통.appendChild(꼬);
  }

  /* 판 602 : 여섯째 값 설정 {맨악보, 첫마디, 제목} — 악보 맞대기에서 쓴다. 곡 창은 그대로 */
  window.JURAN악보그리기 = function (통, 음표들, 조성, 빠르기, 박자, 설정) {
    try { 그리기(통, 음표들, 조성||'C Major', 빠르기||120, (박자>=1&&박자<=16)?박자:4, null, 설정); return true; }
    catch (e) { try{ console.error('[JURAN 곡 창 악보]', e); }catch(_){} return false; }
  };
})();
