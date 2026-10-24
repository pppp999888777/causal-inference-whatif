/* 因果推断学习台 · 各章共用的工具：导航、格式化、随机数、画图、DAG、自测、玩具知识追踪模拟器 */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function fmt(x,d=2){if(x==null||!isFinite(x))return '—';const s=Math.abs(x).toFixed(d);return (x<0&&+s!==0?'−':'')+s}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
function sd(a){const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/Math.max(1,a.length-1))}
function quantile(a,p){const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.max(0,Math.floor(p*s.length)))]}
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function randn(r){let u=0;while(!u)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r())}
const expit=x=>1/(1+Math.exp(-x));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---------- 章节目录 ---------- */
// [章号, 部分, 中文名, 英文名, 优先级 1=必读 2=第二轮 3=选读, 一句话对应论文]
const CHAPTERS=[
 [1,'I','因果效应的定义','A definition of causal effect',1,'模拟器就是“上帝视角表”；NLG 差是平均因果效应'],
 [2,'I','随机试验','Randomized experiments',1,'日志策略 μ 够随机吗？可交换性决定离线评估能否成立'],
 [3,'I','观察性研究','Observational studies',1,'真实日志上的 IPS/DR 依赖可交换性、正性、一致性'],
 [4,'I','效应修饰','Effect modification',2,'效应随数据集变：Junyi 上 AG 打平甚至反超'],
 [5,'I','交互作用','Interaction',3,'反作弊项和策略头一起改时，效果能不能相加'],
 [6,'I','因果图','Graphical representation of causal effects',1,'画出 能力 → 出题 → NLG 的因果图'],
 [7,'I','混杂','Confounding',1,'ECE 与 NLG 的相关来自共同原因（策略头）'],
 [8,'I','选择偏倚','Selection bias',2,'截断到最近 500 次、只看留下来的学生会选出谁'],
 [9,'I','测量偏倚','Measurement bias',2,'r_gain 的均值回归假象；“已掌握”怎么测'],
 [10,'I','随机变异','Random variability',2,'5 种子 × 4 数据集、配对检验、Holm 校正'],
 [11,'II','为什么需要模型','Why model?',3,'技能和历史太多，没法逐格算，只能建模'],
 [12,'II','IP 加权与边际结构模型','IP weighting and marginal structural models',1,'IPS / SNIPS、权重截断在 20'],
 [13,'II','标准化与参数 g 公式','Standardization and the parametric g-formula',1,'结局模型 q̂ 与双重稳健（DR）'],
 [14,'II','G 估计','G-estimation of structural nested models',3,'“一步偏离”就是结构嵌套模型里的 blip'],
 [15,'II','结局回归与倾向评分','Outcome regression and propensity scores',1,'μ̂ 就是倾向评分；预测准 ≠ 好的倾向评分'],
 [16,'II','工具变量','Instrumental variable estimation',3,'随机轮换题库可以当工具变量'],
 [17,'II','因果生存分析','Causal survival analysis',3,'steps-to-mastery 是“到事件时间”，60 步是删失'],
 [18,'II','因果推断的变量选择','Variable selection for causal inference',2,'交叉拟合、哪些历史特征该进 μ̂'],
 [19,'III','时变处理','Time-varying treatments',1,'60 步出题序列 = 时变处理；策略 π = 动态策略'],
 [20,'III','处理—混杂反馈','Treatment-confounder feedback',1,'上一题的对错影响下一题，也影响结局'],
 [21,'III','时变处理的 g 方法','G-methods for time-varying treatments',1,'全程部署 V(π) 与一步偏离 V¹ˢᴰ(π)'],
 [22,'III','目标试验模拟','Target trial emulation',2,'把论文写成一份“目标试验”方案'],
];
const PART_NAME={I:'第 I 部分 · 不靠模型的因果推断',II:'第 II 部分 · 借助模型的因果推断',III:'第 III 部分 · 复杂纵向数据'};
const PRI_NAME={1:'必读',2:'第二轮',3:'选读'};
const chFile=n=>'ch'+String(n).padStart(2,'0')+'.html';

