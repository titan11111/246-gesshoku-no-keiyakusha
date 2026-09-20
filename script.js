'use strict';

const cv=document.getElementById('g'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const screenWrap=document.getElementById('screen-wrap');
const W=320,H=224,TS=16,MW=19,MH=11,OX=8,OY=0;
let paused=false,mute=false,AC=null,bgmNode=null;
const SAVE_KEY='tg.246.save.v2';
function fitCanvas(){
  const r=screenWrap.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.max(1,Math.round(r.width*dpr));
  cv.height=Math.max(1,Math.round(r.height*dpr));
  cv.style.width=r.width+'px';cv.style.height=r.height+'px';
  cv.dataset.logicalWidth=String(Math.round(r.width));
  cv.dataset.logicalHeight=String(Math.round(r.height));
  ctx.imageSmoothingEnabled=false;
  ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
}
window.addEventListener('resize',fitCanvas);
window.addEventListener('orientationchange',fitCanvas);
fitCanvas();
try{mute=localStorage.getItem('tg.246.mute')==='1';}catch(e){}
function unlockAudio(){
  try{
    AC=AC||new(window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const buf=AC.createBuffer(1,1,22050);const src=AC.createBufferSource();src.buffer=buf;src.connect(AC.destination);src.start(0);
    startBgm();
  }catch(e){}
}
function startBgm(){
  if(!AC||mute||bgmNode)return;
  try{
    const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const data=buf.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.sin(2*Math.PI*110*i/AC.sampleRate)*0.02+Math.sin(2*Math.PI*165*i/AC.sampleRate)*0.01;
    const src=AC.createBufferSource(),g=AC.createGain();g.gain.value=.18;src.buffer=buf;src.loop=true;src.connect(g);g.connect(AC.destination);src.start();bgmNode=src;
  }catch(e){}
}
function stopBgm(){if(bgmNode){try{bgmNode.stop();}catch(e){}bgmNode=null;}}
function setMute(v){mute=v;try{localStorage.setItem('tg.246.mute',mute?'1':'0');}catch(e){}const b=document.getElementById('btnMute');if(b)b.textContent=mute?'🔇':'♪';const d=document.getElementById('btnMuteDlg');if(d)d.textContent=mute?'音: オフ':'音: オン';if(mute)stopBgm();else startBgm();}
function setPaused(on){if(scene==='title'&&on)return;paused=on;const dlg=document.getElementById('pauseDlg');if(on){try{dlg.showModal();}catch(e){}stopBgm();}else{try{dlg.close();}catch(e){}if(!mute)startBgm();}}
setMute(mute);
let lastTouchEnd=0;document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=300)e.preventDefault();lastTouchEnd=now;},{passive:false});
document.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(typeof scene!=='undefined'&&scene!=='title')setPaused(true);stopBgm();}});
document.getElementById('btnMute').addEventListener('pointerdown',e=>{e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId);}catch(err){}setMute(!mute);});
document.getElementById('btnPause').addEventListener('pointerdown',e=>{e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId);}catch(err){}setPaused(true);});
document.getElementById('btnResume').addEventListener('pointerdown',e=>{e.preventDefault();setPaused(false);});
document.getElementById('btnMuteDlg').addEventListener('pointerdown',e=>{e.preventDefault();setMute(!mute);});
document.getElementById('btnQuit').addEventListener('pointerdown',e=>{e.preventDefault();setPaused(false);scene='title';ui=null;busy=false;});
const COL={void:'#07050f',wall:'#2b2150',wallHi:'#453578',wallLo:'#1a1433',floor:'#120d24',floorDot:'#231a42',
  ink:'#efe4c8',dim:'#8b7fae',red:'#c8323c',blood:'#6e1420',gold:'#e8b44a',teal:'#46b3a6',moon:'#f3e9cc',panel:'#150f2b',line:'#5b4e86'};
const FONT='"DotGothic16","Hiragino Kaku Gothic ProN","Yu Gothic",monospace';
const font=px=>{ctx.font=`${px}px ${FONT}`;};
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function hasSave(){try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
function saveGame(){
  if(scene!=='explore'||!P)return;
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify({
      P,items,floor,map,seen,px,py,light,
      party:party.map(a=>({id:a.m.id,hp:a.hp,maxhp:a.maxhp,atk:a.atk,def:a.def}))
    }));
  }catch(e){}
}
function loadGame(){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEY));
    if(!s||!s.P||!Array.isArray(s.map))return false;
    P=s.P;items=s.items;floor=s.floor;map=s.map;seen=s.seen;px=s.px;py=s.py;light=s.light;
    party=(s.party||[]).map(v=>{const m=ROSTER.find(r=>r.id===v.id);if(!m)return null;const a=mkUnit(m,'ally');return Object.assign(a,{hp:v.hp,maxhp:v.maxhp,atk:v.atk,def:v.def});}).filter(Boolean);
    battle=null;ui=null;busy=false;endDone=false;scene='explore';titleChoice=0;
    return true;
  }catch(e){clearSave();return false;}
}

