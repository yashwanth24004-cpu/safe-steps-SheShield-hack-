const $=id=>document.getElementById(id);
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const DEF={lat:12.9716,lng:77.5946,acc:0,demo:true};
let pos={...DEF},crumbs=[];
const POLICE=[["Cubbon Park PS",12.9760,77.5960],["Vidhana Soudha PS",12.9795,77.5910],["MG Road PS",12.9745,77.5985],["Halasuru PS",12.9810,77.6200],["Shivajinagar PS",12.9850,77.5990],["Ashok Nagar PS",12.9690,77.6050],["High Grounds PS",12.9920,77.5870],["Upparpet PS",12.9780,77.5700]];
const HOSP=[["Victoria Hospital ER",12.9634,77.5755],["Bowring Hospital ER",12.9858,77.6012],["KC General Hospital",13.0020,77.5700],["Command Hospital",12.9780,77.6270],["NIMHANS Emergency",12.9430,77.5960],["Jayanagar General",12.9300,77.5830]];
const HAV=[...POLICE.map(p=>({n:p[0],lat:p[1],lng:p[2],k:"Police"})),...HOSP.map(p=>({n:p[0],lat:p[1],lng:p[2],k:"Hospital"}))];
const dist=(a,b,c,d)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dg=r(d-b),h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
const fmt=km=>km<1?Math.round(km*1000)+" m":km.toFixed(1)+" km";
const osm=()=>`https://www.openstreetmap.org/?mlat=${pos.lat}&mlon=${pos.lng}#map=18/${pos.lat}/${pos.lng}`;
const gm=()=>`https://maps.google.com/?q=${pos.lat},${pos.lng}`;
const dir=h=>`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${pos.lat}%2C${pos.lng}%3B${h.lat}%2C${h.lng}`;
function nearest(k){return HAV.filter(h=>!k||h.k===k).map(h=>({...h,d:dist(pos.lat,pos.lng,h.lat,h.lng)})).sort((a,b)=>a.d-b.d)}

/* tabs */
function go(id){document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t.id===id));document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===id));if(id==="t-map")drawMap()}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>go(b.dataset.t));

/* geolocation */
function upd(){
  $("gps").textContent=pos.demo?"Demo location (GPS off)":"GPS ±"+Math.round(pos.acc)+" m";
  $("loc").innerHTML=`${Math.abs(pos.lat).toFixed(5)}° ${pos.lat>=0?"N":"S"}, ${Math.abs(pos.lng).toFixed(5)}° ${pos.lng>=0?"E":"W"}`+(pos.demo?"<br>Allow location access for live tracking. Showing Bengaluru as a demo.":"");
  $("osm").href=osm();$("gmap").href=gm();
  $("crumbs").innerHTML=crumbs.slice(-5).reverse().map(c=>`<li><span>${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}</span><span class="mut">${new Date(c.t).toLocaleTimeString()}</span></li>`).join("")||'<li class="mut">No fixes yet</li>';
}
if(navigator.geolocation)navigator.geolocation.watchPosition(p=>{pos={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy};crumbs.push({...pos,t:Date.now()});if(crumbs.length>50)crumbs.shift();store.set("crumbs",crumbs.slice(-20));upd();if($("t-map").classList.contains("on"))drawMap()},()=>{$("gps").textContent="Demo location (GPS denied)"},{enableHighAccuracy:true,maximumAge:3000});
upd();

/* contacts */
const REL=["Family","Friend","Roommate"];
let contacts=store.get("contacts",[{n:"",r:"Family",p:""},{n:"",r:"Friend",p:""},{n:"",r:"Roommate",p:""}]);
function renderContacts(){$("clist").innerHTML=contacts.map((c,i)=>`<div class="card"><b>Contact ${i+1}${i===0?" (first alerted)":""}</b>
<label for="cn${i}">Name</label><input id="cn${i}" value="${c.n.replace(/"/g,"&quot;")}">
<div class="row"><div><label for="cr${i}">Relationship</label><select id="cr${i}">${REL.map(r=>`<option${r===c.r?" selected":""}>${r}</option>`).join("")}</select></div>
<div><label for="cp${i}">Phone</label><input id="cp${i}" type="tel" placeholder="+91…" value="${c.p}"></div></div></div>`).join("")}
$("csave").onclick=()=>{contacts=contacts.map((_,i)=>({n:$("cn"+i).value.trim(),r:$("cr"+i).value,p:$("cp"+i).value.replace(/[^\d+]/g,"")}));store.set("contacts",contacts);$("cst").textContent="Saved on this device."};
renderContacts();

