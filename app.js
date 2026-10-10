/* ---------- Données et mémoire locale ---------- */
const KEY = 'undercontrol-mvp-v1';
const blank = () => ({ user:null, session:false, onboarded:false, policies:[], profile:{owner:null, vehicle:null, employed:null}, requests:[], chat:[], claims:[], settings:{intro:true, introSound:true} });
let storageOK = true;
try { localStorage.setItem(KEY+'-test','1'); localStorage.removeItem(KEY+'-test'); } catch(e){ storageOK = false; }
function load(){
  try { const s = localStorage.getItem(KEY); if(!s) return blank(); const d = Object.assign(blank(), JSON.parse(s)); d.profile = Object.assign(blank().profile, d.profile||{}); d.settings = Object.assign(blank().settings, d.settings||{}); return d; }
  catch(e){ return blank(); }
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){ storageOK = false; } }
let data = load();

/* Fichiers (PDF, photos) dans IndexedDB */
let dbp = null;
function db(){
  if(dbp) return dbp;
  dbp = new Promise((res, rej) => {
    try { const r = indexedDB.open('undercontrol-mvp', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch(e){ rej(e); }
  });
  return dbp;
}
async function idb(mode, fn){
  const d = await db();
  return new Promise((res, rej) => { const t = d.transaction('files', mode); const st = t.objectStore('files'); const r = fn(st);
    t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); });
}
const putFile = (id, blob) => idb('readwrite', s => s.put(blob, id));
const getFile = id => idb('readonly', s => s.get(id));
const delFile = id => idb('readwrite', s => s.delete(id)).catch(()=>{});
const clearFiles = () => idb('readwrite', s => s.clear()).catch(()=>{});

/* ---------- Référentiels ---------- */
const RISKS = [
  {id:'maladie', label:'Assurance maladie', short:'Maladie', icon:'heart'},
  {id:'menage', label:'Ménage et RC privée', short:'Ménage et RC', icon:'home'},
  {id:'vehicule', label:'Véhicule à moteur', short:'Véhicule', icon:'car'},
  {id:'batiment', label:'Bâtiment', short:'Bâtiment', icon:'building'},
  {id:'pj', label:'Protection juridique', short:'Prot. juridique', icon:'scale'},
  {id:'vie', label:'Vie / 3e pilier', short:'Vie / 3e pilier', icon:'pillar'},
  {id:'voyage', label:'Voyage', short:'Voyage', icon:'plane'},
  {id:'autre', label:'Autre assurance', short:'Autre', icon:'doc'}
];
const R = id => RISKS.find(r => r.id === id) || RISKS[RISKS.length-1];
const I = {
  plus:'<path d="M12 5v14M5 12h14"/>', back:'<path d="M15 6l-6 6 6 6"/>', chev:'<path d="M9 6l6 6-6 6"/>',
  doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  shield:'<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  heart:'<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  home:'<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  car:'<path d="M5 16l1.5-5h11L19 16"/><path d="M4 16h16v3H4z"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
  building:'<path d="M5 21V5l7-2v18M12 8h7v13M3 21h18M8 9h1M8 13h1M8 17h1M15 12h1M15 16h1"/>',
  scale:'<path d="M12 4v16M6 8h12M4 14l2-6 2 6a2 2 0 0 1-4 0zM16 14l2-6 2 6a2 2 0 0 1-4 0z"/>',
  pillar:'<path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6"/>',
  plane:'<path d="M21 3L3 10l7 3 3 7z"/><path d="M10 13l11-10"/>',
  upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"/>',
  check:'<path d="M5 12l4 4 10-10"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
  clip:'<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5"/>',
  send:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  idcard:'<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M14 11h4M14 14h3"/>',
  alert:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>'
};
const svg = (n, s=20, w=1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const z = n => String(n).padStart(2,'0');
const fmt = t => { const d = new Date(t); return `${z(d.getDate())}.${z(d.getMonth()+1)}.${d.getFullYear()}`; };
const fmtShort = t => { const d = new Date(t); return `${z(d.getDate())}.${z(d.getMonth()+1)}`; };
const plural = (n, one, many) => `${n} ${n>1 ? many : one}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const size = b => b > 1e6 ? (b/1e6).toFixed(1).replace('.',',')+' Mo' : Math.max(1,Math.round(b/1e3))+' ko';

function statusOf(p){ return p.receivedAt ? 'received' : p.requestedAt ? 'requested' : 'incomplete'; }
function pillOf(p){
  const s = statusOf(p);
  if(s==='received') return `<span class="pill ok">Reçu</span>`;
  if(s==='requested') return `<span class="pill req">Demandé le ${fmtShort(p.requestedAt)}</span>`;
  return `<span class="pill warn">À compléter</span>`;
}
function subOf(p){
  if(!p.insurer && !p.number) return 'Assureur et n° à compléter';
  return [p.insurer || 'Assureur à compléter', p.number ? 'n° '+p.number : ''].filter(Boolean).join(' · ');
}
function newPolicy({risk, insurer='', number='', mandate=false}){
  insurer = insurer.trim(); number = number.trim();
  return { id:uid(), risk, insurer, number, createdAt:Date.now(), requestedAt:(insurer && mandate) ? Date.now() : null, receivedAt:null, simulated:false, file:null };
}
const sorted = () => [...data.policies].sort((a,b) => RISKS.indexOf(R(a.risk)) - RISKS.indexOf(R(b.risk)) || a.createdAt - b.createdAt);

async function hash(s){
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join(''); }
  catch(e){ let h = 5381; for(const c of s) h = ((h<<5) + h + c.charCodeAt(0)) | 0; return 'x'+(h>>>0).toString(16); }
}

/* ---------- Analyse du portefeuille (bilan) ---------- */
function analyse(){
  const has = r => data.policies.filter(p => p.risk === r);
  const pr = data.profile;
  const vehicle = pr.vehicle ?? (has('vehicule').length ? true : null);
  const items = [];
  const gap = (risk, sev, t, p, ref) => items.push({k:'gap', risk, sev, t, p, ref, topic:R(risk).label});
  if(!has('maladie').length) gap('maladie','high','Pas d’assurance maladie enregistrée','L’assurance maladie de base est obligatoire pour toute personne domiciliée en Suisse. Si vous en avez une, ajoutez-la.','LAMal art. 3');
  if(!has('menage').length) gap('menage','high','Pas d’assurance ménage ni de RC privée','Un dommage causé à quelqu’un, ou à votre logement si vous êtes locataire, peut coûter très cher. Dans certains cantons, l’assurance du mobilier contre l’incendie est obligatoire.','CO art. 41');
  if(vehicle && !has('vehicule').length) gap('vehicule','high','Véhicule sans assurance enregistrée','L’assurance responsabilité civile est obligatoire pour circuler avec un véhicule à moteur.','LCR art. 63');
  if(pr.owner && !has('batiment').length) gap('batiment','high','Bâtiment non assuré','Dans la plupart des cantons, l’assurance bâtiment est obligatoire, auprès de l’établissement cantonal ou d’un assureur privé selon le canton.','Loi cantonale');
  if(!has('pj').length) gap('pj','med','Pas de protection juridique','Un litige avec un employeur, un bailleur ou après un accident de la route peut coûter des milliers de francs en frais d’avocat.', null);
  if(!has('vie').length) gap('vie','low','Pas de 3e pilier enregistré','Le 3e pilier lié complète la retraite, et les versements sont déductibles du revenu imposable dans les limites fixées chaque année.','OPP 3 art. 7');
  ['menage','pj','voyage'].forEach(r => { const n = has(r).length; if(n > 1) items.push({k:'dup', sev:'med', risk:r, t:`${n} polices « ${R(r).label} »`, p:'Elles couvrent peut-être les mêmes personnes et les mêmes risques. Comparez-les avant la prochaine échéance.', ref:null}); });
  if(pr.employed && has('maladie').length) items.push({k:'dup', sev:'med', risk:'maladie', t:'Accidents peut-être payés deux fois', p:'Si vous travaillez au moins 8 heures par semaine chez le même employeur, son assurance accidents vous couvre. La couverture accidents de votre assurance maladie peut alors être suspendue.', ref:'LAMal art. 8 · LAA art. 1a'});
  const order = {high:0, med:1, low:2};
  items.sort((a,b) => order[a.sev] - order[b.sev]);
  const covered = RISKS.filter(r => r.id !== 'autre' && has(r.id).length).map(r => ({r, list:has(r.id)}));
  const pending = data.policies.filter(p => statusOf(p) !== 'received').length;
  const unanswered = ['owner','vehicle','employed'].filter(k => (k==='vehicle' ? vehicle : pr[k]) == null).length;
  return { items, covered, pending, unanswered, vehicle,
    gaps: items.filter(i => i.k==='gap').length, dups: items.filter(i => i.k==='dup').length };
}

/* ---------- Navigation ---------- */
const ui = { screen:'welcome', params:{}, stack:[] };
function go(screen, params={}, push=true){
  if(push) ui.stack.push({screen:ui.screen, params:ui.params});
  ui.screen = screen; ui.params = params; ui.confirmDel = false; ui.confirmErase = false; ui.confirmReset = false;
  window.scrollTo(0,0); render();
}
function back(){ const prev = ui.stack.pop(); if(prev){ ui.screen = prev.screen; ui.params = prev.params; window.scrollTo(0,0); render(); } else go(data.session ? 'home' : 'welcome', {}, false); }
function tab(s){ ui.stack = []; go(s, {}, false); }
function startOnboard(){
  ui.draft = [{risk:'maladie', insurer:'', number:''}, {risk:'menage', insurer:'', number:''}];
  ui.draftMandate = false; ui.stack = []; go('onboard', {}, false);
}
function toast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2800); }
const storageBanner = () => storageOK ? '' : `<div class="banner warn">${svg('info',18,2)}<span>La mémoire locale n’est pas disponible dans ce navigateur. Vos données seront perdues en fermant la page.</span></div>`;

/* ---------- Écrans ---------- */
const S = {};

S.welcome = () => `
  <div class="brand">${window.UCMark ? UCMark(36) : ''}<span class="brand-name"><span class="w5">Under</span>Control</span></div>
  <div class="stack" aria-hidden="true">
    <div class="s1"></div><div class="s2"></div>
    <div class="s3">
      <div class="between"><strong>Ménage et RC privée</strong><span class="pill ok">Document reçu</span></div>
      <span class="mono note">Police n° 40.118.207</span>
      <div class="chips" style="gap:6px"><span class="tag">Vol par effraction ✓</span><span class="tag warn">Vol simple manquant</span></div>
    </div>
  </div>
  <div class="col g12">
    <h1 class="xl">Toutes vos assurances, au même endroit.</h1>
    <p class="lede lg">Rassemblez vos polices, posez vos questions 24/7 et sachez ce qui est couvert, ce qui manque et comment optimiser vos couvertures.</p>
  </div>
  <ol class="steps">
    <li><span>1</span>Ajoutez vos polices, ou nous les demandons à l’assureur</li>
    <li><span>2</span>Posez vos questions à l’assistant</li>
    <li><span>3</span>Faites le bilan et comparez les offres</li>
  </ol>
  <div class="grow"></div>
  <div class="col g10">
    <button class="btn btn-primary btn-lg" data-act="goAuth" data-mode="create">Commencer</button>
    <button class="btn btn-ghost" data-act="goAuth" data-mode="login">J’ai déjà un compte</button>
  </div>`;

S.auth = () => {
  const mode = ui.params.mode || (data.user ? 'login' : 'create');
  const v = ui.authVals || {};
  const err = ui.authError ? `<p class="err" role="alert">${esc(ui.authError)}</p>` : '';
  const top = `<div class="topbar"><button class="back" data-act="back">${svg('back',18,2)}Retour</button>${mode==='create' ? '<div class="progress" aria-label="Étape 1 sur 2"><span class="on"></span><span></span></div>' : ''}</div>`;
  if(mode === 'login'){
    return `${top}
      <div class="col g8"><h1>Content de vous revoir</h1><p class="lede">Connectez-vous pour retrouver vos polices.</p></div>
      ${storageBanner()}
      <form class="col g10" data-submit="login" novalidate>
        <div class="field"><label for="li-email">E-mail</label><input id="li-email" name="email" class="input" type="email" autocomplete="email" value="${esc(v.email ?? data.user?.email ?? '')}"></div>
        <div class="field"><label for="li-pwd">Mot de passe</label><input id="li-pwd" name="pwd" class="input" type="password" autocomplete="current-password"></div>
        ${err}
        <button class="btn btn-primary btn-lg" type="submit">Se connecter</button>
      </form>
      ${data.user ? (ui.confirmReset ? `
        <div class="card danger"><strong>Recommencer à zéro ?</strong><p class="small">Le compte, les polices et les documents enregistrés sur ce téléphone seront effacés.</p>
          <div class="grid2"><button class="btn btn-secondary" data-act="cancelReset">Annuler</button><button class="btn btn-danger" data-act="doReset">Effacer</button></div></div>`
        : `<button class="btn btn-ghost" data-act="askReset">Mot de passe oublié ? Recommencer à zéro</button>`)
        : `<button class="btn btn-ghost" data-act="authMode" data-mode="create">Créer un compte</button>`}`;
  }
  return `${top}
    <div class="col g8"><h1>Créez votre compte UnderControl</h1><p class="lede">Vos polices contiennent des données personnelles. Votre compte les protège et nous permet d’agir en votre nom auprès des assureurs.</p></div>
    ${storageBanner()}
    <div class="col g10">
      <button class="btn btn-dark" data-act="sso">${svg('idcard',20,1.9)}Continuer avec SwissID</button>
      <button class="btn btn-secondary" data-act="sso">Continuer avec Apple</button>
      <button class="btn btn-secondary" data-act="sso">Continuer avec Google</button>
    </div>
    <div class="divider" style="display:flex;align-items:center;gap:12px;color:var(--muted);font-size:13px"><span class="grow" style="height:1px;background:var(--line)"></span>ou avec votre e-mail<span class="grow" style="height:1px;background:var(--line)"></span></div>
    <form class="col g10" data-submit="create" novalidate>
      <div class="field"><label for="cr-first">Prénom</label><input id="cr-first" name="first" class="input" autocomplete="given-name" value="${esc(v.first||'')}"></div>
      <div class="field"><label for="cr-email">E-mail</label><input id="cr-email" name="email" class="input" type="email" autocomplete="email" placeholder="prenom.nom@exemple.ch" value="${esc(v.email||'')}"></div>
      <div class="field"><label for="cr-pwd">Mot de passe</label><input id="cr-pwd" name="pwd" class="input" type="password" autocomplete="new-password" placeholder="8 caractères minimum"></div>
      ${err}
      <button class="btn btn-primary btn-lg" type="submit">Créer mon compte</button>
    </form>
    <button class="btn btn-ghost" data-act="authMode" data-mode="login">Déjà un compte ? Se connecter</button>
    <p class="note" style="text-align:center">Version de test : votre compte reste sur ce téléphone, rien n’est envoyé.</p>`;
};

const countDraft = () => (ui.draft||[]).filter(r => r.insurer.trim() || r.number.trim()).length;
const onbLabel = () => { const n = countDraft(); return n ? `Continuer avec ${plural(n,'police','polices')}` : 'Continuer'; };
S.onboard = () => {
  if(!ui.draft) ui.draft = [{risk:'maladie', insurer:'', number:''}];
  const opts = sel => RISKS.map(r => `<option value="${r.id}"${r.id===sel?' selected':''}>${esc(r.label)}</option>`).join('');
  const rows = ui.draft.map((r,i) => `
    <div class="card tight">
      <div style="display:flex;gap:8px;align-items:flex-end">
        <div class="field grow"><label for="ob-r${i}">Risque</label><select id="ob-r${i}" class="input" data-row="${i}" data-field="risk">${opts(r.risk)}</select></div>
        ${ui.draft.length > 1 ? `<button class="icon-btn" data-act="delRow" data-i="${i}" aria-label="Supprimer cette ligne">${svg('trash',18)}</button>` : ''}
      </div>
      <div class="grid2">
        <div class="field"><label for="ob-a${i}">Assureur</label><input id="ob-a${i}" class="input" data-row="${i}" data-field="insurer" value="${esc(r.insurer)}" placeholder="Ex. Allianz" autocomplete="off"></div>
        <div class="field"><label for="ob-n${i}">N° de police</label><input id="ob-n${i}" class="input mono" data-row="${i}" data-field="number" value="${esc(r.number)}" placeholder="Facultatif" autocomplete="off"></div>
      </div>
    </div>`).join('');
  return `
    <div class="topbar"><div class="progress" aria-label="Étape 2 sur 2"><span class="on"></span><span class="on"></span></div><button class="btn-link" data-act="skipOnb">Passer</button></div>
    <div class="col g8"><h1>Quelles assurances avez-vous ?</h1><p class="lede">Une ligne par police. Avec l’assureur et le numéro, nous demandons les documents pour vous. Vous pouvez aussi le faire plus tard.</p></div>
    <div class="col g10">${rows}<button class="btn btn-dashed" data-act="addRow">${svg('plus',18,2)}Ajouter une ligne</button></div>
    <div class="chips"><span class="note">Ajout rapide :</span>${['vehicule','pj','vie','voyage'].map(id => `<button class="chip sm" data-act="quickRow" data-r="${id}">${esc(R(id).short)}</button>`).join('')}</div>
    <label class="check"><input type="checkbox" data-bind="draftMandate"${ui.draftMandate?' checked':''}><span>J’autorise UnderControl à demander les documents à mes assureurs en mon nom (mandat de courtage).</span></label>
    <div class="grow"></div>
    <div class="col g8">
      <button class="btn btn-primary btn-lg" id="onb-go" data-act="finishOnb">${onbLabel()}</button>
      <button class="btn btn-ghost" data-act="skipOnb">Je n’ai pas les infos, je le ferai plus tard</button>
    </div>`;
};

S.home = () => {
  const a = analyse(); const ps = sorted(); const rec = ps.filter(p => statusOf(p)==='received').length;
  const heroTitle = !ps.length ? 'Ajoutez vos polices pour un bilan précis' : (a.gaps || a.dups) ? `${plural(a.gaps,'lacune','lacunes')} et ${plural(a.dups,'point','points')} à vérifier` : 'Aucune lacune détectée';
  const list = ps.length ? `
    <div class="between"><h2>${plural(ps.length,'police','polices')}</h2><span class="note">${plural(rec,'document reçu','documents reçus')}</span></div>
    <div class="list">${ps.map(p => { const r = R(p.risk); const st = statusOf(p); return `
      <button class="row" data-act="openPolicy" data-id="${p.id}">
        <span class="ico ${st==='incomplete'?'warn':''}">${svg(r.icon)}</span>
        <span class="row-main"><span class="row-title">${esc(r.label)}</span><span class="row-sub">${esc(subOf(p))}</span></span>
        ${pillOf(p)}
      </button>`; }).join('')}</div>`
    : `<div class="card"><h2 class="sm">Aucune police pour l’instant</h2><p class="small" style="color:var(--ink-2)">Ajoutez l’assureur et le numéro de police, ou importez directement le document.</p><button class="btn btn-primary" data-act="goAdd">${svg('plus',18,2.2)}Ajouter une police</button></div>`;
  return `
    ${storageBanner()}
    <div class="head-row">
      <div><div class="muted">Bonjour ${esc(data.user?.first)}</div><h1>Mes polices</h1></div>
      <button class="icon-btn primary" data-act="goAdd" aria-label="Ajouter une police">${svg('plus',20,2.2)}</button>
    </div>
    <button class="hero" data-act="tab" data-s="bilan">
      <span class="between" style="width:100%"><span class="eyebrow">Bilan de mes assurances</span>${svg('chev',20,2)}</span>
      <span class="title">${heroTitle}</span>
      <span class="chips" style="gap:6px"><span class="pill">${plural(a.covered.length,'risque couvert','risques couverts')}</span>${a.pending ? `<span class="pill">${plural(a.pending,'document en attente','documents en attente')}</span>` : ''}</span>
    </button>
    ${list}`;
};

const uploadBlock = (ctx, title='J’importe ma police') => `
  <section class="upload">
    <span class="ico">${svg('upload',22)}</span>
    <h2 class="sm">${title}</h2>
    <p class="small" style="color:var(--muted)">PDF ou photo des conditions particulières et générales.</p>
    <div class="btns">
      <label class="btn btn-secondary btn-sm file-label"><input type="file" class="sr" accept="application/pdf,image/*" data-file="${ctx}">Choisir un fichier</label>
      <label class="btn btn-secondary btn-sm file-label"><input type="file" class="sr" accept="image/*" capture="environment" data-file="${ctx}">Prendre en photo</label>
    </div>
  </section>`;

S.add = () => {
  const f = ui.add || (ui.add = {risk:null, insurer:'', number:'', mandate:false});
  const err = ui.addError ? `<p class="err" role="alert">${esc(ui.addError)}</p>` : '';
  return `
    <button class="back" data-act="back">${svg('back',18,2)}Mes polices</button>
    <h1>Ajouter une police</h1>
    <div class="col g8"><span class="label">Quel risque ?</span>
      <div class="chips">${RISKS.map(r => `<button class="chip" data-act="pickRisk" data-r="${r.id}" aria-pressed="${f.risk===r.id}">${esc(r.short)}</button>`).join('')}</div>
    </div>
    <form class="card" data-submit="addRequest" novalidate>
      <div class="col g4"><h2 class="sm">Nous demandons les documents</h2><p class="small" style="color:var(--muted)">Indiquez l’assureur et le numéro de police. Vous êtes averti dès que la police arrive.</p></div>
      <div class="field"><label for="ad-ins">Assureur</label><input id="ad-ins" class="input" data-bind="add.insurer" value="${esc(f.insurer)}" placeholder="Ex. Allianz" autocomplete="off"></div>
      <div class="field"><label for="ad-num">N° de police</label><input id="ad-num" class="input mono" data-bind="add.number" value="${esc(f.number)}" placeholder="Ex. 12.345.678" autocomplete="off"></div>
      <label class="check"><input type="checkbox" data-bind="add.mandate"${f.mandate?' checked':''}><span>J’autorise UnderControl à demander mes documents à cet assureur en mon nom (mandat de courtage).</span></label>
      ${err}
      <button class="btn btn-primary" type="submit">Envoyer la demande</button>
    </form>
    <div style="display:flex;align-items:center;gap:12px;color:var(--muted);font-size:13px"><span class="grow" style="height:1px;background:var(--line)"></span>ou<span class="grow" style="height:1px;background:var(--line)"></span></div>
    ${uploadBlock('add')}`;
};

S.policy = () => {
  const p = data.policies.find(x => x.id === ui.params.id);
  if(!p) return `<button class="back" data-act="back">${svg('back',18,2)}Mes polices</button><p>Cette police n’existe plus.</p>`;
  const r = R(p.risk); const st = statusOf(p);
  let state = '';
  if(st === 'received'){
    state = p.file ? `
      <div class="card"><div class="between"><h2 class="sm">Document</h2><span class="pill ok">Reçu le ${fmt(p.receivedAt)}</span></div>
        <div class="row" style="padding:0;min-height:0;border:0"><span class="ico ok">${svg('doc')}</span><span class="row-main"><span class="row-title" style="overflow-wrap:anywhere">${esc(p.file.name)}</span><span class="row-sub">${esc(size(p.file.size))}${p.file.stored===false ? ' · non enregistré sur ce téléphone' : ''}</span></span></div>
        <div class="preview" id="pv"></div>
        <div class="grid2">
          <label class="btn btn-secondary btn-sm file-label" style="width:100%"><input type="file" class="sr" accept="application/pdf,image/*" data-file="policy">Remplacer</label>
          <button class="btn btn-secondary btn-sm" style="width:100%" data-act="removeFile">Retirer</button>
        </div>
      </div>`
      : `<div class="banner">${svg('check',18,2)}<span>Reçu de l’assureur le ${fmt(p.receivedAt)} (simulé). Importez le document pour l’avoir sur votre téléphone.</span></div>${uploadBlock('policy','Importer le document')}`;
  } else if(st === 'requested'){
    state = `
      <div class="card"><div class="col g4"><h2 class="sm">Demande en cours</h2><p class="small" style="color:var(--ink-2)">Demande envoyée à ${esc(p.insurer)} le ${fmt(p.requestedAt)}. Vous serez averti à la réception.</p></div>
        <p class="note">Version de test : aucune demande n’est réellement envoyée à l’assureur.</p>
        <button class="btn btn-secondary" data-act="simulate">Simuler la réception</button></div>
      ${uploadBlock('policy','Vous l’avez déjà ? Importez-la')}`;
  } else {
    state = (p.insurer ? `
      <form class="card" data-submit="requestDocs" novalidate>
        <div class="col g4"><h2 class="sm">Demander les documents</h2><p class="small" style="color:var(--ink-2)">Nous demandons la police à ${esc(p.insurer)} pour vous.</p></div>
        <label class="check"><input type="checkbox" name="mandate"><span>J’autorise UnderControl à demander mes documents à cet assureur en mon nom (mandat de courtage).</span></label>
        ${ui.policyError ? `<p class="err" role="alert">${esc(ui.policyError)}</p>` : ''}
        <button class="btn btn-primary" type="submit">Envoyer la demande</button>
      </form>`
      : `<div class="banner warn">${svg('info',18,2)}<span>Indiquez l’assureur pour que nous puissions demander les documents, ou importez la police.</span></div>`) + uploadBlock('policy');
  }
  return `
    <button class="back" data-act="back">${svg('back',18,2)}Mes polices</button>
    <div class="head-row"><div class="col g4"><span class="muted">${esc(r.label)}</span><h1>${esc(p.insurer || 'Assureur à compléter')}</h1></div>${pillOf(p)}</div>
    <div class="card" style="padding-block:6px">
      <dl class="kv">
        <div><dt>N° de police</dt><dd class="mono">${esc(p.number || '—')}</dd></div>
        <div><dt>Ajoutée le</dt><dd>${fmt(p.createdAt)}</dd></div>
      </dl>
    </div>
    ${state}
    <button class="btn btn-secondary" data-act="newClaim" data-policy="${p.id}">${svg('alert',18)}Annoncer un sinistre sur cette police</button>
    <details class="card"${!p.insurer ? ' open' : ''}>
      <summary>Modifier l’assureur ou le numéro</summary>
      <form class="col g10" data-submit="savePolicy" novalidate>
        <div class="field"><label for="pe-ins">Assureur</label><input id="pe-ins" name="insurer" class="input" value="${esc(p.insurer)}" autocomplete="off"></div>
        <div class="field"><label for="pe-num">N° de police</label><input id="pe-num" name="number" class="input mono" value="${esc(p.number)}" autocomplete="off"></div>
        <button class="btn btn-secondary" type="submit">Enregistrer</button>
      </form>
    </details>
    ${ui.confirmDel ? `
      <div class="card danger"><strong>Supprimer cette police ?</strong><p class="small">Elle et son document seront effacés de ce téléphone.</p>
        <div class="grid2"><button class="btn btn-secondary" data-act="cancelDel">Annuler</button><button class="btn btn-danger" data-act="doDel">Supprimer</button></div></div>`
      : `<button class="btn btn-ghost danger" data-act="askDel">${svg('trash',18)}Supprimer cette police</button>`}`;
};

const SUGG = ['Suis-je couvert si on me vole mon vélo ?', 'Quelle est ma franchise maladie ?', 'Fais-moi un bilan'];
S.assistant = () => {
  const n = data.policies.length;
  const msgs = data.chat.map(m => m.who === 'me'
    ? `<div class="bubble me">${esc(m.text)}</div>`
    : `<div class="bubble bot"><p>${esc(m.text)}</p>${m.act==='bilan' ? `<button class="btn btn-dark btn-sm" style="width:100%" data-act="tab" data-s="bilan">Ouvrir le bilan</button>` : ''}${m.act==='claim' && data.claims.some(c => c.id === m.id) ? `<button class="btn btn-dark btn-sm" style="width:100%" data-act="openClaim" data-id="${m.id}">Ouvrir la déclaration</button>` : ''}</div>`).join('');
  return `
    <header class="chat-head"><span class="logo" style="width:40px;height:40px;border-radius:12px">${svg('chat',20,1.9)}</span>
      <div class="col"><h1 class="sm">Alfred - Votre assistant</h1><span class="note">Version de test : pas encore connecté</span></div></header>
    <div class="msgs">
      <div class="bubble bot"><p>Bonjour ${esc(data.user?.first)}. Je suis Alfred. Bientôt, je lirai ${n ? `vos ${plural(n,'police','polices')}` : 'vos polices'} pour répondre à vos questions, article à l’appui.</p></div>
      ${msgs}
    </div>
    <div class="sugg">${SUGG.map(q => `<button class="chip sm" data-act="sugg" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <form class="composer" data-submit="chat" novalidate>
      <button type="button" class="icon-btn" style="border:0;background:var(--bg)" data-act="attach" aria-label="Joindre un document">${svg('clip',20,1.9)}</button>
      <label for="as-q" class="sr">Votre question</label>
      <input id="as-q" name="q" class="input" placeholder="Posez votre question…" autocomplete="off">
      <button type="submit" class="icon-btn primary" aria-label="Envoyer">${svg('send',20,2)}</button>
    </form>`;
};

S.bilan = () => {
  const a = analyse(); const n = data.policies.length; const pr = data.profile;
  const q = (k, label, val) => `<div class="q"><span>${label}</span><div class="seg" role="group" aria-label="${esc(label)}">
      <button data-act="setProf" data-k="${k}" data-v="1" aria-pressed="${val===true}">Oui</button>
      <button data-act="setProf" data-k="${k}" data-v="0" aria-pressed="${val===false}">Non</button></div></div>`;
  const sevC = {high:'var(--sev-high)', med:'var(--sev-med)', low:'var(--sev-low)'};
  const sevL = {high:'Risque élevé', med:'Risque moyen', low:'Risque faible'};
  const findings = a.items.map(it => {
    const c = it.k==='dup' ? 'var(--dup)' : sevC[it.sev];
    const firstOf = data.policies.find(p => p.risk === it.risk);
    const actions = it.k==='gap'
      ? `<div class="grid2"><button class="btn btn-primary btn-sm" style="width:100%" data-act="compare" data-topic="${esc(it.topic)}">Comparer</button><button class="btn btn-secondary btn-sm" style="width:100%" data-act="goAdd" data-r="${it.risk}">Je l’ai déjà</button></div>`
      : (firstOf ? `<button class="btn btn-secondary btn-sm" style="width:100%" data-act="openPolicy" data-id="${firstOf.id}">Voir la police</button>` : '');
    return `<article class="finding" style="--c:${c}"><div class="bar"></div><div class="in">
      <div class="chips" style="gap:6px"><span class="sev" style="--c:${sevC[it.sev]}">${sevL[it.sev]}</span><span class="pill ${it.k==='gap'?'warn':'dup'}">${it.k==='gap'?'Lacune':'À vérifier'}</span></div>
      <h3>${esc(it.t)}</h3><p class="small" style="color:var(--ink-2);font-size:14px">${esc(it.p)}</p>
      ${it.ref ? `<span class="ref">${esc(it.ref)}</span>` : ''}${actions}</div></article>`;
  }).join('');
  const covered = a.covered.length ? `<div class="list">${a.covered.map(c => `
      <div class="row" style="min-height:52px"><span style="color:var(--ok)">${svg('check',18,2.2)}</span>
        <span class="row-main"><span>${esc(c.r.label)}</span><span class="row-sub">${esc(c.list.map(p => p.insurer || 'Assureur à compléter').join(', '))}</span></span></div>`).join('')}</div>`
    : `<p class="small" style="color:var(--muted)">Aucune police enregistrée pour l’instant.</p>`;
  return `
    <div class="col g4"><h1>Bilan du portefeuille</h1><span class="note">Analyse du ${fmt(Date.now())} · ${plural(n,'police','polices')}</span></div>
    ${a.pending ? `<div class="banner">${svg('clock',18,2)}<span>${plural(a.pending,'police n’a','polices n’ont')} pas encore de document. Le bilan détaillé, article par article, se fera à réception.</span></div>` : ''}
    <div class="tiles">
      <div class="tile"><b style="color:var(--ok)">${a.covered.length}</b><span>Couverts</span></div>
      <div class="tile"><b style="color:var(--warn)">${a.gaps}</b><span>Lacunes</span></div>
      <div class="tile"><b style="color:var(--dup)">${a.dups}</b><span>À vérifier</span></div>
    </div>
    <section class="card" style="gap:4px">
      <div class="col g4"><h2 class="sm">Votre situation</h2>${a.unanswered ? `<span class="note">Répondez pour un bilan plus précis.</span>` : ''}</div>
      ${q('owner','Êtes-vous propriétaire de votre logement ?', pr.owner)}
      ${q('vehicle','Avez-vous un véhicule à moteur ?', a.vehicle)}
      ${q('employed','Travaillez-vous au moins 8 h par semaine chez un employeur ?', pr.employed)}
    </section>
    <h2>À traiter, par ordre de risque</h2>
    ${findings || `<div class="banner">${svg('check',18,2)}<span>Rien à signaler avec les informations actuelles.</span></div>`}
    <h2>Bien couvert</h2>
    ${covered}
    <p class="note">Ce bilan se base sur les polices enregistrées et vos réponses. Il ne remplace pas le conseil d’un courtier.</p>`;
};

S.compare = () => {
  const topic = ui.params.topic || 'Assurance';
  const mine = data.requests.slice().reverse();
  return `
    <button class="back" data-act="back">${svg('back',18,2)}Bilan</button>
    <div class="col g8"><h1>Comparatif</h1><p class="lede">${esc(topic)}</p></div>
    ${ui.params.sent ? `
      <div class="card"><span class="ico ok">${svg('check',20,2.2)}</span><h2 class="sm">Demande enregistrée</h2>
        <p class="small" style="color:var(--ink-2)">Un courtier préparera des offres pour ce risque.</p>
        <p class="note">Version de test : la demande reste sur ce téléphone.</p>
        <button class="btn btn-secondary" data-act="tab" data-s="bilan">Retour au bilan</button></div>`
    : `
      <div class="banner">${svg('info',18,2)}<span>Le comparateur en ligne arrive dans une prochaine version. En attendant, demandez un comparatif : un courtier vous répond avec des offres.</span></div>
      <form class="card" data-submit="compare" novalidate>
        <div class="field"><label for="cp-note">Précisions (facultatif)</label><textarea id="cp-note" name="note" class="input" placeholder="Ex. somme d’assurance souhaitée, franchise, budget"></textarea></div>
        <button class="btn btn-primary" type="submit">Demander un comparatif</button>
      </form>`}
    ${mine.length ? `<h2>Vos demandes</h2><div class="list">${mine.map(r => `
      <div class="row" style="min-height:52px"><span class="row-main"><span class="row-title">${esc(r.topic)}</span><span class="row-sub">${esc(r.note || 'Sans précision')}</span></span><span class="note">${fmt(r.at)}</span></div>`).join('')}</div>` : ''}`;
};

S.profil = () => {
  const ps = data.policies; const rec = ps.filter(p => statusOf(p)==='received').length;
  return `
    <h1>Profil</h1>
    <div class="card"><div style="display:flex;gap:12px;align-items:center"><span class="avatar">${esc((data.user?.first||'?').charAt(0).toUpperCase())}</span>
      <div class="col" style="min-width:0"><strong>${esc(data.user?.first)}</strong><span class="note" style="overflow-wrap:anywhere">${esc(data.user?.email)}</span></div></div></div>
    <div class="list">
      <div class="row" style="min-height:48px"><span class="row-main">Polices</span><strong>${ps.length}</strong></div>
      <div class="row" style="min-height:48px"><span class="row-main">Documents reçus</span><strong>${rec}</strong></div>
      <div class="row" style="min-height:48px"><span class="row-main">Sinistres déclarés</span><strong>${data.claims.length}</strong></div>
      <div class="row" style="min-height:48px"><span class="row-main">Demandes de comparatif</span><strong>${data.requests.length}</strong></div>
    </div>
    <section class="card" style="gap:10px">
      <div style="display:flex;gap:12px;align-items:center">${window.UCMark ? UCMark(32) : ''}<h2 class="sm">Intro au démarrage</h2></div>
      <label class="check"><input type="checkbox" data-setting="intro"${data.settings.intro ? ' checked' : ''}><span>Jouer l’intro à l’ouverture de l’app</span></label>
      <label class="check"><input type="checkbox" data-setting="introSound"${data.settings.introSound ? ' checked' : ''}><span>Avec le son (souffle et cadenas)</span></label>
      <p class="note">À l’ouverture, le navigateur ne laisse souvent pas jouer le son. Il joue toujours avec « Revoir l’intro ».</p>
      <button class="btn btn-secondary" data-act="replayIntro">Revoir l’intro</button>
    </section>
    <div class="banner">${svg('info',18,2)}<span>Version de test : votre compte, vos polices et vos documents restent sur ce téléphone, dans ce navigateur. Rien n’est envoyé.</span></div>
    <button class="btn btn-secondary" data-act="logout">Se déconnecter</button>
    ${ui.confirmErase ? `
      <div class="card danger"><strong>Effacer toutes les données ?</strong><p class="small">Compte, polices, documents et demandes de ce téléphone seront supprimés. Impossible d’annuler.</p>
        <div class="grid2"><button class="btn btn-secondary" data-act="cancelErase">Annuler</button><button class="btn btn-danger" data-act="erase">Effacer</button></div></div>`
      : `<button class="btn btn-ghost danger" data-act="askErase">${svg('trash',18)}Effacer toutes mes données</button>`}`;
};

/* ---------- Sinistres ---------- */
const EVENTS = {
  menage:['Vol par effraction','Vol simple (hors du domicile)','Dégât d’eau','Incendie','Bris de glace','Dommage causé à un tiers (RC)','Dommages naturels (grêle, tempête)','Autre'],
  vehicule:['Collision','Stationnement / dommage de parking','Vol','Bris de glace','Grêle','Dommage causé à un tiers (RC)','Autre'],
  maladie:['Maladie','Accident','Autre'],
  batiment:['Dégât d’eau','Incendie','Dommages naturels (grêle, tempête)','Bris de glace','Autre'],
  pj:['Litige avec un employeur','Litige avec un bailleur','Litige après un accident de la route','Litige de consommation','Autre'],
  vie:['Décès','Incapacité de gain','Autre'],
  voyage:['Annulation de voyage','Bagages perdus ou volés','Frais médicaux à l’étranger','Rapatriement','Autre'],
  autre:['Autre']
};
const CLAIM_ST = {draft:{l:'Brouillon',c:'warn'}, sent:{l:'Envoyé',c:'req'}, received:{l:'Chez l’assureur',c:'req'}, review:{l:'En examen',c:'req'}, closed:{l:'Clos',c:'ok'}};
const CLAIM_NEXT = {sent:['received','Transmis à l’assureur par votre courtier'], received:['review','En cours d’examen par l’assureur'], review:['closed','Sinistre clos : décision de l’assureur reçue']};
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; };
const fmtISO = s => s ? s.split('-').reverse().join('.') : '—';
const hhmm = t => { const d = new Date(t); return `${z(d.getHours())}:${z(d.getMinutes())}`; };
const chf = v => { const n = parseFloat(String(v).replace(/[^\d.,]/g,'').replace(',','.')); return isNaN(n) ? String(v) : 'CHF ' + Math.round(n).toLocaleString('fr-CH').replace(/ |\s/g,"'"); };
const policyLabel = p => `${R(p.risk).label}${p.insurer ? ' · ' + p.insurer : ''}`;
const curClaim = () => data.claims.find(x => x.id === ui.params.id);

function newClaimDraft(policyId){
  return { id:uid(), policyId: policyId || (data.policies.length === 1 ? data.policies[0].id : null), type:'', date:todayISO(), place:'', amount:'', desc:'', files:[] };
}
function claimFromForm(){
  const f = ui.claim; const now = Date.now();
  let c = data.claims.find(x => x.id === f.id);
  if(!c){ c = {id:f.id, createdAt:now, status:'draft', history:[{at:now, label:'Déclaration commencée'}]}; data.claims.push(c); }
  Object.assign(c, {policyId:f.policyId, type:f.type, date:f.date, place:f.place.trim(), amount:f.amount.trim(), desc:f.desc.trim(), files:f.files.slice()});
  return c;
}
function validateClaim(f, forSend){
  const e = [];
  if(!f.policyId) e.push('Choisissez la police concernée.');
  if(!f.type) e.push('Choisissez le risque concerné.');
  if(!f.date) e.push('Indiquez la date du sinistre.');
  else if(f.date > todayISO()) e.push('La date ne peut pas être dans le futur.');
  if(forSend && f.desc.trim().length < 10) e.push('Décrivez ce qui s’est passé en quelques phrases.');
  return e;
}
/* Analyse préalable par règles simples, en attendant qu'Alfred lise vraiment les polices */
function preAnalysis(c){
  const p = data.policies.find(x => x.id === c.policyId);
  const t = (c.type || '').toLowerCase(); const need = []; const tips = []; const out = [];
  const days = Math.max(0, Math.round((Date.parse(todayISO()) - Date.parse(c.date)) / 864e5));
  out.push(`Analyse préalable · ${c.type}, ${fmtISO(c.date)}`, '');
  if(!p) out.push('• La police liée à ce sinistre a été supprimée : choisissez-en une autre.');
  else if(statusOf(p) !== 'received') out.push(`• Je n’ai pas encore le document de votre police « ${R(p.risk).label} » : je ne peux pas vérifier la couverture. Importez-la ou demandez-la depuis Mes polices.`);
  else out.push(`• Police « ${R(p.risk).label} »${p.insurer ? ' chez ' + p.insurer : ''} : document reçu. La vérification article par article arrivera dans la prochaine version.`);
  out.push(days > 30
    ? `• Le sinistre date de ${days} jours : annoncez-le sans attendre. La loi demande d’aviser l’assureur dès que vous en avez connaissance (LCA art. 38).`
    : '• Annoncez-le rapidement : la loi demande d’aviser l’assureur dès que vous en avez connaissance (LCA art. 38).');
  if(t.includes('vol')){ need.push('le récépissé de votre plainte à la police', 'la liste des objets avec factures ou photos'); if(t.includes('simple')) tips.push('Le vol simple hors du domicile n’est couvert que si l’option figure dans votre police.'); }
  if(t.includes('eau')){ need.push('des photos des dégâts', 'le devis ou la facture de réparation'); tips.push('Si vous êtes locataire, prévenez aussi votre régie.'); }
  if(t.includes('incendie')) need.push('des photos', 'le rapport des pompiers s’ils sont intervenus');
  if(t.includes('bris')){ need.push('des photos', 'le devis de remplacement'); tips.push('Le bris de glaces est souvent une option : vérifiez qu’elle est incluse.'); }
  if(t.includes('tiers')){ need.push('les coordonnées de la personne lésée', 'des photos du dommage'); tips.push('Ne reconnaissez pas votre responsabilité et ne promettez pas de payer avant l’accord de l’assureur.'); }
  if(t.includes('naturels') || t.includes('grêle')) need.push('des photos datées', 'le lieu exact');
  if(t.includes('collision') || t.includes('stationnement')){ need.push('le constat européen d’accident signé par les deux conducteurs', 'des photos des véhicules'); tips.push('En cas de blessés, la police doit être appelée.'); }
  if(t === 'accident'){ need.push('les factures médicales'); if(data.profile.employed) tips.push('Vous travaillez au moins 8 h par semaine : l’accident se déclare d’abord à votre employeur, qui l’annonce à son assureur accidents.'); }
  if(t === 'maladie') need.push('les factures médicales et les ordonnances');
  if(p && p.risk === 'pj') tips.push('Annoncez le litige avant de mandater un avocat : l’assureur doit en général donner son accord.');
  if(t.includes('annulation')) need.push('la confirmation de réservation', 'le certificat médical ou la preuve de l’empêchement', 'la facture des frais d’annulation');
  if(t.includes('bagages')) need.push('l’attestation de perte de la compagnie de transport');
  if(t.includes('étranger') || t.includes('rapatriement')) need.push('les factures médicales de l’étranger');
  if(!need.length) need.push('des photos ou des documents qui montrent ce qui s’est passé');
  out.push(`• À joindre : ${[...new Set(need)].join(', ')}.`);
  tips.forEach(x => out.push('• ' + x));
  if(!c.files.length) out.push('• Aucun justificatif pour l’instant : ajoutez au moins une photo ou un document.');
  else out.push(`• ${plural(c.files.length, 'justificatif joint', 'justificatifs joints')}.`);
  if(c.amount) out.push(`• Montant estimé : ${chf(c.amount)}. S’il est proche de votre franchise, la déclaration n’est peut-être pas utile : votre courtier peut vous le dire.`);
  if((c.desc || '').length < 40) out.push('• Décrivez plus précisément les circonstances : où, quand, comment.');
  out.push('', 'Analyse automatique de la version de test, à confirmer par votre courtier.');
  return out.join('\n');
}
const thumbsHTML = (files, editable) => `<div class="thumbs">${files.map(x => `
  <div class="thumb" data-key="${esc(x.key)}" data-type="${esc(x.type)}"><span class="thumb-name">${esc(x.name)}</span>${editable ? `<button class="thumb-del" data-act="delClaimFile" data-key="${esc(x.key)}" aria-label="Retirer ${esc(x.name)}">${svg('trash',16)}</button>` : ''}</div>`).join('')}</div>`;

S.claims = () => {
  const list = data.claims.slice().sort((a,b) => (b.date||'').localeCompare(a.date||'') || b.createdAt - a.createdAt);
  const open = list.filter(c => c.status !== 'closed'), done = list.filter(c => c.status === 'closed');
  const row = c => { const p = data.policies.find(x => x.id === c.policyId); const st = CLAIM_ST[c.status]; return `
    <button class="row" data-act="openClaim" data-id="${c.id}">
      <span class="ico ${c.status==='draft'?'warn':''}">${svg(R(p ? p.risk : 'autre').icon)}</span>
      <span class="row-main"><span class="row-title">${esc(c.type || 'Sinistre')}</span><span class="row-sub">${esc(fmtISO(c.date))} · ${esc(p ? policyLabel(p) : 'Police supprimée')}</span></span>
      <span class="pill ${st.c}">${st.l}</span>
    </button>`; };
  return `
    <div class="head-row">
      <div><div class="muted">Suivi et historique</div><h1>Sinistres</h1></div>
      <button class="icon-btn primary" data-act="newClaim" aria-label="Annoncer un sinistre">${svg('plus',20,2.2)}</button>
    </div>
    ${list.length ? '' : `<div class="card"><h2 class="sm">Aucun sinistre</h2><p class="small" style="color:var(--ink-2)">Vol, dégât d’eau, accident : annoncez-le ici. Alfred vous dit quoi joindre, puis la déclaration part chez votre courtier.</p><button class="btn btn-primary" data-act="newClaim">${svg('alert',18)}Annoncer un sinistre</button></div>`}
    ${open.length ? `<h2>En cours</h2><div class="list">${open.map(row).join('')}</div>` : ''}
    ${done.length ? `<h2>Historique</h2><div class="list">${done.map(row).join('')}</div>` : ''}`;
};

S.claimNew = () => {
  const f = ui.claim || (ui.claim = newClaimDraft());
  const ps = sorted();
  if(!ps.length) return `
    <button class="back" data-act="back">${svg('back',18,2)}Sinistres</button>
    <h1>Annoncer un sinistre</h1>
    <div class="card"><h2 class="sm">Ajoutez d’abord une police</h2><p class="small" style="color:var(--ink-2)">Un sinistre se déclare sur une de vos polices. Ajoutez celle qui est concernée, même sans le document.</p>
      <button class="btn btn-primary" data-act="goAdd">${svg('plus',18,2.2)}Ajouter une police</button></div>`;
  const pol = data.policies.find(x => x.id === f.policyId);
  const types = pol ? (EVENTS[pol.risk] || EVENTS.autre) : [];
  const err = ui.claimErrors && ui.claimErrors.length ? `<div class="banner warn" role="alert">${svg('info',18,2)}<span>${ui.claimErrors.map(esc).join('<br>')}</span></div>` : '';
  const editing = data.claims.some(c => c.id === f.id);
  return `
    <button class="back" data-act="back">${svg('back',18,2)}${editing ? 'Retour' : 'Sinistres'}</button>
    <div class="col g8"><h1>${editing ? 'Compléter la déclaration' : 'Annoncer un sinistre'}</h1><p class="lede">Les informations de base suffisent. Alfred vous dit ensuite ce qu’il faut joindre.</p></div>
    <section class="col g8"><span class="label">1. Police concernée</span>
      <div class="list" role="radiogroup" aria-label="Police concernée">${ps.map(p => `
        <button class="row" role="radio" aria-checked="${f.policyId===p.id}" data-act="pickClaimPolicy" data-id="${p.id}">
          <span class="ico">${svg(R(p.risk).icon)}</span>
          <span class="row-main"><span class="row-title">${esc(R(p.risk).label)}</span><span class="row-sub">${esc(subOf(p))}</span></span>
          <span class="radio" aria-hidden="true"></span>
        </button>`).join('')}</div>
    </section>
    <section class="card"><span class="label">2. Ce qui s’est passé</span>
      <div class="field"><label for="cl-type">Risque concerné</label>
        <select id="cl-type" class="input" data-bind="claim.type"${pol ? '' : ' disabled'}><option value="">${pol ? 'Choisir…' : 'Choisissez d’abord la police'}</option>${types.map(t => `<option${t===f.type?' selected':''}>${esc(t)}</option>`).join('')}</select></div>
      <div class="grid2">
        <div class="field"><label for="cl-date">Date du sinistre</label><input id="cl-date" type="date" class="input" max="${todayISO()}" value="${esc(f.date)}" data-bind="claim.date"></div>
        <div class="field"><label for="cl-amount">Montant estimé (CHF)</label><input id="cl-amount" class="input" inputmode="decimal" placeholder="Facultatif" value="${esc(f.amount)}" data-bind="claim.amount" autocomplete="off"></div>
      </div>
      <div class="field"><label for="cl-place">Lieu</label><input id="cl-place" class="input" placeholder="Ex. Gare de Morges" value="${esc(f.place)}" data-bind="claim.place" autocomplete="off"></div>
      <div class="field"><label for="cl-desc">Description des événements</label><textarea id="cl-desc" class="input" rows="5" placeholder="Que s’est-il passé ? Où, quand, comment, qui était présent ?" data-bind="claim.desc">${esc(f.desc)}</textarea></div>
    </section>
    <section class="card"><span class="label">3. Photos et justificatifs</span>
      ${f.files.length ? thumbsHTML(f.files, true) : `<p class="small" style="color:var(--muted)">Photos des dégâts, factures, plainte, constat…</p>`}
      <div class="btns" style="justify-content:flex-start">
        <label class="btn btn-secondary btn-sm file-label"><input type="file" class="sr" accept="application/pdf,image/*" multiple data-file="claim">Ajouter des fichiers</label>
        <label class="btn btn-secondary btn-sm file-label"><input type="file" class="sr" accept="image/*" capture="environment" data-file="claim">Prendre une photo</label>
      </div>
    </section>
    ${err}
    <div class="col g10">
      <button class="btn btn-dark" data-act="claimAnalyse">${svg('chat',18,2)}Analyse préalable avec Alfred</button>
      <button class="btn btn-primary btn-lg" data-act="claimSend">Envoyer la déclaration</button>
      <button class="btn btn-ghost" data-act="claimDraft">Enregistrer comme brouillon</button>
    </div>
    <p class="note" style="text-align:center">Version de test : la déclaration reste sur ce téléphone, rien n’est envoyé.</p>`;
};

S.claim = () => {
  const c = curClaim();
  if(!c) return `<button class="back" data-act="back">${svg('back',18,2)}Sinistres</button><p>Ce sinistre n’existe plus.</p>`;
  const p = data.policies.find(x => x.id === c.policyId); const st = CLAIM_ST[c.status];
  const actions = c.status === 'draft' ? `
      <button class="btn btn-primary btn-lg" data-act="editClaim">Compléter et envoyer</button>
      <button class="btn btn-dark" data-act="claimAnalyseSaved">${svg('chat',18,2)}Analyse préalable avec Alfred</button>`
    : `
      <button class="btn btn-dark" data-act="claimAnalyseSaved">${svg('chat',18,2)}${c.status === 'closed' ? 'Revoir l’analyse avec Alfred' : 'Demander à Alfred'}</button>
      ${CLAIM_NEXT[c.status] ? `<button class="btn btn-secondary" data-act="claimAdvance">Simuler l’étape suivante</button>` : ''}`;
  return `
    <button class="back" data-act="back">${svg('back',18,2)}Sinistres</button>
    <div class="head-row"><div class="col g4"><span class="muted">${esc(p ? policyLabel(p) : 'Police supprimée')}</span><h1>${esc(c.type || 'Sinistre')}</h1></div><span class="pill ${st.c}">${st.l}</span></div>
    <div class="card" style="padding-block:6px"><dl class="kv">
      <div><dt>Date du sinistre</dt><dd>${fmtISO(c.date)}</dd></div>
      ${c.place ? `<div><dt>Lieu</dt><dd>${esc(c.place)}</dd></div>` : ''}
      ${c.amount ? `<div><dt>Montant estimé</dt><dd>${esc(chf(c.amount))}</dd></div>` : ''}
      <div><dt>Justificatifs</dt><dd>${c.files.length}</dd></div>
    </dl></div>
    <section class="card"><h2 class="sm">Description</h2><p style="white-space:pre-line;color:var(--ink-2);font-size:14px;overflow-wrap:anywhere">${esc(c.desc || '—')}</p></section>
    ${c.files.length ? `<section class="card"><h2 class="sm">Photos et justificatifs</h2>${thumbsHTML(c.files, false)}</section>` : ''}
    <section class="card"><h2 class="sm">Suivi</h2>
      <ol class="track-list">${c.history.slice().reverse().map((h,i) => `<li class="${i===0?'now':''}"><span class="dot" aria-hidden="true"></span><span class="col"><span>${esc(h.label)}</span><span class="note">${fmt(h.at)} à ${hhmm(h.at)}</span></span></li>`).join('')}</ol>
    </section>
    <div class="col g10">${actions}</div>
    ${c.status !== 'draft' ? `<p class="note">Version de test : la déclaration n’est pas réellement envoyée. « Simuler l’étape suivante » montre le suivi tel qu’il apparaîtra.</p>` : ''}
    ${c.status === 'draft' ? (ui.confirmDel ? `
      <div class="card danger"><strong>Supprimer ce brouillon ?</strong><p class="small">La déclaration et ses justificatifs seront effacés de ce téléphone.</p>
        <div class="grid2"><button class="btn btn-secondary" data-act="cancelDel">Annuler</button><button class="btn btn-danger" data-act="doDelClaim">Supprimer</button></div></div>`
      : `<button class="btn btn-ghost danger" data-act="askDel">${svg('trash',18)}Supprimer le brouillon</button>`) : ''}`;
};
async function loadThumbs(){
  for(const el of document.querySelectorAll('.thumb[data-key]')){
    if(!String(el.dataset.type).startsWith('image/')) continue;
    try { const blob = await getFile(el.dataset.key); if(blob && el.isConnected){ const img = new Image(); img.alt = ''; img.src = URL.createObjectURL(blob); el.prepend(img); } } catch(e){}
  }
}
async function handleClaimFiles(input){
  const files = [...(input.files || [])]; let added = 0;
  for(const file of files){
    if(file.size > 15e6){ toast(`${file.name} dépasse 15 Mo.`); continue; }
    const key = `${ui.claim.id}:${uid()}`;
    try { await putFile(key, file); } catch(e){ toast('Un fichier n’a pas pu être enregistré sur ce téléphone.'); continue; }
    ui.claim.files.push({key, name:file.name || 'Photo', type:file.type, size:file.size}); added++;
  }
  render(); if(added) toast(plural(added, 'fichier ajouté', 'fichiers ajoutés'));
}
function sendToAlfred(c){
  c.history.push({at:Date.now(), label:'Analyse préalable demandée à Alfred'});
  data.chat.push({who:'me', text:`Analyse préalable de mon sinistre : ${c.type}, ${fmtISO(c.date)}.`});
  data.chat.push({who:'bot', text:preAnalysis(c), act:'claim', id:c.id});
  save(); tab('assistant');
}

const TABS = [['home','Polices','doc'],['claims','Sinistres','alert'],['assistant','Assistant','chat'],['bilan','Bilan','shield'],['profil','Profil','user']];
const TAB_OF = {home:'home', add:'home', policy:'home', claims:'claims', claimNew:'claims', claim:'claims', assistant:'assistant', bilan:'bilan', compare:'bilan', profil:'profil'};
function render(){
  const s = ui.screen; const t = TAB_OF[s];
  document.getElementById('app').innerHTML = `<main class="screen${t?'':' no-tabs'}">${S[s]()}</main>` + (t ? `
    <nav class="tabbar" aria-label="Navigation principale"><div class="tabbar-in">${TABS.map(([id,l,ic]) =>
      `<button class="tab" data-act="tab" data-s="${id}"${t===id?' aria-current="page"':''}>${svg(ic,22)}${l}</button>`).join('')}</div></nav>` : '');
  if(s === 'policy') loadPreview();
  if(s === 'claimNew' || s === 'claim') loadThumbs();
  if(s === 'assistant' && data.chat.length) window.scrollTo(0, document.body.scrollHeight);
}
async function loadPreview(){
  const p = data.policies.find(x => x.id === ui.params.id);
  if(!p || !p.file || !String(p.file.type).startsWith('image/')) return;
  try { const blob = await getFile(p.id); const pv = document.getElementById('pv'); if(blob && pv){ const img = new Image(); img.alt = 'Aperçu du document'; img.src = URL.createObjectURL(blob); pv.replaceChildren(img); } } catch(e){}
}

/* ---------- Actions ---------- */
const A = {
  goAuth: el => { ui.authError = null; ui.authVals = null; go('auth', {mode: el.dataset.mode}); },
  authMode: el => { ui.params = {mode: el.dataset.mode}; ui.authError = null; render(); },
  back: () => back(),
  sso: () => toast('Disponible dans la version finale. Utilisez votre e-mail pour tester.'),
  askReset: () => { ui.confirmReset = true; render(); },
  cancelReset: () => { ui.confirmReset = false; render(); },
  doReset: async () => { await eraseAll(); ui.stack = [{screen:'welcome', params:{}}]; go('auth', {mode:'create'}, false); },
  skipOnb: () => { data.onboarded = true; save(); tab('home'); },
  addRow: () => { const used = ui.draft.map(d => d.risk); ui.draft.push({risk:(RISKS.find(r => !used.includes(r.id)) || R('autre')).id, insurer:'', number:''}); render(); document.getElementById('ob-a'+(ui.draft.length-1))?.focus(); },
  quickRow: el => { ui.draft.push({risk:el.dataset.r, insurer:'', number:''}); render(); document.getElementById('ob-a'+(ui.draft.length-1))?.focus(); },
  delRow: el => { ui.draft.splice(+el.dataset.i, 1); render(); },
  finishOnb: () => {
    const rows = ui.draft.filter(r => r.insurer.trim() || r.number.trim());
    rows.forEach(r => data.policies.push(newPolicy({...r, mandate:ui.draftMandate})));
    data.onboarded = true; save(); ui.draft = null; tab('home');
    if(rows.length) toast(`${plural(rows.length,'police ajoutée','polices ajoutées')}`);
  },
  tab: el => tab(el.dataset.s),
  goAdd: el => { ui.add = {risk: el.dataset.r || null, insurer:'', number:'', mandate:false}; ui.addError = null; go('add'); },
  pickRisk: el => { ui.add.risk = el.dataset.r; ui.addError = null; render(); },
  openPolicy: el => { ui.policyError = null; go('policy', {id: el.dataset.id}); },
  simulate: () => { const p = cur(); p.receivedAt = Date.now(); p.simulated = true; save(); render(); toast('Réception simulée'); },
  removeFile: async () => { const p = cur(); await delFile(p.id); p.file = null; if(!p.simulated) p.receivedAt = null; save(); render(); toast('Document retiré'); },
  askDel: () => { ui.confirmDel = true; render(); },
  cancelDel: () => { ui.confirmDel = false; render(); },
  doDel: async () => { const p = cur(); await delFile(p.id); data.policies = data.policies.filter(x => x.id !== p.id); save(); tab('home'); toast('Police supprimée'); },
  setProf: el => { data.profile[el.dataset.k] = el.dataset.v === '1'; save(); render(); },
  compare: el => go('compare', {topic: el.dataset.topic}),
  attach: () => toast('L’envoi de documents à Alfred arrive avec l’assistant.'),
  sugg: el => sendChat(el.dataset.q),
  logout: () => { data.session = false; save(); ui.stack = []; ui.authVals = null; ui.authError = null; go('auth', {mode:'login'}, false); },
  askErase: () => { ui.confirmErase = true; render(); },
  cancelErase: () => { ui.confirmErase = false; render(); },
  erase: async () => { await eraseAll(); ui.stack = []; go('welcome', {}, false); toast('Données effacées'); },
  replayIntro: () => { if(window.UCIntro) UCIntro.start({ sound: data.settings.introSound, fromTap: true }); },
  newClaim: el => { ui.claim = newClaimDraft(el.dataset.policy); ui.claimErrors = null; go('claimNew'); },
  pickClaimPolicy: el => {
    ui.claim.policyId = el.dataset.id; const p = data.policies.find(x => x.id === el.dataset.id);
    if(!(EVENTS[p.risk] || EVENTS.autre).includes(ui.claim.type)) ui.claim.type = '';
    ui.claimErrors = null; render();
  },
  delClaimFile: async el => { await delFile(el.dataset.key); ui.claim.files = ui.claim.files.filter(x => x.key !== el.dataset.key); render(); },
  claimDraft: () => {
    if(!ui.claim.policyId){ ui.claimErrors = ['Choisissez la police concernée.']; render(); return; }
    const c = claimFromForm(); save(); ui.claimErrors = null;
    ui.stack = [{screen:'claims', params:{}}]; go('claim', {id:c.id}, false); toast('Brouillon enregistré');
  },
  claimAnalyse: () => {
    const e = validateClaim(ui.claim, false); if(e.length){ ui.claimErrors = e; render(); return; }
    ui.claimErrors = null; sendToAlfred(claimFromForm());
  },
  claimSend: () => {
    const e = validateClaim(ui.claim, true); if(e.length){ ui.claimErrors = e; render(); return; }
    const c = claimFromForm(); c.status = 'sent'; c.sentAt = Date.now();
    c.history.push({at:Date.now(), label:'Déclaration envoyée à votre courtier'}); save(); ui.claimErrors = null;
    ui.stack = [{screen:'claims', params:{}}]; go('claim', {id:c.id}, false); toast('Déclaration envoyée');
  },
  openClaim: el => go('claim', {id: el.dataset.id}),
  editClaim: () => { const c = curClaim(); ui.claim = {id:c.id, policyId:c.policyId, type:c.type, date:c.date, place:c.place, amount:c.amount, desc:c.desc, files:c.files.slice()}; ui.claimErrors = null; go('claimNew'); },
  claimAnalyseSaved: () => sendToAlfred(curClaim()),
  claimAdvance: () => { const c = curClaim(); const n = CLAIM_NEXT[c.status]; if(!n) return; c.status = n[0]; c.history.push({at:Date.now(), label:n[1]}); save(); render(); toast(CLAIM_ST[c.status].l); },
  doDelClaim: async () => { const c = curClaim(); for(const f of c.files) await delFile(f.key); data.claims = data.claims.filter(x => x.id !== c.id); save(); tab('claims'); toast('Brouillon supprimé'); }
};
const cur = () => data.policies.find(x => x.id === ui.params.id);
async function eraseAll(){ try { localStorage.removeItem(KEY); } catch(e){} await clearFiles(); data = blank(); }

const SUBMIT = {
  create: async f => {
    const first = f.elements.first.value.trim(), email = f.elements.email.value.trim().toLowerCase(), pwd = f.elements.pwd.value;
    ui.authVals = {first, email};
    let e = null;
    if(data.user) e = 'Un compte existe déjà sur ce téléphone. Connectez-vous, ou recommencez à zéro depuis l’écran de connexion.';
    else if(!first) e = 'Indiquez votre prénom.';
    else if(!/^\S+@\S+\.\S+$/.test(email)) e = 'Cette adresse e-mail ne semble pas valide.';
    else if(pwd.length < 8) e = 'Le mot de passe doit faire au moins 8 caractères.';
    if(e){ ui.authError = e; render(); return; }
    data.user = {first, email, hash: await hash(email+'|'+pwd), createdAt: Date.now()};
    data.session = true; data.onboarded = false; save(); ui.authError = null; ui.authVals = null;
    startOnboard();
  },
  login: async f => {
    const email = f.elements.email.value.trim().toLowerCase(), pwd = f.elements.pwd.value;
    ui.authVals = {email};
    if(!data.user){ ui.authError = 'Aucun compte sur ce téléphone. Créez-en un.'; render(); return; }
    if(email !== data.user.email || await hash(email+'|'+pwd) !== data.user.hash){ ui.authError = 'E-mail ou mot de passe incorrect.'; render(); return; }
    data.session = true; save(); ui.authError = null; ui.authVals = null;
    if(data.onboarded) tab('home'); else startOnboard();
  },
  addRequest: () => {
    const f = ui.add; let e = null;
    if(!f.risk) e = 'Choisissez le risque.';
    else if(!f.insurer.trim()) e = 'Indiquez l’assureur.';
    else if(!f.mandate) e = 'Cochez l’autorisation pour que nous puissions demander les documents.';
    if(e){ ui.addError = e; render(); return; }
    const p = newPolicy(f); data.policies.push(p); save();
    ui.stack = [{screen:'home', params:{}}]; go('policy', {id:p.id}, false); toast('Demande enregistrée');
  },
  requestDocs: f => {
    const p = cur();
    if(!f.elements.mandate.checked){ ui.policyError = 'Cochez l’autorisation pour envoyer la demande.'; render(); return; }
    ui.policyError = null; p.requestedAt = Date.now(); save(); render(); toast('Demande enregistrée');
  },
  savePolicy: f => { const p = cur(); p.insurer = f.elements.insurer.value.trim(); p.number = f.elements.number.value.trim(); save(); render(); toast('Modifications enregistrées'); },
  chat: f => { const q = f.elements.q.value.trim(); if(q) sendChat(q); },
  compare: f => { data.requests.push({id:uid(), topic:ui.params.topic, note:f.elements.note.value.trim(), at:Date.now()}); save(); ui.params = {...ui.params, sent:true}; render(); }
};
function sendChat(q){
  data.chat.push({who:'me', text:q}); save(); render();
  setTimeout(() => {
    data.chat.push(/bilan/i.test(q)
      ? {who:'bot', text:'Votre bilan se calcule à partir de vos polices et de quelques questions. Il est prêt dans l’onglet Bilan.', act:'bilan'}
      : {who:'bot', text:'Merci pour votre question. Dans cette version de test, je ne peux pas encore lire vos polices pour y répondre. Ce sera possible dans la prochaine version.'});
    save(); if(ui.screen === 'assistant') render();
  }, 450);
}
async function handleFile(input){
  if(input.dataset.file === 'claim') return handleClaimFiles(input);
  const file = input.files && input.files[0]; if(!file) return;
  if(file.size > 15e6){ toast('Ce fichier dépasse 15 Mo.'); input.value = ''; return; }
  let p;
  if(input.dataset.file === 'add'){
    if(!ui.add.risk){ ui.addError = 'Choisissez d’abord le risque.'; render(); return; }
    p = newPolicy({risk:ui.add.risk, insurer:ui.add.insurer, number:ui.add.number, mandate:false}); data.policies.push(p);
  } else p = cur();
  p.file = {name:file.name || 'Photo', type:file.type, size:file.size, stored:true};
  try { await putFile(p.id, file); } catch(e){ p.file.stored = false; toast('Le fichier n’a pas pu être enregistré sur ce téléphone.'); }
  p.receivedAt = Date.now(); save();
  if(input.dataset.file === 'add'){ ui.stack = [{screen:'home', params:{}}]; go('policy', {id:p.id}, false); } else render();
  if(p.file.stored) toast('Police importée');
}

document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if(!el) return; const fn = A[el.dataset.act]; if(fn){ e.preventDefault(); fn(el, e); } });
document.addEventListener('submit', e => { e.preventDefault(); const fn = SUBMIT[e.target.dataset.submit]; if(fn) fn(e.target); });
function onField(e){
  const t = e.target;
  if(t.matches('input[type=file][data-file]')){ if(e.type === 'change') handleFile(t); return; }
  if(t.dataset.row != null && ui.draft){ ui.draft[+t.dataset.row][t.dataset.field] = t.value; const b = document.getElementById('onb-go'); if(b) b.textContent = onbLabel(); }
  if(t.dataset.bind){ const path = t.dataset.bind.split('.'); let o = ui; while(path.length > 1) o = o[path.shift()]; o[path[0]] = t.type === 'checkbox' ? t.checked : t.value; }
  if(t.dataset.setting && e.type === 'change'){ data.settings[t.dataset.setting] = t.checked; save(); }
}
document.addEventListener('input', onField);
document.addEventListener('change', onField);

/* ---------- Démarrage ---------- */
if(window.UCIntro){ if(data.settings.intro) UCIntro.start({ sound: data.settings.introSound }); else UCIntro.hide(); }
if(!data.user) go('welcome', {}, false);
else if(!data.session) go('auth', {mode:'login'}, false);
else if(!data.onboarded) startOnboard();
else go('home', {}, false);

/* ---------- Installation hors ligne (PWA) ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