/* ===== データ ===== */
const P_NAME=['陽','陰','狂'];
const ROSTER=[
 {id:0,n:'灯喰い',lv:1,p:1,c:['#e8b44a','#8a4a18','#fff2a8']},
 {id:1,n:'泥鴉',lv:2,p:2,c:['#6a6a8e','#2a2a3e','#b0b0d8']},
 {id:2,n:'錆ノ童',lv:3,p:0,c:['#c0703a','#6a3418','#f0b080']},
 {id:3,n:'傘骨鬼',lv:4,p:2,c:['#b03848','#5a1824','#f08090']},
 {id:4,n:'硝子蜘蛛',lv:6,p:1,c:['#78c8d8','#2e6878','#e0fbff']},
 {id:5,n:'電線女',lv:7,p:0,c:['#a8d048','#4a6a18','#e8ffa0']},
 {id:6,n:'無面ノ車掌',lv:9,p:1,c:['#7a7ab8','#2a2a58','#d0d0f4']},
 {id:7,n:'骨笛の楽士',lv:11,p:0,c:['#e8dcc0','#8a7a5a','#ffffff']},
 {id:8,n:'瓦礫獅子',lv:13,p:2,c:['#a08868','#4a3a28','#e0c8a0']},
 {id:9,n:'墨染め天女',lv:15,p:0,c:['#4a4a60','#15151f','#d8d0f0']},
 {id:10,n:'逆さ地蔵',lv:17,p:1,c:['#8a9a8a','#3a4a3a','#d0e0d0']},
 {id:11,n:'鉄塔巨人',lv:20,p:2,c:['#c84a2a','#5a1a0a','#ffa070']},
];
const BOSS={id:99,n:'蝕王ヨミガラス',lv:24,p:2,c:['#3a2450','#12081c','#c8323c'],boss:true};
const GREET=['なになに? あそんでくれるの?','……何の用だ。','ギャハハ! しゃべる肉だ!'];
const LIKE=['あはは、わかってるね!','……悪くない答えだ。','イイね、イカれてる!'];
const HATE=['つまんないの。','……うるさい。','はぁ? 退屈なやつ。'];
const QS=[
 {q:'おまえ、夜は好きか?',a:[['好きだ。静かでいい',1],['朝のほうがいい',0],['夜ごと喰ってやる',2]]},
 {q:'この街はもう死んだと思う?',a:[['まだ生きてる',0],['とっくに死んでる',1],['燃やせば蘇る',2]]},
 {q:'ヒトはなぜ灯をともす?',a:[['誰かを待つため',0],['闇を見ないため',1],['燃えるのが楽しいから',2]]},
 {q:'オレの顔、こわいか?',a:[['かわいいと思う',0],['……こわい',1],['もっと崩してやろうか',2]]},
 {q:'影はどこへ帰ると思う?',a:[['光のところ',0],['足元へ',1],['知るか',2]]},
 {q:'腹がへった。どうしたらいい?',a:[['あとで一緒に食べよう',0],['がまんしろ',1],['自分の腕でもかじれ',2]]},
 {q:'契約とは何だと思う?',a:[['約束だ',0],['鎖だ',1],['遊びだ',2]]},
 {q:'月が欠けたのは誰のせいだ?',a:[['誰も悪くない',0],['ヒトのせいだ',1],['オレがやった',2]]},
];

/* ===== 状態 ===== */
let scene='title',ui=null,busy=false,frame=0,endDone=false,titleChoice=0;
let P,party,items,floor,map,seen,px,py,light;
let battle=null,fuseFx=null,pops=[],shake=0,hurt=0;
const ME={n:'あなた',isP:true,get hp(){return P.hp},set hp(v){P.hp=v},get maxhp(){return P.maxhp},get atk(){return 6+P.lv*2},get def(){return P.lv}};

/* ===== UI（async） ===== */
function say(text){return new Promise(res=>{ui={type:'say',text,res,shown:0};});}
function choose(opts,cancel=false,prompt='',onMove=null){
  return new Promise(res=>{ui={type:'choose',opts,idx:0,cancel,prompt,res,onMove};if(onMove)onMove(0);});
}
function handleUI(k){
  const u=ui;
  if(u.type==='say'){
    if(k==='a'||k==='b'){ if(u.shown<u.text.length){u.shown=u.text.length;return;} ui=null;u.res(); }
    return;
  }
  const n=u.opts.length;
  if(k==='up'){u.idx=(u.idx+n-1)%n;u.onMove&&u.onMove(u.idx);}
  else if(k==='down'){u.idx=(u.idx+1)%n;u.onMove&&u.onMove(u.idx);}
  else if(k==='a'){ui=null;u.res(u.idx);}
  else if(k==='b'&&u.cancel){ui=null;u.res(-1);}
}

/* ===== ゲーム進行 ===== */
function newGame(){
  clearSave();
  P={lv:1,exp:0,maxhp:38,hp:38,money:20};
  items={heal:2,oil:1};party=[];floor=1;light=100;endDone=false;
  genFloor();scene='explore';saveGame();intro();
}
async function intro(){
  busy=true;
  await say('中央統制局は月蝕を隠した。あなたは封鎖区の地下へ潜り、最下層の蝕王を討て。');
  await say('階段を探して地下5階へ。異形には「はなす」で契約できる。赤い祭壇では契霊2体を融魂できる。');
  busy=false;
}

function genFloor(){
  map=[];for(let y=0;y<MH;y++)map.push(new Array(MW).fill(1));
  const st=[[1,1]];map[1][1]=0;
  while(st.length){
    const [x,y]=st[st.length-1];
    const ds=shuffle([[2,0],[-2,0],[0,2],[0,-2]]).filter(([dx,dy])=>{const nx=x+dx,ny=y+dy;return nx>0&&ny>0&&nx<MW-1&&ny<MH-1&&map[ny][nx]===1;});
    if(!ds.length){st.pop();continue;}
    const [dx,dy]=ds[0];map[y+dy/2][x+dx/2]=0;map[y+dy][x+dx]=0;st.push([x+dx,y+dy]);
  }
  for(let i=0;i<14;i++){const x=1+rnd(MW-2),y=1+rnd(MH-2);if(map[y][x]===1&&((x%2===0&&y%2===1)||(x%2===1&&y%2===0)))map[y][x]=0;}
  const dist=map.map(r=>r.map(()=>-1));dist[1][1]=0;const q=[[1,1]],cells=[];
  while(q.length){const [x,y]=q.shift();cells.push([x,y]);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(map[ny][nx]!==1&&dist[ny][nx]<0){dist[ny][nx]=dist[y][x]+1;q.push([nx,ny]);}}}
  cells.sort((a,b)=>dist[b[1]][b[0]]-dist[a[1]][a[0]]);
  const far=cells[0];map[far[1]][far[0]]=floor===5?6:2;
  const pool=shuffle(cells.filter(c=>c!==far&&dist[c[1]][c[0]]>=4));
  const put=(c,t)=>{if(c)map[c[1]][c[0]]=t;};
  put(pool[0],3);put(pool[1],4);put(pool[2],4);put(pool[3],5);
  seen=map.map(r=>r.map(()=>false));px=1;py=1;
}

