/* ════════════════════════════════════════════════════════════════════════
   CGO 악보 편집기 — 원본 그대로 + JURAN 이음매              (2026-10-13 · 2판)
   ------------------------------------------------------------------------
   【무엇이 들어 있나】
     renderGrooveAsScore          128.5KB  악보 그리기·고치기·연주·저장 (CGO 원본)
     _cgoGenerateScoreOnly368      15.2KB  소리 따라가기 (CGO 원본)
       · 소리판(cgo-vvip-audio)에 timeupdate·pause·ended 걸이를 단다
       · 마디마다 몇 초인지 시각표를 만든다
       · 음표에 불을 켜는 자명종(_자기514)을 맞춘다
       · cgo-552 에서 고친 「보라 점 여러 개」 흠까지 같이 들어 있다
     NOTES · noteToIdx · CHORD_INTERVALS · buildChordNotes   0.6KB
     이음매                          2KB   JURAN 값으로 곡 틀을 만들어 넘긴다
   【안 가져온 것】
     SONG_DB 2.96MB — 곡 2,995개가 든 통. 원본은 곡 틀이 없을 때만 이 통을 뒤진다.
     우리가 먼저 만들어 놓으니 그 길로 안 간다. 빈 통만 놓아 둔다.
   ════════════════════════════════════════════════════════════════════════ */

/* 곡 통 — 원본이 이름을 부르기만 하므로 빈 것으로 놓아 둔다 */
var SONG_DB = [];

var NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