function initChapter(){
  const n=+document.body.dataset.ch;const i=CHAPTERS.findIndex(c=>c[0]===n);
  const nav=$('#topnav');
  if(nav){const secs=$$('section.ch[id]').map(s=>{const num=$('.ch-num',s);return `<a href="#${s.id}"><b>${num?num.textContent:''}</b>${s.dataset.short||''}</a>`}).join('');
    nav.innerHTML=`<div class="wrap"><a href="index.html"><b>←</b>目录</a>${secs}</div>`}
  const foot=$('#chfoot');
  if(foot){const p=CHAPTERS[i-1],q=CHAPTERS[i+1];
    foot.innerHTML=`<div class="wrap"><div class="chfoot">${p?`<a href="${chFile(p[0])}"><span>← 上一章</span>第 ${p[0]} 章 ${p[2]}</a>`:'<a href="index.html"><span>←</span>回到目录</a>'}${q?`<a class="nx" href="${chFile(q[0])}"><span>下一章 →</span>第 ${q[0]} 章 ${q[2]}</a>`:'<a class="nx" href="index.html"><span>→</span>回到目录</a>'}</div>
    <p>原书：Hernán MA, Robins JM. <i>Causal Inference: What If</i>. Chapman &amp; Hall/CRC。作者在 <a href="https://miguelhernan.org/whatifbook" target="_blank" rel="noopener">miguelhernan.org/whatifbook</a> 免费提供英文全书。本页讲解为中文转述；实验台里的数据除注明来自原书的以外，都是为教学构造的模拟数据。</p></div>`}
}