let lastMove=0;
async function step(dx,dy){
  const now=performance.now();if(now-lastMove<115)return;lastMove=now;
  const nx=px+dx,ny=py+dy;if(map[ny][nx]===1)return;
  px=nx;py=ny;const before=light;if(light>0)light--;
  const t=map[ny][nx];busy=true;
  try{
    if(before===1)await say('ランタンの灯が消えた……。闇が濃くなり、異形が凶暴になる。');
    if(t===2){const c=await choose(['降りる','やめる'],true,'下へつづく階段がある。');
      if(c===0){floor++;genFloor();await say(`地下${floor}階。空気がさらに冷たくなった。`);}}
    else if(t===3)await fusion();
    else if(t===4){map[ny][nx]=0;await loot();}
    else if(t===5){map[ny][nx]=0;P.hp=P.maxhp;party.forEach(a=>a.hp=a.maxhp);light=Math.min(100,light+30);
      await say('湧き水に触れた。全員の傷が癒え、倒れた契霊も目をさました。灯も少し強まった。');}
    else if(t===6)await bossFight();
    else if(Math.random()<(light>0?0.07:0.14))await runBattle(encounterSet(),false);
  }finally{busy=false;saveGame();}
}
async function loot(){
  const r=Math.random();
  if(r<0.4){const m=10+floor*8+rnd(10);P.money+=m;await say(`古い箱の中に魂貨が${m}枚。`);}
  else if(r<0.7){items.heal++;await say('霊薬をみつけた。');}
  else{items.oil++;await say('灯油をみつけた。');}
}
async function fieldMenu(){
  busy=true;
  try{
    const i=await choose(['どうぐ','契霊をみる','とじる'],true,`魂貨 ${P.money}枚　経験 ${P.exp}/${P.lv*15}`);
    if(i===0)await itemMenu();
    else if(i===1){
      if(!party.length)await say('まだ契霊はいない。異形に「はなす」で話しかけてみよう。');
      else for(const a of party)await say(`${a.n}　Lv${a.lv}〈${P_NAME[a.p]}〉　HP ${a.hp}/${a.maxhp}　攻${Math.round(a.atk)}`);
    }
  }finally{busy=false;}
}
async function itemMenu(){
  const i=await choose([`霊薬 ×${items.heal}（全員HP+35）`,`灯油 ×${items.oil}（灯+50）`],true,'どうぐ');
  if(i<0)return false;
  if(i===0){
    if(!items.heal){await say('霊薬がない。');return false;}
    items.heal--;P.hp=Math.min(P.maxhp,P.hp+35);party.forEach(a=>{if(a.hp>0)a.hp=Math.min(a.maxhp,a.hp+35);});
    await say('霊薬を飲みほした。みんなの傷がふさがっていく。');return true;
  }
  if(!items.oil){await say('灯油がない。');return false;}
  items.oil--;light=Math.min(100,light+50);await say('ランタンに灯油をそそいだ。灯が強くなった。');return true;
}

/* ===== ユニット ===== */
function mkUnit(m,kind){
  const lv=m.lv,boss=!!m.boss,hp=Math.round((8+lv*5)*(boss?3.2:1));
  return {m,n:m.n,lv,p:m.p,maxhp:hp,hp,atk:kind==='ally'?3+lv*2:2+lv*1.6,def:lv*0.8,boss,flash:0,dead:false,gone:false,rage:false};
}
function encounterSet(){
  const lo=(floor-1)*4,hi=floor*4+1,pool=ROSTER.filter(m=>m.lv>=lo&&m.lv<=hi);
  const n=1+(Math.random()<0.4?1:0)+(floor>=3&&Math.random()<0.3?1:0);
  return Array.from({length:n},()=>mkUnit(pick(pool),'enemy'));
}