var noteToIdx = function(n){
var m={'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
return NOTES.indexOf(m[n]||n);
};

var CHORD_INTERVALS = {
'maj':[0,4,7],'min':[0,3,7],'dom7':[0,4,7,10],
'maj7':[0,4,7,11],'min7':[0,3,7,10],'sus2':[0,2,7],
'sus4':[0,5,7],'dim':[0,3,6],'aug':[0,4,8],'dim7':[0,3,6,9],
};

var buildChordNotes = function(rootName, type, octave){
var ri = noteToIdx(rootName);
if(ri<0) ri=0;
return (CHORD_INTERVALS[type]||CHORD_INTERVALS['maj']).map(function(s){
var ni=(ri+s)%12, oc=octave+Math.floor((ri+s)/12);
return NOTES[ni]+oc;
});
};

var renderGrooveAsScore = function(song, rootName, bpm, mod, gmList){
var canvasWrap = mod&&mod.root&&mod.root.querySelector('#cgo-groove-score-wrap');
if(!canvasWrap) return;
var LGAP=10, HGAP=5, NRX=7, NRY=4.5, STEM=28;
var LYRICS_H=22; // cgo-280: 마디 아래 가사 행 높이
/* cgo-502: 폰에서는 한 줄에 4마디를 욱여넣어 음표가 겹쳐 안 읽혔다.
   화면 너비에 따라 한 줄에 넣을 마디 수를 정한다.
     좁은 폰(≤480)  → 1마디
     큰 폰·태블릿   → 2마디
     PC             → 4마디 (지금까지와 같다) */
var _화면 = 0;
try{ _화면 = window.innerWidth || document.documentElement.clientWidth || 0; }catch(e){}
var BPR = (_화면 && _화면 <= 480) ? 1 : ((_화면 && _화면 <= 900) ? 2 : 4);
var LM=52, ST=36, RH=ST+4*LGAP+34+LYRICS_H;
/* cgo-500: 악보 칸이 아직 화면에 안 보일 때는 offsetWidth 가 0 이라
   380 으로 좁게 그려졌다. 위 칸들을 타고 올라가 실제 폭을 찾고,
   그래도 없으면 창 너비를 쓴다. */
var cW=(function(){
  var w=canvasWrap.offsetWidth||canvasWrap.clientWidth||0;
  if(w<360){ var el=canvasWrap.parentNode, n=0;
    while(el && n<6){ var ww=el.offsetWidth||el.clientWidth||0; if(ww>w) w=ww; el=el.parentNode; n++; } }
  if(w<360){ try{ w=Math.min((window.innerWidth||800)-24, 1200); }catch(e){} }
  return Math.max(340, w);
})();
var BAR_W=Math.max(72,Math.floor((cW-LM-6)/BPR));
var svgNS='http://www.w3.org/2000/svg';
var beatMs = 60000 / bpm;
var DN={C:0,D:1,E:2,F:3,G:4,A:5,B:6}, E4S=30;
var LETTS=['C','D','E','F','G','A','B'];
function ns(n){ var m=n.match(/^([A-G])(#|b)?(\d+)$/); if(!m) return 4; return DN[m[1]]+parseInt(m[3])*7-E4S; }
function sy(slot,sTop){ return sTop+4*LGAP-slot*HGAP; }
function slotToName(slot){ var adj=slot+30, oc=Math.floor(adj/7), dn=adj-oc*7; if(dn<0){oc--;dn+=7;} if(dn>=7){oc++;dn-=7;} return LETTS[dn]+oc; }
var CSUF={'maj':'','min':'m','dom7':'7','maj7':'maj7','min7':'m7','sus2':'sus2','sus4':'sus4','dim':'dim','aug':'aug','dim7':'dim7'};
var ri=noteToIdx(rootName); if(ri<0)ri=0;
var barChords=[], barBpb=[], mArr=[], totBars=0;
/* cgo-523 : 마디마다 화음의 **뿌리와 종류**도 적어 둔다.
   전에는 보여 줄 글자(csym, 'Emaj7')만 남기고 버렸다. 글자로는 소리를 못 낸다. */
var barChordRoot=[], barChordType=[];
(song && song.struct || []).forEach(function(sec){
var effRi=(ri+(sec.keyShift||0)+120)%12;
var bpb=(sec.timeSig?sec.timeSig[0]*4/sec.timeSig[1]:4);
(sec.chords||[]).forEach(function(cd){
var bars=cd[2]||2;
var chRoot=NOTES[(effRi+cd[0])%12];
var csym=chRoot+(CSUF[cd[1]]!==undefined?CSUF[cd[1]]:cd[1]);
if(cd[1]==='rest'||cd[0]===null) csym='N.C.'; // cgo-299: 쉼표 마디 'Grest' 오표기 → N.C.(코드 없음)
var cn=buildChordNotes(chRoot,cd[1],5);
for(var b=0;b<bars;b++){ barChords.push(csym); barBpb.push(bpb); barChordRoot.push(chRoot); barChordType.push(cd[1]); }
if(sec.melody){
var _mm338=sec.melody;
for(var bA=0;bA<bars;bA++){
_mm338.forEach(function(mp,_mi338){
var ni=mp[1]%cn.length, nn=cn[ni];
if(mp[2]){ var oc=parseInt(nn.replace(/[^0-9]/g,''))||5; nn=nn.replace(/[0-9]/g,'')+(oc+mp[2]); }
var _gname=null; // cgo-102: 장식음
if(mp[4]!==undefined&&mp[4]!==null){
var _gni=mp[4]%cn.length,_gnn=cn[_gni];
if(mp[2]){var _goc=parseInt(_gnn.replace(/[^0-9]/g,''))||5;_gnn=_gnn.replace(/[0-9]/g,'')+(mp[2]>0?_goc+mp[2]:_goc+mp[2]);}
_gname=_gnn;
}
var _nextBeat338=(_mi338+1<_mm338.length)?_mm338[_mi338+1][0]:bpb;
var _dur338=Math.max(0.125,(_nextBeat338-mp[0])/2); // beat→4분음표 기준(÷2), 최소 32분음표까지 허용
mArr.push({bar:totBars+bA, beat:mp[0], name:nn, bpb:bpb, dur:_dur338, tuplet:mp[3]||0, grace:_gname}); // cgo-90+cgo-101+cgo-102+cgo-338
});
}
}
totBars+=bars;
});
});
var sectionStarts={};
{ var _sB=0;
(song && song.struct || []).forEach(function(sec){
sectionStarts[_sB]=sec.name||'';
var _sb=(sec.chords||[]).reduce(function(s,c){return s+(c[2]||2);},0);
_sB+=_sb;
});
}
var sectionDynamics={};
var _DYNM6={intro:'p',verse:'mp','pre-chorus':'mf',prechorus:'mf',
chorus:'f',refrain:'f',bridge:'mf',drop:'ff',
buildup:'mf',outro:'p',coda:'pp'};
{var _sD6=0;
(song&&song.struct||[]).forEach(function(sec){
var _sn6=(sec.name||'').toLowerCase();
sectionDynamics[_sD6]=sec.dynamics||_DYNM6[_sn6]||'mp';
var _sb6=(sec.chords||[]).reduce(function(s,c){return s+(c[2]||2);},0);
_sD6+=_sb6;
});
}
var _DLVX7={ppp:0,pp:1,p:2,mp:3,mf:4,f:5,ff:6,fff:7};
var sectionTransArr7=[];
{var _sdK7=Object.keys(sectionDynamics).map(Number).sort(function(a,b){return a-b;});
for(var _sk7=1;_sk7<_sdK7.length;_sk7++){
var _sb7=_sdK7[_sk7-1],_sc7=_sdK7[_sk7];
var _lv1=_DLVX7[sectionDynamics[String(_sb7)]]||3;
var _lv2=_DLVX7[sectionDynamics[String(_sc7)]]||3;
if(_lv2>_lv1) sectionTransArr7.push({bar:_sc7-1,type:'cresc'});
else if(_lv2<_lv1) sectionTransArr7.push({bar:_sc7-1,type:'decresc'});
}
}
var barDynamics7={};
{var _bdc7='mp';
for(var _bdi7=0;_bdi7<totBars;_bdi7++){
if(sectionDynamics[String(_bdi7)]!==undefined) _bdc7=sectionDynamics[String(_bdi7)];
barDynamics7[_bdi7]=_bdc7;
}
}
if(window._cgoMelodyEvents && window._cgoMelodyEvents.length) {
var _tmpMArr411 = []; // cgo-411: 임시 배열로 먼저 수집 (빈 결과 폴백 보장)
var _bpb5 = (barBpb[0]) || 4;
var _bar5 = 0, _beat5 = 0;
window._cgoMelodyEvents.forEach(function(ev) {
if (ev.name) {
_tmpMArr411.push({bar:_bar5,beat:_beat5,name:ev.name,bpb:_bpb5,dur:ev.dur,tuplet:0,grace:null,_fromEv:true});
}
_beat5 += ev.dur;
while (_beat5 >= _bpb5) { _beat5 -= _bpb5; _bar5++; }
});
if(_tmpMArr411.length) { mArr = _tmpMArr411; } // cgo-411: 유효 음표 있을 때만 교체, 없으면 기존 폴백 유지
} else if(!mArr.length && window._cgoMelodyNames && window._cgoMelodyNames.length) {
var _bpb2 = (barBpb[0]) || 4;
var _bar2 = 0, _beat2 = 0;
window._cgoMelodyNames.forEach(function(name) {
if (name) mArr.push({bar:_bar2, beat:_beat2, name:name, bpb:_bpb2, dur:0.5, tuplet:0, grace:null});
_beat2 += 0.5;
if (_beat2 >= _bpb2) { _beat2 = 0; _bar2++; }
});
}
if (mArr.length) {
var _mxBar=0;
mArr.forEach(function(n){ if(n.bar>_mxBar) _mxBar=n.bar; });
if (_mxBar + 1 > totBars) totBars = _mxBar + 1;
}
if (!mArr.length && barChords.length) {
var _CHR4=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var _QMAP4={'m':3,'min':3,'dim':3,'aug':4,'7':4,'maj7':4,
'm7':3,'min7':3,'sus2':2,'sus4':5,'dim7':3,'m7b5':3};
barChords.forEach(function(csym, bIdx) {
var bpb4 = barBpb[bIdx] || 4;
var m4 = csym && csym.match(/^([A-G]#?)(.*)/);
if (!m4) return;
var cr4=m4[1], cq4=m4[2];
var ri4=_CHR4.indexOf(cr4); if(ri4<0) ri4=0;
var third4=(_QMAP4[cq4]!==undefined)?_QMAP4[cq4]:4;
var _pO5=[0,third4,7,12]; // root·3rd·5th·oct
var _bseq5 = bpb4>=6 ? [0,1,1.5,2,3,3.5,4,5] :
bpb4>=4 ? [0,1,1.5,2] :
bpb4>=3 ? [0,1,1.5] :
[0,.5,1];
_bseq5.forEach(function(bk5,pi5){
if(bk5>=bpb4) return;
var mid5=60+ri4+_pO5[pi5%_pO5.length];
if(mid5>84) mid5-=12; // 옥타브 클램프
var nn5=_CHR4[mid5%12]+(Math.floor(mid5/12)-1);
mArr.push({bar:bIdx,beat:bk5,name:nn5,bpb:bpb4,dur:1,tuplet:0,grace:null,_화음에서551:1});
});
});
if(!totBars) totBars=barChords.length;
}
if(!mArr.length){
canvasWrap.style.display='block';
canvasWrap.innerHTML='<div style="padding:12px;color:#9ca3af;font-size:12px;text-align:center;">🎼 이 곡에는 멜로디가 없습니다.</div>';
return;
}
mArr.sort(function(a,b){ return a.bar-b.bar||a.beat-b.beat; });
mArr.forEach(function(note,i){
if(note._fromEv) return; // cgo-245: 실제 리듬 데이터는 dur 재계산 스킵
var bpb2=note.bpb||4;
var maxDur=bpb2-note.beat; // 마디 끝까지 최대 길이
if(i<mArr.length-1){
var nx=mArr[i+1];
var gap=(nx.bar-note.bar)*bpb2+(nx.beat-note.beat);
note.dur=Math.max(0.125,Math.min(gap,maxDur,4.0));
} else {
note.dur=Math.max(0.125,Math.min(1,maxDur));
}
});
/* ═══ cgo-551 (2026-10-11) : 화음을 **가락에서 뽑아 곡 끝까지** 깐다 ═══
   파트너 — "어느 순간 모든 것이 없어지고 재즈 기타 소리, 드럼 소리 두 개만 나옴"
   【잰 것】 곡 하나를 네 번 만들어 세어 보니 네 번 다 똑같았다.
       곡 전체 60마디 · 화음이 적힌 마디 16 · 드럼이 도는 마디 60 · 가락이 도는 마디 60.
   【까닭】 가락은 추첨통에서 오고(음표 ~300개 ≈ 60마디), 화음은 곡 틀에서 온다(16마디).
       두 길이를 맞춰 주는 데가 **아무 데도 없었다.** 추첨통을 붙이기 전에는 둘 다
       곡 틀에서 나왔으니 길이가 같았다 — 추첨통이 들어오면서 어긋났다.
       _반주523 은 `if(!barChordRoot[b]) continue` 라 17마디부터 베이스·화음·깔개·
       현악·브라스·대선율 **여섯 겹이 통째로 쉰다.** 드럼(_드럼533)만 화음을 안 보고
       마디만 세어서 혼자 끝까지 돈다. 그래서 기타와 드럼 둘만 남았다. 곡의 73%.
   ⚠️ 고치려고 재다가 **더 큰 것**이 나왔다. 가락 음을 길이로 재서 조성을 찾아 보니
       네 번 중 세 번이 **라 단조**인데, 적힌 화음의 조는 도·시·솔# 이었다.
       **조가 어긋나 있었다.** 그래서 있는 16마디조차 가락 음과 맞는 비율이 **39%**.
       반쯤은 어긋난 소리를 깔고 있었다. 「허접하다」의 큰 몫이 여기 있었다.
   【하는 것】 ① 가락에서 조성을 찾고 ② 그 조의 화음 중에서
       ③ **두 마디씩 묶어** 가장 잘 맞는 것을 고른다.
   ⚠️ 마디마다 고르면 숫자는 76%로 더 높지만 60마디에 **48번** 바뀐다 —
       거의 매 마디다. 그건 음악이 아니라 멀미다. 숫자만 보고 고르면 틀린다.
       두 마디 묶음 + 끈기면 66% · 18번, 세 마디에 한 번꼴 — 세상 노래의 걸음걸이다.
   【잰 값】 맞는 비율 39% → 66%, 비어 있던 44마디가 전부 찬다.
   ⚠️ 새 고리를 돌리지 않는다. 곡을 만들 때 **딱 한 번** 돈다. 특허 기능과 무관하다.
   ⚠️ 앞 16마디도 바뀐다. 파트너가 "초반은 듣기 좋다"고 한 그 부분이다.
       숫자로는 좋아져야 맞지만 **내 잣대가 틀릴 수 있다. 사람 귀가 이긴다.**
   되돌리기 : window._cgo화음뽑기551 = false   (전과 똑같아진다) */
try{
if(window._cgo화음뽑기551!==false && mArr.length && totBars>0
   && !(mArr[0]&&mArr[0]._화음에서551)){   /* 화음으로 만든 가락이면 돌지 않는다 — 제자리 맴돈다 */
  var _통551=[0,0,0,0,0,0,0,0,0,0,0,0], _마디음551={};
  for(var _i551=0;_i551<mArr.length;_i551++){
    var _n551=mArr[_i551]; if(!_n551||!_n551.name) continue;
    var _pc551=_n2m(_n551.name)%12; if(!(_pc551>=0&&_pc551<=11)) continue;
    var _w551=Math.max(0.25,_n551.dur||1);
    _통551[_pc551]+=_w551;
    (_마디음551[_n551.bar]=_마디음551[_n551.bar]||[]).push({p:_pc551,w:_w551});
  }
  var _합551=0; for(var _q551=0;_q551<12;_q551++) _합551+=_통551[_q551];
  if(_합551>0){
    /* ① 조성 — 열두 조 × 장·단 열두 조, 스물넷 중에 가장 잘 맞는 것.
       아래 두 줄은 음악심리학에서 쓰는 '조성 무게'다. 으뜸음과 5도가 제일 무겁다. */
    var _장551=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
    var _단551=[6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
    var _으뜸551=0,_단조551=false,_최고551=-1;
    for(var _k551=0;_k551<12;_k551++){
      var _ja551=0,_da551=0;
      for(var _j551=0;_j551<12;_j551++){
        var _v551=_통551[(_k551+_j551)%12];
        _ja551+=_v551*_장551[_j551]; _da551+=_v551*_단551[_j551];
      }
      if(_ja551>_최고551){_최고551=_ja551;_으뜸551=_k551;_단조551=false;}
      if(_da551>_최고551){_최고551=_da551;_으뜸551=_k551;_단조551=true;}
    }
    /* ② 그 조의 화음 여덟 — 일곱 음계 화음 + 딸림7(가장 흔한 마침) */
    var _도수551=_단조551?[0,2,3,5,7,8,10,7]:[0,2,4,5,7,9,11,7];
    var _종류551=_단조551?['min','dim','maj','min','min','maj','maj','dom7']
                        :['maj','min','min','maj','maj','min','dim','dom7'];
    var _후보551=[],_집551=[];
    for(var _c551=0;_c551<8;_c551++){
      var _뿌551=NOTES[(_으뜸551+_도수551[_c551])%12], _ty551=_종류551[_c551];
      _후보551.push([_뿌551,_ty551]);
      var _z551={}; buildChordNotes(_뿌551,_ty551,4).forEach(function(nm){ _z551[_n2m(nm)%12]=1; });
      _집551.push(_z551);
    }
    /* ③ 두 마디씩 묶어 고른다 */
    var _새뿌551=[],_새종551=[],_앞551=-1,_버틴551=0;
    var _기본b551=barBpb[0]||4, _끝묶551=Math.ceil(totBars/2);
    for(var _g551=0;_g551<_끝묶551;_g551++){
      var _b0551=_g551*2, _들551=[];
      for(var _d551=0;_d551<2&&_b0551+_d551<totBars;_d551++){
        var _ls551=_마디음551[_b0551+_d551];
        if(_ls551) for(var _e551=0;_e551<_ls551.length;_e551++) _들551.push(_ls551[_e551]);
      }
      var _골551;
      if(_g551===0||_g551===_끝묶551-1) _골551=0;          /* 시작과 끝은 집(으뜸)에서 */
      else if(!_들551.length) _골551=(_앞551>=0?_앞551:0); /* 가락이 쉬면 앞 화음을 끈다 */
      else {
        var _무551=0; for(var _f551=0;_f551<_들551.length;_f551++) _무551+=_들551[_f551].w;
        var _최점551=-1; _골551=0;
        for(var _h551=0;_h551<8;_h551++){
          var _점551=0,_zz551=_집551[_h551];
          for(var _m551=0;_m551<_들551.length;_m551++)
            if(_zz551[_들551[_m551].p]) _점551+=_들551[_m551].w;
          /* 끈기 — 앞 화음을 조금 편든다. 여덟 마디 넘게 버텼으면 놓는다(한 화음에 고이면 지루하다) */
          if(_h551===_앞551&&_버틴551<4) _점551+=_무551*0.12;
          if(_점551>_최점551){_최점551=_점551;_골551=_h551;}
        }
      }
      _버틴551=(_골551===_앞551)?(_버틴551+1):0; _앞551=_골551;
      for(var _p2551=0;_p2551<2&&_b0551+_p2551<totBars;_p2551++){
        _새뿌551[_b0551+_p2551]=_후보551[_골551][0];
        _새종551[_b0551+_p2551]=_후보551[_골551][1];
      }
    }
    /* ④ 적는다. **화면 글자도 같이** 바꿔야 들리는 것과 보이는 것이 안 어긋난다.
       ⚠️ 마디마다 빠짐없이 적는다. 되풀이되는 마디를 빈칸으로 두면 깔끔해 보이지만,
          음표를 고를 때 뜨는 도움말(barChords[note.bar])이 같이 비어 버린다.
          게다가 파트너가 "초보자는 지금 어디인지도 모른다"고 했다 — 글자는 많을수록 낫다. */
    for(var _w2551=0;_w2551<totBars;_w2551++){
      if(!_새뿌551[_w2551]) continue;
      barChordRoot[_w2551]=_새뿌551[_w2551];
      barChordType[_w2551]=_새종551[_w2551];
      if(!barBpb[_w2551]) barBpb[_w2551]=_기본b551;
      var _sf551=CSUF[_새종551[_w2551]];
      barChords[_w2551]=_새뿌551[_w2551]+(_sf551!==undefined?_sf551:_새종551[_w2551]);
    }
    try{ window._cgo화음551={조:NOTES[_으뜸551]+(_단조551?' 단조':' 장조'),
         마디:totBars, 바뀜:(function(){var c=0,p='';for(var i=0;i<totBars;i++){
           var s=barChordRoot[i]+barChordType[i]; if(p&&s!==p)c++; p=s;} return c;})()}; }catch(_){}
    try{ console.log('%c[cgo-551] 화음 '+NOTES[_으뜸551]+(_단조551?' 단조':' 장조')
         +' · '+totBars+'마디 전부 깔았다','color:#7c3aed'); }catch(_){}
  }
}
}catch(_ex551){ try{ console.warn('[cgo-551] 화음 못 뽑음:',_ex551&&_ex551.message); }catch(_){} }
var eN=mArr.map(function(n){ return {bar:n.bar,beat:n.beat,name:n.name,bpb:n.bpb,dur:n.dur||1,tuplet:n.tuplet||0,grace:n.grace||null}; }); // cgo-90+cgo-101+cgo-102
var origN=mArr.map(function(n){ return {bar:n.bar,beat:n.beat,name:n.name,bpb:n.bpb,dur:n.dur||1,tuplet:n.tuplet||0,grace:n.grace||null}; }); // cgo-299: 음 길이까지 보관
var selI=-1, gmMel=(gmList&&gmList[0])||0, beatMs=60000/bpm;
var addMode=false; // 🅑 추가 모드 토글
var inputDur=1, inputIsRest=false; // cgo-265: 음표 입력 박자/쉼표 모드
var _lyricsArr=[]; // cgo-280: 마디별 가사 배열 (인덱스=마디번호, redraw 사이 유지)
/* ════════════════════════════════════════════════════════════════════
   cgo-515 (2026-10-09) : 가사를 마디 칸에 **저절로 채운다**.

   칸은 cgo-280 부터 마디마다 있었다. 비어 있던 이유는 못 넣어서가 아니라
   **아무도 안 채워 줘서**였다. 파트너가 한 칸씩 손으로 쳐 넣어야 했다.

   재료는 이미 다 있다 —
     · 가사  : 서버가 만들어 둔 것 (#cgo-vvip-lyrics), [Verse]/[Chorus] 딱지가 붙어 온다
     · 구간  : sectionStarts — 몇 번째 마디부터 verse 인지 chorus 인지
     · 음표 수: eN — 마디마다 음표가 몇 개인지
   우리 가락은 **노래 목소리에서 딴 것**이라 음표 하나가 글자 하나에 가깝다.
   그래서 '그 마디 음표 수만큼 글자를 담는다'로 나누면 꽤 맞게 들어간다.

   지키는 것 —
     · 파트너가 직접 쳐 넣은 칸은 **안 건드린다** (빈 칸만 채운다)
     · 음표가 없는 마디는 건너뛴다 (간주에 가사가 들어가면 안 된다)
     · 후렴은 **되풀이한다** — 후렴 구간이 두 번 나오면 같은 가사를 두 번 쓴다
     · 말썽이면 아래 `가사자동515 = false` 한 줄로 끈다
   ════════════════════════════════════════════════════════════════════ */
/* ═══ cgo-519 (2026-10-09) : 가사 자동 채우기를 **껐다** ═══
   파트너 — "그럼 가사를 원래대로 악보만 하기로 하죠"

   왜 끄는가 — 어느 마디부터 사람이 부르는지를 **알 수가 없다.**
     cgo-513 에서 목소리 떼기를 껐으므로(11분 걸리고 앱이 멈춰서) 악보 음표는
     노래+반주가 섞인 소리에서 딴 것이다. 전주에도 악기가 울려 음표가 있다.
       음표가 있는 마디 ≠ 노래하는 마디
     cgo-515 는 구간 표를 믿었다가 앞 20마디에 몰렸고, cgo-517 은 고르게 깔았지만
     전주에 가사가 붙었고, cgo-518 은 손으로 미는 단추를 달았다.
     세 판을 쓰고도 **손님이 매번 눌러야 하는 기능**이 남았다. 그건 기능이 아니다.

   지우지 않고 끈다 — 코드는 멀쩡하고, 고친 흠(줄 토막남·손글 덮어쓰기)도 그대로 살아 있다.
   ⚠️ 되살릴 수 있는 때 : ① 목소리 떼기가 빨라져서 노래만 딸 수 있을 때
                          ② 전주가 몇 마디인지 알 수 있을 때 (서버가 알려 주거나, 여러 곡 재서)
   되살리려면 아래 한 줄을 true 로. 가사 칸은 그대로 있으니 손으로는 언제든 쓸 수 있다. */
var 가사자동515 = true;   /* cgo-525 : 다시 켠다. 다만 **자체 악보에만** 들어간다 */
/* cgo-518 (2026-10-09) : **가사 밀기**.
   파트너 — "처음 전주가 나오는데 가사가 나오고"
   cgo-513 에서 목소리 떼기를 껐으므로 악보 음표는 **노래+반주가 섞인 소리**에서 딴
   것이다. 전주에도 기타·피아노가 울려 음표가 있다. 그런데 거기엔 노래가 없다.
     음표가 있는 마디  ≠  노래하는 마디
   어느 마디부터 사람이 부르는지는 **음표만 봐서는 알 수 없다.** 짐작으로 밀면
   곡마다 또 틀린다. 그래서 단추를 드린다 — 한두 번 누르면 맞는다.
   _자동518 : 저절로 채운 칸만 표시해 둔다. 파트너가 손으로 쓴 칸은 밀어도 안 건드린다. */
var _가사밀기518 = 0, _자동518 = {};
function _가사채우기518(){
  for(var _k518 in _자동518){ if(_자동518[_k518]) _lyricsArr[_k518]=''; }
  _자동518 = {};
  if(!가사자동515) return;
  try{
    /* ═══ cgo-525 : 가사는 **우리가 지은 악보에만** 넣는다 ═══
       파트너 — "자체곡의 가사는 우리 악보에 직접 들어가고 / 수노 악보에는 안 들어가는 구조로"
       cgo-519 에서 가사를 통째로 껐던 까닭은 하나였다 —
         수노 소리에서 딴 악보는 **노래가 몇 마디째부터인지 알 수 없다.**
         전주에도 기타·피아노가 울려 음표가 있으니 "음표가 있는 마디"가 "노래하는 마디"가 아니다.
       자체 악보에는 그 문제가 없다. 구간 계획(_cgoSectionPlan341)에
         intro 0~4박 · verse 4~12박 · chorus 18~24박 …
       이 박 단위로 적혀 있고, **음표도 그 계획에서 나왔다.** 두 시간표가 같다.
       그래서 전주는 건너뛰고, 1절 자리에 1절을, 후렴 자리에 후렴을 정확히 놓을 수 있다. */
    if(!window._cgo자체악보525) return;

    var _ta515=document.getElementById('cgo-vvip-lyrics');
    var _txt515=(_ta515 && _ta515.value) || '';
    if(!_txt515 || _txt515.replace(/\s/g,'').length<10) return;
    if(/^[\s]*[🎵🔄⚠️💗✅❌]/.test(_txt515)) return;

    function _종515(x){
      x=String(x||'').toLowerCase();
      if(/pre/.test(x)) return 'pre';
      if(/chorus|hook|refrain|후렴|^c$/.test(x)) return 'chorus';
      if(/bridge|브릿지|브리지|^b$/.test(x)) return 'bridge';
      if(/intro|전주|인트로/.test(x)) return 'intro';
      if(/outro|final|ending|아웃트로/.test(x)) return 'outro';
      if(/inst|break|간주|solo/.test(x)) return 'inst';
      return 'verse';
    }
    /* ① 가사를 덩어리로 가른다 */
    var _덩515=[], _현515=null;
    _txt515.split('\n').forEach(function(ln){
      var m=ln.match(/^\s*[\[\(【]\s*([^\]\)】]{1,30})\s*[\]\)】]\s*$/);
      if(m){ _현515={종:_종515(m[1]), 줄:[]}; _덩515.push(_현515); return; }
      if(!ln.trim()) return;
      if(!_현515){ _현515={종:'verse', 줄:[]}; _덩515.push(_현515); }
      _현515.줄.push(ln.trim());
    });
    _덩515=_덩515.filter(function(d){ return d.줄.length; });
    if(!_덩515.length) return;

    /* ② 마디마다 음표가 몇 개인가 */
    var _음수515={}, _총마디515=0;
    for(var _j515=0;_j515<eN.length;_j515++){
      if(eN[_j515].name==='R') continue;
      _음수515[eN[_j515].bar]=(_음수515[eN[_j515].bar]||0)+1;
      if(eN[_j515].bar+1>_총마디515) _총마디515=eN[_j515].bar+1;
    }
    if(!_총마디515) return;

    /* ③ ⚠️ 구간(verse/chorus) 표에 맞춰 넣어 봤다 — **안 됐다.**
       자체 곡 한 바퀴는 7.5마디뿐이라 후렴 칸이 1~2마디다. 가사 한 줄이 네 마디를
       먹으니 후렴은 「나도」에서 잘리고, 2·3바퀴 절은 통째로 비고, 다섯 줄이 버려졌다.
       cgo-517에서 똑같은 벽을 만났고 그때 푼 길이 이것이다 — **구간 표를 안 쓰고
       노래하는 마디에 고르게 깐다.** 버려지는 줄 0, 되풀이 0.
       (여기까지 왔다는 것은 이미 **자체 악보**라는 뜻이다. 수노 악보는 위에서 돌아갔다.) */
    var _계획525=window._cgoSectionPlan341||[];
    var _바퀴525=window._cgoCycleBeats341||0;
    var _bpb525=(eN[0]&&eN[0].bpb)||4;

    /* ③-1 앞 전주·뒤 후주 마디는 비워 둔다 (한 바퀴치 계획에서 길이만 빌린다) */
    var _앞빼기525=0, _뒤빼기525=0;
    try{
      for(var _q=0;_q<_계획525.length;_q++){
        var _t=_종515(_계획525[_q].type||_계획525[_q].label);
        if(_t==='intro'||_t==='inst') _앞빼기525=Math.round((_계획525[_q].end||0)/_bpb525);
        else break;
      }
      for(var _q2=_계획525.length-1;_q2>=0;_q2--){
        var _t2=_종515(_계획525[_q2].type||_계획525[_q2].label);
        if(_t2==='outro'){ _뒤빼기525=Math.round(((_계획525[_q2].end||0)-(_계획525[_q2].start||0))/_bpb525); }
        else break;
      }
    }catch(_){ _앞빼기525=0; _뒤빼기525=0; }
    if(!(_앞빼기525>=0)) _앞빼기525=0;
    if(!(_뒤빼기525>=0)) _뒤빼기525=0;
    _앞빼기525=Math.min(_앞빼기525,2);     /* 너무 많이 빼지 않는다 */
    _뒤빼기525=Math.min(_뒤빼기525,2);

    /* ③-2 노래할 수 있는 마디만 추린다 (음표가 있는 마디) */
    var _노래마디525=[];
    for(var _b525=_앞빼기525; _b525<_총마디515-_뒤빼기525; _b525++)
      if(_음수515[_b525]>0) _노래마디525.push(_b525);
    if(!_노래마디525.length) return;

    /* ④ 덩어리를 **원래 차례대로** 한 줄씩 편다 (절→후렴→절→브릿지… 적힌 그대로) */
    var _줄차례525=[];
    _덩515.forEach(function(d){
      d.줄.forEach(function(ln){
        var _말=[]; String(ln).split(/\s+/).forEach(function(x){ if(x) _말.push(x); });
        if(_말.length) _줄차례525.push(_말);
      });
    });
    if(!_줄차례525.length) return;

    function _글자515(w){
      var n=(w.match(/[가-힣぀-ヿ一-鿿]/g)||[]).length;
      if(n) return n;
      return Math.max(1,(w.toLowerCase().match(/[aeiouy]+/g)||[]).length);
    }

    /* ⑤ 줄 k 를 노래마디의 k/전체 자리에서 시작시킨다 — 앞에 몰리지 않고 고르게 퍼진다.
       한 줄이 끝나면 **마디도 새로** 넘어간다 (줄이 마디 사이에서 토막나지 않게). */
    var _넣은515=0, _남은515=0;
    var _M525=_노래마디525.length, _L525=_줄차례525.length;
    var _막은525=-1;                                  /* 앞 줄이 먹은 마지막 자리 */
    for(var _k525=0;_k525<_L525;_k525++){
      var _말=_줄차례525[_k525];
      var _자리=Math.floor(_k525*_M525/_L525);
      if(_자리<=_막은525) _자리=_막은525+1;            /* 앞 줄과 겹치지 않게 */
      var _wi=0;
      while(_자리<_M525 && _wi<_말.length){
        var _b=_노래마디525[_자리], _필요=_음수515[_b]||0;
        _자리++;
        if(_필요<=0) continue;
        if(_lyricsArr[_b]) continue;
        var _모=[], _센=0;
        while(_wi<_말.length){
          var _cc=_글자515(_말[_wi]);
          if(_모.length && _센+_cc>_필요) break;
          _모.push(_말[_wi]); _센+=_cc; _wi++;
          if(_센>=_필요) break;
        }
        if(_모.length){ _lyricsArr[_b]=_모.join(' '); _자동518[_b]=1; _넣은515++; }
      }
      _막은525=_자리-1;
      _남은515+=(_말.length-_wi);
    }
    try{ console.log('%c[cgo-525] 자체 악보에 가사 채움 — '+_넣은515+'칸 · 줄 '+_L525+'개 · 노래마디 '+_M525
         +(_남은515>0?(' · 자리가 모자라 남은 말 '+_남은515+'개'):''),'color:#7c3aed'); }catch(_){}
  }catch(_e515){ try{ console.warn('[cgo-525] 가사 채우기 건너뜀:', _e515&&_e515.message); }catch(__){} }
}
_가사채우기518();
var dragState={active:false,idx:-1,sTop:0,currentSlot:0,startY:0,justDragged:false,line:null}; // 🅐 드래그 상태
if(typeof window._cgoScoreStop==='function'){ try{ window._cgoScoreStop(); }catch(ex){} } // 새 악보 = 이전 악보 재생 정리
var PB=window._cgoScorePB=(window._cgoScorePB||{timers:[],srcs:[],out:null,playing:false,mode:'',bar:-1});
var lastBar=-1; // 지금 만지는 마디 (음표 선택·드래그·추가 시 갱신, 선택 해제돼도 기억)
var _curSvg=null; // 현재 화면의 SVG (재생 마디 표시용)
var _bAll=null,_bPart=null,_bStop=null,_scMsg=null,_lastWavUrl=null;
var CGO_SYN_LIST=[
['piano','🎹 피아노'],
['bright_acoustic_piano','🎹 밝은 피아노'],
['electric_piano_1','🎹 일렉 피아노'],
['electric_piano_2','🎹 일렉 피아노 2'],
['harpsichord','🎹 하프시코드'],
['celesta','🔔 첼레스타'],
['music_box','🎵 오르골'],
['vibraphone','🔔 비브라폰'],
['glockenspiel','🔔 글로켄슈필'],
['kalimba','🪘 칼림바'],
['church_organ','⛪ 파이프 오르간'],
['rock_organ','🎹 록 오르간'],
['drawbar_organ','🎹 재즈 오르간'],
['accordion','🪗 아코디언'],
['acoustic_guitar','🎸 어쿠스틱 기타'],
['acoustic_guitar_nylon','🎸 클래식 기타'],
['electric_guitar_clean','🎸 일렉 기타(클린)'],
['electric_guitar_jazz','🎸 재즈 기타'],
['overdriven_guitar','🎸 오버드라이브 기타'],
['distortion_guitar','🎸 디스토션 기타'],
['banjo','🪕 밴조'],
['sitar','🪕 시타르'],
['koto','🪕 거문고풍(코토)'],
['orchestral_harp','🎼 하프'],
['violin','🎻 바이올린'],
['viola','🎻 비올라'],
['cello','🎻 첼로'],
['double_bass','🎻 콘트라베이스'],
['pizzicato_strings','🎻 피치카토'],
['tremolo_strings','🎻 트레몰로 현악'],
['string_ensemble','🎻 현악 앙상블'],
['string_ensemble_2','🎻 현악 앙상블 2'],
['acoustic_bass','🎸 어쿠스틱 베이스'],
['electric_bass_finger','🎸 핑거 베이스'],
['electric_bass_pick','🎸 픽 베이스'],
['slap_bass_1','🎸 슬랩 베이스'],
['trumpet','🎺 트럼펫'],
['muted_trumpet','🎺 뮤트 트럼펫'],
['trombone','🎺 트롬본'],
['tuba','🎺 튜바'],
['french_horn','📯 프렌치 호른'],
['brass_section','🎺 브라스 섹션'],
['soprano_sax','🎷 소프라노 색소폰'],
['saxophone','🎷 알토 색소폰'],
['tenor_sax','🎷 테너 색소폰'],
['baritone_sax','🎷 바리톤 색소폰'],
['flute','🪈 플루트'],
['piccolo','🪈 피콜로'],
['pan_flute','🪈 팬플루트'],
['recorder','🪈 리코더'],
['ocarina','🪈 오카리나'],
['shakuhachi','🪈 샤쿠하치'],
['oboe','🪵 오보에'],
['english_horn','🪵 잉글리시 호른'],
['clarinet','🪵 클라리넷'],
['bassoon','🪵 바순'],
['harmonica','🎵 하모니카'],
['choir_aahs','🗣️ 합창 (아)'],
['voice_oohs','🗣️ 합창 (우)'],
['synth_choir','🗣️ 성가대'],
['steel_drums','🥁 스틸 드럼'],
['timpani','🥁 팀파니']];
var CGO_SYN_GM={piano:0,acoustic_guitar:25,violin:40,viola:41,cello:42,double_bass:43,string_ensemble:48,choir_aahs:52,
trumpet:56,french_horn:60,flute:73,oboe:68,clarinet:71,bassoon:70,saxophone:65,harmonica:22};
var synthPW=(typeof window._cgoGmToPW==='function'&&window._cgoGmToPW(gmMel))||'piano'; // 추첨통에서 고른 첫 악기 음색이 기본
function _n2m(n){
var m=(n||'').match(/^([A-G])(#|b)?(-?\d+)$/); if(!m) return 60;
var NV={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
return (parseInt(m[3],10)+1)*12+NV[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);
}
function _absBeat(n){ return n.bar*(n.bpb||4)+n.beat; }
/* ═══ cgo-523 (2026-10-09) : 화음을 **소리로** 울린다 ═══
   파트너 — "악보 편집은 하나의 악기로만 할 수 있게 되어 있는데 이것을 확대도 가능한가"
   지금까지 화음(Emaj7·Dmaj7…)은 **글자만** 그렸다. 소리는 가락 한 줄뿐이라
   🔊 소리로 저장 을 눌러도 피아노 한 손으로 친 것처럼 빈약했다.
   재료는 이미 있었다 — buildChordNotes() 가 코드를 진짜 음으로 풀어 준다.
   마디마다 **베이스 한 음(옥2) + 받침 세 음(옥3)** 을 깔아 준다.
   ⚠️ 가락보다 작게 운다(반주세기523). 반주가 가락을 덮으면 악보가 안 들린다.
   ⚠️ 새 고리를 돌리지 않는다 — 가락과 **같은 목록에 섞어** 기존 길로 흘려보낸다. */
var 반주523 = true;        /* 말썽이면 false */
var 반주세기523 = 0.32;    /* 가락 대비 소리 크기 */
/* cgo-524 : 반주는 **가락과 다른 악기**로 운다.
   받침은 피아노, 베이스는 콘트라베이스가 기본이다. 화면에서 바꿀 수 있다. */
var 반주악기524 = 'piano';
var 베이스악기524 = 'double_bass';
/* ───────── cgo-533 : 배경을 늘려 꽉 채운다 ──────────────────────────────
   파트너 — "드럼 등 화음 악기, 배경 악기들을 늘려서 자체 악기로도 퀄리티가 있게"
   맞는 말이다. 지금 악보 소리는 **세 겹**뿐이었다 —
     가락 1 · 화음 1(한 마디 내내 「쿵」 누르고 있음) · 베이스 1
   진짜 곡은 6~8겹이다. 셋을 더한다.
     ① 화음을 **쪼개 친다** (한 마디 통째 → 아르페지오 · 8비트 · 쿵짝)
     ② 뒤에 **현악을 깐다** (빈 데를 메운다)
     ③ **드럼**을 넣는다 (아래 _드럼533)
   각각 스위치가 따로다. 하나가 거슬리면 그것만 끄면 된다.
     window._cgo쪼개기533 = false   // 화음 쪼개 치기
     window._cgo깔개533   = false   // 뒤에 깔리는 현악
     window._cgo드럼533   = false   // 드럼                                */
var 쪼갬꼴533 = 'auto';     /* auto · block · arp · eight · oompah */
var 깔개세기533 = 0.45;

/* ───────── cgo-534 : 꼴마다 **편성**이 저절로 바뀐다 ────────────────────
   파트너 — "현악 8중주 · 트럼펫 · 피아노 · 색소폰 · 기타로 목소리를 대신"
             "신디사이저 소리만 아니면 된다. 다다익선"
   악기를 63가지로 늘리고(`cgo-sound2.js`), 꼴에 맞게 제 자리를 맡긴다.
   ⚠️ 현악을 **한 악기로 뭉개지 않는다.** 「현악합주」 하나로 세 음을 내면 그냥 패드다.
      바이올린1=꼭대기 · 바이올린2=가운데 · 비올라=아래 · 첼로=뿌리 로 **나눠 맡겨야**
      진짜 현악부 소리가 난다.
   ⚠️ 손님이 고를 것이 없다. 꼴만 고르면 편성은 저절로다.
      ("손님이 매번 눌러서 맞춰야 하는 기능은 기능이 아니다")
   끄기 : window._cgo편성534 = false  →  cgo-533 의 단순 편성으로 돌아간다          */
var _편성표534 = {
  ballad:  {아르:'piano',                현:['violin','violin','viola','cello'], 현세:1.0,
            베:'double_bass',            브라스:'french_horn', 브세:0.55, 대선:'',          드세:0.72, 꼴:'arp'},
  kballad: {아르:'piano',                현:['violin','violin','viola','cello'], 현세:1.1,
            베:'double_bass',            브라스:'french_horn', 브세:0.50, 대선:'oboe',      드세:0.75, 꼴:'arp'},
  pop:     {아르:'electric_piano_1',     현:['violin','viola','cello'],          현세:0.8,
            베:'electric_bass_finger',   브라스:'brass_section',브세:0.50, 대선:'',          드세:0.95, 꼴:'eight'},
  rock:    {아르:'overdriven_guitar',    현:[],                                   현세:0,
            베:'electric_bass_pick',     브라스:'',            브세:0,    대선:'',          드세:1.15, 꼴:'eight'},
  jazz:    {아르:'electric_piano_1',     현:['pizzicato_strings'],                현세:0.5,
            베:'acoustic_bass',          브라스:'muted_trumpet',브세:0.45, 대선:'tenor_sax', 드세:0.55, 꼴:'arp'},
  country: {아르:'acoustic_guitar_nylon',현:['violin'],                           현세:0.6,
            베:'acoustic_bass',          브라스:'',            브세:0,    대선:'harmonica', 드세:0.80, 꼴:'oompah'},
  orch:    {아르:'orchestral_harp',      현:['violin','violin','viola','cello'],  현세:1.3,
            베:'double_bass',            브라스:'french_horn', 브세:0.70, 대선:'flute',     드세:0.35, 꼴:'arp'}
};
function _편성534(){
  try{
    if(window._cgo편성534===false) return null;
    var t=String((window._cgoDNAMix&&window._cgoDNAMix.style)||'').toLowerCase();
    if(t.indexOf('orchestr')>=0||t.indexOf('cinematic')>=0||t.indexOf('ostdrama')>=0) return _편성표534.orch;
    if(t.indexOf('jazz')>=0||t.indexOf('blues')>=0||t.indexOf('bebop')>=0)            return _편성표534.jazz;
    if(t.indexOf('rock')>=0||t.indexOf('metal')>=0||t.indexOf('punk')>=0)             return _편성표534.rock;
    if(t.indexOf('country')>=0||t.indexOf('trot')>=0||t.indexOf('folk')>=0)           return _편성표534.country;
    if(t.indexOf('kballad')>=0)                                                        return _편성표534.kballad;
    if(t.indexOf('pop')>=0||t.indexOf('rnb')>=0||t.indexOf('edm')>=0)                 return _편성표534.pop;
    return _편성표534.ballad;
  }catch(_){ return _편성표534.ballad; }
}
function _후렴인가534(bar){
  try{
    var _ss=(typeof sectionStarts!=='undefined')?sectionStarts:null;
    if(!_ss) return false;
    var ks=Object.keys(_ss).map(Number).sort(function(a,b){return a-b;});
    var cur='';
    for(var i=0;i<ks.length;i++){ if(ks[i]<=bar) cur=String(_ss[ks[i]]||''); else break; }
    cur=cur.toLowerCase();
    return cur.indexOf('chorus')>=0||cur.indexOf('후렴')>=0||cur.indexOf('final')>=0;
  }catch(_){ return false; }
}
function _m2n533(m){
  try{
    var N=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    m=Math.round(m); if(m<12||m>108) return null;
    return N[((m%12)+12)%12]+(Math.floor(m/12)-1);
  }catch(_){ return null; }
}

function _꼴고르기533(){
  try{
    var g=(window._cgoDNAMix&&window._cgoDNAMix.style)||'';
    var s=String(g||'').toLowerCase();
    if(쪼갬꼴533!=='auto') return 쪼갬꼴533;
    var _E6=_편성534(); if(_E6&&_E6.꼴) return _E6.꼴;
    if(s.indexOf('trot')>=0||s.indexOf('country')>=0) return 'oompah';
    if(s.indexOf('rock')>=0||s.indexOf('pop')>=0||s.indexOf('edm')>=0||s.indexOf('kpop')>=0) return 'eight';
    return 'arp';                                   /* 발라드 기본 — 아르페지오 */
  }catch(_){ return 'arp'; }
}

function _반주523(시작마디, 끝마디){
  var out=[];
  if(!반주523) return out;
  try{
    var 쪼개 = (window._cgo쪼개기533!==false);
    var 깔개 = (window._cgo깔개533!==false);
    var 꼴 = _꼴고르기533();
    for(var b=Math.max(0,시작마디); b<끝마디; b++){
      var r=barChordRoot[b], ty=barChordType[b];
      if(!r || ty==='rest') continue;
      var bpb=barBpb[b]||4;
      var 받침=buildChordNotes(r, ty, 3).slice(0,3);
      var 베이스=buildChordNotes(r, 'maj', 2)[0];
      var 베위=buildChordNotes(r, 'maj', 3)[0];

      /* ── 베이스 ── 한 마디 내내 끌지 않고 박을 짚는다 */
      if(!쪼개){
        out.push({bar:b,beat:0,bpb:bpb,dur:bpb*0.96,name:베이스,_반:1,_베:1});
      } else if(꼴==='oompah'){
        out.push({bar:b,beat:0,bpb:bpb,dur:0.92,name:베이스,_반:1,_베:1});
        if(bpb>2) out.push({bar:b,beat:bpb/2,bpb:bpb,dur:0.92,name:베위,_반:1,_베:1});
      } else {
        out.push({bar:b,beat:0,bpb:bpb,dur:bpb*0.52,name:베이스,_반:1,_베:1});
        out.push({bar:b,beat:bpb/2,bpb:bpb,dur:bpb*0.46,name:베이스,_반:1,_베:1});
      }

      /* ── 화음 ── */
      if(!쪼개 || 꼴==='block'){
        for(var k=0;k<받침.length;k++)
          out.push({bar:b,beat:0,bpb:bpb,dur:bpb*0.96,name:받침[k],_반:1});
      } else if(꼴==='arp'){
        /* 아르페지오 — 8분음표로 올라갔다 내려온다 : 도 미 솔 미 도 미 솔 미 */
        var 차례=[0,1,2,1], n8=Math.round(bpb*2);
        for(var i8=0;i8<n8;i8++){
          var nm=받침[차례[i8%차례.length]];
          if(!nm) continue;
          out.push({bar:b,beat:i8*0.5,bpb:bpb,dur:0.48,name:nm,_반:1});
        }
      } else if(꼴==='eight'){
        /* 8비트 — 화음을 8분으로 끊어 친다. 뒷박을 여리게(세기는 cgo-531 이 맡는다) */
        var n8b=Math.round(bpb*2);
        for(var j8=0;j8<n8b;j8++){
          if(j8%2===1 && (j8%4)!==1) continue;      /* 다 치면 시끄럽다 */
          for(var k2=0;k2<받침.length;k2++)
            out.push({bar:b,beat:j8*0.5,bpb:bpb,dur:0.46,name:받침[k2],_반:1});
        }
      } else {  /* oompah — 쿵(베이스) 짝(화음) */
        for(var j9=1;j9<bpb;j9+=2)
          for(var k3=0;k3<받침.length;k3++)
            out.push({bar:b,beat:j9,bpb:bpb,dur:0.9,name:받침[k3],_반:1});
      }

      /* ── 깔개 ── 뒤에 길게 깔아 빈 데를 메운다 */
      if(깔개){
        for(var k4=0;k4<받침.length;k4++)
          out.push({bar:b,beat:0,bpb:bpb,dur:bpb*0.99,name:받침[k4],_반:1,_깔:1});
      }

      /* ── cgo-534 : 편성 ── 악기마다 제 자리를 맡는다 ── */
      var E=_편성534();
      if(E){
        var 후=_후렴인가534(b);
        for(var q=0;q<out.length;q++){
          var o=out[q];
          if(o.bar!==b||o._깔||o._드||o._악) continue;
          o._악 = o._베 ? E.베 : E.아르;
        }
        if(E.현 && E.현.length && E.현세>0){
          var 높=[받침[2],받침[1],받침[0],받침[0]], 옥=[12,0,0,-12];
          for(var v=0; v<E.현.length && v<4; v++){
            var nm2=높[v]; if(!nm2) continue;
            var 이름2=_m2n533(_n2m(nm2)+옥[v]); if(!이름2) continue;
            out.push({bar:b,beat:0,bpb:bpb,dur:bpb*0.99,name:이름2,_반:1,
                      _악:E.현[v], _세:0.26*E.현세*(후?1.25:1.0)});
          }
        }
        if(후 && E.브라스 && E.브세>0)
          out.push({bar:b,beat:0,bpb:bpb,dur:bpb*0.98,name:받침[2]||받침[0],_반:1,
                    _악:E.브라스,_세:0.30*E.브세});
        if(E.대선 && (b%2)===1)
          out.push({bar:b,beat:Math.max(0,bpb-1),bpb:bpb,dur:0.95,name:받침[1]||받침[0],_반:1,
                    _악:E.대선,_세:0.30});
      }
    }
    /* ── 드럼 ── */
    if(window._cgo드럼533!==false){
      var d=_드럼533(시작마디, 끝마디);
      for(var di=0;di<d.length;di++) out.push(d[di]);
    }
  }catch(e){ return []; }
  return out;
}

/* ───────── cgo-533 : 드럼 ────────────────────────────────────────────────
   ⚠️ 드럼만은 **계산으로 만들어도 진짜다.** TR-808 · 909 가 그렇게 만든 소리이고
      세상 히트곡이 그 소리를 쓴다. 피아노는 흉내가 안 되지만 킥 · 스네어 · 하이햇은
      흉내가 아니라 그 자체다. 그래서 녹음을 안 받아도 된다.
   ⚠️ 음표 꼴로 돌려주되 `_드` 표를 붙인다. 소리 내는 쪽에서 이 표를 보고 따로 낸다. */
function _드럼533(시작마디, 끝마디){
  var out=[];
  try{
    for(var b=Math.max(0,시작마디); b<끝마디; b++){
      var bpb=barBpb[b]||4;
      var 반=Math.floor(bpb/2);
      var _E5=_편성534(); var _ds=_E5?_E5.드세:0.8;
      out.push({bar:b,beat:0,bpb:bpb,dur:0.5,name:'C2',_반:1,_드:'kick',_세:_ds});
      if(bpb>2) out.push({bar:b,beat:반,bpb:bpb,dur:0.5,name:'D2',_반:1,_드:'snare',_세:_ds});
      for(var h=0;h<bpb*2;h++)
        out.push({bar:b,beat:h*0.5,bpb:bpb,dur:0.24,name:'F#2',_반:1,
                  _드:(h%4===2?'ohat':'hat'),_세:_ds});
      if(bpb>3 && (b%4)===3) out.push({bar:b,beat:bpb-0.5,bpb:bpb,dur:0.5,name:'D2',_반:1,_드:'snare'});
    }
  }catch(e){ return []; }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════
   JURAN · 드럼 3판 — **가운데 소리를 채운다**
   ───────────────────────────────────────────────────────────────────────
   【파트너 귀】 "주가 피아노 소리지만 드럼 소리의 역할이 거의 없는 것 같은데요"

   【재 보니 크기 문제가 아니었다】
     드럼만 / 악기만 을 따로 뽑아 재니 둘의 세기가 **똑같았다(0dB 차이).**
     작아서 안 들린 게 아니었다. 드럼을 8dB 올려 보니 이렇게 나왔다 —
        30~150Hz  +2dB      ← 올라간 데는 여기뿐
       150Hz~6kHz  0 또는 마이너스
        6~16kHz   +1.8dB
     옛 드럼은 **아주 낮은 데와 아주 높은 데에만** 있었다. 그런데
       · 사람 귀가 가장 잘 듣는 곳은 그 가운데다
       · **폰 스피커는 150Hz 아래를 아예 못 낸다** — 킥 몸통이 통째로 사라진다
       · 그 가운데는 피아노와 기타가 꽉 채우고 있다
     없는 자리에서는 아무리 키워도 안 들린다.

   【채운 것】 (드럼만 따로, 같은 크기로 맞춘 뒤 잰 값)
       1.2~3kHz +4.0dB · 3~6kHz +5.5dB · 6~16kHz +3.1dB
     · 킥   : 밑소리 말고 **92~145Hz 의 「퍽」**을 한 겹 더. 치는 소리를
              2.6kHz → 3.1kHz 로 옮기고 두 배 세게.
     · 스네어: 북 몸통 1.7배 · **680Hz 의 「탁」** 새로 넣음 ·
              철사 소리 띠를 두 배 넓히고(Q 0.55→0.28) 1.5배 세게 · 「착」 5.6kHz
     · 하이햇: 4.2kHz 부터 내도록 내려 가운데도 조금 맡게

   끄기 : window._cgo드럼3판 = false  (그러면 옛 소리로 돌아간다)
   ═══════════════════════════════════════════════════════════════════════ */
function _잡음555(ctx,초){
  var n=Math.max(1,Math.floor(ctx.sampleRate*초));
  var b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
  for(var i=0;i<n;i++) d[i]=Math.random()*2-1;
  var s=ctx.createBufferSource(); s.buffer=b; return s;
}
function _때555(ctx,양){
  var w=ctx.createWaveShaper(), n=1024, c=new Float32Array(n), k=양||2.2;
  for(var i=0;i<n;i++){ var x=i*2/n-1; c[i]=Math.tanh(x*k)/Math.tanh(k); }
  w.curve=c; w.oversample='2x'; return w;
}
function _드럼소리533(ctx,dest,종,t,세기){
  try{
    var v=Math.max(0.05,Math.min(1.2,세기||0.7));
    var ss=[];
    var 새 = (window._cgo드럼3판 !== false);
    if(종==='kick'){
      if(새){
        /* ㉠ 밑 — 좋은 스피커에서 몸집이 된다 */
        var o=ctx.createOscillator(); o.type='sine';
        o.frequency.setValueAtTime(175,t);
        o.frequency.exponentialRampToValueAtTime(55,t+0.040);
        o.frequency.exponentialRampToValueAtTime(43,t+0.26);
        var g=ctx.createGain();
        g.gain.setValueAtTime(v*1.05,t);
        g.gain.exponentialRampToValueAtTime(v*0.45,t+0.07);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.34);
        var sh=_때555(ctx,2.6); o.connect(sh); sh.connect(g); g.connect(dest);
        o.start(t); o.stop(t+0.38); ss.push(o);
        /* ㉡ 가운데 「퍽」 — 폰 스피커가 실제로 내 주는 자리 */
        var o2=ctx.createOscillator(); o2.type='triangle';
        o2.frequency.setValueAtTime(145,t);
        o2.frequency.exponentialRampToValueAtTime(92,t+0.055);
        var g2=ctx.createGain();
        g2.gain.setValueAtTime(v*0.72,t);
        g2.gain.exponentialRampToValueAtTime(0.001,t+0.16);
        var sh2=_때555(ctx,1.8); o2.connect(sh2); sh2.connect(g2); g2.connect(dest);
        o2.start(t); o2.stop(t+0.20); ss.push(o2);
        /* ㉢ 치는 소리 */
        var c3=_잡음555(ctx,0.012), cf=ctx.createBiquadFilter();
        cf.type='bandpass'; cf.frequency.value=3100; cf.Q.value=0.85;
        var cg=ctx.createGain();
        cg.gain.setValueAtTime(v*0.80,t);
        cg.gain.exponentialRampToValueAtTime(0.001,t+0.022);
        c3.connect(cf); cf.connect(cg); cg.connect(dest); c3.start(t); c3.stop(t+0.03); ss.push(c3);
        return ss;
      }
      var go=ctx.createGain(); go.connect(dest);
      var oo=ctx.createOscillator(); oo.type='sine';
      oo.frequency.setValueAtTime(150,t);
      oo.frequency.exponentialRampToValueAtTime(45,t+0.09);
      go.gain.setValueAtTime(v*1.25,t);
      go.gain.exponentialRampToValueAtTime(0.001,t+0.32);
      oo.connect(go); oo.start(t); oo.stop(t+0.36); ss.push(oo);
      return ss;
    }
    if(종==='snare' && 새){
      /* ㉠ 북 몸통 — 여기가 「통」 소리다 */
      [[190,0.52,0.11],[338,0.34,0.08]].forEach(function(a){
        var o=ctx.createOscillator(); o.type='triangle';
        o.frequency.setValueAtTime(a[0],t);
        o.frequency.exponentialRampToValueAtTime(a[0]*0.84,t+a[2]);
        var g=ctx.createGain();
        g.gain.setValueAtTime(v*a[1],t);
        g.gain.exponentialRampToValueAtTime(0.001,t+a[2]+0.03);
        o.connect(g); g.connect(dest); o.start(t); o.stop(t+a[2]+0.06); ss.push(o);
      });
      /* ㉡ 680Hz 의 「탁」 — 피아노 사이를 뚫고 나오는 자리 */
      var nb=_잡음555(ctx,0.09), fb=ctx.createBiquadFilter();
      fb.type='bandpass'; fb.frequency.value=680; fb.Q.value=1.0;
      var gb=ctx.createGain();
      gb.gain.setValueAtTime(v*0.55,t); gb.gain.exponentialRampToValueAtTime(0.001,t+0.075);
      nb.connect(fb); fb.connect(gb); gb.connect(dest); nb.start(t); nb.stop(t+0.10); ss.push(nb);
      /* ㉢ 철사 — 띠를 넓게, 더 크게 */
      var n1=_잡음555(ctx,0.24), f1=ctx.createBiquadFilter();
      f1.type='bandpass'; f1.frequency.value=2100; f1.Q.value=0.28;
      var g1=ctx.createGain();
      g1.gain.setValueAtTime(v*0.95,t); g1.gain.exponentialRampToValueAtTime(0.001,t+0.19);
      n1.connect(f1); f1.connect(g1); g1.connect(dest); n1.start(t); n1.stop(t+0.26); ss.push(n1);
      /* ㉣ 「착」 */
      var n2=_잡음555(ctx,0.05), f2=ctx.createBiquadFilter();
      f2.type='bandpass'; f2.frequency.value=5600; f2.Q.value=0.5;
      var g3=ctx.createGain();
      g3.gain.setValueAtTime(v*0.78,t); g3.gain.exponentialRampToValueAtTime(0.001,t+0.04);
      n2.connect(f2); f2.connect(g3); g3.connect(dest); n2.start(t); n2.stop(t+0.055); ss.push(n2);
      return ss;
    }
    if(새){                                   /* 하이햇 — 가운데도 조금 맡는다 */
      var 열림=(종==='ohat'), L=열림?0.30:0.046;
      var gh=ctx.createGain();
      gh.gain.setValueAtTime(v*(열림?0.30:0.28),t);
      gh.gain.exponentialRampToValueAtTime(0.001,t+L);
      var bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=9000; bp.Q.value=0.5;
      var hp2=ctx.createBiquadFilter(); hp2.type='highpass'; hp2.frequency.value=4200;
      bp.connect(hp2); hp2.connect(gh); gh.connect(dest);
      [2,3,4.16,5.43,6.79,8.21].forEach(function(r){
        var o=ctx.createOscillator(); o.type='square'; o.frequency.value=40*r;
        o.connect(bp); o.start(t); o.stop(t+L+0.03); ss.push(o);
      });
      return ss;
    }
    /* ── 옛 소리 (window._cgo드럼3판 = false 일 때) ── */
    var g0=ctx.createGain(); g0.connect(dest);
    var 길=(종==='snare')?0.20:((종==='ohat')?0.17:0.055);
    var n0=Math.max(1,Math.floor(ctx.sampleRate*길));
    var buf=ctx.createBuffer(1,n0,ctx.sampleRate), d0=buf.getChannelData(0);
    for(var i=0;i<n0;i++) d0[i]=(Math.random()*2-1)*Math.pow(1-i/n0, (종==='snare')?2.2:3.6);
    var src=ctx.createBufferSource(); src.buffer=buf;
    var hp=ctx.createBiquadFilter();
    hp.type=(종==='snare')?'bandpass':'highpass';
    hp.frequency.value=(종==='snare')?1900:7200;
    hp.Q.value=(종==='snare')?0.8:0.7;
    g0.gain.setValueAtTime(v*((종==='snare')?0.85:0.34),t);
    g0.gain.exponentialRampToValueAtTime(0.001,t+길+0.03);
    src.connect(hp); hp.connect(g0); src.start(t); src.stop(t+길+0.05); ss.push(src);
    if(종==='snare'){
      var o2b=ctx.createOscillator(); o2b.type='triangle'; o2b.frequency.value=195;
      var g2b=ctx.createGain(); g2b.gain.setValueAtTime(v*0.38,t);
      g2b.gain.exponentialRampToValueAtTime(0.001,t+0.11);
      o2b.connect(g2b); g2b.connect(dest); o2b.start(t); o2b.stop(t+0.14); ss.push(o2b);
    }
    return ss;
  }catch(e){ return []; }
}
function _mkChain(ctx,dest){
var ch_cv549=null;
var inp=ctx.createGain(); inp.gain.value=0.9;
var comp=ctx.createDynamicsCompressor();
comp.threshold.value=-18; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.2;
var out=ctx.createGain();
/* cgo-548 : 좌우로 벌리면 가운데서 겹쳐 더해지던 힘이 흩어져 **2.1dB 작아진다**(재 봤다).
   잃은 만큼만 여기서 돌려놓는다. 좌우를 안 쓰는 브라우저에서는 1 그대로 — 안 커진다. */
out.gain.value = ((window._cgo좌우548!==false) && typeof ctx.createStereoPanner==='function') ? 1.05 : 1;   /* cgo-549 : 같은 곡으로 재서 맞춘 값 — 전과 같은 크기 */
inp.connect(comp); comp.connect(out);
try{
/* ═══ cgo-549 (2026-10-11) : 울림을 **제대로** 만들고 자리마다 다르게 보낸다 ═══
   파트너 — "에코를 100% 안 잡았다면 한 5%만 주 악기와 배경 악기에 넣으면 어떨까요"
   ⚠️ 먼저 바로잡을 것 — 지금도 울림은 **있었다.** 0.18(18%)로 적혀 있었다.
      그런데 **재 보니 실제로 나오는 건 2%** 였다. 적힌 값과 나오는 값이 달랐다.
      까닭은 울림을 `(1-i/len)³` 로 깎은 것. 세제곱이라 **0.4초면 이미 죽는다.**
      파트너 귀가 "0%같다"고 한 게 맞았다. 숫자만 크고 소리가 안 났다.
   【고친 것】 자연스러운 줄어듦(RT60) + 앞 12ms 를 천천히 열어 '찰싹' 없애기.
      긴 음으로 재니 RT 1.6초 · 보냄 0.35 에서 꼬리 **5.2%** — 파트너가 말한 그 값이다.
   【자리마다 다르게】 모두에게 5%를 주면 안 된다. 베이스에 울림을 넣으면 뭉갠다.
      앞에 설 것은 적게, 뒤로 물러날 것은 많이 — 그래야 **앞뒤**가 생긴다.
      cgo-548 이 좌우를 만들었으니 이걸로 공간이 완성된다.
   끄기 : window._cgo울림549 = false */
var _RT549 = 1.6;
var sr=ctx.sampleRate, len=Math.floor(sr*_RT549*1.1), ir=ctx.createBuffer(2,len,sr);
for(var c=0;c<2;c++){
  var dd=ir.getChannelData(c);
  for(var i=0;i<len;i++){
    var _t549=i/sr;
    var _열림=(_t549<0.012)?(_t549/0.012):1;          /* 앞 12ms — 찰싹 소리를 없앤다 */
    dd[i]=(Math.random()*2-1)*Math.pow(10,-3*_t549/_RT549)*_열림;
  }
}
var cv=ctx.createConvolver(); cv.buffer=ir;
var wet=ctx.createGain(); wet.gain.value=1.0;        /* 양은 자리마다 따로 보낸다 */
cv.connect(wet); wet.connect(out);
ch_cv549 = cv;
/* 옛 브라우저(좌우를 못 쓰는 곳)나 꺼 놓았을 때만 — 전처럼 옅은 바탕 울림.
   ⚠️ 이걸 늘 걸면 자리별 울림 **위에 한 겹 더** 얹혀 두 번 들어간다. 그래서 조건을 둔다. */
if(typeof ctx.createStereoPanner!=='function' || window._cgo좌우548===false || window._cgo울림549===false){
  var _밑울림549=ctx.createGain(); _밑울림549.gain.value=0.14;
  comp.connect(_밑울림549); _밑울림549.connect(cv);
}
}catch(ex){}
out.connect(dest);
return {inp:inp,out:out,cv:ch_cv549};
}
/* ═══ cgo-548 (2026-10-11) : **좌우로 벌린다** ═══
   파트너 — "배경 음악이 조금 허접한 생각이 드는데"
   재 보니 악보 연주 길(12,100~14,000줄)에 좌우 나누는 것이 **하나도 없었다.**
   열두 겹이 전부 **한가운데 한 점**에서 나오고 있었다. 그래서 납작하게 들린다.
   진짜 녹음실에서는 악기마다 제 자리가 있다 — 베이스와 킥은 가운데,
   화음은 왼쪽, 현악은 오른쪽, 깔개는 넓게. 그것만 해도 「넓다」가 생긴다.
   ⚠️ 음표를 더 넣는 게 아니라 **있는 음표를 제자리에 놓는 일**이라 폰이 더 힘들지 않다.
      붙이는 것은 음표당 panner 하나가 아니라 **자리마다 버스 하나**다 (많아야 열 개).
   끄기 : window._cgo좌우548 = false
   ⚠️ 옛 브라우저에 createStereoPanner 가 없으면 **그냥 전처럼** 가운데로 간다. */
var _panSeq548 = 0;
function _자리548(n){
  try{
    /* ⚠️ cgo-548 처음 짤 때 화음을 **통째로 왼쪽(-0.38)** 에 놓았다.
       재 보니 왼쪽 46 · 오른쪽 30 으로 쏠렸다. 한쪽으로 쏠리면 넓어지는 게 아니라
       기울어진다. 진짜 녹음실은 **한 화음의 세 음을 좌·가운데·우로 흩는다.**
       그래야 넓어지면서도 가운데가 안 빈다. 음 이름으로 자리를 정하니 늘 같은
       음은 늘 같은 자리에 있다 — 화음이 바뀌어도 자리가 춤추지 않는다. */
    if(n._드) return (n._드==='hat') ? 0.32 : (n._드==='ohat') ? -0.26 : 0;  /* 킥·스네어는 가운데 */
    if(n._베) return 0;                                              /* 베이스는 가운데 — 옮기면 안 된다 */
    if(n._깔){                                                       /* 깔개 — 가장 넓게 */
      var m0=_n2m(n.name); return [-0.72, 0.08, 0.72][((m0%3)+3)%3];
    }
    if(typeof n._악==='number'){                                     /* cgo-534 편성 */
      var g=n._악;
      if(g>=40 && g<=51) return 0.44;                                /* 현악 → 오른쪽 */
      if(g>=56 && g<=63) return -0.34;                               /* 금관 → 왼쪽 */
      if(g>=64 && g<=79) return 0.56;                                /* 목관·색소폰 → 오른쪽 바깥 */
      return -0.20;
    }
    if(n._반){                                                       /* 화음 — 세 음을 흩는다 */
      var m1=_n2m(n.name); return [-0.46, -0.04, 0.42][((m1%3)+3)%3];
    }
  }catch(_){}
  return 0;                                                          /* 가락은 가운데 */
}
/* ═══ cgo-550 (2026-10-11) : **편곡 상자** — 겹마다 크기와 울림을 따로 ═══
   파트너 — "주 음 외에 화음·베이스 등 몇 칸까지 되나요. 사용자가 맞추게는 못 하나요.
             소리뿐 아니라 에코도 넣을 수는 없나요. 지금은 빈약해요"
   세어 보니 우리 연주에 실제로 소리 내는 겹은 **여덟**이다. 그런데 손잡이는
   음색 세 칸과 크기 **한 개**뿐이었다. 화음을 올리면 베이스와 깔개가 같이 올라갔다.
   올리고 싶은 것만 못 올리는 것 — 그게 "빈약하다"의 큰 몫이었다.
   【지금 하는 것】 겹마다 문을 하나씩 둔다. 문마다 크기와 울림을 따로 쥔다.
      ⚠️ 음표마다가 아니라 **겹마다** 문 하나다. 많아야 여덟 개 — 폰이 더 힘들지 않다.
      ⚠️ 기본값은 **자동**이다. 아무것도 안 건드려도 제 소리가 난다.
         손님이 매번 맞춰야 하는 건 기능이 아니다 — 바꾸고 싶은 사람만 바꾼다.
   끄기 : window._cgo편곡550 = false */
var _값550 = window._cgo편곡값550 = (window._cgo편곡값550 || {
  /*            크기    울림   (울림은 울림통으로 보내는 양) */
  가락:   { 크기:1.00, 울림:0.15 },
  화음:   { 크기:0.34, 울림:0.29 },
  베이스: { 크기:0.46, 울림:0.00 },   /* 베이스에 울림을 넣으면 저음이 뭉갠다 */
  깔개:   { 크기:0.22, 울림:0.49 },
  현악:   { 크기:0.40, 울림:0.39 },
  브라스: { 크기:0.30, 울림:0.39 },
  대선율: { 크기:0.28, 울림:0.39 },
  /* cgo-556 : 드럼 0.40 → 0.72.
     파트너 — "주가 피아노 소리지만 드럼 소리의 역할이 거의 없는 것 같은데요"
     0.40 은 **옛 드럼**에 맞춰 잡은 값이다. 옛 드럼은 아주 낮은 데가 부풀어
     있어서 더 올리면 뭉갰다. 가운데를 채운 지금 소리는 그렇지 않다.
     앱을 실제로 녹음해 재니 0.40 에서는 새 소리가 거의 안 드러났고
     (1.2~6kHz 변화 −0.5~+0.3dB), 0.72 에서 제자리를 찾았다.
     ⚠️ 전체 크기는 안 커진다 — 녹음해 재니 옛것보다 +0.5dB 였다.
     손님이 바꾸고 싶으면 편곡 손잡이(🥁)로 언제든 움직인다. */
  드럼:   { 크기:0.72, 울림:0.20 }
});
var _처음값550 = JSON.parse(JSON.stringify(_값550));
var _역할차례550 = ['가락','화음','베이스','깔개','현악','브라스','대선율','드럼'];
var _역할그림550 = { 가락:'🎹', 화음:'🎼', 베이스:'🎸', 깔개:'🌫',
                     현악:'🎻', 브라스:'🎺', 대선율:'🎶', 드럼:'🥁' };
function _역할550(n){
  try{
    if(n._드) return '드럼';
    if(n._베) return '베이스';
    if(n._깔) return '깔개';
    if(typeof n._악==='number'){
      var g=n._악;
      if(g>=56 && g<=63) return '브라스';
      if(g>=64 && g<=79) return '대선율';
      return '현악';
    }
    if(n._반) return '화음';
  }catch(_){}
  return '가락';
}
var _panSeq550 = 0;
function _버스548(ctx, ch, n, 기본){      /* 이름은 그대로 — 부르는 쪽을 안 건드리려고 */
  try{
    if(window._cgo편곡550 === false) return 기본;
    if(typeof ctx.createStereoPanner !== 'function') return 기본;
    var 역 = _역할550(n);
    if(!ch._문550) ch._문550 = {};
    /* ───── 비키기 문 (cgo-556) — **기본 꺼짐** ─────
       파트너가 귀로 고른 것은 비키기 **없는** 쪽이다. 그래서 꺼 둔다.
       ⚠️ 꺼져 있을 때는 문을 **아예 만들지 않는다.** 가만히 있는 문이라도
          소리가 지나가면 길이 달라진다 — 안 고른 것은 길에서 치운다.
       켜기 : window._cgo비키기556 = true */
    var 비킴켜짐 = (window._cgo비키기556 === true);
    if(비킴켜짐 && !ch._비킴){
      ch._비킴 = ctx.createGain(); ch._비킴.gain.value = 1; ch._비킴.connect(기본);
      if(ch.cv){ ch._비킴울 = ctx.createGain(); ch._비킴울.gain.value = 1; ch._비킴울.connect(ch.cv); }
      ch._비킴끝 = 0;
    }
    var 드럼이냐 = (역 === '드럼');
    var 나갈데 = (비킴켜짐 && !드럼이냐) ? ch._비킴 : 기본;
    var 울데   = (비킴켜짐 && !드럼이냐) ? (ch._비킴울 || ch.cv) : ch.cv;
    var 문 = ch._문550[역];
    if(!문){
      var v = _값550[역] || { 크기:1, 울림:0 };
      var 입 = ctx.createGain(); 입.gain.value = 1;
      var 크 = ctx.createGain(); 크.gain.value = v.크기;
      입.connect(크);
      var 자 = _자리548(n);
      if(자){ var pn = ctx.createStereoPanner(); pn.pan.value = 자; 크.connect(pn); pn.connect(나갈데); }
      else 크.connect(나갈데);
      var 울 = null;
      if(울데){ 울 = ctx.createGain(); 울.gain.value = v.울림; 입.connect(울); 울.connect(울데); }
      문 = ch._문550[역] = { 입:입, 크:크, 울:울 };
      /* 손잡이를 밀면 **지금 울리는 소리가 바로** 바뀌어야 귀로 맞출 수 있다 */
      try{ (window._cgo살아있는문550 = window._cgo살아있는문550 || []).push({ 역:역, 문:문 }); }catch(_){}
    }
    /* 깔개가 자리를 음마다 흩으므로, 자리만 음표마다 다시 잡아 준다 */
    try{
      var 자2 = _자리548(n);
      if(자2 && 문.크.numberOfOutputs){ /* 이미 이은 자리를 그대로 쓴다 */ }
    }catch(_){}
    return 문.입;
  }catch(_){ return 기본; }
}
/* ═══════════════════════════════════════════════════════════════════════
   JURAN · 비키기 (cgo-556) — 키우지 않고 자리를 만든다 · **기본 꺼짐**
   ───────────────────────────────────────────────────────────────────────
   사람 귀는 같은 때에 두 소리가 겹치면 **큰 쪽만 듣는다.** 그래서 드럼이
   피아노에 가려진다. 킥·스네어가 칠 때 다른 악기를 0.14초 동안 아주 살짝
   (−3.3dB) 내리면, 드럼을 **한 톨도 안 키우고** 또렷해진다.

   【왜 꺼 두나】 앱을 실제로 녹음해 세 벌을 들려 드렸더니, 파트너가 고른 것은
     **비키기 없는 쪽**이었다. 숫자로는 비키기가 맞는 길인데 귀가 아니라고 했다.
     **사람 귀가 이긴다.** 지우지 않고 꺼 둔다 — 나중에 드럼이 바뀌면 다시 잴 수 있다.

   ⚠️ 고리를 돌지 않는다. 음표를 예약할 때 **그 자리에서 한 번** 적어 둘 뿐이라
      특허 기능(보이는 것만 살리기)과 메인 스레드를 다투지 않는다.
   ⚠️ 이미 비켜 있는 동안 또 치면 겹쳐 적지 않는다 — 적는 차례가 엉키면
      브라우저가 앞의 것을 잘라먹는다.
   켜기 : window._cgo비키기556 = true    깊이 : window._cgo비킴깊이556 (0.2~1)
   ═══════════════════════════════════════════════════════════════════════ */
function _비키기556(ch, t){
  try{
    if(window._cgo비키기556 !== true) return;
    if(!ch || !ch._비킴) return;
    if((ch._비킴끝 || 0) > t) return;          /* 아직 비켜 있다 — 덧적지 않는다 */
    var 깊 = window._cgo비킴깊이556;
    if(typeof 깊 !== 'number' || !(깊 > 0.2) || !(깊 < 1)) 깊 = 0.68;
    var 문들 = [ch._비킴, ch._비킴울];
    for(var i=0;i<문들.length;i++){
      var g = 문들[i]; if(!g) continue;
      try{
        g.gain.setValueAtTime(1, Math.max(0, t-0.004));
        g.gain.linearRampToValueAtTime(깊, t+0.012);
        g.gain.linearRampToValueAtTime(1,  t+0.14);
      }catch(_){}
    }
    ch._비킴끝 = t + 0.14;
  }catch(_){}
}
/* 손잡이가 움직이면 지금 울리는 문들에 바로 먹인다 */
function _손잡이550(역, 무엇, 값){
  try{
    if(!_값550[역]) return;
    _값550[역][무엇] = 값;
    var L = window._cgo살아있는문550 || [];
    for(var i=0;i<L.length;i++){
      if(L[i].역 !== 역) continue;
      var f = L[i].문;
      try{
        if(무엇==='크기' && f.크) f.크.gain.setTargetAtTime(값, f.크.context.currentTime, 0.03);
        if(무엇==='울림' && f.울) f.울.gain.setTargetAtTime(값, f.울.context.currentTime, 0.03);
      }catch(_){}
    }
  }catch(_){}
}
try{ window._cgo손잡이550=_손잡이550; }catch(_){}
/* cgo-524 : 악기를 칸으로 받는다. 안 주면 전처럼 가락 악기(synthPW)를 쓴다.
   파트너 — "그냥 우리 악보 악기 하나로만 되나요?"
   되게 만들었다. 바이올린을 고르면 **베이스와 반주까지 바이올린**이 되던 것을 가른다. */
/* ───────── cgo-531 : 셈여림 ─────────────────────────────────────────────
   악보에는 `mp` `mf` `f` 가 **이미 찍혀 있었다.** 그런데 소리 내는 쪽이 안 봤다 —
   음표 천 개가 전부 `.7` 한 값으로 났다. 그래서 기계가 치는 것처럼 들렸다.
   사람은 첫 박을 세게, 뒷박을 여리게, 후렴에서 올리고 간주에서 내린다.
   ⚠️ 넣을 값은 전부 **이미 앱 안에 있었다.** 새로 만든 자료가 하나도 없다 —
      박 자리(`beat`) · 구간(`sectionStarts`) · 감정선(`emotionArc`).
      `emotionArc` 는 BALLAD_DNA 에 들어 있으면서 **한 번도 안 쓰이고 있었다.**
   ⚠️ 새 고리를 안 얹는다. 음표 하나 날 때 한 번 세는 것뿐이라 특허 기능과 안 부딪친다.
   끄려면 콘솔에 `window._cgo셈여림531 = false`                               */
var _구간캐시531=null, _구간때531=0;
function _구간531(bar){
  try{
    if(!_구간캐시531 || Date.now()-_구간때531>3000){
      _구간캐시531=[];
      var _ss=(typeof sectionStarts!=='undefined')?sectionStarts:null;
      if(_ss) Object.keys(_ss).forEach(function(k){ _구간캐시531.push([parseInt(k,10), String(_ss[k]||'')]); });
      _구간캐시531.sort(function(a,b){ return a[0]-b[0]; });
      _구간때531=Date.now();
    }
    var cur='';
    for(var i=0;i<_구간캐시531.length;i++){
      if(_구간캐시531[i][0]<=bar) cur=_구간캐시531[i][1]; else break;
    }
    return cur.toLowerCase();
  }catch(_){ return ''; }
}
function _세기531(n){
  if(!n || window._cgo셈여림531===false) return 0.70;
  /* ⚠️ 바탕값이 0.70 이면 아래 더하기들 때문에 곡 전체 평균이 0.80 으로 **올라간다.**
     그러면 손님 귀에는 「표현이 살았다」가 아니라 **「그냥 커졌다」**로 들린다.
     0.60 으로 내려 평균을 0.70 에 맞춘다 — 전체 크기는 그대로, 사이만 벌어진다. */
  var v=0.60;
  try{
    var bpb=n.bpb||4, b=(n.beat||0)%bpb;
    /* ① 박 자리 — 첫 박이 가장 세다 */
    if(b<0.01) v+=0.13;
    else if(Math.abs(b-Math.floor(bpb/2))<0.01) v+=0.05;
    else if(Math.abs(b-Math.round(b))>0.01) v-=0.06;      /* 박 사이(엇박) 음은 여리게 */
    else v-=0.02;
    /* ② 구간 — 후렴에서 올리고 전주·후주에서 내린다 */
    var sc=_구간531(n.bar||0);
    if(sc.indexOf('chorus')>=0||sc.indexOf('후렴')>=0) v+=0.14;
    else if(sc.indexOf('final')>=0) v+=0.10;
    else if(sc.indexOf('bridge')>=0) v+=0.05;
    else if(sc.indexOf('intro')>=0||sc.indexOf('outro')>=0) v-=0.12;
    /* ③ 감정선 — 곡 전체에 걸친 네 점을 사이 메워 쓴다 */
    var 총=0; try{ 총=(window._cgo악보판&&window._cgo악보판.totBars)||0; }catch(_){}
    var arc=(window._cgoDNAMix&&window._cgoDNAMix.emotionArc)||null;
    if(arc&&arc.length===4&&총>1){
      var x=Math.max(0,Math.min(1,(n.bar||0)/(총-1)))*3;
      var i0=Math.min(2,Math.floor(x)), f=x-i0;
      v += (arc[i0]*(1-f)+arc[i0+1]*f - 0.55)*0.16;
    }
    /* ④ 긴 음은 조금 더 실어서 */
    if((n.dur||1)>=2) v+=0.04;
    /* ⑤ 사람은 똑같이 못 친다 */
    v += (Math.random()-0.5)*0.05;
    /* ⑥ 반주는 가락보다 한 걸음 뒤에 */
    if(n._반) v*=0.85;
  }catch(_){}
  return Math.max(0.35, Math.min(1.00, v));
}

/* ───────── cgo-532 : 진짜 악기 녹음으로 소리 내기 ────────────────────────
   계산으로 만든 소리는 배음 봉우리가 8개, 진짜 피아노는 19개다. 재서 견주었다.
   망치가 줄을 때리는 소리 · 나무통 울림 · 옆 줄이 따라 우는 소리는 계산으로 안 나온다.
   그래서 **녹음한 소리**를 쓴다. 16가지 × 17음(3반음 간격) = 4.4MB, `cgo-sound.js`.
   바탕 : FluidR3_GM (MIT 허가) — 장사에 써도 되고 돈이 안 든다.

   ⚠️ 음높이는 **±1.5반음** 안에서만 옮긴다 (3반음마다 녹음이 있으므로).
      그 정도면 사람 귀에 거의 안 걸린다. 더 옮기면 다람쥐가 된다.
   ⚠️ 통이 없거나 아직 안 풀렸으면 **그냥 옛 소리로 난다.** 앱이 멈추지 않는다.
   ⚠️ 새 고리를 안 얹는다 — 음 하나 날 때 한 번 꺼내 놓는 것뿐이다.
   끄려면 콘솔에 `window._cgo진짜악기532 = false`                              */
var _푼것532 = {};        /* 악기 → {midi:AudioBuffer} */
var _푸는중532 = {};
function _알림538(악기, box){            /* cgo-538 : 다 풀렸다고 적어 둔 사람들에게 알린다 */
  try{ var L=window._줄선538&&window._줄선538[악기]; if(!L) return;
       window._줄선538[악기]=null;
       for(var i=0;i<L.length;i++){ try{ L[i](box); }catch(_){} } }catch(_){}
}
function _악기풀기532(악기, 끝나면){
  try{
    if(window._cgo진짜악기532===false) return null;
    var 통=window._cgo소리통532; if(!통) return null;
    var g=통[악기]; if(!g) return null;
    if(_푼것532[악기]){ if(끝나면) try{끝나면(_푼것532[악기]);}catch(_){} return _푼것532[악기]; }
    /* cgo-538 : 푸는 데 한 번은 시간이 걸린다. 끝나면 알려 달라고 적어 둔다
       (고리를 돌며 묻지 않는다 — cgo-514 와 같은 생각이다) */
    if(!window._줄선538) window._줄선538={};
    if(끝나면){ (window._줄선538[악기]=window._줄선538[악기]||[]).push(끝나면); }
    if(_푸는중532[악기]) return null;
    _푸는중532[악기]=1;
    var ctx=_liveCtx(); if(!ctx){ _푸는중532[악기]=0; return null; }
    var box={}; var keys=Object.keys(g); var left=keys.length;
    keys.forEach(function(k){
      try{
        var bin=atob(g[k]); var ab=new ArrayBuffer(bin.length); var u=new Uint8Array(ab);
        for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
        ctx.decodeAudioData(ab, function(buf){ box[k]=buf; if(--left<=0){ _푼것532[악기]=box; _알림538(악기,box); } },
                                 function(){ if(--left<=0){ _푼것532[악기]=box; _알림538(악기,box); } });
      }catch(e){ if(--left<=0){ _푼것532[악기]=box; _알림538(악기,box); } }
    });
    return null;                       /* 푸는 동안은 옛 소리로 난다 */
  }catch(e){ return null; }
}
/* ═══════════════════════════════════════════════════════════════════════
   JURAN · 여운 살리기 — 때리고 뜯는 악기는 손을 떼도 운다
   ───────────────────────────────────────────────────────────────────────
   【무엇이 잘못돼 있었나】
     음표가 끝나면 0.24초 안에 소리를 꺼 버렸다. 활로 켜는 악기는 그게 맞다 —
     활을 떼면 소리가 멈추니까. 그런데 **피아노·기타는 손을 떼도 줄이 운다.**

   【재 본 것】 녹음이 저절로 작아져 −20dB 에 닿기까지
       피아노 1.47초 · 통기타 1.68초 · 일렉기타 1.81초 · 비브라폰 1.33초
     그런데 8분음표(0.375초)를 치면 녹음이 품은 소리 가운데
       피아노 56% · 일렉기타 63% · 비브라폰 67% 만 나왔다.
     16분음표면 피아노는 **38%** 다. 나머지는 잘려 나갔다.
     답답하고 플라스틱 같은 소리가 나던 까닭이다.

   【고친 것】 아래 표에 든 악기만, 음표가 끝난 **뒤부터** 제 길이대로 잦아들게 둔다.
     표에 없는 악기(현악·관악·오르간·합창)는 **한 글자도 안 바뀐다.**

   【크기】 소리가 커지지 않는다. 같은 가락으로 재니 고른세기가 그대로였고
     (−20.7dB), 오히려 0.68dB 낮춰 맞춰야 했다. 안 들리던 꼬리가 들릴 뿐이다.

   끄기 : window._cgo여운555 = false
   ═══════════════════════════════════════════════════════════════════════ */
var _여운555 = {
  /* 때리는 것 */
  piano:1.4, bright_acoustic_piano:1.4, electric_piano_1:1.2, electric_piano_2:1.2,
  harpsichord:1.3, celesta:0.7, music_box:0.65, glockenspiel:0.36, vibraphone:1.3,
  kalimba:0.2, steel_drums:0.5, timpani:0.24,
  /* 뜯는 것 */
  acoustic_guitar:1.6, acoustic_guitar_nylon:0.9, electric_guitar_clean:1.6,
  electric_guitar_jazz:1.5, orchestral_harp:0.9, banjo:0.55, koto:0.48, sitar:0.95,
  pizzicato_strings:0.3, acoustic_bass:0.6
  /* ⚠️ 일부러 뺀 것 —
       · 현악·관악·오르간·합창·색소폰 : 활·숨을 떼면 멈춘다. 여운을 주면 뭉갠다.
       · 전기베이스·슬랩베이스 : 낮은 소리를 길게 끌면 아래가 흐려진다.
       · distortion/overdriven 기타 : 녹음 자체가 끌리는 소리라 이미 길다. */
};
function _샘플532(ctx,dest,악기,hz,t,durSec,세기){
  try{
    if(window._cgo진짜악기532===false) return null;
    var box=_푼것532[악기] || _악기풀기532(악기);
    if(!box) return null;
    var m=69+12*Math.log(hz/440)/Math.LN2;
    var best=null,bd=99;
    for(var k in box){ var d=Math.abs(m-(+k)); if(d<bd){ bd=d; best=k; } }
    if(best===null || bd>3.2) return null;
    var buf=box[best]; if(!buf) return null;
    var src=ctx.createBufferSource(); src.buffer=buf;
    src.playbackRate.value = Math.pow(2,(m-(+best))/12);
    var g=ctx.createGain();
    var v=Math.max(0.05,Math.min(1.2,(세기||0.7)*1.15));
    var 끝=t+durSec;
    var 여555 = (window._cgo여운555===false) ? 0 : (_여운555[악기]||0);
    if(여555 > 0){
      /* 음표가 끝나는 그 자리까지 제 크기로 가다가, 거기서부터 잦아든다.
         녹음보다 길게 울 수는 없으니 멈추는 자리를 막아 둔다. */
      var 남555 = (buf.duration / (src.playbackRate.value||1)) - durSec;
      if(남555 < 0.05) 여555 = 0.05; else if(여555 > 남555) 여555 = 남555;
      g.gain.setValueAtTime(v,t);
      g.gain.setValueAtTime(v,Math.max(t+0.01,끝));
      g.gain.exponentialRampToValueAtTime(0.0008, 끝+여555);
      src.connect(g); g.connect(dest);
      src.start(t); src.stop(끝+여555+0.05);
      return [src];
    }
    g.gain.setValueAtTime(v,t);
    g.gain.setValueAtTime(v,Math.max(t+0.01,끝-0.06));
    g.gain.exponentialRampToValueAtTime(0.0008, 끝+0.18);   /* 자연스럽게 놓는다 */
    src.connect(g); g.connect(dest);
    src.start(t); src.stop(끝+0.25);
    return [src];
  }catch(e){ return null; }
}
/* cgo-538 : 추첨통 쪽에서도 이 녹음을 쓴다 — 통은 하나뿐, 두 번 풀지 않는다 */
try{ window._cgo샘플532=_샘플532; window._cgo악기풀기532=_악기풀기532; }catch(_){}

/* cgo-524 : 악기를 칸으로 받는다 · cgo-531 : 음표를 받아 세기를 정한다 */
function _voice(ctx,dest,name,t,durSec,악기,음표){
var hz=440*Math.pow(2,(_n2m(name)-69)/12);
var ss=[];
var _악524=악기||synthPW;
var _셈531=_세기531(음표);
/* cgo-533 : 드럼은 계산으로 따로 낸다 (TR-808 처럼) */
if(음표&&typeof 음표._세==='number') _셈531=Math.max(0.05,Math.min(1.2,_셈531*음표._세/0.7));
if(음표&&음표._드) return _드럼소리533(ctx,dest,음표._드,t,_셈531);
if(음표&&음표._악){
  var _r534=_샘플532(ctx,dest,음표._악,hz,t,durSec,_셈531);
  if(_r534) return _r534;
  _악524=음표._악;
}
/* cgo-533 : 깔개는 현악으로 길게, 여리게 */
if(음표&&음표._깔) return _샘플532(ctx,dest,'string_ensemble',hz,t,durSec,_셈531*깔개세기533)
                  || _샘플532(ctx,dest,_악524,hz,t,durSec,_셈531*깔개세기533) || [];
var _진532=_샘플532(ctx,dest,_악524,hz,t,durSec,_셈531);
if(_진532) return _진532;
try{ if(typeof window._cgoPWVoice==='function') ss=window._cgoPWVoice(ctx,dest,_악524,hz,t,durSec,_셈531)||[]; }catch(ex){ ss=[]; }
if(ss.length) return ss;
try{
var o=ctx.createOscillator(), g=ctx.createGain();
o.type='sine'; o.frequency.value=hz;
var _pk531=0.5*(_셈531/0.70);            /* cgo-531 : 되돌아가는 길도 세기를 따른다 */
g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(_pk531,t+0.02);
g.gain.setValueAtTime(_pk531,Math.max(t+0.03,t+durSec-0.05)); g.gain.exponentialRampToValueAtTime(0.0001,t+durSec+0.1);
o.connect(g); g.connect(dest); o.start(t); o.stop(t+durSec+0.15);
return [o];
}catch(ex){ return []; }
}
function _liveCtx(){
var c=(typeof window._cgoGetACtx==='function')?window._cgoGetACtx():null;
if(!c){ if(!window._cgoScoreCtx) window._cgoScoreCtx=new (window.AudioContext||window.webkitAudioContext)(); c=window._cgoScoreCtx; }
return c;
}
function _hl(bar){
PB.bar=bar;
/* cgo-536 : 곡이 날 때도 마디를 밝히려고 바깥에 내놓는다 */
try{ window._cgo마디밝히기536=_hl; window._cgo총마디536=totBars; }catch(_){}
try{ var old=canvasWrap.querySelector('#cgo-sc-hl'); if(old) old.parentNode.removeChild(old); }catch(ex){}
if(bar<0||!_curSvg||bar>=totBars) return;
var row=Math.floor(bar/BPR), bx=LM+(bar%BPR)*BAR_W, sTopH=row*RH+8+ST;
var r=mk('rect',{id:'cgo-sc-hl',x:bx+1,y:sTopH-14,width:BAR_W-2,height:4*LGAP+28,rx:4,
fill:PB.mode==='part'?'rgba(139,92,246,.2)':'rgba(59,130,246,.1)'});
r.style.pointerEvents='none';
_curSvg.insertBefore(r,_curSvg.childNodes[1]||null);
}

/* ═══ cgo-537 (2026-10-10) : 곡이 날 때도 **음표 하나하나에 불**이 켜진다 ═══
   파트너 — "수노 악보 보세요. 마디 표시 있고 음표 하나 하나 또 정해져 있어여.
             수노 참고해서 보세요"

   ⚠️ 새로 만든 것이 아니다. 수노 악보 쪽에는 **이미 돌고 있었다** (cgo-514).
      나는 그걸 만들어 놓고 **곡 쪽에는 안 이었다.** cgo-536 에서는 마디 띠만
      0.25초마다 들여다보는 거친 고리를 새로 얹었고, 음표 불은 아예 없었다.
      이 판에서 하는 일은 **수노 쪽과 똑같은 방식을 곡 쪽에 잇는 것**뿐이다.
      → ④장에 적어 둔 내 흠 그대로다 : "만들어 놓고 앱에 안 꽂는다."

   【cgo-512 의 무덤 — 왜 1초에 60번 도는 고리는 안 되는가】
     cgo-505 에서 음표마다 불을 켜려고 requestAnimationFrame(1초 60번)을 얹었다.
     그 고리가 메인 스레드를 물고 있어서 **특허 기능(화면 아래 아껴 그리기)이
     돌 틈을 잃고 앱이 멈췄다.** cgo-512 에서 통째로 지웠다.

   【cgo-514 가 찾은 길 — 묻지 않고 예약한다】
     음표가 울릴 시각은 **이미 안다** (마디 길이 × 몇 박째). 그러니 "지금이야?"
     라고 1초에 60번 물을 까닭이 없다. **다음 음표 시각에 자명종 하나를 맞추고
     잔다.** 깨는 횟수 = 음표 수 ÷ 곡 길이 ≒ **1초에 두세 번.**
     cgo-536 의 0.25초 고리(1초 네 번)보다 **오히려 적게 깬다.**
     그리고 깰 때마다 지금 시각으로 다시 셈하므로, 브라우저가 자명종을 늦게
     울려도 **스스로 제자리를 찾는다.**

   【깬 김에 마디 띠도 같이 손본다】
     띠(_hl)를 따로 돌리지 않는다. 음표 불이 깰 때 같이 켠다 — **공짜다.**
     그래서 cgo-536 의 setInterval 고리는 이 판에서 **없어진다.**
     고리 수는 늘지 않고 하나 줄고, 음표 불이 새로 생긴다.

   끄기 : window._음표불537 = false       (음표 불만 끄고 마디 띠는 둔다)
          window._cgo따라가기536 = false  (마디 띠까지 전부 끈다)             */
var _불el537=null, _잠537=0, _불idx537=-1;
var _때537=null, _마디초537=0, _끝초537=0, _막마디537=-1;
function _음표들537(){
  try{ var p=window._cgo악보판; return (p&&p.음표&&p.음표.length)?p.음표:null; }
  catch(e){ return null; }
}
function _불끄기537(){
  try{ if(_불el537&&_불el537.parentNode) _불el537.parentNode.removeChild(_불el537); }catch(e){}
  _불el537=null; _불idx537=-1;
}
function _불켜기537(i){
  var L=_음표들537(); if(!L||!L[i]||!_curSvg) return;
  _불끄기537();
  try{
    var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.id='cgo-nt-lit537';
    c.setAttribute('cx',L[i].x); c.setAttribute('cy',L[i].y); c.setAttribute('r',9);
    c.setAttribute('fill','rgba(124,58,237,.34)');   /* 수노 쪽(cgo-514)과 같은 색 */
    c.style.pointerEvents='none';
    _curSvg.appendChild(c);                          /* 맨 뒤 — 음표를 가리지 않는다 */
    _불el537=c; _불idx537=i;
  }catch(e){ _불el537=null; _불idx537=-1; }
}
function _그만537(){
  try{ if(_잠537) clearTimeout(_잠537); }catch(e){}
  _잠537=0; _때537=null; _막마디537=-1; _불끄기537();
  try{ _hl(-1); }catch(e){}
}
function _자기537(){
  try{ if(_잠537) clearTimeout(_잠537); }catch(e){}
  _잠537=0;
  if(!_때537) return;
  var t; try{ t=_때537(); }catch(e){ _그만537(); return; }   /* 곡이 끝났다 → 스스로 그만 */
  if(!(t>=0)) t=0;
  if(_끝초537>0 && t>_끝초537+0.3){ _그만537(); return; }
  var 한박537=_마디초537/4;
  /* ① 마디 띠 — 깬 김에 같이 (따로 고리를 돌리지 않는다) */
  var _b537=Math.floor(t/_마디초537);
  if(_b537!==_막마디537 && _b537>=0 && (!totBars||_b537<totBars)){
    _막마디537=_b537; try{ _hl(_b537); }catch(e){}
  }
  /* ② 음표 불 — 지금 울리는 음표를 가운데를 짚어 가며 찾는다 (76마디도 일곱 번) */
  var L=_음표들537(), 다음537=-1;
  if(L && window._음표불537!==false){
    if(_불el537 && _불el537.isConnected===false){ _불el537=null; _불idx537=-1; }  /* 악보를 다시 그렸다 */
    var lo537=0, hi537=L.length-1;
    while(lo537<=hi537){ var md537=(lo537+hi537)>>1;
      if(L[md537].b*한박537 > t+0.012){ 다음537=md537; hi537=md537-1; } else lo537=md537+1; }
    var cur537=(다음537<0)?(L.length-1):(다음537-1);
    if(cur537>=0){
      var 끝537=L[cur537].b*한박537 + 한박537*(L[cur537].d||0.5);
      if(t<끝537+0.15){ if(cur537!==_불idx537) _불켜기537(cur537); }
      else _불끄기537();
    } else _불끄기537();
  } else if(L){
    /* 음표 불을 껐어도 다음 음표 시각은 알아야 자명종을 맞춘다 */
    for(var _z537=0;_z537<L.length;_z537++){
      if(L[_z537].b*한박537>t+0.012){ 다음537=_z537; break; }
    }
  }
  /* ③ 다음 자명종 — 다음 음표 시각, 음표가 다 떨어지면 다음 마디 첫 박 */
  var 쉴537;
  if(다음537>=0) 쉴537=(L[다음537].b*한박537-t)*1000;
  else           쉴537=((_b537+1)*_마디초537-t)*1000;
  if(_끝초537>0 && !(다음537>=0) && t>_끝초537-0.05){ _그만537(); return; }
  _잠537=setTimeout(_자기537, Math.max(40, Math.min(1000, 쉴537)));
}
try{
  /* 곡 쪽에서 부른다. getT() 는 곡이 시작한 뒤 몇 초째인지 돌려주고,
     곡이 끝났으면 던진다(throw) — 그러면 여기서 스스로 그만둔다. */
  window._cgo곡따라537=function(getT, 마디초, 총초){
    _그만537();
    if(typeof getT!=='function') return false;
    _마디초537=(마디초>0.2)?마디초:2.0;
    _끝초537=(총초>0)?총초:0;
    _때537=getT; _막마디537=-1;
    _자기537();
    return true;
  };
  window._cgo곡그만537=_그만537;
  if(typeof window._음표불537==='undefined') window._음표불537=true;
}catch(_e537){}
function _syncBtns(){
if(_bAll) _bAll.style.background =(PB.playing&&PB.mode==='all') ?'#1d4ed8':'#3b82f6';
if(_bPart) _bPart.style.background=(PB.playing&&PB.mode==='part')?'#6d28d9':'#8b5cf6';
if(_bStop) _bStop.style.background=PB.playing?'#ef4444':'#6b7280';
}
function _flash(msg){
if(!_scMsg) return;
_scMsg.textContent=msg; _scMsg.style.display=msg?'block':'none';
clearTimeout(_scMsg._t); if(msg) _scMsg._t=setTimeout(function(){ if(_scMsg){ _scMsg.style.display='none'; } },2800);
}
window._cgoScoreStop=function(){
PB.timers.forEach(function(t){ clearTimeout(t); }); PB.timers=[];
var out=PB.out, ss=PB.srcs; PB.out=null; PB.srcs=[];
if(out){ try{ var n0=out.context.currentTime; out.gain.cancelScheduledValues(n0); out.gain.setValueAtTime(out.gain.value,n0); out.gain.linearRampToValueAtTime(0,n0+0.04); }catch(ex){} }
setTimeout(function(){
ss.forEach(function(s){ try{ s.onended=null; s.stop(); }catch(ex){} });
if(out){ try{ out.disconnect(); }catch(ex){} }
},60);
PB.playing=false; PB.mode='';
try{ if(typeof window._cgo곡그만537==='function') window._cgo곡그만537(); }catch(_){}   /* cgo-547 */
_hl(-1); _syncBtns();
};
function _stopOthers(){
window._cgoScoreStop();
try{ var _m=window._cgoMusicMod; if(_m&&typeof _m._stopAudio==='function') _m._stopAudio(); }catch(ex){}
try{ if(typeof window._cgoSrvStopPlayback==='function') window._cgoSrvStopPlayback(); }catch(ex){}
}
function _scPlay(mode){
_stopOthers();
var bar=-1, list;
if(mode==='part'){
bar=(selI>=0&&selI<eN.length)?eN[selI].bar:lastBar;
if(bar<0){ _flash('🎯 음표를 한 번 눌러 마디를 고른 뒤 ⏯ 부분을 누르세요'); return; }
lastBar=bar;
list=eN.filter(function(n){ return n.bar===bar&&n.name!=='R'; });
if(!list.length){ _flash('𝄽 '+(bar+1)+'마디에는 소리 나는 음이 없어요'); return; }
} else {
list=eN.filter(function(n){ return n.name!=='R'; });
if(!list.length){ _flash('🎼 재생할 음이 없어요'); return; }
}
/* cgo-523 : 반주를 가락 목록에 섞는다. 때 맞추는 길은 기존 것을 그대로 쓴다. */
try{
  var _반목523 = (mode==='part') ? _반주523(bar, bar+1) : _반주523(0, totBars);
  if(_반목523.length) list = list.concat(_반목523);
}catch(_e523){}
list.sort(function(a,b){ return _absBeat(a)-_absBeat(b); });
var ctx=_liveCtx(); if(!ctx) return;
var bSec=beatMs/1000;
var org=(mode==='part')?bar*(list[0].bpb||4):0; // 부분 = 그 마디 첫 박부터
var bpbU=(list[0].bpb||4);
var go=function(){
try{ window._cgo살아있는문550=[]; }catch(_){}   /* cgo-550 */
var ch=_mkChain(ctx,ctx.destination); PB.out=ch.out;
/* cgo-523 : 반주만 작게 — 따로 작은 문을 하나 만들어 그리로 보낸다 */
var _반문523=null;
try{ _반문523=ctx.createGain(); _반문523.gain.value=반주세기523; _반문523.connect(ch.inp); }catch(_){}
var base=ctx.currentTime+0.08, idx=0, endSec=0;
list.forEach(function(n){ endSec=Math.max(endSec,(_absBeat(n)-org)*bSec+(n.dur||1)*bSec); });
PB.playing=true; PB.mode=mode; _syncBtns();
if(mode==='part') _hl(bar);
/* cgo-547 : **음표 하나하나 불**도 같이 켠다 (cgo-537 자명종).
   파트너 — "수노처럼 음표 각 이동은 안 된다". 자명종은 만들어 뒀는데
   악보 연주 길에는 안 걸려 있었다. 또 '만들어 놓고 안 꽂은' 것이다.
   깨는 횟수는 음표 수 ÷ 곡 길이 ≒ 1초에 두세 번이라 연주를 방해하지 않는다. */
try{
  if(mode==='all' && typeof window._cgo곡따라537==='function')
    window._cgo곡따라537(function(){ return ctx.currentTime - base; }, bSec*bpbU, endSec+1.6);
}catch(_e547p){}
(function pump(){
if(!PB.playing||PB.out!==ch.out) return;
var now=ctx.currentTime;
while(idx<list.length && base+(_absBeat(list[idx])-org)*bSec < now+1.5){
var n=list[idx++];
var _밑548=ch.inp;   /* cgo-550 : 반주 크기는 이제 겹마다 따로 쥔다 */
var _때556=base+(_absBeat(n)-org)*bSec;
var ss=_voice(ctx,_버스548(ctx,ch,n,_밑548),n.name,_때556,(n.dur||1)*bSec,
               n._반?(n._베?베이스악기524:반주악기524):null, n);   /* cgo-531 : 음표를 넘긴다 · cgo-548 : 좌우 */
/* cgo-556 : 킥·스네어가 칠 자리에 「비키기」를 그때 한 번 적어 둔다 */
if(n._드==='kick' || n._드==='snare') _비키기556(ch, _때556);
for(var k=0;k<ss.length;k++) PB.srcs.push(ss[k]);
}
if(mode==='all'){
var cb=Math.floor(Math.max(0,(now-base)/bSec)/bpbU);
if(cb!==PB.bar && cb<totBars) _hl(cb);
}
if(now-base < endSec+1.6) PB.timers.push(setTimeout(pump,200));
else window._cgoScoreStop();
})();
};
if(ctx.state==='suspended'){ ctx.resume().then(go,go); } else { go(); }
}
/* ═══ cgo-547 (2026-10-11) : 곡 만들기도 **이 길로** 온다 ═══
   서버에 보내던 길은 6겹 · 셈여림 없음 · 편성 없음이고, 23MB 를 기다려야 하고, 자주 끊겼다.
   이 길(_scPlay)은 **12겹 · 셈여림 · 편성 · 진짜 악기 96가지**이고 기다림이 없다.
   파트너가 귀로 먼저 알아냈다 — "악보에서 재생하면 훨씬 음악같이 들린다".
   ⚠️ 미리 구워 두는 길은 재 보니 **78초**가 걸렸다. 그래서 안 굽는다.
      이 길은 200ms 마다 1.5초 앞까지만 깔면서 튼다 — 깔아 두는 값은 0.05초(낡은 폰 0.24초)다.
      같은 일을 180초에 걸쳐 나눠 하므로 기다림이 0 이 된다.
   끄기 : window._cgo폰에서547 = false   (그러면 전처럼 서버로 간다) */
try{
  window._cgo악보연주547 = function(){
    try{
      var _있나547 = eN && eN.filter(function(n){ return n.name!=='R'; }).length;
      if(!_있나547) return false;
      _scPlay('all');
      return PB.playing === true;
    }catch(e){ try{ console.warn('[cgo-547] 폰 연주 못 켬:', e && e.message); }catch(_){} return false; }
  };
}catch(_e547){}
function _encWav(ab){
var nc=ab.numberOfChannels, sr=ab.sampleRate, n=ab.length, chs=[], peak=0, i, c;
for(c=0;c<nc;c++){ var cd=ab.getChannelData(c); chs.push(cd); for(i=0;i<n;i++){ var a=Math.abs(cd[i]); if(a>peak) peak=a; } }
var g=peak>0?Math.min(4,.9/peak):1;
var buf=new ArrayBuffer(44+n*nc*2), v=new DataView(buf);
function ws(o,s){ for(var j=0;j<s.length;j++) v.setUint8(o+j,s.charCodeAt(j)); }
ws(0,'RIFF'); v.setUint32(4,36+n*nc*2,true); ws(8,'WAVE'); ws(12,'fmt ');
v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,nc,true); v.setUint32(24,sr,true);
v.setUint32(28,sr*nc*2,true); v.setUint16(32,nc*2,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,n*nc*2,true);
var o=44;
for(i=0;i<n;i++){ for(c=0;c<nc;c++){ var s=Math.max(-1,Math.min(1,chs[c][i]*g)); v.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; } }
return {blob:new Blob([buf],{type:'audio/wav'}),gain:g};
}
/* cgo-521 (2026-10-09) : 한 번 눌러 소리 파일 받기.
   파트너 — "MIDI를 QuickTime 없이 자동으로는 안 되나요, 다른 프로그램들은 되던데"
   웹 페이지는 받는 컴퓨터가 .mid 를 어느 프로그램에 넘길지 못 정한다. 아무도 못 한다.
   파트너가 본 그 프로그램들은 **MIDI 가 아니라 소리(mp3·wav)를 준 것**이다.
   소리 파일은 설계도가 아니라 소리 그 자체라 아무 데서나 그냥 열린다.
   우리도 만들 수 있었는데 **두 번 눌러야 했고 자리가 멀었다.** 한 번으로 줄인다. */
var _자동받기521 = false;
function _renderWav(btn,dl){
var list=eN.filter(function(n){ return n.name!=='R'; });
/* cgo-523 : 저장하는 소리에도 반주를 깐다. 들을 때와 같은 것이 나와야 한다. */
try{ var _반w523=_반주523(0,totBars); if(_반w523.length) list=list.concat(_반w523); }catch(_){}
if(!list.length){ _flash('🎼 렌더할 음이 없어요'); return; }
var OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
if(!OAC){ _flash('⚠️ 이 브라우저는 WAV 렌더를 지원하지 않아요'); return; }
var bSec=beatMs/1000, endSec=0;
list.forEach(function(n){ endSec=Math.max(endSec,_absBeat(n)*bSec+(n.dur||1)*bSec); });
var sr=44100, oc;
try{ oc=new OAC(2,Math.ceil((endSec+2.2)*sr),sr); }catch(ex){ _flash('⚠️ WAV 렌더 준비 실패'); return; }
var ch=_mkChain(oc,oc.destination);
var _반문w523=null;
try{ _반문w523=oc.createGain(); _반문w523.gain.value=반주세기523; _반문w523.connect(ch.inp); }catch(_){}
/* ⚠️ cgo-551 : 글자를 **먼저** 바꾼다.
   전에는 음표 수천 개를 다 쌓은 **뒤에** '⏳ 렌더링 중' 을 적었다. 쌓는 동안
   화면이 멈춰 있어서, 누른 사람은 앱이 죽은 줄 안다. 화음을 예순 마디 전부
   깔면서 음표가 두 배가 됐으니 더 길게 멈춘다. 글자를 먼저 띄우고, 화면이
   한 번 그려질 틈(30ms)을 준 다음에 쌓는다. 쌓는 시간 자체는 그대로다. */
btn.disabled=true; btn.style.opacity='.5'; btn.textContent='⏳ CGO 신디 렌더링 중...';
var synName=(CGO_SYN_LIST.filter(function(x){ return x[0]===synthPW; })[0]||['','CGO'])[1];
var _쌓기551=function(){
list.forEach(function(n){ var _밑w548=ch.inp;   /* cgo-550 */
  _voice(oc,_버스548(oc,ch,n,_밑w548),n.name,.05+_absBeat(n)*bSec,(n.dur||1)*bSec,
               n._반?(n._베?베이스악기524:반주악기524):null, n); });   /* cgo-531 셈여림 · cgo-548 좌우 */
};
var done=function(ab){
var _받기521=_자동받기521; _자동받기521=false;
var w=_encWav(ab);
if(_lastWavUrl){ try{ URL.revokeObjectURL(_lastWavUrl); }catch(ex){} }
_lastWavUrl=URL.createObjectURL(w.blob);
var dlNow=canvasWrap.querySelector('#cgo-sc-wavdl')||dl;
if(dlNow){ dlNow.href=_lastWavUrl; dlNow.download='cgo-score.wav'; dlNow.style.display='block'; }
var bNow=canvasWrap.querySelector('#cgo-sc-wavbtn')||btn;
bNow.disabled=false; bNow.style.opacity='1'; bNow.textContent='🔄 다시 렌더링';
try{ var _wb521=canvasWrap.querySelector('#cgo-sc-wavsave521');
     if(_wb521){ _wb521.disabled=false; _wb521.style.opacity='1'; _wb521.textContent='🔊 소리로 저장'; } }catch(_){}
if(_받기521){
  /* 저장하러 누른 것이다 — 파일만 내려 주고 소리는 안 튼다.
     저장 누른 사람에게 갑자기 곡이 울리면 놀란다. */
  if(dlNow){ try{ dlNow.click(); }catch(_){} }
  _flash('✅ 소리 파일로 저장했습니다 — 아무 데서나 열립니다');
  return;
}
_stopOthers();
var ctx=_liveCtx(); if(!ctx) return;
var play=function(){
var out=ctx.createGain(); out.gain.value=w.gain; out.connect(ctx.destination);
var src=ctx.createBufferSource(); src.buffer=ab; src.connect(out);
src.onended=function(){ if(PB.out===out) window._cgoScoreStop(); };
PB.out=out; PB.srcs=[src]; PB.playing=true; PB.mode='wav'; _syncBtns();
src.start();
};
if(ctx.state==='suspended'){ ctx.resume().then(play,play); } else { play(); }
_flash('✅ '+synName+' · CGO 신디 WAV 완성 — 재생 중');
};
var fail=function(){
_자동받기521=false;
try{ var _wb521f=canvasWrap.querySelector('#cgo-sc-wavsave521');
     if(_wb521f){ _wb521f.disabled=false; _wb521f.style.opacity='1'; _wb521f.textContent='🔊 소리로 저장'; } }catch(_){}
var bNow=canvasWrap.querySelector('#cgo-sc-wavbtn')||btn;
bNow.disabled=false; bNow.style.opacity='1'; bNow.textContent='🎹 CGO 신디로 WAV 만들기';
_flash('⚠️ WAV 렌더 실패 — 다시 눌러 주세요');
};
/* cgo-551 : 글자가 화면에 한 번 그려진 뒤에 음표를 쌓고 굽는다 */
setTimeout(function(){
try{ _쌓기551(); }catch(ex){ fail(); return; }
try{
var pr=oc.startRendering();
if(pr&&typeof pr.then==='function') pr.then(done,fail);
else oc.oncomplete=function(e){ done(e.renderedBuffer); };
}catch(ex){ fail(); }
}, 30);
}
var CHR=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function shiftN(n,d){
var m=n.match(/^([A-G])(#|b)?(\d+)$/); if(!m) return n;
var base=m[1]+(m[2]==='#'?'#':'');
if(m[2]==='b'){ var li='CDEFGAB'.indexOf(m[1]); base='CDEFGAB'[(li+6)%7]+'#'; }
var ci=CHR.indexOf(base); if(ci<0) ci=CHR.indexOf(m[1]); if(ci<0) ci=0;
var oc=parseInt(m[3]); ci+=d;
if(ci<0){ci+=12;oc--;} if(ci>=12){ci-=12;oc++;}
return CHR[ci]+oc;
}
function generateMidi(){
var tpq=480, ustmp=Math.round(60000000/bpm);
function midiN(n){ var m=n.match(/^([A-G])(#|b)?(\d+)$/); if(!m) return 60; var NV={C:0,D:2,E:4,F:5,G:7,A:9,B:11}; return (parseInt(m[3])+1)*12+NV[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0); }
function vl(v){ if(v<0x80) return [v]; var b=[]; b.unshift(v&0x7F); v>>=7; while(v){ b.unshift((v&0x7F)|0x80); v>>=7; } return b; }
var evs=[];
eN.forEach(function(note){
if(note.name==='R') return; // cgo-299: 쉼표는 음이 아님 (기존: 도(C4)로 저장되던 버그)
var t=Math.round((note.bar*(note.bpb||4)+note.beat)*tpq);
var d=Math.max(30,Math.round((note.dur||1)*tpq*0.95)); // cgo-299: 실제 음 길이 (기존: 전부 0.85박)
var p=Math.max(0,Math.min(127,midiN(note.name)));
evs.push({t:t,d:[0x90,p,90]}); evs.push({t:t+d,d:[0x80,p,0]});
});
evs.sort(function(a,b){ return a.t-b.t; });
var td=[0x00,0xFF,0x51,0x03,(ustmp>>16)&0xFF,(ustmp>>8)&0xFF,ustmp&0xFF];
td.push(0x00,0xC0,(CGO_SYN_GM[synthPW]||0)&0x7F); // cgo-299: CGO 신디 음색 → GM 악기 번호
var prev=0;
evs.forEach(function(e){ td.push.apply(td,vl(e.t-prev)); td.push.apply(td,e.d); prev=e.t; });
td.push(0x00,0xFF,0x2F,0x00);
var hdr=[0x4D,0x54,0x68,0x64,0,0,0,6,0,0,0,1,(tpq>>8)&0xFF,tpq&0xFF,
0x4D,0x54,0x72,0x6B,(td.length>>24)&0xFF,(td.length>>16)&0xFF,(td.length>>8)&0xFF,td.length&0xFF];
var all=new Uint8Array(hdr.length+td.length);
hdr.forEach(function(v,i){ all[i]=v; }); td.forEach(function(v,i){ all[hdr.length+i]=v; });
var blob=new Blob([all],{type:'audio/midi'});
var url=URL.createObjectURL(blob);
var a=document.createElement('a'); a.href=url;
a.download=('cgo_melody').replace(/[\s/\\:*?"<>|]/g,'_')+'.mid';
document.body.appendChild(a); a.click(); document.body.removeChild(a);
setTimeout(function(){ URL.revokeObjectURL(url); },3000);
}
/* ════════════════════════════════════════════════════════════════════
   cgo-516 (2026-10-09) : MusicXML 로 내보내기

   왜 만들었나 — 파트너가 MIDI 를 받았더니 윈도우가 QuickTime 에 넘겨
   "Please install Apple Application Support" 창이 떴다. 우리 코드에는
   애플 것이 한 줄도 없다 (quicktime 0군데 · ActiveX 0 · <embed> 0 ·
   소리는 전부 브라우저 AudioContext). 파일이 **우리 손을 떠난 뒤** 윈도우가
   한 일이라, 서버를 무엇으로 바꾸든 거기엔 못 닿는다.
   고칠 자리는 **무엇을 쥐여 주느냐**다.

   MIDI 가 못 싣는 것 — 마디선 · 조 · 빠르기 글 · 구간 이름 · **가사**.
   cgo-515 에서 채운 가사가 MIDI 로 내보내면 통째로 버려진다.
   MusicXML 은 그 전부를 싣고, 무료 MuseScore 에서 우리 악보 그대로 열린다.

   ⚠️ 이 파일은 **노래 가락 한 줄**이다. 반주·화음은 안 들어간다.
      악보에 그려진 것만 나간다 — 그려지지 않은 것을 내보내면 거짓말이 된다.
   ════════════════════════════════════════════════════════════════════ */
function generateMusicXML(){
  var DIV=12;   /* 4분음표 하나 = 12. 3으로도 4로도 나뉘어 셋잇단·16분음표가 다 들어간다 */
  function _esc(s){ return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _음(nm){
    var m=String(nm).match(/^([A-G])(##|bb|x|#|b)?(-?\d+)$/);
    if(!m) return null;
    var a=m[2]||'', al=0;
    if(a==='#') al=1; else if(a==='b') al=-1;
    else if(a==='##'||a==='x') al=2; else if(a==='bb') al=-2;
    return {step:m[1], alter:al, oct:parseInt(m[3],10)};
  }
  /* 박(4분음표=1)을 악보 기호로 — 점은 둘까지 */
  var _꼴=[[4,'whole'],[2,'half'],[1,'quarter'],[0.5,'eighth'],[0.25,'16th'],[0.125,'32nd']];
  function _길이(d){
    var best=null;
    for(var i=0;i<_꼴.length;i++) for(var dt=0;dt<=2;dt++){
      var v=_꼴[i][0]*(2-Math.pow(0.5,dt)), e=Math.abs(v-d);
      if(!best||e<best.e) best={e:e,type:_꼴[i][1],dots:dt};
    }
    return best;
  }
  /* 가사 한 마디치를 음절로 쪼갠다 — 한글은 한 글자가 한 음절이다 */
  function _음절(txt){
    var out=[];
    String(txt||'').split(/\s+/).forEach(function(w){
      if(!w) return;
      if(/[가-힣぀-ヿ一-鿿]/.test(w)){
        var parts=[];
        w.split('').forEach(function(c){
          if(/[가-힣぀-ヿ一-鿿A-Za-z0-9]/.test(c)) parts.push(c);
          else if(parts.length) parts[parts.length-1]+=c;
        });
        /* ⚠️ cgo-516 : 처음엔 begin/middle/end 로 적었다가 그려 보니 글자마다
           **줄표(-)가 붙었다.** 영어 악보 관습이다. 한글 악보는 줄표를 안 쓴다.
           한 글자가 곧 한 음절이라 끊어 읽을 일이 없기 때문이다. 전부 single 로 둔다. */
        parts.forEach(function(c){ out.push({t:c, s:'single'}); });
      } else out.push({t:w, s:'single'});
    });
    return out;
  }
  /* 조 — 몇 개의 #/b 인가 */
  var _장={'C':0,'G':1,'D':2,'A':3,'E':4,'B':5,'F#':6,'C#':7,
           'F':-1,'Bb':-2,'Eb':-3,'Ab':-4,'Db':-5,'Gb':-6,'Cb':-7};
  var _단={'A':0,'E':1,'B':2,'F#':3,'C#':4,'G#':5,'D#':6,'A#':7,
           'D':-1,'G':-2,'C':-3,'F':-4,'Bb':-5,'Eb':-6,'Ab':-7};
  var _키글='';
  try{ if(typeof keyName!=='undefined' && keyName) _키글=String(keyName); }catch(e){}
  try{ if(!_키글 && typeof key!=='undefined' && key) _키글=String(key); }catch(e){}
  try{ if(!_키글 && window._cgoMusicMod && window._cgoMusicMod.selected)
         _키글=String(window._cgoMusicMod.selected.key||''); }catch(e){}
  var _뿌리=(_키글.split(/\s+/)[0]||'C').replace(/[^A-Gb#]/g,'') || 'C';
  var _단조=/min/i.test(_키글);
  var _오도=(_단조?_단[_뿌리]:_장[_뿌리]);
  if(typeof _오도!=='number') _오도=0;

  /* 마디별로 음표를 모은다 */
  var _통={}, _최대=0;
  eN.forEach(function(n){ (_통[n.bar]=_통[n.bar]||[]).push(n); if(n.bar>_최대) _최대=n.bar; });
  Object.keys(_통).forEach(function(k){ _통[k].sort(function(a,b){ return (a.beat||0)-(b.beat||0); }); });
  var _끝=Math.max(_최대+1, (typeof totBars==='number'?totBars:0), 1);

  var _빠=80; try{ if(typeof bpm==='number'&&bpm>20) _빠=Math.round(bpm); }catch(e){}

  var X=[];
  X.push('<?xml version="1.0" encoding="UTF-8"?>');
  X.push('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">');
  X.push('<score-partwise version="4.0">');
  X.push('<work><work-title>CGO 주파수 뮤직</work-title></work>');
  X.push('<identification><encoding>'
        +'<software>CGO 주파수 뮤직</software>'
        +'<encoding-date>'+(new Date().toISOString().slice(0,10))+'</encoding-date>'
        +'</encoding>'
        +'<miscellaneous><miscellaneous-field name="note">'
        +_esc('AI가 듣고 받아 적은 악보 · 예측 정확도 56.3% · 노래 가락 한 줄만 들어 있습니다')
        +'</miscellaneous-field></miscellaneous></identification>');
  X.push('<part-list><score-part id="P1"><part-name>'+_esc('노래')+'</part-name></score-part></part-list>');
  X.push('<part id="P1">');

  for(var b=0;b<_끝;b++){
    var ns=_통[b]||[];
    var bpb=(ns[0]&&ns[0].bpb) || (typeof barBpb!=='undefined' && barBpb[b]) || 4;
    X.push('<measure number="'+(b+1)+'">');
    if(b===0){
      X.push('<attributes><divisions>'+DIV+'</divisions>'
            +'<key><fifths>'+_오도+'</fifths><mode>'+(_단조?'minor':'major')+'</mode></key>'
            +'<time><beats>'+bpb+'</beats><beat-type>4</beat-type></time>'
            +'<clef><sign>G</sign><line>2</line></clef></attributes>');
      X.push('<direction placement="above"><direction-type><metronome>'
            +'<beat-unit>quarter</beat-unit><per-minute>'+_빠+'</per-minute>'
            +'</metronome></direction-type><sound tempo="'+_빠+'"/></direction>');
    }
    var _구간='';
    try{ _구간=(typeof sectionStarts!=='undefined' && sectionStarts[b]) || ''; }catch(e){}
    if(_구간) X.push('<direction placement="above"><direction-type><words font-weight="bold">'
                    +_esc(_구간)+'</words></direction-type></direction>');

    var _가=[]; try{ _가=_음절(_lyricsArr[b]); }catch(e){ _가=[]; }
    var _가i=0, _자리=0;
    /* ⚠️ cgo-516 : 음표보다 글자가 많으면 **남은 글자가 버려졌다** (시험에서 잡음 —
       「먼지 쌓인 침묵을」이 「먼 지 쌓 인 침」에서 끊겼다). 마지막 음표에 몰아 붙인다.
       한 음표에 「침묵을」이 붙는 건 보기 좋진 않지만, 말이 사라지는 것보다 낫다. */
    var _소리수=0;
    for(var _q=0;_q<ns.length;_q++) if(ns[_q].name!=='R') _소리수++;
    var _소리i=0;
    function _쉼(len){
      if(len<=0.01) return;
      var L=_길이(len);
      X.push('<note><rest/><duration>'+Math.max(1,Math.round(len*DIV))+'</duration>'
            +'<voice>1</voice><type>'+L.type+'</type>'+'<dot/>'.repeat(L.dots)+'</note>');
    }
    for(var i=0;i<ns.length;i++){
      var n=ns[i], bt=Math.max(0,Math.min(n.beat||0,bpb));
      if(bt>_자리+0.01){ _쉼(bt-_자리); _자리=bt; }
      var d=Math.max(0.0625,Math.min(n.dur||1, bpb-_자리));
      var L=_길이(d), dur=Math.max(1,Math.round(d*DIV));
      var p=(n.name==='R')?null:_음(n.name);
      var 줄=['<note>'];
      if(!p) 줄.push('<rest/>');
      else 줄.push('<pitch><step>'+p.step+'</step>'
                  +(p.alter?('<alter>'+p.alter+'</alter>'):'')
                  +'<octave>'+p.oct+'</octave></pitch>');
      줄.push('<duration>'+dur+'</duration><voice>1</voice><type>'+L.type+'</type>');
      for(var dd=0;dd<L.dots;dd++) 줄.push('<dot/>');
      if(p && p.alter) 줄.push('<accidental>'+(p.alter===1?'sharp':p.alter===-1?'flat':p.alter===2?'double-sharp':'flat-flat')+'</accidental>');
      if(p){
        _소리i++;
        if(_가i<_가.length){
          var _글, _꼴자;
          if(_소리i>=_소리수){                       /* 이 마디 마지막 음표 — 남은 글자를 다 붙인다 */
            var _뭉=[]; while(_가i<_가.length) _뭉.push(_가[_가i++].t);
            _글=_뭉.join(''); _꼴자='single';
          } else { var g=_가[_가i++]; _글=g.t; _꼴자=g.s; }
          줄.push('<lyric number="1"><syllabic>'+_꼴자+'</syllabic><text>'+_esc(_글)+'</text></lyric>');
        }
      }
      줄.push('</note>');
      X.push(줄.join(''));
      _자리+=d;
    }
    if(_자리<bpb-0.01) _쉼(bpb-_자리);
    if(b===_끝-1) X.push('<barline location="right"><bar-style>light-heavy</bar-style></barline>');
    X.push('</measure>');
  }
  X.push('</part></score-partwise>');

  var blob=new Blob([X.join('\n')],{type:'application/vnd.recordare.musicxml+xml'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download='cgo_악보.musicxml';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); },3000);
  try{ console.log('%c[cgo-516] MusicXML — 마디 '+_끝+' · 조 '+(_키글||'C Major')+' · 빠르기 '+_빠,'color:#0891b2'); }catch(e){}
}

var rows=Math.ceil(totBars/BPR);
var svgW=cW, svgH=rows*RH+16;
function mk(tag,attrs,sty){
var el=document.createElementNS(svgNS,tag);
if(attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k,String(attrs[k])); });
if(sty) el.style.cssText=sty;
return el;
}
function drawSvg(){
var svg=mk('svg',{width:svgW,height:svgH,viewBox:'0 0 '+svgW+' '+svgH,tabindex:'0'},
'background:#fff;display:block;border-radius:8px;width:100%;'+(addMode?'touch-action:none;cursor:crosshair;':'touch-action:auto;'));
svg.appendChild(mk('rect',{width:svgW,height:svgH,fill:'#fff'}));
var barVolta13={};
{var _vB13=0;
(song&&song.struct||[]).forEach(function(sec){
var _sb13=(sec.chords||[]).reduce(function(s,c){return s+(c[2]||2);},0);
if(sec.volta!==undefined){
var _vnum=typeof sec.volta==='number'?sec.volta:1;
var _vbars=2;
for(var _vi=0;_vi<_vbars;_vi++){
barVolta13[_vB13+_sb13-_vbars+_vi]={num:_vnum,first:_vi===0,last:_vi===_vbars-1};
}
}
_vB13+=_sb13;
});
}
for(var row=0;row<rows;row++){
var ry=row*RH+8, sTop=ry+ST;
var bir=Math.min(BPR,totBars-row*BPR);
var rowEndX=LM+bir*BAR_W; // 이 행 실제 끝 X
for(var li=0;li<5;li++)
svg.appendChild(mk('line',{x1:LM-4,x2:rowEndX+4,y1:sTop+li*LGAP,y2:sTop+li*LGAP,stroke:'#bbb','stroke-width':0.7}));
var cl=mk('text',{x:3,y:sTop+4*LGAP+2,'font-size':50,'font-family':'"Times New Roman",Times,serif',fill:'#555'});
cl.textContent='𝄞'; svg.appendChild(cl);
for(var bi=0;bi<=bir;bi++){
var bx=LM+bi*BAR_W;
var _bxL=bi===bir?rowEndX:bx;
svg.appendChild(mk('line',{x1:_bxL,x2:_bxL,y1:sTop,y2:sTop+4*LGAP,stroke:'#bbb','stroke-width':bi===bir?1.8:0.8}));
if(bi<bir){
var barN=row*BPR+bi;
var bt=mk('text',{x:bx+2,y:ry+10,'font-size':7,'font-family':'Arial,sans-serif',fill:'#d1d5db'}); bt.textContent=String(barN+1); svg.appendChild(bt);
if(sectionStarts[barN]!==undefined && sectionStarts[barN]){
var sn=sectionStarts[barN], slW=sn.length*6+10;
var slG=mk('g');
slG.appendChild(mk('rect',{x:bx+2,y:ry+15,width:slW,height:13,rx:3,fill:'#1e3a5f'}));
var slt=mk('text',{x:bx+6,y:ry+25,'font-size':9,'font-family':'Arial,sans-serif',fill:'#fff','font-weight':'bold'});
slt.textContent=sn; slG.appendChild(slt); svg.appendChild(slG);
}
if(barChords[barN]){
/* cgo-551 : 구간 딱지(verse·chorus)와 **같은 자리**에 그려서 화음 글자가 가려졌다.
   전에는 화음이 열 몇 마디에만 있어 눈에 안 띄었는데, 이제 예순 마디 전부라 티가 난다.
   딱지가 있는 마디에서는 딱지 너비만큼 오른쪽으로 비킨다. */
var _cx551=bx+4;
if(sectionStarts[barN]!==undefined && sectionStarts[barN])
  _cx551 = bx+2 + (String(sectionStarts[barN]).length*6+10) + 5;
var ct=mk('text',{x:_cx551,y:ry+22,'font-size':10,'font-family':'Arial,sans-serif',fill:'#7c3aed','font-weight':'bold'});
ct.textContent=barChords[barN]; svg.appendChild(ct);
}
if(sectionDynamics[barN]!==undefined){
var _dT6=mk('text',{x:bx+4,y:sTop+4*LGAP+16,
'font-size':15,'font-family':'"Times New Roman",Times,serif',
'font-style':'italic','font-weight':'bold',fill:'#1e3a5f'});
_dT6.textContent=sectionDynamics[barN]; svg.appendChild(_dT6);
}
for(var _hk7=0;_hk7<sectionTransArr7.length;_hk7++){
if(sectionTransArr7[_hk7].bar===barN){
var _hx17=bx+5,_hx27=bx+BAR_W-5;
var _hy7=sTop+4*LGAP+27,_ho7=6;
var _hd7=sectionTransArr7[_hk7].type==='cresc'
?'M '+_hx17+','+_hy7+' L '+_hx27+','+(_hy7-_ho7)+' M '+_hx17+','+_hy7+' L '+_hx27+','+(_hy7+_ho7)
:'M '+_hx17+','+(_hy7-_ho7)+' L '+_hx27+','+_hy7+' M '+_hx17+','+(_hy7+_ho7)+' L '+_hx27+','+_hy7;
svg.appendChild(mk('path',{d:_hd7,stroke:'#374151',fill:'none','stroke-width':1.3,'stroke-linecap':'round'}));
break;
}
}
var _sN13i=(sectionStarts[barN]||'').toLowerCase();
if(/verse|chorus|refrain/.test(_sN13i)&&barN>0){
svg.appendChild(mk('rect',{x:bx+1,y:sTop,width:2.5,height:4*LGAP,fill:'#374151'}));
svg.appendChild(mk('circle',{cx:bx+7,cy:sTop+LGAP*1.5,r:2.0,fill:'#374151'}));
svg.appendChild(mk('circle',{cx:bx+7,cy:sTop+LGAP*2.5,r:2.0,fill:'#374151'}));
}
var _nSN13i=(sectionStarts[barN+1]||'').toLowerCase();
if(/verse|chorus|refrain/.test(_nSN13i)&&barN>0){
var _rbx13=bx+BAR_W;
svg.appendChild(mk('circle',{cx:_rbx13-7,cy:sTop+LGAP*1.5,r:2.0,fill:'#374151'}));
svg.appendChild(mk('circle',{cx:_rbx13-7,cy:sTop+LGAP*2.5,r:2.0,fill:'#374151'}));
svg.appendChild(mk('rect',{x:_rbx13-3.5,y:sTop,width:2.5,height:4*LGAP,fill:'#374151'}));
}
if(barVolta13[barN]){
var _vt13=barVolta13[barN];
var _vtBx=bx,_vtEx=bx+BAR_W;
svg.appendChild(mk('line',{x1:_vtBx,x2:_vtEx,y1:sTop-12,y2:sTop-12,stroke:'#374151','stroke-width':1.2}));
if(_vt13.first){
svg.appendChild(mk('line',{x1:_vtBx,x2:_vtBx,y1:sTop-12,y2:sTop,stroke:'#374151','stroke-width':1.2}));
var _vNumT13=mk('text',{x:_vtBx+3,y:sTop-4,'font-size':8,'font-family':'Arial,sans-serif',fill:'#374151'});
_vNumT13.textContent=String(_vt13.num)+'.'; svg.appendChild(_vNumT13);
}
if(_vt13.last&&_vt13.num===1){
svg.appendChild(mk('line',{x1:_vtEx,x2:_vtEx,y1:sTop-12,y2:sTop,stroke:'#374151','stroke-width':1.2}));
}
}
if(/coda|outro/.test(_sN13i)){
var _codT13=mk('text',{x:bx+2,y:sTop-3,'font-size':13,'font-family':'Arial Unicode MS,Arial,sans-serif',fill:'#374151'});
_codT13.textContent='𝄌'; svg.appendChild(_codT13);
}
if(barN===totBars-1){
var _fineX13=bx+BAR_W-2;
var _fT13=mk('text',{x:_fineX13,y:sTop-4,'text-anchor':'end','font-size':10,'font-family':'"Times New Roman",Times,serif','font-style':'italic','font-weight':'bold',fill:'#374151'});
_fT13.textContent='Fine'; svg.appendChild(_fT13);
}
(function(_bn,_bx){
var _fo=mk('foreignObject',{x:_bx+1,y:sTop+4*LGAP+34,width:BAR_W-2,height:LYRICS_H});
var _inp=document.createElement('input');
_inp.type='text';
_inp.value=_lyricsArr[_bn]||'';
_inp.placeholder='♪';
_inp.style.cssText='width:100%;height:100%;border:none;border-top:1px dashed #ddd6fe;'
+'background:transparent;font-size:11px;color:#7c3aed;text-align:center;'
+'outline:none;padding:0 2px;font-family:inherit;box-sizing:border-box;';
_inp.addEventListener('focus',function(){ this.style.background='#f5f3ff'; this.style.borderTopColor='#7c3aed'; });
_inp.addEventListener('blur',function(){ this.style.background='transparent'; this.style.borderTopColor='#ddd6fe'; });
_inp.addEventListener('input',function(){ _lyricsArr[_bn]=this.value;
  /* cgo-518 : 손으로 고친 칸은 '저절로 채운 칸' 표시를 뗀다.
     안 떼면 가사를 밀 때 파트너가 쓴 글을 덮어쓴다 (시험에서 잡음). */
  try{ _자동518[_bn]=0; }catch(e){}
});
_inp.addEventListener('click',function(e){ e.stopPropagation(); });
_inp.addEventListener('mousedown',function(e){ e.stopPropagation(); });
_inp.addEventListener('touchstart',function(e){ e.stopPropagation(); });
_fo.appendChild(_inp);
svg.appendChild(_fo);
})(barN,bx);
}
}
}
var dragLine=mk('line',{x1:LM-4,x2:LM+BPR*BAR_W+4,y1:0,y2:0,stroke:'#7c3aed','stroke-width':1.5,'stroke-dasharray':'5,3'},'display:none;pointer-events:none;');
svg.appendChild(dragLine);
dragState.line=dragLine;
var _beamed={}; // idx → true
for(var _bi=0;_bi<eN.length-1;_bi++){
var _na=eN[_bi],_nb=eN[_bi+1];
var _dA=_na.dur||1,_dB=_nb.dur||1;
var _vdA=(_na.tuplet===3?1.5:_na.tuplet===5?1.25:_na.tuplet===6?1.5:_na.tuplet===7?1.75:1)*_dA; // 시각 dur — cgo-211: C2 6·7잇단
var _vdB=(_nb.tuplet===3?1.5:_nb.tuplet===5?1.25:_nb.tuplet===6?1.5:_nb.tuplet===7?1.75:1)*_dB;
var _fA=_vdA<0.875?(_vdA<0.375?2:1):0;
var _fB=_vdB<0.875?(_vdB<0.375?2:1):0;
if(_fA>0&&_fB>0&&_na.bar===_nb.bar){_beamed[_bi]=true;_beamed[_bi+1]=true;}
}
var _barAccMap9={};
var _nPos=[];
eN.forEach(function(note,idx){
var row=Math.floor(note.bar/BPR), barInRow=note.bar%BPR;
var sTop=row*RH+8+ST;
var bpb=note.bpb||4;
var noteX=LM+barInRow*BAR_W+Math.min(note.beat,bpb-0.01)*(BAR_W/bpb)+12;
var slot=ns(note.name), noteY=sy(slot,sTop);
var isSel=(idx===selI), nc=isSel?'#7c3aed':'#1f2937';
var _accRaw9=(note.name.match(/^[A-G](##|bb|x|#|b)/)||[''])[0].slice(1); // cgo-214: D3 ##/bb/x 더블샵·더블플랫 감지
var _basePc9=note.name.replace(/[#b\d]/g,'');
if(!_barAccMap9[note.bar]) _barAccMap9[note.bar]={};
var _prevAcc9=_barAccMap9[note.bar][_basePc9];
var acc=_accRaw9;
if(!acc&&_prevAcc9) acc='n';
_barAccMap9[note.bar][_basePc9]=_accRaw9;
if(note.grace){
var _gs=ns(note.grace),_gy=sy(_gs,sTop);
var _gx=Math.max(noteX-22, LM+barInRow*BAR_W-6);
var _gnrx=NRX*0.62,_gnry=NRY*0.62,_gStem=20;
var _gstX=_gx+_gnrx,_gstEndY=_gy-_gStem;
if(_gs<=-2){for(var _gls=-2;_gls>=_gs;_gls-=2){var _gly=sy(_gls,sTop);svg.appendChild(mk('line',{x1:_gx-_gnrx-3,x2:_gx+_gnrx+3,y1:_gly,y2:_gly,stroke:'#bbb','stroke-width':0.6}));}}
if(_gs>=10){for(var _gls2=10;_gls2<=_gs;_gls2+=2){var _gly2=sy(_gls2,sTop);svg.appendChild(mk('line',{x1:_gx-_gnrx-3,x2:_gx+_gnrx+3,y1:_gly2,y2:_gly2,stroke:'#bbb','stroke-width':0.6}));}}
svg.appendChild(mk('line',{x1:_gstX,x2:_gstX,y1:_gy,y2:_gstEndY,stroke:'#374151','stroke-width':1.0}));
var _gfc='M '+_gstX+','+_gstEndY+' C '+(_gstX+8)+','+(_gstEndY+3)+' '+(_gstX+9)+','+(_gstEndY+7)+' '+_gstX+','+(_gstEndY+10);
svg.appendChild(mk('path',{d:_gfc,stroke:'#374151',fill:'none','stroke-width':0.9}));
var _gg=mk('g',{transform:'rotate(-18,'+_gx+','+_gy+')'});
_gg.appendChild(mk('ellipse',{cx:_gx,cy:_gy,rx:_gnrx,ry:_gnry,fill:'#374151',stroke:'#374151','stroke-width':0.4}));
svg.appendChild(_gg);
svg.appendChild(mk('line',{x1:_gstX-4,x2:_gstX+7,y1:_gstEndY+13,y2:_gstEndY-1,stroke:'#374151','stroke-width':1.0}));
var _slx1=_gx+_gnrx+1,_slx2=noteX-NRX-2;
if(_slx2>_slx1+4){
var _slBaseY=Math.min(_gy,noteY)-5,_slCtrlY=_slBaseY-7;
svg.appendChild(mk('path',{d:'M '+_slx1+','+_slBaseY+' Q '+((_slx1+_slx2)/2)+','+_slCtrlY+' '+_slx2+','+_slBaseY,stroke:'#9ca3af',fill:'none','stroke-width':1.2}));
}
}
if(slot<=-2){ for(var ls=-2;ls>=slot;ls-=2){ var ly=sy(ls,sTop); svg.appendChild(mk('line',{x1:noteX-NRX-4,x2:noteX+NRX+4,y1:ly,y2:ly,stroke:'#bbb','stroke-width':0.7})); } }
if(slot>=10){ for(var ls2=10;ls2<=slot;ls2+=2){ var ly2=sy(ls2,sTop); svg.appendChild(mk('line',{x1:noteX-NRX-4,x2:noteX+NRX+4,y1:ly2,y2:ly2,stroke:'#bbb','stroke-width':0.7})); } }
if(acc){
var _atX9=noteX-NRX-9,_atY9=noteY+4,at9;
if(acc==='##'||acc==='x'){
at9=mk('text',{x:_atX9-1,y:_atY9,'font-size':10,'font-family':'Arial Unicode MS,Arial,sans-serif',fill:nc});
at9.textContent='𝄪';
} else if(acc==='bb'){
at9=mk('text',{x:_atX9-3,y:_atY9+3,'font-size':14,'font-family':'Arial Unicode MS,Arial,sans-serif',fill:nc});
at9.textContent='𝄫';
} else if(acc==='#'){
at9=mk('text',{x:_atX9,y:_atY9,'font-size':10,'font-family':'Arial,sans-serif',fill:nc});
at9.textContent='♯';
} else if(acc==='b'){
at9=mk('text',{x:_atX9-2,y:_atY9+3,'font-size':14,'font-family':'Arial,sans-serif',fill:nc});
at9.textContent='♭';
} else {
at9=mk('text',{x:_atX9-2,y:_atY9+1,'font-size':11,'font-family':'Arial,sans-serif',fill:nc});
at9.textContent='♮';
}
svg.appendChild(at9);
}
if(note.name==='R'){
var _rD65=note.dur||1;
var _rMid65=sTop+LGAP*2; // 오선 3번째 줄 (B4)
var _nc65=isSel?'#7c3aed':'#1f2937';
if(_rD65>=3.75){ // 온쉼표: 3번째 줄 아래 매달린 사각형
svg.appendChild(mk('rect',{x:noteX-7,y:_rMid65-LGAP-3,width:14,height:5,fill:_nc65,rx:1}));
} else if(_rD65>=1.75){ // 2분쉼표: 3번째 줄 위 얹힌 사각형
svg.appendChild(mk('rect',{x:noteX-7,y:_rMid65-LGAP+2,width:14,height:4,fill:_nc65,rx:1}));
} else if(_rD65>=0.875){ // 4분쉼표: 지그재그
var _qp65='M '+( noteX+4)+','+(_rMid65-8)+' L '+(noteX-4)+','+(_rMid65-3)+' L '+(noteX+3)+','+(_rMid65+2)+' L '+(noteX-3)+','+(_rMid65+7);
svg.appendChild(mk('path',{d:_qp65,stroke:_nc65,fill:'none','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'}));
} else if(_rD65>=0.375){ // 8분쉼표
svg.appendChild(mk('circle',{cx:noteX+2,cy:_rMid65+4,r:2.5,fill:_nc65}));
svg.appendChild(mk('line',{x1:noteX+2,x2:noteX-5,y1:_rMid65+3,y2:_rMid65-7,stroke:_nc65,'stroke-width':1.5}));
} else { // 16분쉼표
svg.appendChild(mk('circle',{cx:noteX+2,cy:_rMid65+5,r:2.5,fill:_nc65}));
svg.appendChild(mk('circle',{cx:noteX+5,cy:_rMid65-2,r:2.5,fill:_nc65}));
svg.appendChild(mk('line',{x1:noteX+5,x2:noteX-4,y1:_rMid65-3,y2:_rMid65-11,stroke:_nc65,'stroke-width':1.5}));
}
if(Math.abs(_rD65-1.5)<0.01||Math.abs(_rD65-3.0)<0.01||Math.abs(_rD65-0.75)<0.01||Math.abs(_rD65-0.375)<0.01){
svg.appendChild(mk('circle',{cx:noteX+12,cy:_rMid65,r:2,fill:_nc65}));
}
if(isSel) svg.appendChild(mk('rect',{x:noteX-10,y:_rMid65-12,width:20,height:24,rx:3,fill:'none',stroke:'#7c3aed','stroke-width':1.2,'stroke-dasharray':'3,2'}));
var _rHit65=mk('rect',{x:noteX-10,y:_rMid65-12,width:20,height:24,fill:'transparent','cursor':'pointer'});
_rHit65.dataset.idx=String(idx); svg.appendChild(_rHit65);
_nPos.push({x:noteX,y:_rMid65,idx:idx});
return; // 음표 렌더링 스킵
}
var su=slot<4;
var dur=note.dur||1;
var _vDur=(note.tuplet===3?1.5:note.tuplet===5?1.25:note.tuplet===6?1.5:note.tuplet===7?1.75:1)*dur; // 시각 dur — cgo-211: C2 6·7잇단
var _isOpen=_vDur>=1.75,_noStem=_vDur>=3.75,_isDot=false,_flags=0;
if(_vDur>=3.25){_isOpen=true;_isDot=true;}
else if(_vDur>=1.75){_isOpen=true;}
else if(_vDur>=1.25){_isDot=true;}
else if(_vDur>=0.875){}
else if(_vDur>=0.625){_isDot=true;_flags=1;}
else if(_vDur>=0.375){_flags=1;}
else{_flags=2;}
var _stemX=su?noteX+NRX:noteX-NRX;
var _stemEndY=su?noteY-STEM:noteY+STEM;
if(!_noStem){
svg.appendChild(mk('line',{x1:_stemX,x2:_stemX,y1:noteY,y2:_stemEndY,stroke:nc,'stroke-width':1.3}));
}
var _rxW=_noStem?NRX+1:NRX, _ryW=_noStem?NRY+1:NRY;
var g=mk('g',{transform:'rotate(-18,'+noteX+','+noteY+')'});
var ell=mk('ellipse',{cx:noteX,cy:noteY,rx:_rxW,ry:_ryW,
fill:_isOpen?'none':nc,stroke:nc,'stroke-width':_isOpen?1.6:0.5},'cursor:pointer;');
ell.dataset.idx=String(idx); g.appendChild(ell); svg.appendChild(g);
if(_isDot){
var _dX=noteX+_rxW+5,_dY=noteY-(slot%2===0?2.5:0);
svg.appendChild(mk('circle',{cx:_dX,cy:_dY,r:2.2,fill:nc}));
}
if(_flags>0&&!_beamed[idx]){
var _fX=su?noteX+NRX:noteX-NRX;
var _fY0=su?noteY-STEM:noteY+STEM;
for(var _fi=0;_fi<_flags;_fi++){
var _fy=_fY0+_fi*(su?8:-8);
var _fc=su
?'M '+_fX+','+_fy+' C '+(_fX+14)+','+(_fy+4)+' '+(_fX+15)+','+(_fy+10)+' '+_fX+','+(_fy+14)
:'M '+_fX+','+_fy+' C '+(_fX+14)+','+(_fy-4)+' '+(_fX+15)+','+(_fy-10)+' '+_fX+','+(_fy-14);
svg.appendChild(mk('path',{d:_fc,stroke:nc,fill:'none','stroke-width':1.3}));
}
}
var hit=mk('rect',{x:noteX-13,y:noteY-10,width:26,height:20,fill:'transparent'},'cursor:pointer;');
hit.dataset.idx=String(idx); svg.appendChild(hit);
if(isSel){
var lbl=mk('text',{x:noteX,y:su?noteY-STEM-3:noteY+STEM+11,'text-anchor':'middle','font-size':9,'font-family':'Arial,sans-serif',fill:'#7c3aed','font-weight':'bold'});
lbl.textContent=note.name; svg.appendChild(lbl);
var bch=(barChords[note.bar]||'');
if(bch){
var crim=bch.match(/^([A-G]#?b?)/);
var cri2=crim?noteToIdx(crim[1]):-1;
var nri2=noteToIdx(note.name.replace(/\d/g,''));
if(cri2>=0&&nri2>=0){
var ILB=['R','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];
var ilt=mk('text',{x:noteX,y:su?noteY-STEM-12:noteY+STEM+20,'text-anchor':'middle','font-size':8,'font-family':'Arial,sans-serif',fill:'#a78bfa'});
ilt.textContent=ILB[(nri2-cri2+12)%12]; svg.appendChild(ilt);
}
}
}
if(note.beat<0.05&&(_DLVX7[barDynamics7[note.bar]]||0)===5){
var _acY8=su?noteY+NRY+7:noteY-NRY-7;
svg.appendChild(mk('path',{d:'M '+(noteX-8)+','+(_acY8-4)+' L '+(noteX+5)+','+_acY8+' M '+(noteX-8)+','+(_acY8+4)+' L '+(noteX+5)+','+_acY8,stroke:nc,fill:'none','stroke-width':1.3,'stroke-linecap':'round','stroke-linejoin':'round'}));
}
if(note.beat<0.05&&(_DLVX7[barDynamics7[note.bar]]||0)>=6){
var _mkY10=su?noteY+NRY+11:noteY-NRY-11;
var _mkD10=su?6:-6;
svg.appendChild(mk('path',{d:'M '+(noteX-7)+','+(_mkY10+_mkD10)+' L '+noteX+','+_mkY10+' L '+(noteX+7)+','+(_mkY10+_mkD10),stroke:nc,fill:'none','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));
}
if(note.beat<0.05&&sectionDynamics[String(note.bar)]!==undefined&&(_DLVX7[sectionDynamics[String(note.bar)]]||0)>=6){
var _sfzY10=su?noteY+NRY+25:noteY-NRY-25;
var _sfzT10=mk('text',{x:noteX,y:_sfzY10,'text-anchor':'middle','font-size':8,'font-family':'Arial,sans-serif','font-style':'italic',fill:nc});
_sfzT10.textContent='sfz'; svg.appendChild(_sfzT10);
}
if(_flags>=2&&!_beamed[idx]){
var _stcY11=su?noteY+NRY+4:noteY-NRY-4;
svg.appendChild(mk('circle',{cx:noteX,cy:_stcY11,r:2.0,fill:nc}));
}
if(_isDot&&_flags===0&&!_isOpen){
var _tenY11=su?noteY+NRY+5:noteY-NRY-5;
svg.appendChild(mk('line',{x1:noteX-7,x2:noteX+7,y1:_tenY11,y2:_tenY11,stroke:nc,'stroke-width':1.8,'stroke-linecap':'round'}));
}
if((sectionStarts[String(note.bar+1)]!==undefined||idx===eN.length-1)&&note.beat+note.dur>=note.bpb-0.12){
var _frmBY11=su?noteY+NRY+18:noteY-NRY-18;
var _frmR11=8,_frmSw11=su?0:1;
svg.appendChild(mk('path',{d:'M '+(noteX-_frmR11)+','+_frmBY11+' A '+_frmR11+','+_frmR11+' 0 0 '+_frmSw11+' '+(noteX+_frmR11)+','+_frmBY11,stroke:nc,fill:'none','stroke-width':1.5}));
var _frmDY11=su?_frmBY11-4:_frmBY11+4;
svg.appendChild(mk('circle',{cx:noteX,cy:_frmDY11,r:1.8,fill:nc}));
}
/* ───────── cgo-528 : 음표마다 **계이름**을 찍는다 ────────────────────────
   파트너 — "음 표시 어느 음표인지도 없어 어디를 연주하는지도 모르겠어여".
   음 이름(`note.name`)은 여기까지 **이미 와 있었다.** 알고도 안 찍고 있었다.
   도 레 미 + 옥타브 숫자로 찍는다 (`미4` = 가온다 바로 위 미).
   기둥이 위면 머리 아래, 기둥이 아래면 머리 위 — 기둥·이음줄과 안 겹치게.
   끄려면 콘솔에 `window._cgo계이름528 = false`                            */
try{
  if(window._cgo계이름528!==false && note.name){
    var _m528=String(note.name).match(/^([A-G])([#b]?)(-?\d+)$/);
    if(_m528){
      /* 앱이 21개 말을 쓴다. 한국어면 도레미, 아니면 C·D·E 로 찍는다.
         손님이 눌러서 맞출 것이 없게 **말에 맞춰 저절로** 갈린다. */
      var _한528=false;
      try{ var _lg528=localStorage.getItem('cgo_lang')||''; _한528=(_lg528===''||_lg528==='ko'||_lg528.indexOf('ko')===0); }catch(_){ _한528=true; }
      var _도528=_한528 ? {C:'도',D:'레',E:'미',F:'파',G:'솔',A:'라',B:'시'}[_m528[1]] : _m528[1];
      var _올528=_m528[2]==='#'?'♯':(_m528[2]==='b'?'♭':'');
      var _글528=_도528+_올528+_m528[3];
      var _ly528=(su?noteY+15:noteY-9);
      /* cgo-530 : 16분음표가 들어오면서 음표가 촘촘해져 **글자끼리 포개졌다.**
         앞 글자와 가까우면 한 칸 더 밀어 엇갈리게 놓는다. */
      try{
        if(typeof window._앞글X530!=='number') window._앞글X530=-999;
        if(Math.abs(noteX-window._앞글X530)<22){
          _ly528 += (su? 9 : -9) * (window._앞글층530?2:1);
          window._앞글층530 = !window._앞글층530;
        } else { window._앞글층530 = false; }
        window._앞글X530 = noteX;
      }catch(_){}
      /* ⚠️ `paint-order:stroke` 로 흰 테두리를 두르면 그것을 못 받는 곳에서
         **흰 획이 글자를 덮어 통째로 안 보인다.** 그려 보고 잡았다.
         그래서 흰 글자를 먼저 깔고 그 위에 색 글자를 얹는다 — 어디서나 된다. */
      for(var _k528=0;_k528<2;_k528++){
        var _t528=mk('text',{x:noteX, y:_ly528,
                             'font-size':7.5,'text-anchor':'middle',
                             'font-weight':'700','pointer-events':'none'},
                     _k528===0 ? 'fill:none;stroke:#fff;stroke-width:2.4px;stroke-linejoin:round;'
                               : 'fill:#0891b2;');
        _t528.textContent=_글528;
        svg.appendChild(_t528);
      }
    }
  }
}catch(_e528){}
_nPos.push({idx:idx,noteX:noteX,noteY:noteY,stemX:_stemX,stemEndY:_stemEndY,su:su,flags:_flags,dur:dur,bar:note.bar,beat:note.beat,bpb:bpb,name:note.name,tuplet:note.tuplet||0});
});
for(var _rb=0;_rb<totBars;_rb++){
(function(_bar){
var _bpb=barBpb[_bar]||4;
var _bNotes=[]; for(var _ni=0;_ni<eN.length;_ni++){if(eN[_ni].bar===_bar)_bNotes.push(eN[_ni]);}
_bNotes.sort(function(a,b){return a.beat-b.beat;});
var _rRow=Math.floor(_bar/BPR),_rBiR=_bar%BPR,_rSTop=_rRow*RH+8+ST;
function _drawRest(_rBeat,_rDur){
if(_rDur<0.1) return;
var _rx=LM+_rBiR*BAR_W+Math.min(_rBeat,_bpb-0.01)*(_rDur>=0.875?BAR_W/_bpb:BAR_W/_bpb)+12;
_rx=LM+_rBiR*BAR_W+Math.min(_rBeat,_bpb-0.01)*(BAR_W/_bpb)+12;
var _mY=_rSTop+2*LGAP, _rc='#9ca3af';
if(_rDur>=3.75){ // 온음 쉼표 — 2번째 줄 아래 hanging rect
svg.appendChild(mk('rect',{x:_rx-7,y:_mY-LGAP-2,width:14,height:4,fill:_rc}));
} else if(_rDur>=1.75){ // 2분 쉼표 — 중간 줄 위 sitting rect
svg.appendChild(mk('rect',{x:_rx-7,y:_mY-4,width:14,height:4,fill:_rc}));
} else if(_rDur>=0.875){ // 4분 쉼표 — zigzag
var _qy=_mY-LGAP;
var _qd='M '+(_rx+3)+','+(_qy-7)+' L '+(_rx-2)+','+(_qy-3)+' L '+(_rx+4)+','+(_qy)+' L '+(_rx-2)+','+(_qy+4)+' L '+(_rx+1)+','+(_qy+8);
svg.appendChild(mk('path',{d:_qd,stroke:_rc,'stroke-width':1.5,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
} else if(_rDur>=0.375){ // 8분 쉼표 — dot + slash
var _ey=_mY-LGAP;
svg.appendChild(mk('circle',{cx:_rx+2,cy:_ey-4,r:2.2,fill:_rc}));
svg.appendChild(mk('path',{d:'M '+(_rx+2)+','+(_ey-4)+' L '+(_rx-3)+','+(_ey+6),stroke:_rc,'stroke-width':1.4,fill:'none','stroke-linecap':'round'}));
} else { // 16분 쉼표 — 2dots + slash
var _fy=_mY-LGAP;
svg.appendChild(mk('circle',{cx:_rx+2,cy:_fy-6,r:1.8,fill:_rc}));
svg.appendChild(mk('circle',{cx:_rx+1,cy:_fy+1,r:1.8,fill:_rc}));
svg.appendChild(mk('path',{d:'M '+(_rx+2)+','+(_fy-6)+' L '+(_rx-3)+','+(_fy+7),stroke:_rc,'stroke-width':1.2,fill:'none','stroke-linecap':'round'}));
}
var _dv8=[.8,1.5,3.0,6.0],_isDotR8=false;
for(var _di8=0;_di8<_dv8.length;_di8++) if(Math.abs(_rDur-_dv8[_di8])<0.05){_isDotR8=true;break;}
if(_isDotR8) svg.appendChild(mk('circle',{cx:_rx+12,cy:_mY-LGAP,r:1.8,fill:_rc}));
}
var _cur=0;
for(var _nj=0;_nj<_bNotes.length;_nj++){
var _bn=_bNotes[_nj];
if(_bn.beat>_cur+0.1) _drawRest(_cur,_bn.beat-_cur);
_cur=Math.max(_cur,_bn.beat+(_bn.dur||1));
}
if(_cur<_bpb-0.1) _drawRest(_cur,_bpb-_cur);
})(_rb);
}
(function(){
var _i=0;
while(_i<_nPos.length){
if(!_beamed[_nPos[_i].idx]){_i++;continue;}
var _grp=[_nPos[_i]], _j=_i+1;
while(_j<_nPos.length&&_beamed[_nPos[_j].idx]&&_nPos[_j].bar===_nPos[_i].bar){_grp.push(_nPos[_j]);_j++;}
for(var _gi=0;_gi<_grp.length-1;_gi++){
var _ga=_grp[_gi],_gb=_grp[_gi+1];
if(_ga.bar!==_gb.bar) continue;
var _bSu=_ga.su;
var _bx1=_ga.stemX,_by1=_ga.stemEndY,_bx2=_gb.stemX,_by2=_gb.stemEndY;
var _bavgY=(_by1+_by2)/2;
var _b1Y=_bavgY+(_bSu?-1:1);
svg.appendChild(mk('rect',{x:Math.min(_bx1,_bx2),y:Math.min(_by1,_by2)+(_bSu?-3:0),width:Math.abs(_bx2-_bx1)+1,height:3,fill:'#1f2937'}));
if(_ga.flags>=2&&_gb.flags>=2){
var _b2off=_bSu?-8:8;
svg.appendChild(mk('rect',{x:Math.min(_bx1,_bx2),y:Math.min(_by1,_by2)+(_bSu?-3:0)+_b2off,width:Math.abs(_bx2-_bx1)+1,height:3,fill:'#1f2937'}));
} else if(_ga.flags>=2&&_gb.flags<2){
var _pb2off9=_bSu?-8:8;
var _pbW9=Math.max(8,Math.floor((Math.abs(_bx2-_bx1)+1)/2));
svg.appendChild(mk('rect',{x:_bx1,y:Math.min(_by1,_by2)+(_bSu?-3:0)+_pb2off9,width:_pbW9,height:3,fill:'#1f2937'}));
} else if(_ga.flags<2&&_gb.flags>=2){
var _pb2off9b=_bSu?-8:8;
var _pbW9b=Math.max(8,Math.floor((Math.abs(_bx2-_bx1)+1)/2));
svg.appendChild(mk('rect',{x:_bx2-_pbW9b,y:Math.min(_by1,_by2)+(_bSu?-3:0)+_pb2off9b,width:_pbW9b,height:3,fill:'#1f2937'}));
}
}
_i=_j;
}
})();
(function(){
var _i=0;
while(_i<_nPos.length){
if(!_beamed[_nPos[_i].idx]){_i++;continue;}
var _grp=[_nPos[_i]],_j=_i+1;
while(_j<_nPos.length&&_beamed[_nPos[_j].idx]&&_nPos[_j].bar===_nPos[_i].bar){_grp.push(_nPos[_j]);_j++;}
if(_grp.length>=2){
var _gs=_grp[0],_ge=_grp[_grp.length-1];
var _slDir=_gs.su?1:-1; // su=true(기둥 위) → 슬러 아래(1)
var _slX1=_gs.noteX-NRX+2,_slX2=_ge.noteX+NRX-2;
if(_slX2>_slX1+8){
var _slY1=_gs.noteY+_slDir*10,_slY2=_ge.noteY+_slDir*10;
var _slMX=(_slX1+_slX2)/2,_slDep=Math.min(7,(_slX2-_slX1)*0.1);
svg.appendChild(mk('path',{
d:'M '+_slX1+','+_slY1+' Q '+_slMX+','+((_slY1+_slY2)/2+_slDir*_slDep)+' '+_slX2+','+_slY2,
stroke:'#9ca3af',fill:'none','stroke-width':1.1,'stroke-linecap':'round'
}));
}
}
_i=_j;
}
})();
(function(){
var _dtArc=function(_x1,_y1,_x2,_y2,_dir){
if(_x2<=_x1+8) return;
var _sp=_x2-_x1,_dp=Math.min(12,_sp*0.22);
var _mx=(_x1+_x2)/2,_my=(_y1+_y2)/2+_dir*_dp;
svg.appendChild(mk('path',{d:'M '+_x1+','+_y1+' Q '+_mx+','+_my+' '+_x2+','+_y2,stroke:'#6b7280',fill:'none','stroke-width':1.5,'stroke-linecap':'round'}));
};
for(var _ti=0;_ti<_nPos.length-1;_ti++){
var _ta=_nPos[_ti],_tb=_nPos[_ti+1];
if(_ta.name!==_tb.name) continue;
var _sameAdj=(_ta.bar===_tb.bar&&Math.abs(_ta.beat+_ta.dur-_tb.beat)<0.12);
var _crossBar=(_tb.bar===_ta.bar+1&&_tb.beat<0.12);
if(!_sameAdj&&!_crossBar) continue;
var _tDir=_ta.su?1:-1; // 기둥 위(su) → 호 아래
var _tYA=_ta.noteY+_tDir*5, _tYB=_tb.noteY+_tDir*5;
var _rowA=Math.floor(_ta.bar/BPR),_rowB=Math.floor(_tb.bar/BPR);
if(_rowA===_rowB){
_dtArc(_ta.noteX+NRX+2,_tYA,_tb.noteX-NRX-2,_tYB,_tDir);
} else {
_dtArc(_ta.noteX+NRX+2,_tYA,LM+BPR*BAR_W-6,_tYA,_tDir);
_dtArc(LM+6,_tYB,_tb.noteX-NRX-2,_tYB,_tDir);
}
}
})();
(function(){
var _ti=0;
while(_ti<_nPos.length){
var _tp=_nPos[_ti];
if(!_tp.tuplet){_ti++;continue;}
var _grp=[_tp],_tj=_ti+1;
while(_tj<_nPos.length&&_nPos[_tj].tuplet===_tp.tuplet&&_nPos[_tj].bar===_tp.bar){
_grp.push(_nPos[_tj]);_tj++;
}
if(_grp.length>=2){
var _tsu=_grp[0].su;
var _bx1=_grp[0].noteX-NRX,_bx2=_grp[_grp.length-1].noteX+NRX;
var _tipY=_tsu
?Math.min.apply(null,_grp.map(function(g){return g.stemEndY;}))
:Math.max.apply(null,_grp.map(function(g){return g.stemEndY;}));
var _by=_tipY+(_tsu?-12:12),_dir=_tsu?-1:1;
svg.appendChild(mk('path',{
d:'M '+_bx1+','+(_by+_dir*5)+' L '+_bx1+','+_by+' L '+_bx2+','+_by+' L '+_bx2+','+(_by+_dir*5),
stroke:'#374151',fill:'none','stroke-width':1.2
}));
var _nt=mk('text',{x:(_bx1+_bx2)/2,y:_by-_dir*3,
'text-anchor':'middle','font-size':9,'font-family':'Arial,sans-serif',
fill:'#374151','font-style':'italic'});
_nt.textContent=String(_tp.tuplet); svg.appendChild(_nt);
}
_ti=_tj;
}
})();
svg.addEventListener('pointerdown',function(e){
var t=e.target, ni=-1;
while(t&&t!==svg){ if(t.dataset&&t.dataset.idx!=null){ ni=parseInt(t.dataset.idx); break; } t=t.parentNode; }
if(ni<0) return;
dragState.active=true; dragState.idx=ni; dragState.justDragged=false; dragState.startY=e.clientY;
dragState.sTop=Math.floor(eN[ni].bar/BPR)*RH+8+ST;
dragState.currentSlot=ns(eN[ni].name);
var iy=sy(dragState.currentSlot,dragState.sTop);
var bir2=Math.min(BPR,totBars-Math.floor(eN[ni].bar/BPR)*BPR);
dragLine.setAttribute('x2',String(LM+bir2*BAR_W+4));
dragLine.setAttribute('y1',String(iy)); dragLine.setAttribute('y2',String(iy));
dragLine.style.display=''; svg.setPointerCapture(e.pointerId); e.preventDefault();
});
svg.addEventListener('pointermove',function(e){
if(!dragState.active) return;
var rect=svg.getBoundingClientRect();
var svgY=(e.clientY-rect.top)/rect.height*svgH;
var slot=Math.round((dragState.sTop+4*LGAP-svgY)/HGAP);
dragState.currentSlot=Math.max(-6,Math.min(16,slot));
var iy=sy(dragState.currentSlot,dragState.sTop);
dragLine.setAttribute('y1',String(iy)); dragLine.setAttribute('y2',String(iy));
});
svg.addEventListener('pointerup',function(e){
if(!dragState.active) return;
dragLine.style.display='none';
if(Math.abs(e.clientY-dragState.startY)>6){
eN[dragState.idx].name=slotToName(dragState.currentSlot);
selI=dragState.idx; dragState.justDragged=true;
}
dragState.active=false; redraw();
});
svg.addEventListener('pointercancel',function(){ dragState.active=false; if(dragLine) dragLine.style.display='none'; redraw(); });
svg.addEventListener('click',function(e){
if(dragState.justDragged){ dragState.justDragged=false; return; }
var t=e.target, ni=-1;
while(t&&t!==svg){ if(t.dataset&&t.dataset.idx!=null){ ni=parseInt(t.dataset.idx); break; } t=t.parentNode; }
if(ni>=0){ selI=(selI===ni)?-1:ni; redraw(); return; }
if(addMode){
var rect=svg.getBoundingClientRect();
var svgX=(e.clientX-rect.left)/rect.width*svgW;
var svgY=(e.clientY-rect.top)/rect.height*svgH;
var row2=Math.floor((svgY-8)/RH); if(row2<0||row2>=rows) return;
var sTop2=row2*RH+8+ST;
if(svgY<sTop2-LGAP||svgY>sTop2+5*LGAP) return;
var xInRow=svgX-LM; if(xInRow<0) return;
var biR=Math.floor(xInRow/BAR_W), bar2=row2*BPR+biR;
if(bar2>=totBars) return;
var bpb2=barBpb[bar2]||4;
var xInBar=xInRow-biR*BAR_W-12;
var beat2=Math.max(0,Math.round(xInBar/(BAR_W/bpb2)*2)/2);
beat2=Math.min(bpb2-0.5,beat2);
var slot2=Math.max(-4,Math.min(14,Math.round((sTop2+4*LGAP-svgY)/HGAP)));
var newName=slotToName(slot2);
var dup=eN.some(function(n){ return n.bar===bar2&&Math.abs(n.beat-beat2)<0.26; });
if(!dup){
eN.push({bar:bar2,beat:beat2,name:inputIsRest?'R':newName,bpb:bpb2,dur:inputDur}); // cgo-265: 박자/쉼표 적용
eN.sort(function(a,b2){ return a.bar-b2.bar||a.beat-b2.beat; });
selI=eN.findIndex(function(n){ return n.bar===bar2&&Math.abs(n.beat-beat2)<0.02; });
}
redraw(); return;
}
selI=-1; redraw();
});
/* cgo-505: 그린 쪽이 '내가 어떤 자리에 그렸는지'를 적어 둔다.
   cgo-502 에서 그리는 쪽만 폰 1마디·태블릿 2마디로 바꾸고 불 켜는 쪽은 4마디로
   두어서, 폰에서 둘째 마디부터 불이 엉뚱한 줄에 켜졌다. 숫자를 두 군데서 따로
   정하면 또 어긋난다. 이제 한 군데서만 정하고, 불 켜는 쪽은 이것을 읽는다. */
try{
  /* cgo-512: 음표 자리 목록은 음표 불에만 쓰였다. 그 기능을 지웠으므로 여기서도 뺀다.
     마디 띠가 쓰는 '한 줄 마디 수·칸 너비' 같은 자리 숫자만 남긴다. */
  /* cgo-514 (2026-10-09) : 음표 자리를 **다시 내보낸다**.
     cgo-512 에서 "음표 불을 지웠으니 자리도 뺀다"고 뺐는데, 자리를 만드는
     품은 어차피 들고 있었다 — `_nPos` 는 보표 잇는 선을 그리느라 늘 채워진다.
     새로 세는 게 아니라 **이미 있는 것을 복사**하는 것이라 값이 0 에 가깝다.
       x,y = 화면 자리 · b = 곡 처음부터 몇 박째 · d = 몇 박짜리
     ⚠️ 불 켜는 쪽은 이것이 없어도 **그냥 안 켜질 뿐** 마디 띠는 계속 돈다.
        둘을 묶어 놓으면 하나가 탈 날 때 둘 다 죽는다. */
  var _음표514=[];
  try{
    for(var _pi514=0;_pi514<_nPos.length;_pi514++){
      var _p514=_nPos[_pi514];
      if(typeof _p514.noteX!=='number'||typeof _p514.noteY!=='number') continue;
      var _bpb514=_p514.bpb||4;
      _음표514.push({x:_p514.noteX, y:_p514.noteY,
                     b:_p514.bar*_bpb514+(_p514.beat||0), d:_p514.dur||0.5});
    }
    _음표514.sort(function(a,b){return a.b-b.b;});
  }catch(_e514){ _음표514=[]; }
  window._cgo악보판={BPR:BPR,LM:LM,ST:ST,LGAP:LGAP,LYRICS_H:LYRICS_H,RH:RH,
                     cW:cW,BAR_W:BAR_W,bpm:bpm,rows:rows,totBars:totBars,
                     음표:_음표514, 때:Date.now()};
  try{ console.log('%c[cgo-514] 악보 자리 적음 — 한 줄 '+BPR+'마디 · 음표 '+_음표514.length+'개','color:#0891b2'); }catch(_){}
}catch(e){ try{ console.warn('[cgo-512] 악보 자리 못 적음:', e&&e.message); }catch(_){} }
return svg;
}
if(window._cgoScoreKd){ document.removeEventListener('keydown',window._cgoScoreKd); }
window._cgoScoreKd=function(e){
if(selI<0) return;
if(e.key==='ArrowUp'){ e.preventDefault(); eN[selI].name=shiftN(eN[selI].name,1); redraw(); }
else if(e.key==='ArrowDown'){ e.preventDefault(); eN[selI].name=shiftN(eN[selI].name,-1); redraw(); }
else if(e.key==='Delete'||e.key==='Backspace'){ // 🅑 삭제
e.preventDefault();
eN.splice(selI,1); selI=eN.length?Math.min(selI,eN.length-1):-1; redraw();
}
};
document.addEventListener('keydown',window._cgoScoreKd);
function redraw(){
if(selI>=0&&selI<eN.length) lastBar=eN[selI].bar; // cgo-299: 지금 만지는 마디
canvasWrap.style.display='block';
canvasWrap.innerHTML='';
var hdr=document.createElement('div');
hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:6px 10px 4px;gap:5px;flex-wrap:wrap;border-bottom:1px solid #f3f4f6;';
var ttl=document.createElement('span');
ttl.style.cssText='font-size:11px;font-weight:bold;color:#374151;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
ttl.textContent='🎼 CGO · ♩='+bpm+' · '+rootName;
hdr.appendChild(ttl);
var bw=document.createElement('div');
bw.style.cssText='display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;';
function mkBtn(txt,bg,fg,title){
var b=document.createElement('button');
b.textContent=txt; if(title) b.title=title;
b.style.cssText='font-size:11px;padding:3px 8px;border-radius:6px;background:'+bg+';color:'+fg+';border:none;cursor:pointer;white-space:nowrap;';
return b;
}
var pBtn=mkBtn('▶ 전체','#3b82f6','#fff','처음부터 끝까지 재생 (CGO 신디)');
var _tb299=(selI>=0&&selI<eN.length)?eN[selI].bar:lastBar;
var ptBtn=mkBtn('⏯ 부분'+(_tb299>=0?' '+(_tb299+1)+'마디':''),'#8b5cf6','#fff','지금 만지는 마디만 재생');
var sBtn=mkBtn('⏹ 멈춤','#6b7280','#fff','재생 중지');
_bAll=pBtn; _bPart=ptBtn; _bStop=sBtn; // cgo-299
var aBtn=mkBtn('➕ 추가',addMode?'#f59e0b':'#f3f4f6',addMode?'#fff':'#374151','오선지를 클릭해서 음표 추가');
/* cgo-516 : 단추 이름을 사람 말로 바꿨다.
   「🎵 MIDI」 만 적혀 있으니, 그냥 듣고 싶은 손님이 눌렀다가
   윈도우가 QuickTime 을 띄워 "Please install Apple Application Support" 를 봤다.
   MIDI 는 소리가 든 파일이 아니라 **설계도**다. 이름이 그걸 말해 줘야 한다. */
var mBtn=mkBtn('🎹 미디 파일','#94a3b8','#fff',
               '음악 만드는 프로그램에 넣을 때 씁니다 (MIDI). 음 높이와 길이만 들어갑니다.');
var xBtn=mkBtn('🎼 악보 파일','#10b981','#fff',
               '다른 악보 프로그램에서 열어 고칠 때 씁니다 (MusicXML). 무료 MuseScore 로 열립니다.');
/* cgo-518 : 가사를 한 마디씩 밀고 당긴다. 전주가 몇 마디인지는 알 수 없으니
   파트너가 눈으로 보고 맞추는 것이 가장 빠르고 가장 정확하다. */
var lLBtn=mkBtn('◀ 가사','#7c3aed','#fff','가사를 한 마디 앞으로 당깁니다');
var lRBtn=mkBtn('가사 ▶','#7c3aed','#fff','가사를 한 마디 뒤로 밉니다 — 전주만큼 밀어 주세요');
var rBtn=mkBtn('↩ 원본','#f3f4f6','#374151');
var cpBtn=mkBtn('📋 복사','#0ea5e9','#fff','악보를 이미지로 복사');
/* ═══ cgo-520 (2026-10-09) : 단추를 사람 말로, 차례도 사람 차례로 ═══
   파트너 — "음표도 모르는 사람들은… 저도 저것이 무슨 말인지 모르겠는데"
   그 말이 맞다. 「MusicXML」「MIDI」는 음악 하는 사람 말이고, 정작 대부분이 원하는
   「그림으로 저장」이 맨 뒤에 있었다. 앞뒤를 바꾸고, 전문가 것은 한 단추 뒤로 숨긴다.
   숨긴다고 없어지는 게 아니다 — **찾는 사람만 찾게** 두는 것이다. */
var wavBtn=mkBtn('🔊 소리로 저장','#0d9488','#fff','들을 수 있는 소리 파일로 저장합니다 — 아무 데서나 열립니다. 프로그램 필요 없습니다');
var pdfBtn=mkBtn('📄 인쇄용 PDF','#8b5cf6','#fff','A4 여러 장으로 나눠 저장합니다 — 인쇄해서 들고 다니기 좋습니다');
pdfBtn.id='cgo-sc-pdf522';
wavBtn.id='cgo-sc-wavsave521';
var imgBtn=mkBtn('🖼 악보 그림 저장','#8b5cf6','#fff','악보를 그림 파일로 저장합니다 — 바로 보이고 인쇄됩니다');
var proBtn=mkBtn('🎼 전문가용 파일 ▾','#64748b','#fff','음악 프로그램에서 쓰는 파일 — 그 프로그램이 있어야 열립니다');
bw.appendChild(pBtn); bw.appendChild(ptBtn); bw.appendChild(sBtn); bw.appendChild(aBtn); /* cgo-519 : 자동 채우기가 꺼져 있으면 밀기 단추도 안 보인다 — 밀 것이 없다 */
if(가사자동515){ bw.appendChild(lLBtn); bw.appendChild(lRBtn); }
/* cgo-520 : 사람이 많이 쓰는 것부터. 전문가용 둘은 proBtn 을 눌러야 나온다. */
bw.appendChild(wavBtn); bw.appendChild(imgBtn); bw.appendChild(pdfBtn); bw.appendChild(cpBtn); bw.appendChild(rBtn); bw.appendChild(proBtn);
xBtn.style.display='none'; mBtn.style.display='none';
bw.appendChild(xBtn); bw.appendChild(mBtn);
pdfBtn.addEventListener('click',function(){
  try{
    pdfBtn.disabled=true; pdfBtn.style.opacity='.5'; pdfBtn.textContent='⏳ PDF 만드는 중...';
    _악보PDF522();
  }catch(ex){
    _되돌리기522();
    alert('PDF 를 만들지 못했습니다.\n잠시 뒤 다시 눌러 주세요.');
  }
});
wavBtn.addEventListener('click',function(){
  try{
    _자동받기521 = true;
    wavBtn.disabled = true; wavBtn.style.opacity='.5'; wavBtn.textContent='⏳ 소리 만드는 중...';
    var _rb521 = canvasWrap.querySelector('#cgo-sc-wavbtn');
    if(_rb521){ _rb521.click(); }                       /* 아래 패널의 만들기 단추를 대신 눌러 준다 */
    else { _renderWav(wavBtn, canvasWrap.querySelector('#cgo-sc-wavdl')); }
  }catch(ex){
    _자동받기521=false;
    wavBtn.disabled=false; wavBtn.style.opacity='1'; wavBtn.textContent='🔊 소리로 저장';
    alert('소리 파일을 만들지 못했습니다.\n잠시 뒤 다시 눌러 주세요.');
  }
});
proBtn.addEventListener('click',function(){
  var 열림 = (xBtn.style.display==='none');
  xBtn.style.display = 열림 ? '' : 'none';
  mBtn.style.display = 열림 ? '' : 'none';
  proBtn.textContent = 열림 ? '🎼 전문가용 파일 ▴' : '🎼 전문가용 파일 ▾';
});
hdr.appendChild(bw);
canvasWrap.appendChild(hdr);
var tw=document.createElement('div');
tw.style.cssText='padding:4px 8px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;flex-wrap:wrap;gap:4px;align-items:center;';
function _mkTb(txt,active,ac,cb){
var b=document.createElement('button');
b.textContent=txt;
b.style.cssText='font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid '+(active?ac:'#d1d5db')+';background:'+(active?ac:'#fff')+';color:'+(active?'#fff':'#374151')+';cursor:pointer;white-space:nowrap;';
b.addEventListener('click',cb); return b;
}
tw.appendChild(_mkTb('♩ 음표',!inputIsRest,'#3b82f6',function(){ inputIsRest=false; redraw(); }));
tw.appendChild(_mkTb('𝄽 쉼표',inputIsRest,'#3b82f6',function(){ inputIsRest=true; redraw(); }));
var _sp65=document.createElement('span'); _sp65.style.cssText='width:1px;height:16px;background:#e5e7eb;flex-shrink:0;'; tw.appendChild(_sp65);
if(selI>=0&&selI<eN.length){
var _durLbl=document.createElement('span');
_durLbl.style.cssText='font-size:10px;color:#7c3aed;font-weight:bold;white-space:nowrap;margin-right:1px;';
_durLbl.textContent='📝 박자:';
tw.appendChild(_durLbl);
}
[{l:'온',d:4,s:'○'},{l:'2분',d:2,s:'○'},{l:'4분',d:1,s:'♩'},{l:'8분',d:0.5,s:'♪'},{l:'16분',d:0.25,s:'♬'}].forEach(function(dk){
var _activeDur=(selI>=0&&selI<eN.length)?(eN[selI].dur||1):inputDur;
tw.appendChild(_mkTb(dk.s+' '+dk.l,Math.abs(_activeDur-dk.d)<0.01,'#7c3aed',(function(dv){ return function(){
inputDur=dv;
if(selI>=0&&selI<eN.length){ eN[selI].dur=dv; } // cgo-276: 선택 음표 박자 즉시 변경
redraw();
}; })(dk.d)));
});
var _sp65b=document.createElement('span'); _sp65b.style.cssText='width:1px;height:16px;background:#e5e7eb;flex-shrink:0;'; tw.appendChild(_sp65b);
var _sDel65=document.createElement('button');
_sDel65.textContent='🗑 선택삭제'; _sDel65.title='선택 음표/쉼표 삭제';
_sDel65.style.cssText='font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid #fca5a5;background:#fff5f5;color:#dc2626;cursor:pointer;';
_sDel65.addEventListener('click',function(){ if(selI>=0&&selI<eN.length){ eN.splice(selI,1); selI=eN.length?Math.min(selI,eN.length-1):-1; redraw(); } });
tw.appendChild(_sDel65);
var _lDel65=document.createElement('button');
_lDel65.textContent='↩ 마지막삭제'; _lDel65.title='마지막 음표/쉼표 삭제';
_lDel65.style.cssText='font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid #fca5a5;background:#fff5f5;color:#dc2626;cursor:pointer;';
_lDel65.addEventListener('click',function(){ if(eN.length>0){ if(selI>=eN.length-1) selI=eN.length-2; eN.pop(); redraw(); } });
tw.appendChild(_lDel65);
var _sp65c=document.createElement('span'); _sp65c.style.cssText='width:1px;height:16px;background:#e5e7eb;flex-shrink:0;'; tw.appendChild(_sp65c);
var _bL65=document.createElement('span'); _bL65.style.cssText='font-size:10px;color:#374151;white-space:nowrap;'; _bL65.textContent='BPM:'; tw.appendChild(_bL65);
var _bSlider65=document.createElement('input'); _bSlider65.type='range'; _bSlider65.min=40; _bSlider65.max=240; _bSlider65.value=bpm; _bSlider65.step=1;
_bSlider65.style.cssText='width:80px;height:3px;cursor:pointer;accent-color:#3b82f6;vertical-align:middle;';
var _bVal65=document.createElement('span'); _bVal65.style.cssText='font-size:10px;color:#3b82f6;font-weight:bold;min-width:24px;text-align:center;'; _bVal65.textContent=String(bpm);
_bSlider65.addEventListener('input',function(){ bpm=parseInt(_bSlider65.value); beatMs=60000/bpm; _bVal65.textContent=String(bpm); ttl.textContent='🎼 CGO · ♩='+bpm+' · '+rootName; });
tw.appendChild(_bSlider65); tw.appendChild(_bVal65);
canvasWrap.appendChild(tw);
_scMsg=document.createElement('div'); // cgo-299: 재생 안내 한 줄
_scMsg.style.cssText='display:none;font-size:10.5px;color:#6d28d9;padding:3px 10px;background:#faf5ff;border-bottom:1px solid #ede9fe;';
canvasWrap.appendChild(_scMsg);
if(selI>=0&&selI<eN.length){
var hint=document.createElement('div');
hint.style.cssText='font-size:10px;color:#7c3aed;padding:2px 10px;background:#f5f3ff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:3px;';
var htxt=document.createElement('span');
var hChord=barChords[eN[selI].bar]||'';
htxt.textContent='🎵 '+eN[selI].name+(hChord?' ('+hChord+')':'')+' · ↑↓ 반음 · 드래그 이동';
hint.appendChild(htxt);
var sbw=document.createElement('span'); sbw.style.cssText='display:flex;gap:3px;';
var upBtn=mkBtn('▲','#7c3aed','#fff'); upBtn.style.fontSize='11px'; upBtn.style.padding='1px 6px';
var dnBtn=mkBtn('▼','#7c3aed','#fff'); dnBtn.style.fontSize='11px'; dnBtn.style.padding='1px 6px';
var dlBtn=mkBtn('🗑','#ef4444','#fff','선택 음표 삭제'); dlBtn.style.fontSize='11px'; dlBtn.style.padding='1px 6px';
upBtn.addEventListener('click',function(){ if(selI>=0&&selI<eN.length){ eN[selI].name=shiftN(eN[selI].name,1); redraw(); } });
dnBtn.addEventListener('click',function(){ if(selI>=0&&selI<eN.length){ eN[selI].name=shiftN(eN[selI].name,-1); redraw(); } });
dlBtn.addEventListener('click',function(){ if(selI>=0&&selI<eN.length){ eN.splice(selI,1); selI=eN.length?Math.min(selI,eN.length-1):-1; redraw(); } });
sbw.appendChild(upBtn); sbw.appendChild(dnBtn); sbw.appendChild(dlBtn);
hint.appendChild(sbw);
canvasWrap.appendChild(hint);
}
var sd=document.createElement('div');
sd.style.cssText='overflow-x:auto;-webkit-overflow-scrolling:touch;padding:6px 6px 8px;';
canvasWrap.appendChild(sd);
var svg=drawSvg();
sd.appendChild(svg);
_curSvg=svg; if(PB.playing&&PB.bar>=0) _hl(PB.bar); _syncBtns(); // cgo-299
svg.setAttribute('draggable','true');
svg.style.cursor='grab';
svg.style.touchAction='auto'; // 터치 드래그 허용
svg.addEventListener('dragstart',function(ev){
svg.style.cursor='grabbing';
try{
var svgData355 = new XMLSerializer().serializeToString(svg);
var svgBlob355 = new Blob([svgData355], {type:'image/svg+xml;charset=utf-8'});
var url355 = URL.createObjectURL(svgBlob355);
ev.dataTransfer.setData('text/uri-list', url355);
ev.dataTransfer.setData('text/plain', '악보: CGO ('+bpm+' BPM)');
ev.dataTransfer.effectAllowed = 'copy';
try{
var _dImg355 = new Image();
_dImg355.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData355)));
ev.dataTransfer.setDragImage(_dImg355, 30, 30);
}catch(e){}
_svgToCanvas354(function(cvs){
if(cvs){ try{ window._cgoDragPng355 = cvs.toDataURL('image/png'); }catch(e){} }
});
}catch(ex){ console.warn('[CGO-355] drag start err:', ex); }
});
svg.addEventListener('dragend',function(){ svg.style.cursor='grab'; });
var rrWrap=document.createElement('div');
rrWrap.style.cssText='padding:8px 10px 10px;border-top:1px solid #f3f4f6;';
var rrLbl=document.createElement('div');
rrLbl.style.cssText='font-size:11px;font-weight:700;color:#0d9488;margin-bottom:6px;';
rrLbl.textContent='🎹 CGO 신디사이저 — 음색 (전체·부분·WAV 공통)';
rrWrap.appendChild(rrLbl);
var rrSel=document.createElement('select');
rrSel.style.cssText='width:100%;padding:5px 8px;border-radius:7px;border:1px solid rgba(13,148,136,.4);background:rgba(255,255,255,.9);color:#374151;font-size:11px;margin-bottom:6px;cursor:pointer;font-family:inherit;';
rrSel.innerHTML=CGO_SYN_LIST.map(function(x){ return '<option value="'+x[0]+'"'+(x[0]===synthPW?' selected':'')+'>'+x[1]+'</option>'; }).join('');
rrSel.addEventListener('change',function(){ synthPW=rrSel.value; });
rrWrap.appendChild(rrSel);
/* ═══ cgo-524 : 반주 음색을 따로 고른다 ═══
   위 칸은 **가락**만 바꾼다. 아래 둘은 **반주**다.
   가락이 바이올린인데 베이스까지 바이올린이면 곡이 안 된다. */
(function(){
  var 줄=document.createElement('div');
  줄.style.cssText='font-size:11px;font-weight:700;color:#7c3aed;margin:8px 0 6px;';
  줄.textContent='🎼 반주 음색 (화음·베이스)';
  rrWrap.appendChild(줄);
  function 칸(라벨, 지금, 바꿈, 끄기){
    var w=document.createElement('div');
    w.style.cssText='display:flex;align-items:center;gap:6px;margin-bottom:5px;';
    var t=document.createElement('span');
    t.style.cssText='font-size:11px;color:#6b7280;min-width:44px;';
    t.textContent=라벨; w.appendChild(t);
    var sel=document.createElement('select');
    sel.style.cssText='flex:1;padding:5px 8px;border-radius:7px;border:1px solid rgba(124,58,237,.35);'
      +'background:rgba(255,255,255,.9);color:#374151;font-size:11px;';
    sel.innerHTML=(끄기?'<option value="">— 끄기 —</option>':'')
      +CGO_SYN_LIST.map(function(x){
        return '<option value="'+x[0]+'"'+(x[0]===지금?' selected':'')+'>'+x[1]+'</option>'; }).join('');
    sel.addEventListener('change',function(){ 바꿈(sel.value); });
    w.appendChild(sel); rrWrap.appendChild(w);
    return sel;
  }
  칸('화음', 반주악기524, function(v){ 반주악기524=v||'piano'; 반주523=!!v; }, true);
  칸('베이스', 베이스악기524, function(v){ 베이스악기524=v||'double_bass'; }, false);
  /* ═══ cgo-550 : 편곡 상자 — 겹 여덟에 크기·울림 손잡이 ═══
     전에는 크기 손잡이가 **하나**였다. 화음을 올리면 베이스와 깔개가 같이 올라갔다.
     이제 겹마다 따로 쥔다. 손잡이를 미는 **그 순간** 소리가 바뀐다 —
     다시 눌러서 들으면 귀로 못 맞춘다. */
  var 접개=document.createElement('button');
  접개.type='button';
  접개.style.cssText='width:100%;margin-top:8px;padding:7px 10px;border-radius:8px;cursor:pointer;'
    +'border:1px solid rgba(124,58,237,.35);background:rgba(124,58,237,.08);color:#6d28d9;'
    +'font-size:11px;font-weight:800;text-align:left;';
  접개.textContent='🎚 편곡 상자 — 겹마다 크기·울림  ▾';
  rrWrap.appendChild(접개);
  var 상자=document.createElement('div');
  상자.style.cssText='display:none;margin-top:6px;padding:8px;border-radius:9px;'
    +'border:1px solid rgba(124,58,237,.22);background:rgba(124,58,237,.04);';
  rrWrap.appendChild(상자);
  접개.addEventListener('click',function(){
    var 열림=(상자.style.display!=='none');
    상자.style.display=열림?'none':'block';
    접개.textContent='🎚 편곡 상자 — 겹마다 크기·울림  '+(열림?'▾':'▴');
  });
  var 머리=document.createElement('div');
  머리.style.cssText='display:flex;gap:4px;font-size:9.5px;color:#9ca3af;margin-bottom:4px;padding-left:62px;';
  머리.innerHTML='<span style="flex:1">크기</span><span style="flex:1;padding-left:40px">울림</span>';
  상자.appendChild(머리);
  var 칸들={};
  _역할차례550.forEach(function(역){
    var v=_값550[역]; if(!v) return;
    var 줄2=document.createElement('div');
    줄2.style.cssText='display:flex;align-items:center;gap:4px;margin-bottom:4px;';
    var 이름=document.createElement('span');
    이름.style.cssText='font-size:10.5px;color:#4b5563;min-width:58px;font-weight:600;';
    이름.textContent=(_역할그림550[역]||'')+' '+역;
    줄2.appendChild(이름);
    function 손(무엇, 최대){
      var sl=document.createElement('input');
      sl.type='range'; sl.min='0'; sl.max=String(Math.round(최대*100)); sl.step='1';
      sl.value=String(Math.round(v[무엇]*100)); sl.style.cssText='flex:1;min-width:0;';
      var lb=document.createElement('span');
      lb.style.cssText='font-size:10px;color:#7c3aed;min-width:30px;text-align:right;font-weight:700;';
      lb.textContent=Math.round(v[무엇]*100)+'%';
      sl.addEventListener('input',function(){
        var x=(+sl.value)/100; lb.textContent=sl.value+'%';
        try{ _손잡이550(역, 무엇, x); }catch(_){}
      });
      줄2.appendChild(sl); 줄2.appendChild(lb);
      return {sl:sl, lb:lb};
    }
    칸들[역]={ 크기:손('크기',1.2), 울림:손('울림',1.0) };
    상자.appendChild(줄2);
  });
  var 아래=document.createElement('div');
  아래.style.cssText='display:flex;gap:5px;margin-top:6px;';
  function 단추(글, 함){
    var bb=document.createElement('button'); bb.type='button'; bb.textContent=글;
    bb.style.cssText='flex:1;padding:6px;border-radius:7px;cursor:pointer;font-size:10.5px;'
      +'font-weight:700;border:1px solid rgba(124,58,237,.3);background:#fff;color:#6d28d9;';
    bb.addEventListener('click',함); 아래.appendChild(bb); return bb;
  }
  단추('↺ 처음으로', function(){
    _역할차례550.forEach(function(역){
      var o=_처음값550[역]; if(!o||!칸들[역]) return;
      ['크기','울림'].forEach(function(무엇){
        var x=o[무엇];
        칸들[역][무엇].sl.value=String(Math.round(x*100));
        칸들[역][무엇].lb.textContent=Math.round(x*100)+'%';
        try{ _손잡이550(역, 무엇, x); }catch(_){}
      });
    });
  });
  var 숫자칸=document.createElement('textarea');
  숫자칸.readOnly=true;숫자칸.rows=5;   /* cgo-550 : 여덟 겹이 안 잘리게 */
  숫자칸.style.cssText='display:none;width:100%;margin-top:6px;font-size:10px;line-height:1.5;'
    +'padding:6px;border-radius:7px;border:1px solid rgba(124,58,237,.25);'
    +'background:#fff;color:#374151;resize:vertical;';
  단추('🔢 숫자 보기', function(){
    var 줄들=_역할차례550.map(function(역){
      var v=_값550[역]; if(!v) return '';
      return 역+' 크기'+Math.round(v.크기*100)+' 울림'+Math.round(v.울림*100);
    }).filter(Boolean);
    숫자칸.value=줄들.join(' / ');
    숫자칸.style.display='block';
    try{ 숫자칸.select(); }catch(_){}
  });
  상자.appendChild(아래); 상자.appendChild(숫자칸);
  var 안=document.createElement('div');
  안.style.cssText='font-size:10px;color:#9ca3af;margin-top:5px;line-height:1.5;';
  안.textContent='크기·울림은 미는 즉시 바뀝니다. 음색은 바꾼 뒤 ▶ 전체를 다시 누르세요.';
  rrWrap.appendChild(안);
})();
var rrBtn=document.createElement('button');
rrBtn.id='cgo-sc-wavbtn';
rrBtn.textContent=_lastWavUrl?'🔄 다시 렌더링':'🎹 CGO 신디로 WAV 만들기';
rrBtn.style.cssText='width:100%;padding:6px 12px;border-radius:8px;background:rgba(13,148,136,.1);border:1.5px solid rgba(13,148,136,.3);color:#0d9488;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
rrWrap.appendChild(rrBtn);
var rrDl=document.createElement('a');
rrDl.id='cgo-sc-wavdl';
rrDl.style.cssText='display:'+(_lastWavUrl?'block':'none')+';width:100%;margin-top:5px;padding:6px 12px;border-radius:8px;background:rgba(16,185,129,.1);border:1.5px solid rgba(16,185,129,.3);color:#059669;font-size:11px;font-weight:700;text-align:center;text-decoration:none;box-sizing:border-box;';
rrDl.textContent='🎵 소리로 저장 — 어디서나 바로 열립니다';   /* cgo-516 */
if(_lastWavUrl){ rrDl.href=_lastWavUrl; rrDl.download='cgo-score.wav'; }
rrWrap.appendChild(rrDl);
canvasWrap.appendChild(rrWrap);
pBtn.addEventListener('click',function(){
if(PB.playing&&PB.mode==='all'){ window._cgoScoreStop(); return; }
_scPlay('all');
});
ptBtn.addEventListener('click',function(){ _scPlay('part'); });
sBtn.addEventListener('click',function(){
window._cgoScoreStop();
try{ if(typeof window._cgoSrvStopPlayback==='function') window._cgoSrvStopPlayback(); }catch(ex){}
});
aBtn.addEventListener('click',function(){ addMode=!addMode; redraw(); });
function _가사밀자518(d){
  try{
    _가사밀기518 = Math.max(0, _가사밀기518 + d);
    _가사채우기518();
    redraw();
    try{ console.log('%c[cgo-518] 가사 밀기 '+_가사밀기518+'마디','color:#7c3aed'); }catch(_){}
  }catch(ex){ try{ console.warn('[cgo-518] 가사 밀기 오류:', ex&&ex.message); }catch(_){} }
}
lLBtn.addEventListener('click',function(){ _가사밀자518(-1); });
lRBtn.addEventListener('click',function(){ _가사밀자518(+1); });
xBtn.addEventListener('click',function(){
  try{ generateMusicXML(); }
  catch(ex){ alert('악보 파일을 만들지 못했습니다.\n잠시 뒤 다시 눌러 주세요.'); }
});
/* cgo-516 : MIDI 를 누르면 한 줄 알려 준다. 모르고 누른 손님이 애플 창을 보지 않게. */
mBtn.addEventListener('click',function(){
  /* cgo-520 : 겁주는 확인창을 없앴다. 전문가용 서랍을 열어야 보이는 단추라
     여기까지 온 사람에게 또 물을 까닭이 없다. 실패했을 때만 사람 말로 알려 준다. */
  try{ generateMidi(); }
  catch(ex){ alert('미디 파일을 만들지 못했습니다.\n잠시 뒤 다시 눌러 주세요.'); }
});
rBtn.addEventListener('click',function(){
eN=origN.map(function(n){ return {bar:n.bar,beat:n.beat,name:n.name,bpb:n.bpb,dur:n.dur,tuplet:n.tuplet,grace:n.grace}; });
selI=-1; addMode=false; redraw();
});
/* ════════════════════════════════════════════════════════════════════
   cgo-522 (2026-10-09) : 악보를 **PDF** 로 저장한다.

   왜 — PNG 는 종이 크기 개념이 없다. 76마디짜리를 인쇄하면 A4 한 장에 구겨진다.
        PDF 는 A4 여러 장으로 나뉘어 들고 다니며 볼 수 있다.

   왜 손으로 만드나 — jsPDF 같은 바깥 꾸러미를 CDN 에서 불러오면
        ① 인터넷이 없을 때 안 된다 (우리는 온디바이스 앱이다)
        ② 앱이 무거워진다  ③ 남의 서버가 죽으면 우리가 죽는다
        PDF 는 글 구조라 손으로 쓸 수 있다. 아래가 전부다.

   어떻게 — 이미 있는 `_svgToCanvas354` 가 악보를 큰 그림 한 장으로 만들어 준다.
        그것을 A4 높이만큼 **가로로 잘라** 장마다 한 조각씩 넣는다.
        조각은 JPEG 으로 굽고 PDF 의 /DCTDecode 로 그대로 품는다 — 다시 풀 일이 없다.
   ⚠️ 셈이 가볍다. 고리를 새로 돌리지 않는다 — 장 수만큼만 돈다 (서너 번).
   ════════════════════════════════════════════════════════════════════ */
function _악보PDF522(){
  var A4W=595.28, A4H=841.89, 여백=28;          /* 1pt = 1/72인치. A4 = 210×297mm */
  var 칸W=A4W-여백*2, 칸H=A4H-여백*2;
  function _바이트(s){ var a=new Uint8Array(s.length); for(var i=0;i<s.length;i++) a[i]=s.charCodeAt(i)&0xFF; return a; }
  function _JPEG바이트(dataUrl){ return _바이트(atob(dataUrl.split(',')[1])); }

  _svgToCanvas354(function(cvs){
    if(!cvs){ alert('악보를 그림으로 만들지 못했습니다.\n잠시 뒤 다시 눌러 주세요.'); _되돌리기522(); return; }
    try{
      var W=cvs.width, H=cvs.height;
      var 배율=칸W/W;                               /* 가로를 종이 폭에 맞춘다 */
      var 담을px=Math.max(40, Math.floor(칸H/배율)); /* 한 장에 들어갈 그림 높이(픽셀) */
      /* ⚠️ cgo-522 : 처음엔 그냥 담을px 만큼 잘랐더니 **악보 줄 한가운데가 잘렸다.**
         1쪽 맨 아래 줄의 아랫도리가 2쪽 꼭대기에 붙었다 (그려 보고 알았다).
         악보는 '줄' 단위로 끊어야 한다. 한 줄 높이로 나누어떨어지게 맞춘다. */
      var 한장px=담을px, 줄수=0;
      try{ var _p522=window._cgo악보판; if(_p522&&_p522.rows>0) 줄수=_p522.rows; }catch(_){}
      if(줄수>0){
        var 한줄px=H/줄수;
        var 장당줄=Math.max(1, Math.floor(담을px/한줄px));
        한장px=Math.max(40, Math.round(장당줄*한줄px));
      }
      var 장수=Math.max(1, Math.ceil(H/한장px));

      var 조각=[];
      for(var p=0;p<장수;p++){
        var y0=p*한장px, 높=Math.min(한장px, H-y0);
        var c2=document.createElement('canvas');
        c2.width=W; c2.height=높;
        var g=c2.getContext('2d');
        g.fillStyle='#ffffff'; g.fillRect(0,0,W,높);
        g.drawImage(cvs, 0,y0,W,높, 0,0,W,높);
        /* 쪽 번호 — 인쇄해서 들고 다니면 장이 섞인다. 조각 그림에 바로 찍는다
           (PDF 에 글자를 쓰려면 글꼴을 품어야 해서 파일이 커진다. 이쪽이 가볍다.) */
        try{
          g.fillStyle='#9ca3af';
          g.font=Math.max(16, Math.round(W/70))+'px sans-serif';
          g.textAlign='center';
          g.fillText((p+1)+' / '+장수, W/2, 높-10);
          g.textAlign='left';
        }catch(_){}
        조각.push({ jpg:_JPEG바이트(c2.toDataURL('image/jpeg',0.92)), w:W, h:높 });
      }

      /* ── PDF 뼈대 짜기 ── */
      var 쪽=[], 오프셋=[], 길이=0;
      function 밀기(x){ var b=(typeof x==='string')?_바이트(x):x; 쪽.push(b); 길이+=b.length; }
      var 객체수 = 2 + 조각.length*3;               /* 목록 + 쪽묶음 + (쪽·내용·그림)×장수 */
      밀기('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
      /* JURAN 판 614 : 악보 PDF 안에 음표를 한 줄로 같이 넣는다 (PDF 의 '%' 줄은 주석이라 보는 프로그램은 건너뛴다).
         그래서 이 PDF 를 저작권 검사에 넣으면 그림을 읽지 않고 **음표를 그대로** 읽는다 — 100% 정확. */
      try{ var _가락614=window.JC&&window.JC.가락표&&window.JC.가락표(); if(_가락614) 밀기('%JURAN-NOTES '+JSON.stringify(_가락614)+'\n'); }catch(_e614){}

      function 객체시작(n){ 오프셋[n]=길이; 밀기(n+' 0 obj\n'); }
      객체시작(1); 밀기('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

      var 쪽목록=[];
      for(var i=0;i<조각.length;i++) 쪽목록.push((3+i*3)+' 0 R');
      객체시작(2);
      밀기('<< /Type /Pages /Kids ['+쪽목록.join(' ')+'] /Count '+조각.length+' >>\nendobj\n');

      for(var k=0;k<조각.length;k++){
        var 쪽N=3+k*3, 내용N=쪽N+1, 그림N=쪽N+2, 조=조각[k];
        var 그릴W=칸W, 그릴H=조.h*배율;
        var x=여백, y=A4H-여백-그릴H;              /* PDF 는 왼쪽 아래가 0,0 이다 */
        객체시작(쪽N);
        밀기('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+A4W.toFixed(2)+' '+A4H.toFixed(2)+'] '
            +'/Resources << /XObject << /Im0 '+그림N+' 0 R >> >> /Contents '+내용N+' 0 R >>\nendobj\n');
        var 그림명령='q '+그릴W.toFixed(2)+' 0 0 '+그릴H.toFixed(2)+' '+x.toFixed(2)+' '+y.toFixed(2)+' cm /Im0 Do Q\n';
        객체시작(내용N);
        밀기('<< /Length '+그림명령.length+' >>\nstream\n'+그림명령+'endstream\nendobj\n');
        객체시작(그림N);
        밀기('<< /Type /XObject /Subtype /Image /Width '+조.w+' /Height '+조.h
            +' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+조.jpg.length+' >>\nstream\n');
        밀기(조.jpg);
        밀기('\nendstream\nendobj\n');
      }

      var xref=길이;
      var x표='xref\n0 '+(객체수+1)+'\n0000000000 65535 f \n';
      for(var n=1;n<=객체수;n++){
        var o=오프셋[n]||0;
        x표 += ('0000000000'+o).slice(-10)+' 00000 n \n';
      }
      밀기(x표);
      밀기('trailer\n<< /Size '+(객체수+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');

      var 모두=new Uint8Array(길이), 자리=0;
      for(var z=0;z<쪽.length;z++){ 모두.set(쪽[z],자리); 자리+=쪽[z].length; }
      var blob=new Blob([모두],{type:'application/pdf'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url;
      a.download='악보-CGO-'+(bpm||80)+'bpm.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); },4000);
      try{ console.log('%c[cgo-522] PDF — A4 '+조각.length+'장 · '+(길이/1024).toFixed(0)+'KB','color:#8b5cf6'); }catch(e){}
      _flash('✅ PDF 로 저장했습니다 — A4 '+조각.length+'장');
    }catch(ex){
      try{ console.error('[cgo-522] PDF 오류:', ex); }catch(_){}
      alert('PDF 를 만들지 못했습니다.\n잠시 뒤 다시 눌러 주세요.');
    }
    _되돌리기522();
  });
}
function _되돌리기522(){
  try{ var b=canvasWrap.querySelector('#cgo-sc-pdf522');
       if(b){ b.disabled=false; b.style.opacity='1'; b.textContent='📄 인쇄용 PDF'; } }catch(e){}
}

function _svgToCanvas354(cb){
try{
var _svg354 = sd.querySelector('svg');
if(!_svg354){ if(cb) cb(null); return; }
var _origFo370 = _svg354.querySelectorAll('foreignObject');
var _foVals370 = [];
for(var _oi370=0;_oi370<_origFo370.length;_oi370++){
var _oInp370 = _origFo370[_oi370].querySelector('input');
_foVals370.push(_oInp370 ? (_oInp370.value||'') : '');
}
var _clone370 = _svg354.cloneNode(true);
var _foList370 = _clone370.querySelectorAll('foreignObject');
for(var _fi370=0;_fi370<_foList370.length;_fi370++){
var _fo370 = _foList370[_fi370];
var _val370 = _foVals370[_fi370] || '';
if(_val370){
var _tx370 = document.createElementNS(svgNS,'text');
_tx370.setAttribute('x', String(parseFloat(_fo370.getAttribute('x')||0)+(parseFloat(_fo370.getAttribute('width')||60)/2)));
_tx370.setAttribute('y', String(parseFloat(_fo370.getAttribute('y')||0)+14));
_tx370.setAttribute('text-anchor','middle');
_tx370.setAttribute('font-size','11');
_tx370.setAttribute('font-family','Arial,sans-serif');
_tx370.setAttribute('fill','#7c3aed');
_tx370.textContent = _val370;
_fo370.parentNode.replaceChild(_tx370, _fo370);
} else {
_fo370.parentNode.removeChild(_fo370);
}
}
var svgData = new XMLSerializer().serializeToString(_clone370);
var svgBlob = new Blob([svgData], {type:'image/svg+xml;charset=utf-8'});
var url354 = URL.createObjectURL(svgBlob);
var img354 = new Image();
var w354 = _svg354.getAttribute('width') || _svg354.viewBox.baseVal.width || 800;
var h354 = _svg354.getAttribute('height') || _svg354.viewBox.baseVal.height || 400;
var scale354 = 2;
img354.onload = function(){
try{
var cvs354 = document.createElement('canvas');
cvs354.width = w354 * scale354;
cvs354.height = h354 * scale354;
var ctx354 = cvs354.getContext('2d');
ctx354.fillStyle = '#ffffff';
ctx354.fillRect(0, 0, cvs354.width, cvs354.height);
ctx354.drawImage(img354, 0, 0, cvs354.width, cvs354.height);
URL.revokeObjectURL(url354);
if(cb) cb(cvs354);
}catch(ex){ console.error('[CGO-354] canvas 렌더 오류:', ex); if(cb) cb(null); }
};
img354.onerror = function(){ URL.revokeObjectURL(url354); if(cb) cb(null); };
img354.src = url354;
}catch(ex){ console.error('[CGO-354] SVG 변환 오류:', ex); if(cb) cb(null); }
}
cpBtn.addEventListener('click',function(){
cpBtn.textContent='⏳ 복사중…';
_svgToCanvas354(function(cvs){
if(!cvs){ cpBtn.textContent='❌ 실패'; setTimeout(function(){ cpBtn.textContent='📋 복사'; },1500); return; }
cvs.toBlob(function(blob){
if(!blob){ cpBtn.textContent='❌ 실패'; setTimeout(function(){ cpBtn.textContent='📋 복사'; },1500); return; }
try{
if(navigator.clipboard && navigator.clipboard.write){
navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){
cpBtn.textContent='✅ 복사됨!'; setTimeout(function(){ cpBtn.textContent='📋 복사'; },2000);
}).catch(function(e){
console.warn('[CGO-354] Clipboard API 실패, 폴백:', e);
var _fbUrl = URL.createObjectURL(blob);
window.open(_fbUrl, '_blank');
cpBtn.textContent='📋 복사'; setTimeout(function(){ URL.revokeObjectURL(_fbUrl); },5000);
});
} else {
var _fbUrl2 = URL.createObjectURL(blob);
window.open(_fbUrl2, '_blank');
cpBtn.textContent='📋 복사';
}
}catch(ex){
console.error('[CGO-354] 클립보드 오류:', ex);
cpBtn.textContent='❌ 실패'; setTimeout(function(){ cpBtn.textContent='📋 복사'; },1500);
}
},'image/png');
});
});
imgBtn.addEventListener('click',function(){
imgBtn.textContent='⏳ 변환중…';
_svgToCanvas354(function(cvs){
if(!cvs){ imgBtn.textContent='❌ 실패'; setTimeout(function(){ imgBtn.textContent='🖼 저장'; },1500); return; }
try{
var a354 = document.createElement('a');
a354.href = cvs.toDataURL('image/png');
a354.download = '악보-CGO-' + bpm + 'bpm.png';
document.body.appendChild(a354); a354.click();
setTimeout(function(){ try{ a354.remove(); }catch(e){} }, 1000);
imgBtn.textContent='✅ 저장됨!'; setTimeout(function(){ imgBtn.textContent='🖼 저장'; },2000);
}catch(ex){
console.error('[CGO-354] PNG 저장 오류:', ex);
imgBtn.textContent='❌ 실패'; setTimeout(function(){ imgBtn.textContent='🖼 저장'; },1500);
}
});
});
rrBtn.addEventListener('click',function(){ _renderWav(rrBtn,rrDl); });
try{ canvasWrap.scrollIntoView({behavior:'smooth',block:'nearest'}); }catch(ex){}
}
redraw();
};


window._cgoGenerateScoreOnly368 = function(){
try{
var _mod = window._cgoMusicMod;
if(!_mod) return;
_mod.selected = _mod.selected || {};
if(!_mod.selected.key) _mod.selected.key = 'C Major';
if(!_mod.tempoBpm) _mod.tempoBpm = 120;
var _k369 = _mod.selected.key || 'C Major';
var _b369 = _mod.tempoBpm || 120;
var _pick369 = window._cgoCurrentPick;
if(!_pick369 && SONG_DB && SONG_DB.length){
var _bestI=0, _bestD=9999;
for(var i=0;i<SONG_DB.length;i++){
var _br=SONG_DB[i].bpm||[100,130];
var _d=Math.abs((_br[0]+_br[1])/2-_b369);
if(_d<_bestD){_bestD=_d;_bestI=i;}
}
_pick369=SONG_DB[_bestI];
window._cgoCurrentPick=_pick369;
}
if(!_pick369) return;
if(!window._cgoMelodyEvents || !window._cgoMelodyEvents.length){
try{ if(typeof _mod._buildNoteSequence==='function') _mod._buildNoteSequence(); }catch(_bns411){ console.error('[cgo-411] _buildNoteSequence fallback:',_bns411); window._cgoMelodyEvents=null; } // cgo-411: 예외 시 null로 정리 → renderGrooveAsScore 내부 SONG_DB struct+barChords 폴백 보장
}
if(!window._cgoMelodyEvents || !window._cgoMelodyEvents.length){ // cgo-411: 멜로디 이벤트 여전히 없으면 _cgoMelodyNames도 정리
if(!window._cgoMelodyNames || !window._cgoMelodyNames.length) window._cgoMelodyEvents=null; // 완전 폴백 모드: SONG_DB struct 의존
}
var _rn369=_k369.split(/\s/)[0]||'C';
var _sw369=_mod.root&&_mod.root.querySelector('#cgo-groove-score-wrap');
if(_sw369){
_sw369.style.display='block';
renderGrooveAsScore(_pick369,_rn369,_b369,_mod,[0]);
}
try{
var _au372=document.getElementById('cgo-vvip-audio');
if(_au372 && _sw369){
if(window._cgoScoreSyncFn372){ try{_au372.removeEventListener('timeupdate',window._cgoScoreSyncFn372);}catch(e){} }
if(window._cgoScoreEndFn372){ try{_au372.removeEventListener('pause',window._cgoScoreEndFn372);_au372.removeEventListener('ended',window._cgoScoreEndFn372);}catch(e){} }
/* ═══ cgo-552 (2026-10-11) : 보라 점이 **여러 개** 뜨던 것 ═══
   파트너 — "수노 악보에 저 개인 음표가 여러 개 뜨는 오류"
   【잰 것】 악보를 세 번 그렸더니 play 걸이 3개 · 보라 점 3개 · 멈춘 뒤에도 2개가 남았다.
   【까닭】 악보를 그릴 때마다 소리판에 걸이를 새로 단다. 그런데 **떼내는 줄이
       timeupdate · pause · ended 세 개에만 있고 play · seeked 두 개에는 없었다.**
       그래서 옛 자명종(_자기514)이 하나도 안 죽고 각자 제 점을 그리며 계속 돈다.
       게다가 옛것들은 **옛 마디 시각표**를 들고 있어서 지금 악보의 엉뚱한 음표에
       불을 켠다 — 화면 아래쪽에 혼자 떨어져 있던 점이 그것이다.
       멈춰도 안 꺼지는 까닭도 같다. 옛것의 pause 걸이는 위에서 떼냈으니
       제 점을 지울 길이 없다.
   【고치는 것 — 세 겹】
     ㉠ play · seeked 걸이도 떼낸다 (안 떼내던 두 개)
     ㉡ 세대 번호를 둔다. 옛 자명종은 깨어나는 **그 순간 스스로 죽는다.**
        걸이를 못 떼낸 경우(다른 길로 걸린 것)까지 막는다.
     ㉢ 불을 켜기 전에 같은 표가 붙은 동그라미를 **전부** 쓸어 낸다.
        ㉠㉡ 을 빠져나온 것이 있어도 화면에는 하나만 남는다.
   ⚠️ 새 고리를 돌리지 않는다. 깨는 횟수는 그대로다 — 특허 기능과 무관하다. */
if(window._cgo자기걸이552){ try{ _au372.removeEventListener('play',window._cgo자기걸이552);
  _au372.removeEventListener('seeked',window._cgo자기걸이552); }catch(e){} }
var _세대552 = (window._cgo악보세대552 = (window._cgo악보세대552||0) + 1);
var _bpm372=_b369;
var _beatSec372=60.0/_bpm372;
var _bpb372=4;
var _barSecFallback373=_bpb372*_beatSec372;
/* ═══ cgo-514 (2026-10-09) : 마디 띠가 밀리고 멈추던 것을 고친 자리 ═══
   파트너 말 — "처음만 정확하고 갈수록 어디가 어딘줄 모르겠어여"
                "마디도 잘 안 맞는 것 같은데요"

   ⚠️ 내가 이 자리에서 **한 번 틀렸다** (같은 날, 고치기 전에 시험하다 잡았다).
      처음엔 "음표 길이를 더해서 마디를 세는 게 범인"이라 보고, 음표들의
      진짜 시각에 **곧은 선 하나**(최소제곱)를 그어 대신하려 했다. 재 보니
      더 나빴다 — 끝마디 어긋남 0.07초 → 2.87초.
      왜냐면 **악보가 바로 그 더하기로 그려져 있기 때문**이다. 음표가 어느 마디에
      그려지는지는 길이를 더한 값이 정한다. 그러니 "몇 번째 마디냐"의 기준이
      그 더하기다. 거기에 곧은 선을 억지로 맞추면 그림과 어긋난다.
      → 교훈 : 고치기 전에 **무엇이 정답인지**를 먼저 정해야 한다.

   【진짜 범인 — 빈 마디에서 띠가 멈춘다】
     마디 시각표는 **그 마디에 음표가 있을 때만** 채워졌다. 음표가 없는 마디
     (쉼표·간주·노래 안 하는 데)는 빈 칸으로 남았고, 띠를 찾는 코드는 표를
     뒤에서부터 훑어 **빈 칸을 건너뛰고 앞 마디에 머물렀다.**
     우리 음표는 '노래 목소리'에서만 딴 것이라 전주·간주가 통째로 빈다.
     그래서 앞에서는 맞다가 뒤로 갈수록 제자리를 못 찾는다.

   【지금 하는 것】
     ① 음표가 있는 마디 → 그 음표의 **진짜 소리 시각**에 못을 박는다 (전과 같다)
     ② 음표가 없는 마디 → 양옆 못 사이를 **곧게 이어** 채운다 (빈 칸을 없앤다)
     ③ 앞뒤 끝 → 가장 가까운 두 못의 기울기로 늘린다
     ④ 시각이 거꾸로 가면 바로잡는다 (음표 시각이 뒤집힌 데가 있다)
     표에 빈 칸이 없으므로 띠는 멈추지 않는다. 그리고 못이 **마디마다** 박혀
     있으므로 한 군데가 틀려도 **그 마디에서 끝난다 — 뒤로 안 번진다.** */
var _barT514=[], _맞음514=false;
try{
  var _ev514=window._cgoMelodyEvents;
  var _총마디514=0;
  try{ var _p514b=window._cgo악보판; if(_p514b&&_p514b.totBars) _총마디514=_p514b.totBars; }catch(_){}
  if(_ev514 && _ev514.length){
    var _못514=[], _acc514=0;
    for(var _mi514=0;_mi514<_ev514.length;_mi514++){
      var _e514=_ev514[_mi514];
      var _bi514=Math.floor(_acc514/_bpb372), _박안514=_acc514-_bi514*_bpb372;
      /* 그 음표가 셋째 박에 있으면 마디 첫 박은 두 박 앞이다 (cgo-508 에서 고친 것).
         여기 쓰는 박 길이는 '마디 안' 보정이라 많아야 세 박 — 빠르기가 1% 틀려도 0.02초다. */
      if(typeof _e514.start_sec==='number' && _못514[_bi514]===undefined)
        _못514[_bi514]=_e514.start_sec-_박안514*_beatSec372;
      _acc514+=(_e514.dur||0);
    }
    var _끝마디514=Math.max(_못514.length, Math.ceil(_acc514/_bpb372), _총마디514);
    var _있는514=[];
    for(var _q514=0;_q514<_못514.length;_q514++) if(_못514[_q514]!==undefined) _있는514.push(_q514);
    if(_있는514.length>=2){
      /* ② 못과 못 사이를 곧게 잇는다 */
      for(var _g514=0;_g514<_있는514.length-1;_g514++){
        var _i0=_있는514[_g514], _i1=_있는514[_g514+1];
        if(_i1-_i0<=1) continue;
        var _기514=(_못514[_i1]-_못514[_i0])/(_i1-_i0);
        for(var _f514=_i0+1;_f514<_i1;_f514++) _못514[_f514]=_못514[_i0]+_기514*(_f514-_i0);
      }
      /* ③ 앞뒤 끝은 가장 가까운 두 못의 기울기로 늘린다 */
      var _첫514=_있는514[0], _끝못514=_있는514[_있는514.length-1];
      var _앞기514=(_못514[_있는514[1]]-_못514[_첫514])/(_있는514[1]-_첫514);
      var _뒤기514=(_못514[_끝못514]-_못514[_있는514[_있는514.length-2]])/
                   (_끝못514-_있는514[_있는514.length-2]);
      if(!(_앞기514>0.1)) _앞기514=_barSecFallback373;
      if(!(_뒤기514>0.1)) _뒤기514=_barSecFallback373;
      for(var _f2514=_첫514-1;_f2514>=0;_f2514--) _못514[_f2514]=_못514[_f2514+1]-_앞기514;
      for(var _f3514=_끝못514+1;_f3514<_끝마디514;_f3514++) _못514[_f3514]=_못514[_f3514-1]+_뒤기514;
      /* ④ 거꾸로 가는 자리 바로잡기 */
      for(var _f4514=1;_f4514<_끝마디514;_f4514++)
        if(!(_못514[_f4514]>_못514[_f4514-1])) _못514[_f4514]=_못514[_f4514-1]+0.05;
      _barT514=_못514.slice(0,_끝마디514);
      _맞음514=_barT514.length>1;
      try{ console.log('%c[cgo-514] 마디 시각표 '+_barT514.length+'칸 — 음표로 박은 못 '+
                       _있는514.length+'개, 메운 칸 '+(_barT514.length-_있는514.length)+'개',
                       'color:#059669'); }catch(_){}
      /* JURAN : 이 글을 개발자 창에만 두지 않고 화면에도 띄운다.
         파트너님이 눈으로 읽고 「시각이 왔나 안 왔나」를 알려 주실 수 있게. */
      try{ window._cgo못보고514={맞음:true, 칸:_barT514.length, 못:_있는514.length,
                                 메움:_barT514.length-_있는514.length,
                                 첫초:(_barT514.length?Math.round(_barT514[0]*100)/100:null)}; }catch(_){}
    }
  }
}catch(_e514b){ _맞음514=false; _barT514=[]; }
if(!_맞음514){ try{ console.log('%c[cgo-514] 시각표를 못 만들었다 — 악보 빠르기 '+_bpm372+' 로 간다','color:#b45309'); }catch(_){}
  /* JURAN : 왜 못 만들었는지까지 적어 둔다. 음표가 아예 없는 것과,
     음표는 있는데 시각(start_sec)이 안 온 것은 고칠 데가 다르다. */
  try{
    var _ev보=window._cgoMelodyEvents||[], _초있=0;
    for(var _z=0;_z<_ev보.length;_z++) if(typeof _ev보[_z].start_sec==='number') _초있++;
    window._cgo못보고514={맞음:false, 음표:_ev보.length, 시각있는것:_초있, 빠르기:_bpm372};
  }catch(_){ window._cgo못보고514={맞음:false, 음표:-1, 시각있는것:-1, 빠르기:_bpm372}; }
}

/* 마디 k 가 시작하는 시각. 표에 빈 칸이 없으므로 그냥 꺼내 쓴다. */
function _마디시각514(k){
  if(!_맞음514) return k*_barSecFallback373;
  if(k<0) return _barT514[0];
  if(k>=_barT514.length) return _barT514[_barT514.length-1];
  return _barT514[k];
}
/* 음표 하나가 울리는 시각 = 그 마디 시작 + 마디 안 몇 박째 × 그 마디의 한 박 */
function _음표시각514(n){
  var k=Math.floor(n.b/_bpb372), 박안=n.b-k*_bpb372;
  var 시=_마디시각514(k), 한박=(_마디시각514(k+1)-시)/_bpb372;
  if(!(한박>0.01)) 한박=_beatSec372;
  return 시+박안*한박;
}
/* cgo-505: 여기서 숫자를 또 정하면 그린 쪽과 어긋난다. 그린 쪽이 적어 둔 것을
   그때그때 읽는다. 화면을 돌리거나 악보를 다시 그려도 저절로 따라간다. */
function _판505(){
  var p=window._cgo악보판;
  if(p&&p.BAR_W) return p;
  /* 적어 둔 것이 없을 때도 '그리는 쪽과 같은 규칙'으로 셈한다.
     여기서 4 로 고정하면 cgo-502 의 흠이 그대로 되살아난다. */
  var LG=10,S=36,LY=22, _화=0;
  try{ _화=window.innerWidth||document.documentElement.clientWidth||0; }catch(e){}
  var B=(_화&&_화<=480)?1:((_화&&_화<=900)?2:4);
  var w=Math.max(340,_sw369.offsetWidth||_sw369.clientWidth||380);
  return {BPR:B,LM:52,ST:S,LGAP:LG,LYRICS_H:LY,RH:S+4*LG+34+LY,
          cW:w,BAR_W:Math.max(72,Math.floor((w-58)/B)),음표:[]};
}
var _prevBar372=-1;
window._cgoScoreSyncFn372=function(){
if(_au372.paused) return;
var _t372=_au372.currentTime||0;
/* cgo-514: 표를 **뒤에서부터 한 칸씩 훑던 것**을 가운데를 짚어 가는 찾기로 바꿨다.
   전에는 빈 칸을 만나면 건너뛰어 앞 마디에 머물렀다 — 그게 띠가 멈추던 이유다.
   이제 표에 빈 칸이 없고, 76마디짜리도 일곱 번이면 찾는다. */
var _bar372=0;
if(_맞음514){
  var _lo372=0,_hi372=_barT514.length-1;
  while(_lo372<=_hi372){ var _md372=(_lo372+_hi372)>>1;
    if(_barT514[_md372]<=_t372){ _bar372=_md372; _lo372=_md372+1; } else _hi372=_md372-1; }
} else {
  _bar372=Math.floor(_t372/_barSecFallback373);
}
if(!(_bar372>=0)) _bar372=0;
/* cgo-514 그물 : 브라우저가 자명종을 떨어뜨렸으면(탭을 숨겼다 돌아왔다든가)
   여기서 다시 맞춘다. 1초에 네 번, 이진 탐색 한 번이라 값이 없다. */
if(_음표불514 && !_잠514){ try{ _자기514(); }catch(e){} }
if(_bar372===_prevBar372) return;
_prevBar372=_bar372;
try{
var _oldHl=_sw369.querySelector('#cgo-sc-sync372');
if(_oldHl) _oldHl.parentNode.removeChild(_oldHl);
var _svg372=_sw369.querySelector('svg');
if(!_svg372) return;
var _svgNS372='http://www.w3.org/2000/svg';
var _판=_판505();
var _row372=Math.floor(_bar372/_판.BPR);
var _bx372=_판.LM+(_bar372%_판.BPR)*_판.BAR_W;
var _sTopH372=_row372*_판.RH+8+_판.ST;
var _r372=document.createElementNS(_svgNS372,'rect');
_r372.id='cgo-sc-sync372';
_r372.setAttribute('x',_bx372+1);
_r372.setAttribute('y',_sTopH372-14);
_r372.setAttribute('width',_판.BAR_W-2);
_r372.setAttribute('height',4*_판.LGAP+28);
_r372.setAttribute('rx','4');
/* cgo-514: .14 → .22 로 올렸다. cgo-505 때는 "음표 불이 주인공이라 옅게" 였는데
   cgo-512 가 음표 불을 지워서 **주인공이 사라진 채 조연만 옅게** 남아 있었다.
   음표 불을 되살리니 둘이 겹친다 — 띠는 자리를 알려 주고(옅게),
   불은 지금 소리를 짚는다(진하게). 그래서 .28 이 아니라 .22 다. */
_r372.setAttribute('fill','rgba(251,191,36,.22)');
_r372.style.pointerEvents='none';
_svg372.insertBefore(_r372,_svg372.childNodes[1]||null);
var _hlTop372=_row372*_판.RH;
var _wrapH372=_sw369.clientHeight||300;
var _sT372=_sw369.scrollTop||0;
if(_hlTop372<_sT372 || _hlTop372+_판.RH>_sT372+_wrapH372){
_sw369.scrollTo({top:Math.max(0,_hlTop372-40),behavior:'smooth'});
}
}catch(e){}
};
/* ─────────────────────────────────────────────────────────────────────
   cgo-505 : 음표 하나하나에 반투명 흑색을 찍는다.
   마디(2.8초)에 찍으면 악보를 못 읽는 사람은 그 안 어디가 지금 소리인지
   알 수가 없다. 음표에 찍으면 들리는 소리와 점 하나가 1대1로 묶인다.
   소리를 분석하지 않는다 — 재생 시각만 보고 그린다. 계산 값이 0이다.
   timeupdate 는 1초에 네 번쯤만 와서 음표에는 너무 성기다. 그래서
   requestAnimationFrame 으로 돌린다 (멈춰 있으면 돌지 않는다).
   ───────────────────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════
   cgo-512 : 음표 하나씩 불 켜기를 **통째로 지웠다**.

   왜 지웠나 — 파트너 지시: *"악보 정확도와 상관 없으면 통째로 빼는것이 아니라 전체 삭제해주세요"*

   내가 cgo-505 에 넣고 508·509·511 로 세 번 고쳤지만, 폰에서 계속 말썽이었다.
     · 1초에 60번 도는 고리가 메인 스레드를 먹어 **특허 제4분할(content-visibility)이
       그릴 틈을 못 얻었다** → 스크롤할 때 작은 흰 박스가 뜨고 앱이 멈췄다
     · cgo-511 에서 133배 가볍게 했지만, 악보 정확도와는 아무 상관이 없는 기능이다
   **없는 편이 낫다.** 다시 넣고 싶으면 cgo-505 를 보라 — 다만 특허 기능과
   메인 스레드를 다투지 않을 방법을 먼저 찾아야 한다.

   남긴 것 (둘 다 진짜 버그 고침이고 무게가 0이다) —
     · `_판505()` : 그린 쪽이 적어 둔 한 줄 마디 수를 읽는다.
       cgo-502 에서 폰 1마디로 바꾸면서 불 켜는 쪽을 4마디로 둬서, 폰에서
       둘째 마디부터 띠가 엉뚱한 줄에 켜졌다. 그 고침이다.
     · 마디 띠 기준점 : '그 마디 첫 음표의 시각'이 아니라 '마디 첫 박의 시각'을 쓴다.
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   cgo-514 (2026-10-09) : 음표 하나씩 불 켜기를 **자다 깨는 방식**으로 되살렸다.

   【cgo-505~511 이 왜 앱을 멈췄나】
     1초에 60번 도는 고리(requestAnimationFrame)를 돌려 "지금 어느 음표냐"를
     **계속 물었다.** 메인 스레드가 꽉 차서 특허 제4분할(content-visibility)이
     그릴 틈을 못 얻었고, 스크롤하면 흰 박스가 뜨고 앱이 멈췄다.
     cgo-512 에서 통째로 지웠다. 지운 판단은 옳았다.

   【지금 하는 것 — 묻지 않고 예약한다】
     음표가 울릴 시각은 **이미 안다** (위에서 만든 마디 시각표에서 꺼낸다).
     그러니 물을 필요가 없다. 다음 음표 시각에 자명종을 하나 맞추고 **잔다.**
       깨어나는 횟수 = 음표 수 ÷ 곡 길이 ≒ 1초에 두세 번
       (지금 마디 띠를 돌리는 timeupdate 가 1초에 네 번이다. 그보다 적다.)
     깰 때마다 지금 시각으로 다시 셈하므로, 브라우저가 자명종을 늦게 울려도
     **스스로 제자리를 찾는다.** 밀리지 않는다.

   【안전 울타리】
     · 음표 자리가 없으면 → 불만 안 켜진다. 마디 띠는 그대로 돈다.
     · `_음표불514 = false` 한 줄로 끌 수 있다.
     · 멈추면 자명종을 끈다. 안 보이는 데서 도는 것이 없다.
   ════════════════════════════════════════════════════════════════════ */
var _음표불514 = true;          /* ⚠️ 말썽이면 이 한 줄을 false 로 */
var _불el514 = null, _잠514 = 0, _불idx514 = -1;

function _음표들514(){
  try{ var p=window._cgo악보판; return (p && p.음표 && p.음표.length) ? p.음표 : null; }
  catch(e){ return null; }
}
/* ⚠️ cgo-514 : 여기 _음표시각514 를 **또** 만들어 뒀다가 지웠다. 같은 이름을 두 번
   만들면 뒤엣것이 이긴다 — 위에서 제대로 만든 것이 조용히 죽는다.
   쓰는 것은 위(마디 시각표를 읽는 쪽) 하나뿐이다. */
function _불끄기514(){
  /* cgo-552 ㉢ : 내 것만 지우지 않는다. 같은 표가 붙은 것을 **전부** 쓸어 낸다.
     옛 자명종이 남긴 동그라미는 내 손에 없어서, 내 것만 지우면 화면에 그대로 남는다. */
  try{ var _svg552=_sw369.querySelector('svg');
       if(_svg552){ var _ds552=_svg552.querySelectorAll('#cgo-nt-lit514');
         for(var _di552=0;_di552<_ds552.length;_di552++)
           if(_ds552[_di552].parentNode) _ds552[_di552].parentNode.removeChild(_ds552[_di552]); } }catch(e){}
  try{ if(_불el514 && _불el514.parentNode) _불el514.parentNode.removeChild(_불el514); }catch(e){}
  _불el514 = null; _불idx514 = -1;
}
function _불켜기514(i){
  var L = _음표들514(); if(!L || !L[i]) return;
  var _svg = _sw369.querySelector('svg'); if(!_svg) return;
  _불끄기514();
  try{
    var c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.id = 'cgo-nt-lit514';
    c.setAttribute('cx', L[i].x); c.setAttribute('cy', L[i].y); c.setAttribute('r', 9);
    c.setAttribute('fill','rgba(124,58,237,.34)');
    c.style.pointerEvents = 'none';
    _svg.appendChild(c);                       /* 맨 뒤 — 음표를 가리지 않는다 */
    _불el514 = c; _불idx514 = i;
  }catch(e){ _불el514 = null; _불idx514 = -1; }
}
/* 깨어났다 → 지금 울리는 음표에 불을 켜고 → 다음 음표 시각에 자명종을 맞추고 → 잔다 */
var _도는중514 = false;
function _자기514(){
  if(_도는중514) return;        /* 띠 쪽에서 나를 부르고 내가 띠를 부르니, 맞물리지 않게 */
  _도는중514 = true;
  try{ _자기속514(); } finally { _도는중514 = false; }
}
function _자기속514(){
  try{ if(_잠514) clearTimeout(_잠514); }catch(e){}
  _잠514 = 0;
  /* cgo-552 ㉡ : 나보다 새 악보가 그려졌으면 나는 **옛것**이다.
     깨어난 김에 내 점을 지우고 죽는다. 다시는 자명종을 안 맞춘다. */
  if(_세대552 !== window._cgo악보세대552){ try{ _불끄기514(); }catch(e){} return; }
  if(!_음표불514) return;
  var L = _음표들514(); if(!L) return;
  if(!_au372 || _au372.paused) return;
  if(_불el514 && _불el514.isConnected === false){ _불el514 = null; _불idx514 = -1; }  /* 악보를 다시 그렸다 */
  var t = _au372.currentTime || 0;
  var lo = 0, hi = L.length - 1, nx = -1;      /* 지금보다 나중에 오는 첫 음표 */
  while(lo <= hi){
    var md = (lo + hi) >> 1;
    if(_음표시각514(L[md]) > t + 0.012){ nx = md; hi = md - 1; } else { lo = md + 1; }
  }
  var cur = (nx < 0) ? (L.length - 1) : (nx - 1);
  if(cur >= 0){
    /* 이 음표가 몇 초짜리인가 — 그 마디의 한 박으로 잰다 (마디마다 빠르기가 조금씩 다르다) */
    var _k끝514 = Math.floor(L[cur].b/_bpb372);
    var _한박끝514 = (_마디시각514(_k끝514+1)-_마디시각514(_k끝514))/_bpb372;
    if(!(_한박끝514>0.01)) _한박끝514=_beatSec372;
    var 끝 = _음표시각514(L[cur]) + _한박끝514 * (L[cur].d || 0.5);
    if(t < 끝 + 0.15){ if(cur !== _불idx514) _불켜기514(cur); }
    else _불끄기514();
  } else _불끄기514();
  /* cgo-514 : 깬 김에 **마디 띠도 같이 손본다**.
     띠는 timeupdate 로 도는데 그게 1초에 네 번뿐이라 최대 0.25초 늦게 켜졌다.
     음표 불은 음표마다 깨니(1초에 두세 번) 그 길에 얹으면 **깨는 횟수를 안 늘리고**
     띠가 음표 경계에서 바로 따라간다. 공짜다. */
  try{ if(typeof window._cgoScoreSyncFn372==='function') window._cgoScoreSyncFn372(); }catch(e){}
  if(nx < 0) return;                            /* 남은 음표가 없다 — 다시 안 깬다 */
  _잠514 = setTimeout(_자기514, Math.max(8, (_음표시각514(L[nx]) - t) * 1000));
}
window._cgoScoreEndFn372=function(){
_prevBar372=-1;
try{ if(_잠514) clearTimeout(_잠514); }catch(e){}
_잠514=0; _불끄기514();
try{var _oldHl=_sw369.querySelector('#cgo-sc-sync372');if(_oldHl)_oldHl.parentNode.removeChild(_oldHl);}catch(e){}
};
_au372.addEventListener('timeupdate',window._cgoScoreSyncFn372);
_au372.addEventListener('pause',window._cgoScoreEndFn372);
_au372.addEventListener('ended',window._cgoScoreEndFn372);
/* cgo-514: 틀거나 자리를 옮기면 자명종을 다시 맞춘다
   cgo-552 ㉠ : 다음에 악보를 다시 그릴 때 **떼낼 수 있게** 창문에 적어 둔다.
   이걸 안 적어 둬서 지금까지 옛 걸이가 하나도 안 떨어졌다. */
try{ window._cgo자기걸이552 = _자기514; }catch(_){}
_au372.addEventListener('play', _자기514);
_au372.addEventListener('seeked', _자기514);
try{ if(!_au372.paused) _자기514(); }catch(e){}
}
}catch(ex372){console.error('[cgo-372] score sync:',ex372);}
}catch(ex){console.error('[cgo-369] VVIP 악보:',ex);}
};


/* ════════════════════════════════════════════════════════════════════════
   이음매 — JURAN 쪽 값을 CGO 악보가 알아듣는 꼴로 만들어 넘긴다
   ------------------------------------------------------------------------
   CGO 의 renderGrooveAsScore 는 곡 하나를 받는데, 거기서 보는 것은 **song.struct**
   하나뿐이다 (구간 이름 · 마디 수 · 화음 · 조옮김). 해석기로 세어 확인했다.
   그래서 2.96MB 짜리 곡 통(SONG_DB)은 **안 가져온다.** 우리가 만들어 넘긴다.
   ⚠️ 화음은 가락에서 뽑은 **짐작**이다. 귀가 맞다 하면 맞는 것이다.
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  var 음이름=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var 반음={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  function 반음값(이름){
    if(!이름) return null;
    var m=String(이름).match(/^([A-Ga-g])([#b]?)(-?\d+)$/); if(!m) return null;
    var v=반음[m[1].toUpperCase()] + (m[2]==='#'?1:(m[2]==='b'?-1:0));
    return ((v%12)+12)%12;
  }
  function 이름고침(L){
    if(/후렴|chorus/i.test(L)) return 'chorus';
    if(/브릿지|bridge/i.test(L)) return 'bridge';
    if(/전주|intro/i.test(L)) return 'intro';
    if(/후주|outro|끝/i.test(L)) return 'outro';
    if(/마지막|final/i.test(L)) return 'final';
    return 'verse';
  }
  /* 마디마다 어울리는 화음 하나 — [으뜸으로부터 반음, 꼴, 박] */
  function 마디화음들(ev, 박자, 으뜸, 단조){
    var 음계 = 단조 ? [0,3,5,7,10] : [0,2,4,5,7,9,11];
    var 후보 = 단조 ? [[0,'min7'],[3,'maj7'],[5,'min7'],[7,'min7'],[8,'maj7'],[10,'dom7'],[2,'dim']]
                    : [[0,'maj7'],[2,'min7'],[4,'min7'],[5,'maj7'],[7,'dom7'],[9,'min7'],[11,'dim']];
    var 짜임={'maj7':[0,4,7,11],'min7':[0,3,7,10],'dom7':[0,4,7,10],'dim':[0,3,6]};
    var 마디=[], 이번=new Array(12).fill(0), 쌓=0, 처음=true;
    for (var i=0;i<ev.length;i++){
      var d=(ev[i].dur>0?ev[i].dur:1), pc=반음값(ev[i].name);
      while (d>0.0001){
        var 쓸=Math.min(d, 박자-쌓);
        if (pc!==null) 이번[pc]+= 쓸*(처음?1.6:1);
        처음=false; 쌓+=쓸; d-=쓸;
        if (쌓>=박자-1e-9){ 마디.push(이번); 이번=new Array(12).fill(0); 쌓=0; 처음=true; }
      }
    }
    if (쌓>0) 마디.push(이번);
    return 마디.map(function(w){
      var 모두=w.reduce(function(a,b){return a+b;},0);
      if (모두<=0) return [0,단조?'min7':'maj7',1];
      var 제일=null, 높=-1;
      for (var k=0;k<후보.length;k++){
        var r=(으뜸+후보[k][0])%12, 꼴=후보[k][1], s=0;
        if (w[r]<=0) continue;
        var 짜=짜임[꼴]||[0,4,7];
        for (var j=0;j<짜.length;j++) s += w[(r+짜[j])%12] * (j===0?3.0:(j===1?1.3:0.8));
        if (꼴==='dim') s*=0.55;
        if (s>높){ 높=s; 제일=후보[k]; }
      }
      /* ⚠️ 셋째 값은 「몇 박」이 아니라 **「몇 마디」** 다. 4 를 넣었더니 마디가
         네 배로 늘어 뒤쪽 180마디가 텅 빈 오선으로 그려졌다. 한 마디에 하나다. */
      return 제일 ? [제일[0], 제일[1], 1] : [0,단조?'min7':'maj7',1];
    });
  }

  /* CGO 원본을 잡아 둔다 — 아래에서 곡 틀만 만들어 주고 그 손에 넘긴다 */
  var CGO원본 = window._cgoGenerateScoreOnly368;

  window._cgoGenerateScoreOnly368 = function(){
    try{
      var mod=window._cgoMusicMod; if(!mod) return;
      /* 판 574 : 악보 칸이 지금 문서에 붙어 있나 — 떼어 둔 화면에 그리면 소리 따라가기를 못 단다.
         그때는 표를 남겨, 화면이 다시 붙을 때 폭보기(③)가 한 번 더 그리게 한다. */
      try{ window._주란떼어그림574 = !document.getElementById('cgo-groove-score-wrap'); }catch(_e574){}
      mod.selected=mod.selected||{};
      if(!mod.selected.key) mod.selected.key='C Major';
      if(!mod.tempoBpm) mod.tempoBpm=120;
      if(!window._cgoMelodyEvents || !window._cgoMelodyEvents.length){
        try{ if(typeof mod._buildNoteSequence==='function') mod._buildNoteSequence(); }catch(e){}
      }
      var ev=window._cgoMelodyEvents||[];
      var wrap=mod.root&&mod.root.querySelector('#cgo-groove-score-wrap');
      if (!ev.length){
        if (wrap){ wrap.style.display='block';
          wrap.innerHTML='<div style="padding:18px 14px;color:#9aa3ad;font-size:13px">'
            +'음표를 받지 못했습니다. 곡을 다시 만들어 주세요.</div>'; }
        return;
      }
      var bpm=window._cgoMelodyBpm||mod.tempoBpm||120;
      var keyName=mod.selected.key||'C Major';
      var 조각=keyName.split(/\s+/);
      var 뿌리이름=(조각[0]||'C');
      var 으뜸=음이름.indexOf(뿌리이름); if(으뜸<0) 으뜸=0;
      var 단조=/minor/i.test(조각[1]||'');
      var 박자=4; try{ var ts=window._cgoSelectedTimeSig; if(ts&&ts.length) 박자=ts[0]||4;
                       else if(ts&&ts.num) 박자=ts.num; }catch(e){}
      if(!(박자>=1&&박자<=16)) 박자=4;

      var 화음들=마디화음들(ev,박자,으뜸,단조);
      var 총마디=Math.max(1,화음들.length);

      /* 구간을 마디로 — 구간표가 없으면 통째로 한 구간 */
      var 마디초=(60/bpm)*박자;
      var 구간=(window._cgoSectionPlan341||[]).map(function(s){
        return { b:Math.max(0,Math.round((s.start||0)/마디초)), nm:이름고침(s.label||s.type||'') };
      }).filter(function(s){ return s.b<총마디; });
      if(!구간.length) 구간=[{b:0,nm:'verse'}];
      구간.sort(function(a,b){ return a.b-b.b; });

      var struct=[];
      for (var i=0;i<구간.length;i++){
        var 시작=구간[i].b;
        var 끝=(i+1<구간.length)?구간[i+1].b:총마디;
        var 마디수=Math.max(1,끝-시작);
        struct.push({ name:구간[i].nm, bars:마디수, keyShift:0,
                      chords:화음들.slice(시작,끝),
                      dynamics:(구간[i].nm==='chorus'?0.95:(구간[i].nm==='bridge'?0.8:0.7)) });
      }
      var song={ id:'juran', genre:'K', mood:'', bpm:[bpm-8,bpm+8],
                 key:(단조?'min':'maj'), title:'JURAN 곡', struct:struct };
      window._cgoCurrentPick=song;
      if (wrap) wrap.style.display='block';
      /* ⚠️ 여기서 직접 그리면 **소리 따라가기가 빠진다.**
         CGO 원본 손 안에 소리판 걸이(timeupdate·pause·ended)·마디 시각표·
         음표 불 켜는 자명종이 들어 있다. 내가 2KB 짜리로 갈아 끼웠다가
         수노 노래가 흘러도 악보가 가만히 있는 흠을 냈다.
         이제 곡 틀만 만들어 주고 **원본 손에 넘긴다.** */
      if (typeof CGO원본==='function') CGO원본();
      else renderGrooveAsScore(song, 뿌리이름, bpm, mod, [0]);
      시각쪽지();
    }catch(e){ try{ console.error('[JURAN 악보]', e); }catch(_){} }
  };

  /* ───── 시각 쪽지 ─────────────────────────────────────────────
     마디 시각표가 만들어졌는지를 악보 위에 한 줄로 적는다.
     개발자 창을 못 여는 사람도 눈으로 읽을 수 있어야 하기 때문이다.
     그림은 건드리지 않는다 — 악보 위에 글 한 줄만 붙인다. */
  function 시각쪽지(){
    try{
      var wrap=document.getElementById('cgo-groove-score-wrap'); if(!wrap) return;
      var 쪽=document.getElementById('juran-시각쪽지');
      if(!쪽){
        쪽=document.createElement('div'); 쪽.id='juran-시각쪽지';
        /* ⚠️ 비치는 바탕(rgba)을 쓰면 **어두운 꾸밈에서 글자가 안 보인다.**
           재 보니 진초록 글자가 거의 까만 바탕에 얹혀 읽히지 않았다.
           그래서 쪽지가 **제 바탕을 스스로 깐다** — 밝든 어둡든 똑같이 읽힌다.
           scroll-margin-top : 위에 붙어 다니는 띠에 가려지지 않게 자리를 비운다. */
        쪽.style.cssText='font-size:12px;line-height:1.55;padding:8px 11px;margin:0 0 7px;'+
          'border-radius:9px;word-break:keep-all;scroll-margin-top:150px;border:1px solid';
        wrap.parentNode.insertBefore(쪽, wrap);
      }
      function 칠(바탕,글,테){ 쪽.style.background=바탕; 쪽.style.color=글; 쪽.style.borderColor=테; }
      var b=window._cgo못보고514;
      if(!b){ 쪽.textContent='⏳ 아직 악보 시각을 재지 않았습니다.';
              칠('#1e293b','#cbd5e1','#475569'); return; }
      if(b.맞음){
        쪽.innerHTML='✅ <b>소리 시각이 왔습니다.</b> 마디 시각표 '+b.칸+'칸 · '+
          '노래로 못 박은 마디 '+b.못+'개 · 이어 메운 마디 '+b.메움+'개'+
          (b.첫초!=null ? ' · 첫 마디 <b>'+b.첫초+'초</b>' : '');
        칠('#064e3b','#d1fae5','#10b981');
      } else {
        쪽.innerHTML='⚠️ <b>소리 시각이 안 왔습니다.</b> 음표 '+b.음표+'개 가운데 '+
          '시각이 든 것 <b>'+b.시각있는것+'개</b> — 악보 빠르기 '+b.빠르기+'으로 짐작해 따라갑니다.';
        칠('#7c2d12','#ffedd5','#f97316');
      }
    }catch(_){}
  }
  window._juran시각쪽지=시각쪽지;
  /* ⚠️ CGO 악보는 **그릴 때의 폭**으로 한 번 그리고 끝이다. 글자를 키우거나 창을
     바꾸면 그린 그림과 자리가 안 맞는다. 폭이 8% 넘게 달라졌을 때만 다시 그린다.
     (고리를 돌지 않는다 — 바뀔 때 한 번이다.) */
  /* ⚠️ 판 570 : 이 장치가 **곡을 끊고 있었다.**
     파트너 — 「악보와 띠 소리만 나오고 끊어집니다. 원래는 안 끊어지고 계속 나와야」
     재 보니 곡이 시작되고 0.6초 뒤에 여기서 악보를 다시 그렸고, CGO 작곡 손은
     악보를 다시 그릴 때 **연주를 멈춘다**(renderGrooveAsScore → _cgoScoreStop).
     악보 칸이 처음 나타나는 순간을 「폭이 바뀌었다」로 잘못 본 것이다(지난폭이 0 이었다).
     ① 처음 본 폭은 **기억만** 한다 — 그것은 바뀐 게 아니라 처음 잰 것이다.
     ② **연주 중에는 다시 그리지 않는다.** 폭이 바뀌었으면 적어 두고, 연주가 끝난 뒤
        다음에 이 장치가 깰 때(폭이 또 바뀌거나 창이 바뀔 때) 맞춘다. 고리를 돌지 않는다. */
  var 지난폭=0, 늦=null, 밀린폭=false;
  function 연주중(){ try{ var pb=window._cgoScorePB; return !!(pb&&pb.playing); }catch(e){ return false; } }
  /* ⚠️ 판 574 : 판 570 의 ①이 **수노 악보 따라가기를 죽였다.**
     파트너 — 「수노 노래와 악보의 음표가 되었던 것이 안 되어요」 「시각 쪽지도 없어졌어요」
     재 보니 이랬다. 수노 곡은 1~3분 걸려서 손님은 기다리다 다른 앱으로 간다. 그러면 특허 구조가
     화면을 통째로 **떼어 둔다**(재우기). 그 사이 악보가 오면 떼어 둔 화면 안에 그려지는데,
     그때는 소리판(#cgo-vvip-audio)도 악보 칸도 문서에서 못 찾아 노란 띠 · 보라 점 · 시각 쪽지를
     하나도 못 단다. 손님이 돌아와 화면이 다시 붙으면, 판 570 전에는 이 장치가 「처음 본 폭」을
     핑계로 **한 번 다시 그려서** 그것들을 달아 주고 있었다. ①이 바로 그 한 번을 막았다.
     ③ 그래서 「떼어 둔 채 그려졌다」는 표(_주란떼어그림574 — 악보 손이 적는다)가 있으면
        화면이 붙자마자 **꼭 한 번** 다시 그린다. ①은 그대로 둔다 — AI 곡을 끊던 것을 막는 자리다. */
  function 폭보기(){
    try{
      var m=window._cgoMusicMod; if(!m||!m.root) return;
      var w=m.root.querySelector('#cgo-groove-score-wrap');
      if(!w || !w.querySelector('svg')) return;
      var 이번=w.offsetWidth||0; if(!이번) return;
      if(window._주란떼어그림574 && document.getElementById('cgo-groove-score-wrap')===w){   /* ③ */
        window._주란떼어그림574=false; 지난폭=이번; 밀린폭=false;
        window._cgoGenerateScoreOnly368(); return;
      }
      if(!지난폭){ 지난폭=이번; return; }                                   /* ① */
      if(Math.abs(이번-지난폭)/지난폭 < 0.08 && !밀린폭){ 지난폭=이번; return; }
      if(연주중()){ 밀린폭=true; return; }                                   /* ② */
      지난폭=이번; 밀린폭=false;
      window._cgoGenerateScoreOnly368();
    }catch(e){}
  }
  window.addEventListener('resize',function(){ if(늦) clearTimeout(늦); 늦=setTimeout(폭보기,260); });
  /* 판 574 : 화면이 다시 붙을 때(깨우기) index.html 이 부른다 — 지켜보는 칸이 바뀌었어도 놓치지 않게 */
  window._juran폭보기574=function(){ if(늦) clearTimeout(늦); 늦=setTimeout(폭보기,150); };
  try{
    if(window.ResizeObserver){
      var ro=new ResizeObserver(function(){ if(늦) clearTimeout(늦); 늦=setTimeout(폭보기,260); });
      var 붙이기=function(){
        var m=window._cgoMusicMod;
        var w=m&&m.root&&m.root.querySelector('#cgo-groove-score-wrap');
        if(w){ try{ ro.observe(w); }catch(e){} } else setTimeout(붙이기,1500);
      };
      setTimeout(붙이기,1500);
    }
  }catch(e){}

  /* ═══ 판 571 : 악보 따라가기 ═════════════════════════════════════════════
     파트너 — 「음표 찍히면 자동으로 악보가 찍히는 구간에 맞게 내려가게」
     CGO 작곡 손은 곡이 흐르면 지금 마디에 띠(#cgo-sc-hl)를 켠다. 그런데 화면은
     안 따라가서, 재 보니 3마디만 지나도 띠가 화면 아래로 빠져나갔다.
     ・ 띠가 새로 켜질 때만 본다 — 고리를 돌지 않는다(마디마다 한 번, 2초에 한 번꼴).
     ・ 띠가 화면 아래 82% 를 넘거나 위로 숨으면, 띠가 화면 위 30% 자리에 오게 한 번 굴린다.
     ・ 손님이 손가락으로 화면을 만지면 따라가기를 멈추고 「▶ 악보 따라가기」 단추를 띄운다.
       보고 싶은 데를 보는데 자꾸 끌려가면 짜증 난다. 단추를 누르면 다시 따라간다.
     ・ 새 곡이 처음부터 흐르면(첫 마디) 저절로 다시 따라간다.
     ・ 작곡 손(cgo-gen.js)은 한 글자도 안 건드린다. 띠가 켜지는 것만 지켜본다. */
  (function(){
    var 멈춤=false, 단추=null, 굴릴틀=0, 지난마디=-2;
    var 조용히=false; try{ 조용히=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}
    /* 판 572 : 수노 곡도 따라간다 — 수노는 소리판(#cgo-vvip-audio)이 흐르고 띠 이름이 다르다(#cgo-sc-sync372).
       CGO 는 악보 칸 **안에서** 굴렸는데(_sw369.scrollTo), JURAN 은 악보가 페이지에 통째로 펼쳐져 있어
       칸 안 굴리기가 아무 일도 안 했다. 그래서 수노 곡이 흘러도 화면이 가만히 있었다. */
    function 수노소리(){ var a=document.getElementById('cgo-vvip-audio'); return (a && !a.paused && !a.ended) ? a : null; }
    function 연주중(){ try{ var pb=window._cgoScorePB; if(pb&&pb.playing) return true; }catch(e){} return !!수노소리(); }
    function 지금띠(){ return document.getElementById('cgo-sc-hl') || (수노소리() && document.getElementById('cgo-sc-sync372')); }
    function 단추보이기(on){
      if(on && !단추){
        단추=document.createElement('button'); 단추.type='button';
        단추.textContent='▶ 악보 따라가기';
        단추.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));'+
          'z-index:55;padding:11px 18px;border:0;border-radius:999px;font-weight:800;font-size:14px;cursor:pointer;'+
          'background:#10b981;color:#04221a;box-shadow:0 6px 20px rgba(0,0,0,.25)';
        단추.addEventListener('click',function(){ 멈춤=false; 단추보이기(false); 따라가기(true); });
        document.body.appendChild(단추);
      }
      if(단추) 단추.style.display=on?'block':'none';
    }
    function 따라가기(바로){
      if(멈춤 || !연주중()) return;
      var hl=지금띠(); if(!hl) return;
      var r=hl.getBoundingClientRect(), H=window.innerHeight||700;
      if(!r.height) return;                                   /* 떼어 둔 화면 — 안 보인다 */
      var 위=Math.max(72, H*0.12);
      if(바로 || r.bottom > H*0.82 || r.top < 위){
        var 목표=Math.max(0, (window.pageYOffset||0) + r.top - H*0.30);
        try{ window.scrollTo({top:목표, behavior:조용히?'auto':'smooth'}); }catch(e){ window.scrollTo(0,목표); }
      }
    }
    /* 손님 손 — 화면을 만지면 멈춘다 (단추 자신은 빼고) */
    ['touchstart','wheel','keydown'].forEach(function(k){
      window.addEventListener(k,function(e){
        if(!연주중()) return;
        if(단추 && e.target && 단추.contains(e.target)) return;
        if(k==='keydown' && !/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key||'')) return;
        if(!멈춤){ 멈춤=true; 단추보이기(true); }
      },{passive:true, capture:true});   /* 붙잡기 단계 — 안쪽에서 막아도 먼저 듣는다 */
    });
    /* 띠가 켜지거나 꺼질 때만 깬다 */
    function 띠살핌(){
      굴릴틀=0;
      if(!연주중()){ 멈춤=false; 단추보이기(false); 지난마디=-2; return; }
      var 마디=-1; try{ 마디=window._cgoScorePB.bar; }catch(e){}
      if(마디===0 && 지난마디!==0){ 멈춤=false; 단추보이기(false); }   /* 새 곡 첫 마디 — 다시 따라간다 */
      지난마디=마디;
      따라가기(false);
    }
    function 띠인가(n){ return n && n.nodeType===1 && (n.id==='cgo-sc-hl' || n.id==='cgo-sc-sync372'); }
    /* 수노 곡을 처음부터 다시 틀면 다시 따라간다 (소리 사건은 위로 안 올라오니 붙잡기 단계로 듣는다) */
    document.addEventListener('play',function(e){
      if(e.target && e.target.id==='cgo-vvip-audio'){ 멈춤=false; 단추보이기(false); }
    },true);
    try{
      var 지켜봄=new MutationObserver(function(바뀐것){
        for(var i=0;i<바뀐것.length;i++){
          var b=바뀐것[i], j;
          for(j=0;j<b.addedNodes.length;j++)   if(띠인가(b.addedNodes[j]))   { if(!굴릴틀) 굴릴틀=requestAnimationFrame(띠살핌); return; }
          for(j=0;j<b.removedNodes.length;j++) if(띠인가(b.removedNodes[j])) { if(!굴릴틀) 굴릴틀=requestAnimationFrame(띠살핌); return; }
        }
      });
      var 걸기=function(){
        var 자리=document.getElementById('cgo-music-mount');
        if(자리) 지켜봄.observe(자리,{childList:true,subtree:true}); else setTimeout(걸기,1500);
      };
      걸기();
    }catch(e){}
    window._juran따라가기571={ 다시:function(){ 멈춤=false; 단추보이기(false); 따라가기(true); } };
  })();

  try{ window.renderGrooveAsScore = renderGrooveAsScore; }catch(e){}
  try{ console.log('[JURAN] CGO 악보 편집기 실림'); }catch(e){}
})();