/* ---------- 画图 ---------- */
function setupCanvas(cv){const dpr=window.devicePixelRatio||1;const w=cv.clientWidth||400,h=+cv.getAttribute('height');cv.width=w*dpr;cv.height=h*dpr;cv.style.height=h+'px';const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return{c,w,h}}
function rrect(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
// 直方图：opt = {lo,hi,bins,ticks,td,line,lineLabel,empty,color}
function histogram(cv,vals,opt){
  const{c,w,h}=setupCanvas(cv);c.clearRect(0,0,w,h);
  const ink=css('--ink'),mut=css('--muted'),line=css('--line'),fill=css(opt.color||'--accent'),mark=css('--w1');
  const L=10,R=w-10,T=14,B=h-26;const lo=opt.lo,hi=opt.hi,bins=opt.bins;const X=v=>L+(v-lo)/(hi-lo)*(R-L);
  c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(L,B+.5);c.lineTo(R,B+.5);c.stroke();
  c.fillStyle=mut;c.font='11px '+css('--f-mono');c.textAlign='center';
  (opt.ticks||[]).forEach(t=>{c.fillText(fmt(t,opt.td??1),X(t),h-8);c.beginPath();c.moveTo(X(t)+.5,B);c.lineTo(X(t)+.5,B+4);c.stroke()});
  if(!vals.length){c.font='13px '+css('--f-body');c.fillText(opt.empty||'还没有数据',w/2,h/2);return}
  const cnt=Array(bins).fill(0);vals.forEach(v=>{let b=Math.floor((v-lo)/(hi-lo)*bins);cnt[clamp(b,0,bins-1)]++});
  const mx=Math.max(...cnt);const bw=(R-L)/bins;c.fillStyle=fill;
  cnt.forEach((k,i)=>{if(!k)return;const bh=(B-T)*k/mx;const x=L+i*bw+1,ww=Math.max(1,bw-2);rrect(c,x,B-bh,ww,bh,[Math.min(3,ww/2),Math.min(3,ww/2),0,0]);c.fill()});
  const lines=opt.lines||(opt.line!=null?[{v:opt.line,label:opt.lineLabel,color:'--w1'}]:[]);
  lines.forEach((ln,j)=>{const x=X(ln.v);c.strokeStyle=css(ln.color||'--w1');c.lineWidth=2;c.setLineDash([4,3]);c.beginPath();c.moveTo(x,T-4);c.lineTo(x,B);c.stroke();c.setLineDash([]);
    c.fillStyle=ink;c.font='12px '+css('--f-body');const right=x>w-90;c.textAlign=right?'right':'left';c.fillText(ln.label,x+(right?-5:5),T+6+j*15)});
}
// 折线图：series=[{name,color,pts:[[x,y],...],dash}]；opt={xlo,xhi,ylo,yhi,xticks,yticks,xd,yd,xlabel,hlines:[{y,label}]}
function lineChart(cv,series,opt){
  const{c,w,h}=setupCanvas(cv);c.clearRect(0,0,w,h);
  const mut=css('--muted'),line=css('--line'),ink=css('--ink');
  const L=44,R=w-(opt.rpad??70),T=12,B=h-30;
  const X=x=>L+(x-opt.xlo)/(opt.xhi-opt.xlo)*(R-L),Y=y=>B-(y-opt.ylo)/(opt.yhi-opt.ylo)*(B-T);
  c.font='11px '+css('--f-mono');c.fillStyle=mut;c.strokeStyle=line;c.lineWidth=1;
  (opt.yticks||[]).forEach(t=>{c.beginPath();c.moveTo(L,Y(t)+.5);c.lineTo(R,Y(t)+.5);c.stroke();c.textAlign='right';c.fillText(fmt(t,opt.yd??1),L-6,Y(t)+4)});
  c.textAlign='center';(opt.xticks||[]).forEach(t=>c.fillText(fmt(t,opt.xd??0),X(t),h-12));
  if(opt.xlabel){c.textAlign='right';c.fillText(opt.xlabel,R,h-0.5)}
  (opt.hlines||[]).forEach(hl=>{c.strokeStyle=css(hl.color||'--muted');c.setLineDash([4,3]);c.lineWidth=1.5;c.beginPath();c.moveTo(L,Y(hl.y));c.lineTo(R,Y(hl.y));c.stroke();c.setLineDash([]);c.fillStyle=ink;c.textAlign='left';c.font='12px '+css('--f-body');c.fillText(hl.label,L+4,Y(hl.y)-5)});
  series.forEach(s=>{const col=css(s.color);c.strokeStyle=col;c.lineWidth=2;c.setLineDash(s.dash||[]);c.beginPath();
    s.pts.forEach(([x,y],i)=>{const px=X(x),py=Y(clamp(y,opt.ylo,opt.yhi));i?c.lineTo(px,py):c.moveTo(px,py)});c.stroke();c.setLineDash([]);
    if(s.dots){c.fillStyle=col;s.pts.forEach(([x,y])=>{c.beginPath();c.arc(X(x),Y(y),4,0,7);c.fill()})}
    const last=s.pts[s.pts.length-1];if(last&&s.name){c.fillStyle=ink;c.font='12px '+css('--f-body');c.textAlign='left';c.fillText(s.name,X(last[0])+6,Y(clamp(last[1],opt.ylo,opt.yhi))+4+(s.dy||0))}});
}
// 散点：pts=[{x,y,color}]
function scatter(cv,pts,opt){
  const{c,w,h}=setupCanvas(cv);c.clearRect(0,0,w,h);
  const mut=css('--muted'),line=css('--line'),surf=css('--surface');const L=40,R=w-12,T=10,B=h-28;
  const X=x=>L+(x-opt.xlo)/(opt.xhi-opt.xlo)*(R-L),Y=y=>B-(y-opt.ylo)/(opt.yhi-opt.ylo)*(B-T);
  c.font='11px '+css('--f-mono');c.fillStyle=mut;c.strokeStyle=line;c.lineWidth=1;
  (opt.yticks||[]).forEach(t=>{c.beginPath();c.moveTo(L,Y(t)+.5);c.lineTo(R,Y(t)+.5);c.stroke();c.textAlign='right';c.fillText(fmt(t,opt.yd??1),L-5,Y(t)+4)});
  c.textAlign='center';(opt.xticks||[]).forEach(t=>c.fillText(fmt(t,opt.xd??1),X(t),h-10));
  if(opt.xlabel){c.textAlign='right';c.fillText(opt.xlabel,R,h-0.5)}
  pts.forEach(p=>{c.beginPath();c.arc(X(p.x),Y(p.y),opt.r||3,0,7);c.fillStyle=css(p.color||'--accent');c.globalAlpha=opt.alpha??.7;c.fill();c.globalAlpha=1});
  (opt.fits||[]).forEach(f=>{c.strokeStyle=css(f.color);c.lineWidth=2.5;c.beginPath();c.moveTo(X(opt.xlo),Y(f.a+f.b*opt.xlo));c.lineTo(X(opt.xhi),Y(f.a+f.b*opt.xhi));c.stroke();c.lineWidth=1;c.strokeStyle=surf});
}
// 横向条形（可含负值）：items=[[标签,值,颜色token?]]
function barList(el,items,opt={}){
  const vals=items.map(x=>x[1]);const lo=Math.min(0,opt.min??Math.min(...vals)),hi=Math.max(0,opt.max??Math.max(...vals));const span=(hi-lo)||1;const z=(0-lo)/span*100;const f=opt.fmt||(v=>fmt(v,3));
  el.innerHTML=items.map(([l,v,col])=>{const a=(Math.min(v,0)-lo)/span*100,b=(Math.max(v,0)-lo)/span*100;
    return `<div class="bar" title="${l}：${f(v)}"><span>${l}</span><div class="tr"><div class="fl" style="left:${a}%;width:${b-a}%;border-radius:4px;${col?`background:var(${col})`:''}"></div>${lo<0?`<div class="zero" style="left:${z}%"></div>`:''}</div><span class="vl">${f(v)}</span></div>`}).join('');
}
// 重画钩子：窗口大小或主题改变时
const _redraws=[];function onRedraw(fn){_redraws.push(fn)}
(()=>{let t;const run=()=>_redraws.forEach(f=>f());window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(run,150)});
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',run);
  new MutationObserver(run).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})})();