/* ===== 戦闘 ===== */
const alive=()=>battle.en.filter(e=>!e.dead&&!e.gone);
function calc(a,t,mult=1){let d=(a.atk-t.def*0.5)*(0.85+Math.random()*0.3)*mult;const crit=Math.random()<0.08;if(crit)d*=1.6;return {d:Math.max(1,Math.round(d)),crit};}
function apply(t,d){
  t.hp=Math.max(0,t.hp-d);
  if(battle&&battle.en.includes(t)){t.flash=18;pops.push({e:t,text:String(d),t:0});}
  else{shake=8;hurt=10;}
}
async function fallen(t){
  if(t.hp>0||t.isP)return;
  if(party.includes(t))await say(`${t.n}は倒れた。`);
  else if(!t.dead){t.dead=true;await say(`${t.n}をたおした!`);}
}
async function hit(a,t,mult=1){
  const {d,crit}=calc(a,t,mult);apply(t,d);
  await say(`${a.n}の攻撃!${crit?' 会心の一撃!':''} ${t.n}に${d}のダメージ。`);
  await fallen(t);
}
async function pickTarget(){
  const al=alive();if(al.length===1)return al[0];
  const i=await choose(al.map(e=>`${e.n}　Lv${e.lv}`),true,'だれを?',idx=>{battle.cursor=battle.en.indexOf(al[idx]);});
  battle.cursor=-1;return i<0?null:al[i];
}
async function enemyTurn(){
  for(const e of battle.en){
    if(e.dead||e.gone)continue;
    const acts=e.boss?2:1;
    for(let k=0;k<acts;k++){
      const tg=[ME,...party.filter(a=>a.hp>0)];
      const mult=(light<=0?1.2:1)*(e.rage?1.5:1);
      if(e.boss&&k===1&&Math.random()<0.45){
        const parts=tg.map(u=>{const {d}=calc(e,u,0.6*mult);apply(u,d);return `${u.n}${d}`;});
        await say(`ヨミガラスが月蝕の翼をひろげた! ${parts.join('、')}のダメージ。`);
        for(const u of tg)await fallen(u);
      }else{
        const t=Math.random()<0.5?ME:pick(tg);
        await hit(e,t,mult);
      }
      if(P.hp<=0)return;
    }
    e.rage=false;
  }
}
async function negotiate(e){
  battle.cursor=battle.en.indexOf(e);
  await say(`${e.n}「${GREET[e.p]}」`);
  let score=light<=0?-1:0;
  for(const q of shuffle(QS.slice()).slice(0,2)){
    const ans=shuffle(q.a.slice());
    const i=await choose(ans.map(a=>a[0]),false,`${e.n}「${q.q}」`);
    const t=ans[i][1],d=t===e.p?2:(t===2||e.p===2)?0:-1;score+=d;
    await say(`${e.n}「${d===2?LIKE[e.p]:d===0?'……ふーん。':HATE[e.p]}」`);
  }
  if(score>=3){
    const kind=rnd(3);let text,can,pay;
    if(kind===0){const m=e.lv*6+rnd(10);text=`魂貨を${m}枚くれたら、力を貸してやる。`;can=P.money>=m;pay=()=>{P.money-=m;};}
    else if(kind===1){text='霊薬をひとつよこせ。そしたら契約してやる。';can=items.heal>0;pay=()=>{items.heal--;};}
    else{const h=Math.ceil(P.maxhp*0.2);text=`おまえの血を少しもらう。（HP−${h}）`;can=P.hp>h;pay=()=>{P.hp-=h;};}
    const c=await choose(['わたす','ことわる'],false,`${e.n}「${text}」`);
    if(c===0){
      if(!can)await say(`${e.n}「……足りないじゃないか。からかったのか?」`);
      else{
        pay();e.gone=true;
        if(party.length<3){party.push(mkUnit(e.m,'ally'));await say(`${e.n}「いいだろう。今夜からおまえの灯についていく」`);await say(`${e.n}と契約した!`);}
        else await say(`${e.n}「契霊がいっぱいじゃないか。礼だけもらって去るよ」`);
      }
    }else await say(`${e.n}「ケチなやつ」`);
  }else if(score>=1){e.gone=true;await say(`${e.n}は興味をなくして、闇に溶けていった。`);}
  else{e.rage=true;await say(`${e.n}は激怒した! 次の攻撃が激しくなる。`);}
  battle.cursor=-1;
}
async function runBattle(en,isBoss){
  battle={en,cursor:-1};scene='battle';pops=[];
  await say(en.length===1?`${en[0].n}があらわれた!`:`${en.map(e=>e.n).join('、')}があらわれた!`);
  let result='win';
  while(true){
    const cmd=await choose(['たたかう','はなす','どうぐ','にげる']);
    if(cmd===0){
      const t=await pickTarget();if(!t)continue;
      await hit(ME,t);
      for(const a of party){
        if(a.hp<=0)continue;const al=alive();if(!al.length)break;
        const tgt=(t.dead||t.gone)?pick(al):(Math.random()<0.6?t:pick(al));
        await hit(a,tgt);
      }
    }else if(cmd===1){
      if(isBoss){await say('ヨミガラス「……言葉なら、とうに喰い尽くした」');}
      else{const t=await pickTarget();if(!t)continue;await negotiate(t);}
    }else if(cmd===2){if(!(await itemMenu()))continue;}
    else{
      if(isBoss)await say('逃げ道は闇にふさがれている!');
      else if(Math.random()<0.5+light/400){await say('うまく逃げきった。');result='flee';break;}
      else await say('逃げられない!');
    }
    if(!alive().length)break;
    await enemyTurn();
    if(P.hp<=0){result='dead';break;}
  }
  if(result==='dead'){await say('あなたは闇に呑まれた……。');battle=null;scene='over';return 'dead';}
  if(result==='win'){
    const k=battle.en.filter(e=>e.dead);
    if(k.length){
      const exp=k.reduce((s,e)=>s+e.lv*5,0),money=k.reduce((s,e)=>s+e.lv*4,0);
      P.exp+=exp;P.money+=money;await say(`経験${exp}と魂貨${money}枚を得た。`);
      while(P.exp>=P.lv*15){P.exp-=P.lv*15;P.lv++;P.maxhp+=8;P.hp=Math.min(P.maxhp,P.hp+8);await say(`レベルが${P.lv}に上がった!`);}
    }
  }
  battle=null;scene='explore';return result;
}
async function bossFight(){
  await say('闇の底で、欠けた月を喰らう影がこちらを見た。');
  const r=await runBattle([mkUnit(BOSS,'enemy')],true);
  if(r!=='win')return;
  clearSave();
  scene='end';
  await say('ヨミガラスが崩れ落ち、喰われていた月が空へ還っていく。');
  await say('街の灯が、ひとつ、またひとつ、ともりはじめた。');
  await say(`契約者Lv${P.lv}。${party.length?party.map(a=>a.n).join('、')+'とともに――':''}夜明けへ。`);
  endDone=true;
}