/* SOS */
function msg(){return `SOS! I need help. My live location: ${osm()} (Google: ${gm()}). Accuracy ±${Math.round(pos.acc)} m. Sent ${new Date().toLocaleString()} via SheShield.`}
function triggerSOS(){
  const m=msg(),box=$("allinks");$("almsg").textContent=m;
  const cs=contacts.filter(c=>c.p);
  box.innerHTML=cs.length?cs.map(c=>`<div class="row"><a class="b red" href="sms:${c.p}?body=${encodeURIComponent(m)}">SMS ${c.n||c.r}</a><a class="b" target="_blank" rel="noopener" href="https://wa.me/${c.p.replace(/\D/g,"")}?text=${encodeURIComponent(m)}">WhatsApp</a></div>`).join(""):'<div class="mut">No contacts saved yet. Add them under Contacts. You can still call 112.</div><a class="b red" href="tel:112">Call 112</a>';
  const h=nearest("Police")[0];
  $("alpol").innerHTML=`<div>${h.n} · ${fmt(h.d)} away</div><a class="b" style="margin-top:8px;width:100%" target="_blank" rel="noopener" href="${dir(h)}">Walking directions</a>`;
  $("alert").classList.add("on");go("t-sos");$("alert").scrollIntoView();
  siren(true);if(navigator.vibrate)navigator.vibrate([300,100,300,100,300]);
}
let hold=null,t0=0,lastTap=0;const sosB=$("sos"),rc=$("ringc");
function stopHold(){cancelAnimationFrame(hold);hold=null;rc.style.strokeDashoffset=301.6}
function tick(){const p=Math.min(1,(performance.now()-t0)/3000);rc.style.strokeDashoffset=301.6*(1-p);if(p>=1){stopHold();triggerSOS()}else hold=requestAnimationFrame(tick)}
sosB.addEventListener("pointerdown",e=>{e.preventDefault();const n=Date.now();if(n-lastTap<450){lastTap=0;stopHold();triggerSOS();return}lastTap=n;t0=performance.now();hold=requestAnimationFrame(tick)});
["pointerup","pointerleave","pointercancel"].forEach(ev=>sosB.addEventListener(ev,stopHold));
sosB.addEventListener("contextmenu",e=>e.preventDefault());
sosB.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();triggerSOS()}});

/* siren + strobe */
let ac,osc,gain,sirI,strI,on=false;
function siren(s){
  if(s===on)return;on=s;const o=$("strobe");
  if(s){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();osc=ac.createOscillator();gain=ac.createGain();osc.type="square";gain.gain.value=1;osc.connect(gain).connect(ac.destination);osc.frequency.value=700;osc.start();let hi=false;sirI=setInterval(()=>{hi=!hi;osc.frequency.setTargetAtTime(hi?960:640,ac.currentTime,0.02)},380)}catch(e){}
    o.style.display="flex";let f=false;strI=setInterval(()=>{f=!f;o.classList.toggle("r",f)},140);if(navigator.vibrate)navigator.vibrate(new Array(30).fill(200))}
  else{clearInterval(sirI);clearInterval(strI);try{osc.stop();osc.disconnect()}catch(e){}o.style.display="none";if(navigator.vibrate)navigator.vibrate(0)}
}