/* ---------- 因果图（DAG） ---------- */
// spec={w,h,nodes:[{id,x,y,t,cls}],edges:[[from,to,cls]]}；cls: a(处理) y(结局) cond(已条件化，方框加粗) hid(未测量，虚线)
function dag(el,spec){
  const N={};spec.nodes.forEach(n=>N[n.id]=n);const uid='m'+Math.random().toString(36).slice(2,7);
  const nw=n=>Math.max(44,(n.t.length*15)+20),nh=34;
  const edge=([a,b,cls])=>{const p=N[a],q=N[b];const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);
    const off=n=>{const hw=nw(n)/2+3,hh=nh/2+3;const s=Math.min(hw/Math.abs(dx/d||1e-9),hh/Math.abs(dy/d||1e-9));return s};
    const s1=off(p),s2=off(q)+4;const x1=p.x+dx/d*s1,y1=p.y+dy/d*s1,x2=q.x-dx/d*s2,y2=q.y-dy/d*s2;
    const hl=(cls||'').includes('hl');
    return `<path class="ed ${cls||''}" d="M${x1},${y1} L${x2},${y2}" marker-end="url(#${uid}${hl?'h':'n'})"/>`};
  el.innerHTML=`<svg class="dag" viewBox="0 0 ${spec.w} ${spec.h}" role="img" aria-label="${spec.label||'因果图'}">
   <defs><marker id="${uid}n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="mk-n" d="M0,0 L10,5 L0,10 z"/></marker>
   <marker id="${uid}h" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="mk-h" d="M0,0 L10,5 L0,10 z"/></marker></defs>
   ${spec.edges.map(edge).join('')}
   ${spec.nodes.map(n=>`<g class="nd ${n.cls||''}"><rect x="${n.x-nw(n)/2}" y="${n.y-nh/2}" width="${nw(n)}" height="${nh}" rx="${(n.cls||'').includes('cond')?3:17}"/><text x="${n.x}" y="${n.y+5}" text-anchor="middle">${n.t}</text></g>`).join('')}</svg>`;
}