/* ===== 融魂 ===== */
function fuseResult(a,b){
  const target=Math.floor((a.lv+b.lv)/2)+3;
  const pool=ROSTER.filter(m=>m.id!==a.m.id&&m.id!==b.m.id);
  return pool.filter(m=>m.lv>=target).sort((x,y)=>x.lv-y.lv)[0]||pool.sort((x,y)=>y.lv-x.lv)[0];
}
async function fusion(){
  if(party.length<2){await say('融魂の祭壇だ。契霊が2体いれば、ここで合わせて新たな霊を呼べる。');return;}
  const go=await choose(['融魂する','やめる'],true,'融魂の祭壇。契霊を2体ささげ、より強い霊を呼ぶ。');
  if(go!==0)return;
  const lab=a=>`${a.n}　Lv${a.lv}`;
  const a=await choose(party.map(lab),true,'ひとり目をえらぶ');if(a<0)return;
  const rest=party.map((_,i)=>i).filter(i=>i!==a);
  const bi=await choose(rest.map(i=>lab(party[i])),true,'ふたり目をえらぶ');if(bi<0)return;
  const A=party[a],B=party[rest[bi]],R=fuseResult(A,B);
  const ok=await choose(['ささげる','やめる'],true,`${A.n} ＋ ${B.n} → ${R.n} Lv${R.lv}`);
  if(ok!==0)return;
  scene='fuse';fuseFx={t:0,a:A.m,b:B.m,r:R};
  await wait(2700);
  party=party.filter(x=>x!==A&&x!==B);party.push(mkUnit(R,'ally'));
  scene='explore';fuseFx=null;
  await say(`祭壇の炎から${R.n}が生まれた!`);
}

/* ===== 描画ヘルパー ===== */
const patC={};
function pat(col){if(patC[col])return patC[col];const c=document.createElement('canvas');c.width=c.height=2;const g=c.getContext('2d');g.fillStyle=col;g.fillRect(0,0,1,1);g.fillRect(1,1,1,1);return patC[col]=ctx.createPattern(c,'repeat');}
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function bar(x,y,w,h,ratio,col){ctx.fillStyle='#000';ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.round(w*Math.max(0,Math.min(1,ratio))),h);}
function wrap(t,w){const out=[];let cur='';for(const ch of t){if(ctx.measureText(cur+ch).width>w){out.push(cur);cur=ch;}else cur+=ch;}out.push(cur);return out;}
function drawEclipse(cx,cy,r){
  ctx.fillStyle=pat(COL.red);circle(cx,cy,r*1.28);
  ctx.fillStyle=COL.blood;circle(cx,cy,r+2);
  ctx.fillStyle=COL.moon;circle(cx,cy,r);
  ctx.fillStyle=COL.void;circle(cx-r*0.2+Math.sin(frame/90)*1.5,cy-r*0.06,r*0.96);
}
const sprC={};
function sprite(m){
  if(sprC[m.id])return sprC[m.id];
  const S=m.boss?16:12,H2=S/2;let seed=(m.id+3)*7919;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const g=[];for(let y=0;y<S;y++)g.push(new Array(S).fill(0));
  for(let y=0;y<S;y++)for(let x=0;x<H2;x++){
    const cx=(H2-1-x)/H2,cy=Math.abs(y-S*0.5)/(S*0.5),p=0.88-cx*0.55-cy*0.42;
    if(r()<p){const v=r(),val=v<0.6?1:v<0.85?2:3;g[y][x]=val;g[y][S-1-x]=val;}
  }
  const ey=Math.floor(S*0.38),ex=H2-2-(r()<0.5?0:1);g[ey][ex]=4;g[ey][S-1-ex]=4;
  const c=document.createElement('canvas');c.width=c.height=S+2;const x2=c.getContext('2d');
  const at=(x,y)=>(x<0||y<0||x>=S||y>=S)?0:g[y][x];
  for(let y=-1;y<=S;y++)for(let x=-1;x<=S;x++){
    const v=at(x,y);
    if(v){x2.fillStyle=v===4?(m.boss?'#ff3040':'#fff4d0'):m.c[v-1];x2.fillRect(x+1,y+1,1,1);}
    else if(at(x+1,y)||at(x-1,y)||at(x,y+1)||at(x,y-1)){x2.fillStyle='#050308';x2.fillRect(x+1,y+1,1,1);}
  }
  return sprC[m.id]=c;
}

