// Mensaje personalizado (modifica aquí si quieres)
let NAME = 'Ximena';
let MESSAGE = `${NAME}, `;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W = canvas.width = innerWidth;
let H = canvas.height = innerHeight;

// particulas
let particles = [];
let PARTICLE_COUNT = 900; // cantidad para formar el corazón (ajustada en runtime)

function computeParticleCount(){
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  // heurística: más partículas en pantallas grandes, menos en móviles
  if(minSide < 420) return 200;
  if(minSide < 768) return 420;
  if(minSide < 1200) return 700;
  return 900;
}
// (Saturno/anillos eliminados)

function resize(){
  const ratio = window.devicePixelRatio || 1;
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  // set canvas backing store size for crisp rendering on high-DPI
  canvas.width = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  // reset transform so drawing coordinates match CSS pixels
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  W = cssW; H = cssH;

  // update particle count for this viewport
  const newCount = computeParticleCount();
  if(newCount !== PARTICLE_COUNT){
    PARTICLE_COUNT = newCount;
  }
  // re-init particles to adapt to new size/count
  initParticles();
}
addEventListener('resize', ()=>{
  // debounce resize to avoid thrashing
  clearTimeout(window.__resizeTimeout);
  window.__resizeTimeout = setTimeout(resize, 120);
});
// initial sizing
resize();

// función paramétrica de corazón (normalized)
function heartPoint(t){
  // cardioid-like shape, scaled
  const x = 16*Math.pow(Math.sin(t),3);
  const y = - (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
  return {x,y};
}

function mapToCanvas(x,y){
  // x,y roughly in range [-18..18], map to center
  const scale = Math.min(W,H)/40;
  return {x: W/2 + x*scale, y: H/2 + y*scale};
}

function initParticles(){
  particles = [];
  for(let i=0;i<PARTICLE_COUNT;i++){
    const t = Math.random()*Math.PI*2;
    const p = heartPoint(t);
    const pos = mapToCanvas(p.x, p.y);
    // start from random positions outside
    particles.push({
      x: Math.random()*W,
      y: Math.random()*H,
      tx: pos.x + (Math.random()-0.5)*2,
      ty: pos.y + (Math.random()-0.5)*2,
      vx:0, vy:0, size: Math.random()*1.6+0.6, color: `hsl(${330 + Math.random()*20},80%,65%)`, life:1
    });
  }
}

function updateParticles(dt){
  for(const p of particles){
    // attract particle toward target
    const ax = (p.tx - p.x)*0.02;
    const ay = (p.ty - p.y)*0.02;
    p.vx += ax; p.vy += ay;
    p.vx *= 0.92; p.vy *= 0.92;
    p.x += p.vx; p.y += p.vy;
    // small pulsing
    p.size *= 0.997; if(p.size<0.4) p.size=0.4;
  }
}

function drawParticles(){
  for(const p of particles){
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.95;
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
  }
}

let last = performance.now();
function loop(now){
  const dt = now - last; last = now;
  ctx.clearRect(0,0,W,H);
  // gentle background glow
  const g = ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,Math.max(W,H)/1.6);
  g.addColorStop(0,'rgba(255,150,180,0.06)');
  g.addColorStop(1,'rgba(15,11,26,0.0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  updateParticles(dt);
  drawParticles();


  requestAnimationFrame(loop);
}

// explosion de corazones en click
function makeSmallHeart(x,y){
  const el = document.createElement('div');
  el.className = 'heart';
  el.style.left = (x-10)+'px';
  el.style.top = (y-10)+'px';
  el.innerHTML = '❤';
  el.style.fontSize = '20px';
  el.style.color = 'rgba(255,110,150,1)';
  document.body.appendChild(el);
  const vx = (Math.random()-0.5)*6;
  const vy = - (Math.random()*6+2);
  let t=0;
  function frame(){
    t+=1;
    el.style.transform = `translate(${vx*t}px, ${vy*t + 0.5*4*(t*t)/100}px) scale(${1 - t*0.02})`;
    el.style.opacity = String(1 - t*0.03);
    if(t>60){ el.remove(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

canvas.addEventListener('click', (ev)=>{
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
  // push nearby particles outward
  for(let i=0;i<80;i++){
    const p = particles[Math.floor(Math.random()*particles.length)];
    p.vx += (p.x - x)*0.02 + (Math.random()-0.5)*4;
    p.vy += (p.y - y)*0.02 + (Math.random()-0.5)*4;
  }
  // spawn small hearts
  for(let i=0;i<18;i++) makeSmallHeart(ev.clientX + (Math.random()-0.5)*40, ev.clientY + (Math.random()-0.5)*40);
});


// typewriter
const messageEl = document.getElementById('message');
const phraseEl = document.getElementById('phrase');
function typeWriter(text, el, delay=40){
  el.textContent = '';
  let i=0;
  return new Promise(res=>{
    const id = setInterval(()=>{
      el.textContent += text[i]||'';
      i++;
      if(i>text.length){ clearInterval(id); res(); }
    }, delay);
  });
}

// controles
const startBtn = document.getElementById('startBtn');
if(startBtn){
  startBtn.addEventListener('click', async ()=>{
    const nameInputEl = document.getElementById('nameInput');
    const nameInput = nameInputEl ? nameInputEl.value.trim() : '';
    NAME = nameInput || NAME;
    MESSAGE = `Para ${NAME}, con todo mi cariño.`;
    await typeWriter(MESSAGE, messageEl, 40);
  });
}
const resetBtn = document.getElementById('resetBtn');
if(resetBtn){
  resetBtn.addEventListener('click', ()=>{
    initParticles();
    messageEl.textContent = '';
  });
}

// autostart
initParticles();
const PHRASE = "tu contienes en tu mirada el ocaso y la aurora; tu esparces perfumes como una tarde tempestuosa; tus besos son un filtro y tu boca un anfora que tornan al heroe flojo y al niño valiente";
async function startAll(){
  await typeWriter(MESSAGE, messageEl, 30);
  if(phraseEl){
    await typeWriter(PHRASE, phraseEl, 28);
    // agregar efecto pulso una vez
    phraseEl.classList.remove('phrase-pulse');
    // forzar reflow para reiniciar la animación si ya la tenía
    void phraseEl.offsetWidth;
    phraseEl.classList.add('phrase-pulse');
  }
}
startAll();
requestAnimationFrame(loop);

// toggle player visibility
const playerWrap = document.getElementById('playerWrap');
const togglePlayer = document.getElementById('togglePlayer');
if(togglePlayer && playerWrap){
  togglePlayer.addEventListener('click', ()=>{
    playerWrap.classList.toggle('hidden');
    const hidden = playerWrap.classList.contains('hidden');
    togglePlayer.setAttribute('aria-label', hidden ? 'Mostrar reproductor' : 'Ocultar reproductor');
  });
}