/* ---------- 自测 ---------- */
function quiz(el,Q){
  el.innerHTML=Q.map((x,i)=>`<div class="q"><div class="qt">${i+1}. ${x.q}</div><div class="opts">${x.o.map((o,j)=>`<button class="btn" data-q="${i}" data-o="${j}">${o}</button>`).join('')}</div><div class="fb" hidden></div></div>`).join('');
  el.addEventListener('click',e=>{const b=e.target.closest('button[data-q]');if(!b)return;const x=Q[+b.dataset.q],box=b.closest('.q'),fb=$('.fb',box);
    $$('button',box).forEach(z=>z.classList.remove('on'));b.classList.add('on');const ok=+b.dataset.o===x.a;
    fb.hidden=false;fb.className='fb '+(ok?'ok':'no');fb.innerHTML=`<b>${ok?'对。':'不对。'}</b>${x.w}`});
}
// 一组互斥按钮
function segmented(ids,onPick){ids.forEach(id=>{$('#'+id).addEventListener('click',()=>{ids.forEach(j=>$('#'+j).classList.toggle('on',j===id));onPick(id)})})}

/* ---------- 玩具知识追踪模拟器（12 技能、BKT 式、60 步） ---------- */
const KT=(()=>{
  const K=12,TT=60;const SK=[];{const r=rng(7);for(let k=0;k<K;k++)SK.push({p0:.15+.35*r(),learn:.08+.14*r(),guess:.15+.15*r(),slip:.05+.08*r()})}
  function makeStudent(i){const r=rng(1000+i*7919);const ab=(r()+r()+r()-1.5)*1.6;
    const m=[],U=[],V=[];for(let k=0;k<K;k++){const p0=Math.min(.95,Math.max(.02,SK[k].p0+ab*.15));m.push(r()<p0);U.push([]);V.push([]);for(let n=0;n<TT;n++){U[k].push(r());V[k].push(r())}}
    return{i,ab,m0:m,U,V,assignU:rng(424242+i*31)()}}
  const expScore=m=>{let s=0;for(let k=0;k<K;k++)s+=m[k]?1-SK[k].slip:SK[k].guess;return s/K};
  // 同一个学生的随机数 U/V 固定，换策略时“运气”相同；返回 NLG、练已掌握技能的比例、首次掌握 ≥9 个技能的步数（未达到为 null）
  function teach(st,policy,steps=TT){const m=st.m0.slice(),cnt=Array(K).fill(0),cor=Array(K).fill(0),tr=rng(9000+st.i);let onM=0,tm=null;const pre=expScore(m);
    for(let t=0;t<steps;t++){const est=cnt.map((c,k)=>(cor[k]+1)/(c+2));let k;
      if(policy==='rand')k=Math.floor(tr()*K);
      else{const tgt=policy==='c07'?.7:policy==='c05'?.5:null;let best=1e9,cands=[];
        for(let j=0;j<K;j++){const sc=tgt===null?-est[j]:Math.abs(est[j]-tgt);if(sc<best-1e-9){best=sc;cands=[j]}else if(Math.abs(sc-best)<1e-9)cands.push(j)}
        k=cands[Math.floor(tr()*cands.length)]}
      if(m[k])onM++;const n=cnt[k]%TT,sk=SK[k];const y=st.U[k][n]<(m[k]?1-sk.slip:sk.guess);
      const lr=Math.min(.6,sk.learn*Math.exp(st.ab*.35));if(!m[k]&&st.V[k][n]<lr)m[k]=true;cnt[k]++;cor[k]+=y;
      if(tm===null&&m.filter(Boolean).length>=9)tm=t+1}
    return{nlg:(expScore(m)-pre)/(1-pre),onM:onM/steps,tm,start:st.m0.filter(Boolean).length}}
  const POL=[['rand','随机出题 Random'],['c05','最接近 0.5 Uncertainty-0.5'],['c07','最接近 0.7 DKT 规则'],['greedy','挑最有把握的（像无反作弊项的 Safe-DFKT）']];
  const SHORT={rand:'随机',c05:'0.5 规则',c07:'0.7 规则',greedy:'挑最有把握'};
  return{K,TT,SK,makeStudent,teach,POL,SHORT};
})();