/* ===== シーン描画 ===== */
const skyline=Array.from({length:22},(_,i)=>({x:i*15-4,w:10+((i*37)%9),h:18+((i*53)%34),broken:(i*7)%3===0}));
function drawTitle(){
  ctx.fillStyle='#090a0a';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#b42623';ctx.fillRect(0,0,W,13);
  font(8);ctx.fillStyle='#f0e8d8';ctx.fillText('中央統制局・第九封鎖区',7,3);
  ctx.textAlign='right';ctx.fillText('緊急放送 00:00:00',313,3);ctx.textAlign='left';

  ctx.save();ctx.beginPath();ctx.rect(0,13,W,122);ctx.clip();
  ctx.fillStyle='#111313';ctx.fillRect(0,13,W,122);
  ctx.fillStyle='#181b19';
  for(let x=5;x<330;x+=22){const h=24+(x*17)%62;ctx.fillRect(x,135-h,15,h);ctx.fillRect(x+4,126-h,7,9);}
  ctx.globalAlpha=.16;ctx.fillStyle='#d9d2bf';ctx.beginPath();ctx.moveTo(24,135);ctx.lineTo(224,18);ctx.lineTo(258,18);ctx.lineTo(82,135);ctx.fill();ctx.globalAlpha=1;
  drawEclipse(244,67,42);
  ctx.fillStyle='#080909';ctx.fillRect(229,12,3,98);ctx.fillRect(257,17,2,104);
  ctx.strokeStyle='#54201f';ctx.strokeRect(197.5,19.5,94,94);
  ctx.restore();

  const glitch=frame%173<5?2:0;
  font(27);ctx.fillStyle='#5e1515';ctx.fillText('月蝕ノ',18+glitch,43);ctx.fillText('契約者',18-glitch,73);
  ctx.fillStyle='#e5dfd0';ctx.fillText('月蝕ノ',16,41);ctx.fillText('契約者',16,71);
  font(8);ctx.fillStyle='#9b9c94';ctx.fillText('ECLIPSE COVENANT / FILE 246',18,105);
  ctx.fillStyle='#b42623';ctx.fillRect(15,115,137,13);ctx.fillStyle='#f3ead9';font(9);ctx.fillText('警告：月を直視するな',22,117);

  ctx.fillStyle='#0c0d0d';ctx.fillRect(0,135,W,89);ctx.fillStyle='#353834';ctx.fillRect(0,135,W,1);
  font(8);ctx.fillStyle='#777a73';ctx.fillText('市民識別: UNKNOWN　契約適合率: 87.3%',15,141);
  const opts=hasSave()?['前回の契約を再開','新しい契約を開始']:['契約者として登録'];
  opts.forEach((o,i)=>{
    const y=156+i*23,sel=i===titleChoice;
    ctx.fillStyle=sel?'#b42623':'#171918';ctx.fillRect(15,y,222,18);
    ctx.strokeStyle=sel?'#dc615b':'#444742';ctx.strokeRect(15.5,y+.5,221,17);
    font(10);ctx.fillStyle=sel?'#fff5e6':'#aaa99f';ctx.fillText(sel?'▶':'·',23,y+4);ctx.fillText(o,39,y+4);
  });
  font(8);ctx.fillStyle='#797b75';ctx.fillText('方向キー: 選択　A / 画面タップ: 認証',15,211);

  ctx.globalAlpha=.13;ctx.fillStyle='#ffffff';for(let y=14;y<H;y+=3)ctx.fillRect(0,y,W,1);ctx.globalAlpha=1;
  if(frame%211<3){ctx.fillStyle='rgba(190,35,31,.25)';ctx.fillRect(0,46+(frame%3)*17,W,3);}
}
function drawTile(x,y,t){
  const sx=OX+x*TS,sy=OY+y*TS;
  if(t===1){ctx.fillStyle=COL.wall;ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=COL.wallHi;ctx.fillRect(sx,sy,TS,3);
    ctx.fillStyle=COL.wallLo;ctx.fillRect(sx,sy+TS-2,TS,2);ctx.fillRect(sx+((y%2)?4:11),sy+3,1,11);ctx.fillRect(sx,sy+8,TS,1);return;}
  ctx.fillStyle=COL.floor;ctx.fillRect(sx,sy,TS,TS);ctx.fillStyle=COL.floorDot;ctx.fillRect(sx+4,sy+11,1,1);ctx.fillRect(sx+11,sy+5,1,1);
  if(t===2){for(let i=0;i<4;i++){ctx.fillStyle=i%2?COL.dim:COL.ink;ctx.fillRect(sx+2+i*1.5,sy+3+i*3,12-i*3,2);}}
  else if(t===3){const pl=(Math.sin(frame/15)+1)/2;ctx.fillStyle=pl>0.5?COL.red:COL.blood;circle(sx+8,sy+8,6);ctx.fillStyle=COL.floor;circle(sx+8,sy+8,4);ctx.fillStyle=COL.red;ctx.fillRect(sx+7,sy+7,2,2);}
  else if(t===4){ctx.fillStyle=COL.gold;ctx.fillRect(sx+3,sy+5,10,8);ctx.fillStyle=COL.blood;ctx.fillRect(sx+3,sy+8,10,1);ctx.fillRect(sx+7,sy+8,2,3);}
  else if(t===5){const k=(frame>>3)%3;ctx.strokeStyle=COL.teal;ctx.beginPath();ctx.ellipse(sx+8,sy+9,3+k*1.5,1.5+k*0.7,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=COL.teal;ctx.fillRect(sx+7,sy+8,2,2);}
  else if(t===6){ctx.fillStyle=pat(COL.red);circle(sx+8,sy+8,7+Math.sin(frame/10));ctx.fillStyle=COL.void;circle(sx+8,sy+8,5);}
}
function drawPlayer(){
  const sx=OX+px*TS,sy=OY+py*TS,b=(frame>>4)%2;
  ctx.fillStyle='#3a2a5a';ctx.fillRect(sx+4,sy+7,8,8);
  ctx.fillStyle=COL.red;ctx.fillRect(sx+4,sy+7,8,2);
  ctx.fillStyle=COL.ink;ctx.fillRect(sx+5,sy+2+b,6,5);
  ctx.fillStyle=COL.void;ctx.fillRect(sx+6,sy+4+b,1,1);ctx.fillRect(sx+9,sy+4+b,1,1);
  ctx.fillStyle=light>0?(Math.random()<0.15?'#fff2a8':COL.gold):COL.dim;ctx.fillRect(sx+12,sy+9,3,3);
}
function drawHUD(){
  ctx.fillStyle=COL.panel;ctx.fillRect(0,176,W,48);ctx.fillStyle=COL.line;ctx.fillRect(0,176,W,1);
  font(10);ctx.fillStyle=COL.ink;
  ctx.fillText(`地下${floor}階`,8,181);ctx.fillText(`Lv${P.lv}`,62,181);
  ctx.fillText('HP',100,181);bar(118,184,70,5,P.hp/P.maxhp,hurt>0?COL.red:COL.teal);ctx.fillText(`${P.hp}/${P.maxhp}`,194,181);
  ctx.fillText('灯',100,195);bar(118,198,70,5,light/100,light>0?COL.gold:COL.red);
  ctx.fillText(`魂貨 ${P.money}`,194,195);ctx.fillStyle=COL.dim;ctx.fillText('B：メニュー',254,181);
  ctx.fillStyle=COL.ink;ctx.fillText('契霊',8,209);
  if(!party.length){ctx.fillStyle=COL.dim;ctx.fillText('なし',40,209);}
  party.forEach((a,i)=>{ctx.fillStyle=a.hp>0?COL.ink:COL.red;ctx.fillText(a.n,40+i*92,209);bar(40+i*92,221,60,2,a.hp/a.maxhp,COL.teal);});
  ctx.fillStyle=COL.ink;ctx.fillText('霊薬',8,195);ctx.fillText(`${items.heal}`,34,195);ctx.fillText('灯油',50,195);ctx.fillText(`${items.oil}`,76,195);
  ctx.fillStyle=COL.gold;ctx.fillText(floor<5?'目的：階段を探す':'目的：蝕王を討つ',194,209);
}
function drawExplore(){
  const r=light>0?2.2+light/25:1.6;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const d=Math.hypot(x-px,y-py),vis=d<=r;if(vis)seen[y][x]=true;if(!seen[y][x])continue;
    drawTile(x,y,map[y][x]);
    if(!vis){ctx.fillStyle='rgba(7,5,15,0.66)';ctx.fillRect(OX+x*TS,OY+y*TS,TS,TS);}
    else if(d>r-1.1){ctx.fillStyle=pat(COL.void);ctx.fillRect(OX+x*TS,OY+y*TS,TS,TS);}
  }
  drawPlayer();drawHUD();
}
function epos(i,n,e){const s=e.boss?18*5:14*4;return {x:Math.round(W/2+(i-(n-1)/2)*86-s/2),y:e.boss?38:66+Math.round(Math.sin(frame/22+i)*2),s};}
function drawStatus(){
  ctx.fillStyle=COL.panel;ctx.fillRect(0,0,W,24);ctx.fillStyle=hurt>0?COL.red:COL.line;ctx.fillRect(0,24,W,1);
  font(10);const us=[ME,...party];
  us.forEach((u,i)=>{const x=4+i*79;ctx.fillStyle=u.hp<=0?COL.red:COL.ink;ctx.fillText(u.n,x,3);
    ctx.textAlign='right';ctx.fillStyle=COL.dim;ctx.fillText(String(u.hp),x+74,3);ctx.textAlign='left';
    bar(x,17,72,3,u.hp/u.maxhp,COL.teal);});
}
function drawBattle(){
  const bands=['#0a0718','#0d0920','#110b28','#150d2e','#190f34','#1d1138'];
  bands.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(0,25+i*22,W,22);});
  const boss=battle.en.some(e=>e.boss);
  drawEclipse(boss?160:270,boss?80:50,boss?50:18);
  ctx.fillStyle=pat(COL.wall);ctx.fillRect(0,124,W,34);ctx.fillStyle=COL.wall;ctx.fillRect(0,158,W,H-158);
  const n=battle.en.length;
  battle.en.forEach((e,i)=>{
    if(e.dead||e.gone)return;const p=epos(i,n,e);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.ellipse(p.x+p.s/2,p.y+p.s-2,p.s*0.36,4,0,0,Math.PI*2);ctx.fill();
    if(!(e.flash>0&&frame%4<2))ctx.drawImage(sprite(e.m),p.x,p.y,p.s,p.s);
    if(e.flash>0)e.flash--;
    font(10);ctx.textAlign='center';ctx.fillStyle=e.rage?COL.red:COL.ink;ctx.fillText(e.n,p.x+p.s/2,p.y+p.s+3);ctx.textAlign='left';
    bar(p.x+p.s/2-22,p.y+p.s+16,44,3,e.hp/e.maxhp,COL.red);
    if(battle.cursor===i){ctx.fillStyle=COL.gold;const cx=p.x+p.s/2,cy=p.y-8+((frame>>3)%2);ctx.beginPath();ctx.moveTo(cx-5,cy);ctx.lineTo(cx+5,cy);ctx.lineTo(cx,cy+5);ctx.fill();}
  });
  font(12);ctx.textAlign='center';
  pops=pops.filter(pp=>pp.t<40);
  for(const pp of pops){const i=battle.en.indexOf(pp.e);if(i<0)continue;const p=epos(i,n,pp.e);
    ctx.fillStyle=COL.void;ctx.fillText(pp.text,p.x+p.s/2+1,p.y+10-pp.t*0.6+1);ctx.fillStyle=COL.gold;ctx.fillText(pp.text,p.x+p.s/2,p.y+10-pp.t*0.6);pp.t++;}
  ctx.textAlign='left';
  drawStatus();
}
function drawFuse(){
  const f=fuseFx,t=Math.min(f.t,170);f.t++;
  ctx.fillStyle=COL.void;ctx.fillRect(0,0,W,H);
  const cx=160,cy=100;
  ctx.strokeStyle=COL.blood;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,74,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2+t*0.02;ctx.fillStyle=i%2?COL.red:COL.gold;ctx.fillRect(cx+Math.cos(a)*74-1,cy+Math.sin(a)*74-1,3,3);}
  if(t<95){
    const k=t/95,ang=t*0.13,rad=66*(1-k*k);
    [[f.a,0],[f.b,Math.PI]].forEach(([m,o])=>{const x=cx+Math.cos(ang+o)*rad,y=cy+Math.sin(ang+o)*rad*0.6;ctx.drawImage(sprite(m),x-24,y-24,48,48);});
    ctx.fillStyle=pat(COL.red);circle(cx,cy,6+k*20);
  }else if(t<118){
    ctx.fillStyle=`rgba(243,233,204,${1-(t-95)/23})`;ctx.fillRect(0,0,W,H);
  }else{
    const k=Math.min(1,(t-118)/30),s=Math.round(64*k);
    ctx.fillStyle=pat(COL.gold);circle(cx,cy,40*k);
    ctx.drawImage(sprite(f.r),cx-s/2,cy-s/2,s,s);
    font(14);ctx.textAlign='center';ctx.fillStyle=COL.ink;ctx.fillText(`${f.r.n}　Lv${f.r.lv}`,cx,cy+48);ctx.textAlign='left';
  }
}
function drawOver(){
  ctx.fillStyle=COL.void;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=COL.dim;ctx.fillRect(157,96,6,8);
  ctx.textAlign='center';font(20);ctx.fillStyle=COL.red;ctx.fillText('灯は、消えた。',160,118);
  font(12);ctx.fillStyle=COL.dim;ctx.fillText('A でタイトルへ',160,150);ctx.textAlign='left';
}
function drawEnd(){
  ctx.fillStyle='#0d1030';ctx.fillRect(0,0,W,H);
  ctx.fillStyle=pat('#f3e9cc');circle(160,80,50);ctx.fillStyle=COL.moon;circle(160,80,42);
  ctx.fillStyle='#05030a';for(const b of skyline)ctx.fillRect(b.x,H-b.h,b.w,b.h);
  ctx.fillStyle=COL.gold;for(const b of skyline)if(b.h>24)ctx.fillRect(b.x+3,H-b.h+6,2,2);
  if(endDone){ctx.textAlign='center';font(20);ctx.fillStyle=COL.ink;ctx.fillText('おわり',160,146);
    font(12);ctx.fillStyle=COL.dim;ctx.fillText('A でタイトルへ',160,172);ctx.textAlign='left';}
}
let uiTapRects=[];
function drawUI(){
  const u=ui,LH=15,pad=6,bw=W-12;font(12);
  let lines,opts=[],h;
  if(u.type==='say'){
    const full=wrap(u.text,bw-pad*2-8);
    u.shown=Math.min(u.text.length,u.shown+1.3);
    lines=wrap(u.text.slice(0,Math.floor(u.shown)),bw-pad*2-8);
    h=Math.max(2,full.length)*LH+pad*2;
  }else{
    lines=u.prompt?wrap(u.prompt,bw-pad*2):[];opts=u.opts;h=(lines.length+opts.length)*LH+pad*2;
  }
  const bx=6,by=H-h-6;
  uiTapRects=[];
  ctx.fillStyle=COL.panel;ctx.fillRect(bx,by,bw,h);ctx.strokeStyle=COL.line;ctx.strokeRect(bx+0.5,by+0.5,bw-1,h-1);
  ctx.strokeStyle=COL.wall;ctx.strokeRect(bx+2.5,by+2.5,bw-5,h-5);
  lines.forEach((l,i)=>{ctx.fillStyle=u.type==='say'?COL.ink:COL.dim;ctx.fillText(l,bx+pad+2,by+pad+i*LH);});
  opts.forEach((o,i)=>{const y=by+pad+(lines.length+i)*LH,sel=i===u.idx;
    uiTapRects.push({x:bx+3,y:y-2,w:bw-6,h:LH,i});
    ctx.fillStyle=sel?COL.gold:COL.ink;if(sel)ctx.fillText('▶',bx+pad+2,y);ctx.fillText(o,bx+pad+18,y);});
  if(u.type==='say'&&u.shown>=u.text.length&&(frame>>4)%2===0){ctx.fillStyle=COL.gold;ctx.fillText('▼',bx+bw-18,by+h-18);}
}
function loop(){
  ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);
  if(!paused)frame++;if(hurt>0&&!paused)hurt--;
  ctx.save();ctx.textBaseline='top';
  if(shake>0){ctx.translate(rnd(5)-2,rnd(5)-2);shake--;}
  ctx.fillStyle=COL.void;ctx.fillRect(-4,-4,W+8,H+8);
  if(scene==='title')drawTitle();
  else if(scene==='explore')drawExplore();
  else if(scene==='battle'&&battle)drawBattle();
  else if(scene==='fuse'&&fuseFx)drawFuse();
  else if(scene==='over')drawOver();
  else if(scene==='end')drawEnd();
  if(ui)drawUI();
  ctx.restore();requestAnimationFrame(loop);
}

