/* ===== Settings ===== */
const WEBHOOK_URL = "https://hack-karo-05.app.n8n.cloud/webhook/complaint";

/* ===== State ===== */
let photoBlob = null, coords = null, stream = null, sending = false;
const $ = id => document.getElementById(id);

/* ===== Camera (live only, no gallery) ===== */
async function openCamera(){
  $("camStatus").textContent = "";
  try{
    stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}, audio:false});
    const v = $("video"); v.srcObject = stream; await v.play();
    v.hidden = false; $("preview").hidden = true; $("empty").hidden = true;
    $("snap").hidden = false; $("openCam").hidden = true; $("retake").hidden = true;
  }catch(e){
    $("camStatus").textContent = "Allow camera access (camera icon in the address bar). If it still fails, use the option below.";
    $("camStatus").className = "status bad";
    $("fallback").hidden = false;
  }
}
function stopCamera(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } }

function snap(){
  const v = $("video"), c = $("canvas");
  const max = 1280, s = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
  c.width = Math.round(v.videoWidth*s); c.height = Math.round(v.videoHeight*s);
  c.getContext("2d").drawImage(v,0,0,c.width,c.height);
  c.toBlob(b=>{ setPhoto(b); stopCamera(); }, "image/jpeg", 0.8);
}
function setPhoto(blob){
  photoBlob = blob;
  const p = $("preview"); p.src = URL.createObjectURL(blob); p.hidden = false;
  $("video").hidden = true; $("empty").hidden = true;
  $("snap").hidden = true; $("retake").hidden = false; $("openCam").hidden = true;
  $("camStatus").textContent = "Photo ready."; $("camStatus").className = "status ok";
  refresh();
}
function retake(){ photoBlob = null; $("preview").hidden = true; refresh(); openCamera(); }

/* ===== GPS ===== */
function getGps(){
  const el = $("gpsStatus"); el.className = "status"; el.textContent = "Finding your location…";
  if(!navigator.geolocation){ el.textContent = "GPS is not supported on this device."; el.className="status bad"; return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    coords = {lat:pos.coords.latitude, lng:pos.coords.longitude, acc:Math.round(pos.coords.accuracy)};
    el.textContent = `Found: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (±${coords.acc} m)`;
    el.className = "status ok"; refresh();
  }, err=>{
    coords = null;
    el.textContent = "Could not get location. Allow location access in the browser and retry.";
    el.className = "status bad"; refresh();
  }, {enableHighAccuracy:true, timeout:15000, maximumAge:0});
}

function refresh(){ $("submit").disabled = !(photoBlob && coords && $("email").value.trim() && $("email").validity.valid) || sending; }

/* ===== Voice input (speech to text, fills the description) ===== */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false;
function micMsg(t, cls){ $("micStatus").textContent = t; $("micStatus").className = "status " + (cls||""); }
function toggleMic(){
  if(listening){ rec.stop(); return; }
  rec = new SR();
  rec.lang = $("lang").value; rec.interimResults = true; rec.continuous = true;
  const base = $("desc").value.trim();
  rec.onstart = () => { listening = true; $("mic").textContent = "Stop"; $("mic").className = "rec"; micMsg("Listening… speak now.", "ok"); };
  rec.onresult = e => {
    let t = ""; for(let i=0;i<e.results.length;i++) t += e.results[i][0].transcript;
    $("desc").value = (base ? base + " " : "") + t; refresh();
  };
  rec.onerror = e => micMsg("Voice failed (" + e.error + "). Allow microphone access or type instead.", "bad");
  rec.onend = () => { listening = false; $("mic").textContent = "Speak"; $("mic").className = "ghost"; if(!$("micStatus").classList.contains("bad")) micMsg(""); };
  rec.start();
}
if(!SR){ $("mic").disabled = true; $("lang").disabled = true; micMsg("Voice input works in Chrome. Please type instead."); }
else { $("mic").onclick = toggleMic; }
$("desc").addEventListener("input", refresh);
$("email").addEventListener("input", refresh);

/* ===== Submit ===== */
async function submit(e){
  e.preventDefault();
  if(sending || !photoBlob || !coords) return;
  sending = true; refresh();
  const id = "C" + Date.now().toString(36).toUpperCase();
  const fd = new FormData();
  fd.append("id", id);
  fd.append("photo", photoBlob, id + ".jpg");
  fd.append("lat", coords.lat);
  fd.append("long", coords.lng);
  fd.append("accuracy", coords.acc);
  fd.append("description", $("desc").value.trim());
  fd.append("email", $("email").value.trim());
  fd.append("language", $("lang").value);
  fd.append("timestamp", new Date().toISOString());
  $("msg").textContent = "Sending…"; $("msg").className = "status";
  try{
    const r = await fetch(WEBHOOK_URL, {method:"POST", body:fd});
    if(!r.ok) throw new Error("HTTP " + r.status);
    $("form").hidden = true; $("done").hidden = false; $("cid").textContent = id;
  }catch(err){
    sending = false; refresh();
    $("msg").textContent = "Failed (" + err.message + "). Check your internet and try again.";
    $("msg").className = "status bad";
  }
}

/* ===== Wire up ===== */
$("openCam").onclick = openCamera;
$("snap").onclick = snap;
$("retake").onclick = retake;
$("retryGps").onclick = getGps;
$("fallbackInput").onchange = e => { if(e.target.files[0]) setPhoto(e.target.files[0]); };
$("form").addEventListener("submit", submit);
getGps();