/* ---------- d-分离：列出 from 到 to 之间所有路径，并判断是否被阻断 ---------- */
// edges=[[a,b],...] 表示 a→b；cond=Set(已条件化的节点)
function dagPaths(edges,from,to,cond){
  const nb={};const add=(x,y,dir)=>{(nb[x]=nb[x]||[]).push([y,dir])};
  edges.forEach(([a,b])=>{add(a,b,'out');add(b,a,'in')});
  const ch={};edges.forEach(([a,b])=>{(ch[a]=ch[a]||[]).push(b)});
  const desc=v=>{const seen=new Set(),st=[v];while(st.length){const x=st.pop();(ch[x]||[]).forEach(y=>{if(!seen.has(y)){seen.add(y);st.push(y)}})}return seen};
  const out=[];
  (function walk(path,dirs){const cur=path[path.length-1];
    if(cur===to){out.push({nodes:path.slice(),dirs:dirs.slice()});return}
    (nb[cur]||[]).forEach(([y,d])=>{if(path.includes(y))return;path.push(y);dirs.push(d);walk(path,dirs);path.pop();dirs.pop()})})([from],[]);
  return out.map(p=>{let blocked=null;
    for(let i=1;i<p.nodes.length-1;i++){const v=p.nodes[i];const intoV=p.dirs[i-1]==='out',intoVfromNext=p.dirs[i]==='in';const collider=intoV&&intoVfromNext;
      if(collider){const d=desc(v);if(!cond.has(v)&&![...d].some(x=>cond.has(x))){blocked={v,why:'对撞点未被条件化'};break}}
      else if(cond.has(v)){blocked={v,why:'条件化了非对撞点'};break}}
    const backdoor=p.dirs[0]==='in';
    const str=p.nodes.map((n,i)=>i?(p.dirs[i-1]==='out'?' → ':' ← ')+n:n).join('');
    return{...p,open:!blocked,blocked,backdoor,str}});
}

/* 调试：?probe 时报告比视口宽的元素 */
if(location.search.includes('probe'))window.addEventListener('load',()=>setTimeout(()=>{const W=document.documentElement.clientWidth;
  const bad=$$('body *').filter(e=>{const r=e.getBoundingClientRect();return r.right>W+1&&!e.closest('.tbl-wrap,.formula,nav.top')}).slice(0,6).map(e=>e.tagName+'.'+e.className+'#'+e.id+' r='+Math.round(e.getBoundingClientRect().right));
  console.log('PROBE scrollW='+document.documentElement.scrollWidth+' W='+W+' '+bad.join(' | '))},800));

/* ---------- 回归：线性最小二乘 linreg、逻辑回归 logreg（牛顿法），都返回系数数组 ---------- */
function _solve(M){const p=M.length;for(let c=0;c<p;c++){let m=c;for(let r=c+1;r<p;r++)if(Math.abs(M[r][c])>Math.abs(M[m][c]))m=r;[M[c],M[m]]=[M[m],M[c]];
  for(let r=0;r<p;r++)if(r!==c){const f=M[r][c]/M[c][c];for(let k=c;k<=p;k++)M[r][k]-=f*M[c][k]}}return M.map((row,i)=>row[p]/row[i])}
function linreg(X,y,w){const p=X[0].length;const M=Array.from({length:p},()=>Array(p+1).fill(0));
  for(let i=0;i<X.length;i++){const wi=w?w[i]:1;for(let j=0;j<p;j++){for(let k=0;k<p;k++)M[j][k]+=wi*X[i][j]*X[i][k];M[j][p]+=wi*X[i][j]*y[i]}}
  for(let j=0;j<p;j++)M[j][j]+=1e-9;return _solve(M)}
function logreg(X,y,it=25){const p=X[0].length;let b=Array(p).fill(0);
  for(let s=0;s<it;s++){const M=Array.from({length:p},()=>Array(p+1).fill(0));
    for(let i=0;i<X.length;i++){let z=0;for(let j=0;j<p;j++)z+=X[i][j]*b[j];const m=expit(z),d=y[i]-m,w=m*(1-m);for(let j=0;j<p;j++){M[j][p]+=X[i][j]*d;for(let k=0;k<p;k++)M[j][k]+=w*X[i][j]*X[i][k]}}
    for(let j=0;j<p;j++)M[j][j]+=1e-6;const st=_solve(M);b=b.map((v,j)=>v+st[j]);if(st.every(x=>Math.abs(x)<1e-8))break}
  return b}
const dot=(x,b)=>x.reduce((s,v,j)=>s+v*b[j],0);