/* ===== 入力 ===== */
function press(k,rep){
  if(paused)return;
  unlockAudio();
  if(ui){if(rep&&(k==='a'||k==='b'))return;handleUI(k);return;}
  if(rep&&(k==='a'||k==='b'))return;
  if(scene==='title'){
    const n=hasSave()?2:1;
    if(k==='up'||k==='down')titleChoice=(titleChoice+(k==='down'?1:-1)+n)%n;
    else if(k==='a'){if(hasSave()&&titleChoice===0){if(!loadGame())newGame();}else newGame();}
    return;
  }
  if(scene==='over'){if(k==='a')scene='title';return;}
  if(scene==='end'){if(k==='a'&&endDone)scene='title';return;}
  if(scene==='explore'&&!busy){
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[k];
    if(d)step(d[0],d[1]);else if(k==='a'||k==='b')fieldMenu();
  }
}
const KEYS={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
  KeyZ:'a',Enter:'a',Space:'a',KeyX:'b',Escape:'b',Backspace:'b'};
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();setPaused(!paused);return;}
  const k=KEYS[e.code];if(!k)return;e.preventDefault();press(k,e.repeat);
});
document.querySelectorAll('#control-deck button[data-k]').forEach(b=>{
  const k=b.dataset.k;let tm=null,iv=null;
  const stop=()=>{clearTimeout(tm);clearInterval(iv);tm=iv=null;b.classList.remove('is-pressed');};
  b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(err){}b.classList.add('is-pressed');if(navigator.vibrate)navigator.vibrate(12);press(k,false);
    if(['up','down','left','right'].includes(k)){tm=setTimeout(()=>{iv=setInterval(()=>press(k,true),120);},240);}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,stop));
});
cv.addEventListener('pointerdown',e=>{
  if(paused)return;unlockAudio();
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
  if(ui&&ui.type==='choose'){
    const hit=uiTapRects.find(v=>x>=v.x&&x<=v.x+v.w&&y>=v.y&&y<=v.y+v.h);
    if(hit){ui.idx=hit.i;ui.onMove&&ui.onMove(hit.i);press('a',false);}return;
  }
  if(scene==='title'&&hasSave()&&y>=156&&y<202){titleChoice=Math.min(1,Math.max(0,Math.floor((y-156)/23)));press('a',false);return;}
  if((ui&&ui.type==='say')||['title','over','end'].includes(scene))press('a',false);
});

(document.fonts&&document.fonts.load?document.fonts.load('12px "DotGothic16"').catch(()=>{}):Promise.resolve()).finally(()=>requestAnimationFrame(loop));
