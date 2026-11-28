/* Sound: a warm master chain, short synth tones and noise bursts, the sound on/off buttons. */
/* ---------- sound + voice ---------- */
let soundOn=true, actx=null;
try{ if(localStorage.getItem('wb-sound')==='off') soundOn=false }catch(e){}
function audio(){
  if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}
  if(actx.state==='suspended') actx.resume();
  return actx;
}
document.addEventListener('pointerdown',audio,{capture:true});
document.addEventListener('contextmenu',e=>e.preventDefault());
let master=null,voices=0;const lastHit=new Map();
/* Master chain: gentle lowpass -> soft compressor -> quiet room reverb -> output. Keeps everything warm, never shrill. */
function out(){const a=audio();if(!a)return null;if(!master){
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;lp.Q.value=.5;
  const comp=a.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=18;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.2;
  const vol=a.createGain();vol.gain.value=.55;
  const len=Math.floor(a.sampleRate*.9),ir=a.createBuffer(2,len,a.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
  const rev=a.createConvolver();rev.buffer=ir;const wet=a.createGain();wet.gain.value=.14;
  lp.connect(comp);comp.connect(vol);comp.connect(rev);rev.connect(wet).connect(vol);vol.connect(a.destination);master=lp}return master}
/* Skip a sound if the same kind of sound just played (stops machine-gun clicks when many things collide at once). */
function tooSoon(key,ms){const now=performance.now(),l=lastHit.get(key)||0;if(now-l<ms)return true;lastHit.set(key,now);if(lastHit.size>300)lastHit.clear();return false}
function tone(f,d=.18,type='sine',vol=.2,when=0,f2){
  if(!soundOn||voices>24) return; const a=audio(); if(!a) return;
  if(when<.01&&tooSoon('t'+Math.round(Math.log2(Math.max(20,f))*12),35)) return;
  if(type==='square'||type==='sawtooth'){type='triangle';vol*=1.3}
  vol=Math.min(vol,.3);
  const t=a.currentTime+when, o=a.createOscillator(), g=a.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(out()); voices++; o.onended=()=>voices--; o.start(t); o.stop(t+d+.05);
}
let noiseBuf=null;
function noise(d=.2,f=1200,q=1,vol=.2,when=0,f2,type='bandpass'){
  if(!soundOn||voices>24) return; const a=audio(); if(!a) return;
  if(when<.01&&tooSoon('n'+Math.round(Math.log2(Math.max(20,f))*4),45)) return;
  vol=Math.min(vol,.3);
  if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate,a.sampleRate);const ch=noiseBuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}
  const t=a.currentTime+when,s=a.createBufferSource(),bq=a.createBiquadFilter(),g=a.createGain();
  s.buffer=noiseBuf;s.loop=true;bq.type=type;bq.frequency.setValueAtTime(f,t);if(f2)bq.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);bq.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(bq).connect(g).connect(out());voices++;s.onended=()=>voices--;s.start(t,Math.random()*.5);s.stop(t+d+.05);
}
const pop=(p=1)=>{tone(620*p,.1,'sine',.2,0,260*p);tone(1240*p,.05,'sine',.05)};
const cheer=()=>[523,659,784,1047].forEach((f,i)=>{tone(f,.35,'sine',.13,i*.085);tone(f*2,.2,'triangle',.03,i*.085)});
const buzz=()=>{if(tooSoon('buzz',300))return;tone(392,.16,'triangle',.11,0);tone(311,.26,'triangle',.11,.13)};
/* Spoken words: every game's narration goes through learn.say (js/learn.js), which speaks only when a grown-up has
   switched voice on in the grown-ups view (hold the ⭐ counter on the home screen for two seconds). Off by default. */
function say(t){if(typeof learn==='object')learn.say(t)}
/* Long sounds (like Wave Lab's string) register here so the sound button and a hidden tab can silence them. */
const soundHooks=new Set();
/* A hidden tab or a sleeping tablet should not keep making noise; wake the audio again when the child comes back. */
document.addEventListener('visibilitychange',()=>{if(!actx)return;try{document.hidden?actx.suspend():(soundOn&&actx.resume())}catch(e){}});
const sndBtn=$('#snd'),sndBtn2=$('#snd2');
function paintSnd(){sndBtn.textContent=soundOn?'🔊 Sound on':'🔇 Sound off';sndBtn.setAttribute('aria-pressed',soundOn);sndBtn2.textContent=soundOn?'🔊':'🔇';sndBtn2.setAttribute('aria-pressed',soundOn);sndBtn2.setAttribute('aria-label',soundOn?'Sound on':'Sound off')}
paintSnd();
sndBtn2.addEventListener('click',()=>sndBtn.click());
sndBtn.addEventListener('click',()=>{soundOn=!soundOn;paintSnd();try{localStorage.setItem('wb-sound',soundOn?'on':'off')}catch(e){};if(soundOn){tone(660,.15,'triangle');say('Sound on!')}else{try{speechSynthesis.cancel()}catch(e){}}
  soundHooks.forEach(f=>{try{f(soundOn)}catch(e){}})});