/* map */
function drawMap(){
  const S=140/3,k=111.32*Math.cos(pos.lat*Math.PI/180);let g="";
  [1,2,3].forEach(r=>g+=`<circle cx="150" cy="150" r="${r*S}" fill="none" stroke="#343841" stroke-dasharray="3 4"/><text x="${150+r*S-2}" y="146" font-size="9" fill="#a7adb8" text-anchor="end">${r} km</text>`);
  const L=nearest().filter(h=>h.d<=3);
  L.forEach(h=>{const x=150+(h.lng-pos.lng)*k*S,y=150-(h.lat-pos.lat)*110.57*S;g+=h.k==="Police"?`<circle cx="${x}" cy="${y}" r="7" fill="#60a5fa"/>`:`<text x="${x}" y="${y+6}" font-size="18" fill="#e11d48" text-anchor="middle" font-weight="700">✚</text>`});
  g+=`<path d="M150 140l9 10-9 10-9-10z" fill="#fbbf24"/>`;
  $("map").innerHTML=`<rect width="300" height="300" rx="10" fill="#15171b"/>`+g;
  $("havens").innerHTML=nearest().slice(0,8).map(h=>`<li><div><b>${h.n}</b><br><span class="tag">${h.k}</span> <span class="mut">${fmt(h.d)}</span></div><a class="b" style="min-height:48px" target="_blank" rel="noopener" href="${dir(h)}">Walk</a></li>`).join("")+`<li><div><b>Women helpline</b><br><span class="mut">24/7, free</span></div><a class="b" style="min-height:48px" href="tel:1091">1091</a></li>`;
}

/* walk monitor */
let wI,wEnd=0;
$("wgo").onclick=()=>{clearInterval(wI);wEnd=Date.now()+(+$("wmin").value)*60000;$("wsafe").style.display="block";wI=setInterval(()=>{const r=wEnd-Date.now();if(r<=0){clearInterval(wI);$("wst").textContent="Timer expired. SOS sent.";$("wsafe").style.display="none";triggerSOS()}else{const m=Math.floor(r/60000),s=Math.floor(r%60000/1000);$("wst").textContent=`Walking… check in within ${m}:${String(s).padStart(2,"0")}`}},500)};
$("wsafe").onclick=()=>{clearInterval(wI);$("wsafe").style.display="none";$("wst").textContent="Checked in safe. Timer stopped."};

/* fake call */
let rI,cT,cSec=0,spk=false;
function beep(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=440;g.gain.value=.15;o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.6)}catch(e){}}
function say(t){try{speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(t))}catch(e){}}
$("fgo").onclick=()=>{const d=+$("fdel").value;$("fst").textContent=d?`Call will ring in ${d} seconds. You can lock the screen.`:"";beep();setTimeout(startCall,d*1000)};
function startCall(){$("cname").textContent=$("fname").value||"Unknown";$("cstat").textContent="Incoming call…";$("call").style.display="flex";$("cacc").style.display="";rI=setInterval(()=>{beep();if(navigator.vibrate)navigator.vibrate([400,200,400])},1800)}
$("cacc").onclick=()=>{clearInterval(rI);$("cacc").style.display="none";cSec=0;$("cstat").textContent="00:00";cT=setInterval(()=>{cSec++;$("cstat").textContent="0"+Math.floor(cSec/60)+":"+String(cSec%60).padStart(2,"0")},1000);
  say("Hello? Where are you now? I’m waiting for you. Please come home right away, it’s important.")};
function endCall(){clearInterval(rI);clearInterval(cT);try{speechSynthesis.cancel()}catch(e){}$("call").style.display="none"}

/* voice */
let rec,listening=false;
$("vgo").onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$("vst").textContent="Voice recognition isn’t supported in this browser.";return}
  if(listening){listening=false;rec.stop();$("vgo").textContent="🎙 Start listening";$("vst").textContent="";return}
  rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang="en-IN";
  rec.onresult=e=>{const t=[...e.results].slice(e.resultIndex).map(r=>r[0].transcript).join(" ").toLowerCase();$("vst").textContent="Heard: "+t;if(/help[, ]+help|bachao|बचाओ/.test(t)){rec.stop();listening=false;$("vgo").textContent="🎙 Start listening";triggerSOS()}};
  rec.onend=()=>{if(listening)try{rec.start()}catch(e){}};
  rec.onerror=e=>{$("vst").textContent="Mic error: "+e.error};
  listening=true;rec.start();$("vgo").textContent="⏹ Stop listening";$("vst").textContent="Listening…";
};
