
  // ---------- Types & Weaknesses (fixed, but you can edit) ----------
  const TYPES = [
  "physical",
  "earth",
  "fire",
  "water",
  "paper",
  "metal",
  "plant",
  "electric",
  "ice",
  "sand",
  "blade",
  "corrosion",
  "neutralizer",
  "insulator",
  "ground",
  "stone",
  "wind",
  "glass",
  "acid",
  "salt",
  "wood",
  "rope",
  "magnetism",
  "oil",
  "steam",
  "clay",
  "lava",
  "frost",
  "lightning",
  "poison",
  "antidote",
  "shield",
  "absorbent",
  "condense"
];
  const WEAKNESSES = {
  "physical": [
    "paper",
    "metal",
    "acid"
  ],
  "earth": [
    "water",
    "plant",
    "wind"
  ],
  "fire": [
    "water",
    "sand",
    "insulator"
  ],
  "water": [
    "electric",
    "ice",
    "poison"
  ],
  "paper": [
    "metal",
    "fire",
    "blade"
  ],
  "metal": [
    "corrosion",
    "electric",
    "acid"
  ],
  "plant": [
    "fire",
    "blade",
    "poison"
  ],
  "electric": [
    "ground",
    "insulator"
  ],
  "ice": [
    "fire",
    "salt",
    "metal"
  ],
  "sand": [
    "water",
    "plant"
  ],
  "blade": [
    "stone",
    "metal"
  ],
  "corrosion": [
    "neutralizer"
  ],
  "neutralizer": [],
  "insulator": [],
  "ground": [
    "water",
    "plant"
  ],
  "stone": [
    "paper",
    "acid"
  ],
  "wind": [
    "stone",
    "ice"
  ],
  "glass": [
    "stone",
    "metal"
  ],
  "acid": [
    "neutralizer"
  ],
  "salt": [
    "water"
  ],
  "wood": [
    "fire",
    "blade"
  ],
  "rope": [
    "blade",
    "fire"
  ],
  "magnetism": [
    "insulator"
  ],
  "oil": [
    "fire",
    "absorbent"
  ],
  "steam": [
    "insulator",
    "condense"
  ],
  "clay": [
    "blade",
    "plant"
  ],
  "lava": [
    "water",
    "sand"
  ],
  "frost": [
    "fire",
    "salt",
    "metal"
  ],
  "lightning": [
    "insulator",
    "ground"
  ],
  "poison": [
    "antidote"
  ],
  "antidote": [],
  "shield": [
    "acid",
    "corrosion"
  ],
  "absorbent": [
    "fire"
  ],
  "condense": []
};
  // -----------------------------------------------------------------

  // PRNG (deterministic) — mulberry32
  const mulberry32=CraftingCore.mulberry32;
  const randTypes=id=>CraftingCore.randTypes(id,TYPES);
  const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const bounded=(value,min,max,fallback)=>{const n=Number(value);return Number.isSafeInteger(n)?Math.min(max,Math.max(min,n)):fallback;};
  // Calculate type rarity and probability insights
  function getTypeStats(sampleSize = 10000) {
    const counts = {};
    TYPES.forEach(t => counts[t] = 0);
    let total = 0;
    
    // Sample random IDs
    const rng = mulberry32(123456);
    for (let i = 0; i < sampleSize; i++) {
      const id = Math.floor(rng() * 1e9);
      const types = randTypes(id);
      types.forEach(t => counts[t]++);
      total += types.length;
    }

    // Calculate probabilities and rarity tiers
    const stats = {};
    Object.entries(counts).forEach(([type, count]) => {
      const prob = count / sampleSize;
      let rarity = 'common';
      if (prob < 0.02) rarity = 'legendary';
      else if (prob < 0.04) rarity = 'epic';
      else if (prob < 0.07) rarity = 'rare';
      stats[type] = { count, probability: prob, rarity };
    });
    return stats;
  }

  // Cache type stats
  const typeStats = getTypeStats();

  function itemFromId(id) {
    return { id, name: "Item-"+id, types: randTypes(id) };
  }
  function compFromId(id) {
    return { id, name: "Comp-"+id, adds: randTypes(id) };
  }

  function weakTo(types) {
    const out = new Set();
    types.forEach(t => (WEAKNESSES[t]||[]).forEach(w => out.add(w)));
    return [...out];
  }

  // UI state
  // default target: Rock challenge (stone)
  let craftContext={};
  let currentTarget = { id: 'rock', name: 'Rock', types: ['stone'] };
  const selectedComponents = new Set();
  let compPageSeed = 1;

  // Progress & favorites state (persistent)
  const STORAGE_KEY = 'crafting-kit-state-v1';
  let gameState = {
    favorites: new Set(),
    history: [],
    challenges: {
      rock: { progress: 0, wins: 0 },
      elements: { progress: 0, wins: { fire: 0, water: 0, earth: 0, wind: 0 } },
      legendary: { progress: 0, completed: false }
    }
  };

  // Load state from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      gameState=CraftingCore.normalizeState(parsed,TYPES,WEAKNESSES);
    }
  } catch (e) {
    console.warn('Failed to load game state:', e);
  }

  // Save state helper
  function saveState() {
    gameState.progression ??= CraftingProgression.normalize(null,TYPES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...gameState,
        favorites: [...gameState.favorites]
      }));
    } catch (e) {
      console.warn('Failed to save game state:',e);const el=document.getElementById('storageStatus');if(el)el.textContent='Progress could not be saved. Export a backup.';
    }
  }

  // Update challenge progress
  function updateChallenges(crafted) {
    // Rock challenge
    if (currentTarget.types.includes('stone') && crafted.types.some(t => ['paper','acid'].includes(t))) {
      gameState.challenges.rock.wins++;
      gameState.challenges.rock.progress = Math.min(100, gameState.challenges.rock.wins * 20);
    }
    // Elements challenge
    if (currentTarget.types.some(t => ['fire','water','earth','wind'].includes(t))) {
      for(const elem of currentTarget.types.filter(t => ['fire','water','earth','wind'].includes(t))) {
      if (crafted.types.some(t => WEAKNESSES[elem].includes(t))) {
        gameState.challenges.elements.wins[elem] = (gameState.challenges.elements.wins[elem] || 0) + 1;
        gameState.challenges.elements.progress=Object.values(gameState.challenges.elements.wins).filter(n=>n>0).length*25;
      }
    }
    }
    // Legendary challenge
    if (crafted.types.length >= 6) {
      gameState.challenges.legendary.completed = true;
      gameState.challenges.legendary.progress = 100;
    }
    // Update UI
    renderChallenges();
    saveState();
  }
  function renderChallenges(){
    document.querySelectorAll('.challenge').forEach(ch => {
      const id = ch.dataset.id;
      if (gameState.challenges[id]) {
        const prog = gameState.challenges[id].progress;
        ch.querySelector('.progress-bar').style.width = prog + '%';
        ch.classList.toggle('complete',prog>=100);
      }
    });
    saveState();
  }

  // Render history
  function renderHistory() {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '';
    gameState.history.filter(h=>!document.getElementById('favoritesOnly').checked || gameState.favorites.has(h.key)).slice(0,100).forEach(h => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const effectiveTypes = h.types.filter(t => h.target.weak.includes(t));
      div.innerHTML = `
        <div class="row" style="justify-content:space-between">
          <div>
            <strong>vs ${escapeHtml(h.target.name)}</strong>
            ${effectiveTypes.length ? `<span class="badge" style="background:#e6fff7;color:#0a7">Success!</span>` : ''}
          </div>
          <button class="mini-btn fav ${gameState.favorites.has(h.key)?'active':''}" data-key="${escapeHtml(h.key)}">
            ${gameState.favorites.has(h.key)?'★':'☆'} Favorite
          </button>
        </div>
        <div class="small">Components: <span class="mono">${h.ids.join(', ')}</span></div>
        <div class="small">Types: ${h.types.join(', ')}</div>
      `;
      div.querySelector('.fav').onclick = (e) => {
        e.stopPropagation();
        const key = e.target.dataset.key;
        if (gameState.favorites.has(key)) {
          gameState.favorites.delete(key);
          e.target.textContent = '☆ Favorite';
        } else {
          gameState.favorites.add(key);
          e.target.textContent = '★ Favorite';
        }
        e.target.classList.toggle('active');
        saveState();
      };
      // Click to restore this craft
      div.onclick=()=>{
        craftContext={};
        currentTarget={id:h.target.id ?? 'rock',name:h.target.name,types:h.target.types?.length?h.target.types:h.target.name==='Rock'?['stone']:randTypes(Number(h.target.name.replace('Item-','')) || 0)};
        selectedComponents.clear();h.ids.forEach(id=>selectedComponents.add(id));
        renderTarget();renderComponents();clearResult();
        resultDiv.textContent='Recipe restored. Press Craft to try it again.';
      };
      historyDiv.appendChild(div);
    });
  }

  // Dark mode
  const themeSwitcher = document.getElementById('themeSwitcher');
  themeSwitcher.onclick = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeSwitcher.textContent = isDark ? '🌙 Dark mode' : '☀️ Light mode';
    try{localStorage.setItem('theme',isDark?'light':'dark');}catch{}
  };
  // Check saved theme
  let savedTheme;try{savedTheme=localStorage.getItem('theme');}catch{}
  const initialTheme=savedTheme==='light'?'light':savedTheme==='dark'?'dark':window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.body.setAttribute('data-theme',initialTheme);
  themeSwitcher.textContent=initialTheme==='dark'?'☀️ Light mode':'🌙 Dark mode';

  function setTargetByTypes(name, types) {
    craftContext={};
    currentTarget = { id: name.toLowerCase(), name, types };
    selectedComponents.clear();
    renderTarget();
    renderComponents();
    clearResult();
  }

  // Tabs
  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".section").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      document.getElementById(t.dataset.tab).classList.add("active");
      if (t.dataset.tab === "docs") {
        document.getElementById("typesJson").textContent = JSON.stringify(TYPES, null, 2);
        document.getElementById("weakJson").textContent = JSON.stringify(WEAKNESSES, null, 2);
      }
    });
  });

  // Target load
  const targetIdEl = document.getElementById("targetId");
  const loadTargetBtn = document.getElementById("loadTarget");
  const randomTargetBtn = document.getElementById("randomTarget");
  const rockTargetBtn = document.getElementById("rockTarget");
  const targetView = document.getElementById("targetView");
  loadTargetBtn.onclick = () => {
    const id=Number(targetIdEl.value);if(!targetIdEl.value.trim() || !CraftingCore.validId(id)){resultDiv.textContent='Enter a whole-number ID from 0 to '+CraftingCore.MAX_ID+'.';return;}
    craftContext={};currentTarget = itemFromId(id);
    selectedComponents.clear();
    renderTarget();
    renderComponents();
    clearResult();
  };
  randomTargetBtn.onclick = () => {
    const id = Math.floor(Math.random()*1e9);
    targetIdEl.value = id;
    loadTargetBtn.onclick();
  };
  rockTargetBtn.onclick = () => {
    // set a friendly 'Rock' target — type 'stone' — players must craft 'paper' or 'acid'
    setTargetByTypes('Rock', ['stone']);
    targetIdEl.value = '';
  };

  function renderTarget() {
    targetView.innerHTML = `
      <div><strong>${escapeHtml(currentTarget.name)}</strong> (ID <span class="mono">${currentTarget.id}</span>)</div>
      <div class="small">Types: ${currentTarget.types.join(", ")}</div>
      <div class="small">Weak to: ${weakTo(currentTarget.types).join(", ") || "none"}</div>
    `;
  }

  // Components sampling page
  const compsDiv = document.getElementById("components");
  const compSearch = document.getElementById("compSearch");
  const regenPageBtn = document.getElementById("regenPage");
  function renderComponents() {
    document.getElementById('selectedCount').textContent=selectedComponents.size+' / 20 components selected';
    const q = compSearch.value.toLowerCase().trim();
    const batch = 256; // show a page of 256 comps
    const rng = mulberry32(compPageSeed);
    const list = [];
    for (let i=0; i<batch; i++) {
      const id = Math.floor(rng()*1e9) >>> 0;
      list.push(compFromId(id));
    }
    const targetsWeak = weakTo(currentTarget.types);
    compsDiv.innerHTML = "";
    list.forEach(c => {
      // filter
      if (q) {
        const idMatch = (""+c.id).includes(q);
        const typeMatch = c.adds.join(",").toLowerCase().includes(q);
        if (!idMatch && !typeMatch) return;
      }
      const chip = document.createElement("button");chip.type="button";
      chip.className = "chip " + (selectedComponents.has(c.id) ? "selected" : "");
      const effective = c.adds.some(t => targetsWeak.includes(t));
      // Show rarity badges for rare/epic/legendary types
      const rarityBadges = c.adds
        .map(t => typeStats[t])
        .filter(s => s.rarity !== 'common')
        .map(s => `<span class="badge ${s.rarity}">${s.rarity}</span>`)
        .join('');
      chip.innerHTML = `<div style="font-weight:600">${c.name}</div>
                        <div class="small">adds: ${c.adds.join(", ")}</div>
                        <div class="small" style="color:${effective?'#0a7':'#666'}">${effective?'effective vs target':'-'}</div>
                        ${rarityBadges}`;
      chip.onclick = () => {
        if (selectedComponents.has(c.id)) selectedComponents.delete(c.id);
        else if(selectedComponents.size<20)selectedComponents.add(c.id);else resultDiv.textContent='Select at most 20 components per craft.';
        renderComponents();
      };
      compsDiv.appendChild(chip);
    });
  }
  compSearch.addEventListener("input", renderComponents);
  regenPageBtn.onclick = () => { compPageSeed = Math.floor(Math.random()*2**31); renderComponents(); };

  // Craft
  const craftBtn = document.getElementById("craftBtn");
  const clearBtn = document.getElementById("clearBtn");
  const resultDiv = document.getElementById("result");
  craftBtn.onclick = () => {
    if (selectedComponents.size===0) {
      resultDiv.innerHTML = `<div class="crafted">Pick some components first.</div>`;
      return;
    }
    const types = new Set();
    [...selectedComponents].forEach(id => randTypes(id).forEach(t => types.add(t)));
    const crafted = {
      name: "Craft["+[...selectedComponents].slice(0,5).join(",")+ (selectedComponents.size>5?"…":"")+"]",
      types: [...types],
      ids: [...selectedComponents]
    };
    const weaknesses = weakTo(currentTarget.types);
    const effective = crafted.types.filter(t => weaknesses.includes(t));
    const ok = effective.length>0;

    // Add to history
    const historyEntry = {
      ids: crafted.ids,
      types: crafted.types,
      target: { id:currentTarget.id,name:currentTarget.name,types:currentTarget.types,weak:weaknesses },
      success: ok,
      key: crafted.ids.sort((a,b)=>a-b).join(','),
      timestamp: Date.now()
    };
    gameState.history.unshift(historyEntry);
    if(gameState.history.length>200){const index=gameState.history.findLastIndex(h=>!gameState.favorites.has(h.key));if(index>=0)gameState.history.splice(index,1);else gameState.history.pop();}
    saveState();
    renderHistory();

    // Update challenges if successful
    if (ok) updateChallenges(crafted);
    const progression=CraftingProgression.record(gameState.progression,crafted,currentTarget,WEAKNESSES,TYPES,craftContext);
    gameState.progression=progression.state;saveState();renderProgression();
    document.getElementById('rewardStatus').textContent=[progression.xp?`+${progression.xp} XP`:'Recipe already researched',progression.quest?'Expedition stage complete!':'',progression.daily?'Daily challenge complete!':'',...progression.unlocked.map(name=>'Achievement: '+name)].filter(Boolean).join(' · ');

    resultDiv.innerHTML = `
      <div class="crafted ${ok?'success':''}">
        <div><strong>${ok?"SUCCESS":"Nope"}</strong> — crafted types: ${crafted.types.join(", ")}</div>
        <div class="small">Target weak to: ${weaknesses.join(", ")}</div>
        <div class="small">${ok?("Effective types: " + effective.join(", ")):"Try components that add one of the weakness types."}</div>
      </div>
    `;
  };
  clearBtn.onclick = () => { selectedComponents.clear(); renderComponents(); resultDiv.innerHTML=""; };

  function clearResult() { resultDiv.innerHTML=""; }

  // Combos Scanner (Web Worker)
  const scanBtn = document.getElementById("scanBtn");
  const stopBtn = document.getElementById("stopScan");
  const scanStart = document.getElementById("scanStart");
  const scanCount = document.getElementById("scanCount");
  const scanMax = document.getElementById("scanMax");
  const scanStatus = document.getElementById("scanStatus");
  const scanResults = document.getElementById("scanResults");
  let worker = null;
  let poolWorker = null;
  const poolSizeEl = document.getElementById('poolSize');
  const maxCompEl = document.getElementById('maxComp');
  const findBtn = document.getElementById('findBtn');
  const findStatus = document.getElementById('findStatus');
  const findResults = document.getElementById('findResults');

  function startScan() {
    if (worker) worker.terminate();
    worker = new Worker("worker.js");
    scanResults.innerHTML = "";
    const start=bounded(scanStart.value,0,CraftingCore.MAX_ID,0);
    const count=bounded(scanCount.value,1,1000000,100000);
    const maxRes=bounded(scanMax.value,1,1000,200);
    const weaknesses = weakTo(currentTarget.types);
    const sample = !!document.getElementById('sampleMode').checked;
    const spaceSize=bounded(document.getElementById('spaceSize').value,1,CraftingCore.MAX_ID+1,1000000000);
    worker.onerror=()=>{scanStatus.textContent='Scanner failed. Please retry.';worker?.terminate();worker=null;};
    worker.postMessage({ start, count, maxRes, weaknesses, TYPES, sample, spaceSize });
    worker.onmessage = (e) => {
      const msg = e.data;
      if(msg.type==='error'){scanStatus.textContent=msg.text;worker.terminate();worker=null;}else if (msg.type === "status") {
        scanStatus.textContent = msg.text;
      } else if (msg.type === "result") {
        const tr = document.createElement("tr");
        const idx = scanResults.children.length+1;
        tr.innerHTML = `<td>${idx}</td><td class="mono">${msg.id}</td><td>${msg.adds.join(", ")}</td>`;
        scanResults.appendChild(tr);
      } else if (msg.type === "done") {
        scanStatus.textContent = `Done. Checked ${msg.checked} IDs, found ${msg.found} matches.`;worker.terminate();worker=null;
      }
    };
  }
  scanBtn.onclick = startScan;
  stopBtn.onclick=()=>{worker?.terminate();poolWorker?.terminate();worker=null;poolWorker=null;scanStatus.textContent='Stopped.';findStatus.textContent='Stopped.';};

  // Find combos that beat Rock (or current target) using a sampled pool returned by the worker
  findBtn.onclick = () => {
    if (poolWorker) poolWorker.terminate();
    poolWorker = new Worker('worker.js');
    findResults.innerHTML = '';
    findStatus.textContent = 'Sampling pool...';
    const seed = Math.max(0, parseInt(scanStart.value||0));
    const poolSize=bounded(poolSizeEl.value,1,2000,500);
    const space=bounded(document.getElementById('spaceSize').value,1,CraftingCore.MAX_ID+1,1000000000);
    poolWorker.onerror=()=>{findStatus.textContent='Scanner failed. Please retry.';poolWorker?.terminate();poolWorker=null;};
    poolWorker.postMessage({ action: 'samplePool', start: seed, count: poolSize, spaceSize: space, TYPES });
    poolWorker.onmessage = (e) => {
      const msg = e.data;
      if(msg.type==='error'){findStatus.textContent=msg.text;poolWorker.terminate();poolWorker=null;return;}
      if (msg.type === 'status') {
        findStatus.textContent = msg.text;
        return;
      }
      if (msg.type === 'pool') {
        findStatus.textContent = `Pool received (${msg.pool.length}). Searching combos...`;
        // Do combination search client-side (optimized)
        const pool = msg.pool;
        const weaknesses = weakTo(currentTarget.types);
        const maxComp = bounded(maxCompEl.value,1,3,2);
        const maxResults=bounded(document.getElementById('findMax').value,1,200,50);
        const results = [];

        // Build index: which pool entries include any weakness type
        const weaknessCandidates = [];
        for (let i=0;i<pool.length;i++) {
          const p = pool[i];
          if (p.adds.some(t => weaknesses.includes(t))) weaknessCandidates.push(i);
        }

        // Helper to record result with dedupe
        const seen = new Set();
        function pushResult(ids, types) {
          const key = ids.slice().sort((a,b)=>a-b).join(',');
          if (seen.has(key)) return false;
          seen.add(key);
          results.push({ ids: ids.slice(), types });
          return true;
        }

        // 1) singles
        for (const i of weaknessCandidates) {
          if (results.length>=maxResults) break;
          pushResult([pool[i].id], pool[i].adds);
        }

        // 2) pairs: combine each weakness-candidate with any other component (reduces work vs full n^2)
        if (maxComp >= 2 && results.length < maxResults) {
          for (const i of weaknessCandidates) {
            if (results.length>=maxResults) break;
            for (let j=0;j<pool.length && results.length<maxResults;j++) {
              if (j===i) continue;
              const a = pool[i], b = pool[j];
              const u = [...new Set([...a.adds, ...b.adds])];
              if (u.some(t => weaknesses.includes(t))) pushResult([a.id,b.id], u);
            }
          }
        }

        // 3) triples: for each weakness-candidate, pair with any pair of others (still better than blind n^3 if weaknessCandidates is small)
        if (maxComp >= 3 && results.length < maxResults) {
          for (const iw of weaknessCandidates) {
            if (results.length>=maxResults) break;
            for (let j=0;j<pool.length && results.length<maxResults;j++) {
              if (j===iw) continue;
              for (let k=j+1;k<pool.length && results.length<maxResults;k++) {
                if (k===iw) continue;
                const a = pool[iw], b = pool[j], c = pool[k];
                const u = [...new Set([...a.adds, ...b.adds, ...c.adds])];
                if (u.some(t => weaknesses.includes(t))) pushResult([a.id,b.id,c.id], u);
              }
            }
          }
        }

        // render results (clickable: auto-craft)
        results.slice(0, maxResults).forEach((r, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${idx+1}</td><td class="mono">${r.ids.join(', ')}</td><td>${r.types.join(', ')}</td>`;
          tr.style.cursor = 'pointer';
          tr.title = 'Click to auto-craft this combo in Play';
          tr.addEventListener('click', () => {
            // auto-load into Play: set selected components, switch tabs, and craft
            selectedComponents.clear();
            r.ids.forEach(id => selectedComponents.add(id));
            // switch tab to Play
            document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
            document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
            const playTab = document.querySelector('.tab[data-tab="play"]');
            if (playTab) playTab.classList.add('active');
            const playSection = document.getElementById('play');
            if (playSection) playSection.classList.add('active');
            renderComponents();
            // craft immediately
            craftBtn.onclick();
            // add a small status note
            findStatus.textContent = `Auto-crafted combo ${r.ids.join(', ')} in Play.`;
          });
          findResults.appendChild(tr);
        });
        findStatus.textContent = `Done. Found ${results.length} combos (searched pool of ${pool.length}). Click a row to auto-craft.`;
      }
      if (msg.type === 'done') {
        // worker finished
        poolWorker.terminate();
        poolWorker = null;
      }
    };
  };

  // Initialize
  renderTarget();renderComponents();renderHistory();renderChallenges();
  const insights=document.getElementById('typeInsights');
  insights.innerHTML=Object.entries(typeStats).map(([type,stat])=>`<div class="history-item"><strong>${type}</strong><div class="small">${(stat.probability*100).toFixed(1)}% of sampled components</div></div>`).join('');
  document.getElementById('favoritesOnly').onchange=renderHistory;
  document.getElementById('dailyTarget').onclick=()=>{
    const day=new Date().toISOString().slice(0,10);let seed=0;for(const c of day)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
    craftContext={daily:true,day};currentTarget={...itemFromId(seed),name:'Daily Challenge '+day};targetIdEl.value=seed;selectedComponents.clear();renderTarget();renderComponents();clearResult();
  };
  document.getElementById('exportProgress').onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({...gameState,favorites:[...gameState.favorites],version:1},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='crafting-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  document.getElementById('importProgress').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>1000000)throw new Error('Progress file is too large.');gameState=CraftingCore.normalizeState(JSON.parse(await file.text()),TYPES,WEAKNESSES);saveState();renderHistory();renderChallenges();renderProgression();document.getElementById('storageStatus').textContent='Progress imported.';}catch(error){document.getElementById('storageStatus').textContent=error.message;}e.target.value='';
  };

  // Keyboard shortcuts
  window.addEventListener("keydown", (ev) => {
    if(ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.closest("input,textarea,select,[contenteditable]"))return;
    if (ev.key.toLowerCase() === "c") craftBtn.onclick();
    if (ev.key.toLowerCase() === "x") clearBtn.onclick();
    if (ev.key.toLowerCase() === "r") regenPageBtn.onclick();
  });

  function renderProgression(){
    gameState.progression=CraftingProgression.normalize(gameState.progression,TYPES);
    const p=gameState.progression,level=CraftingProgression.progress(p.xp);
    document.getElementById('levelNumber').textContent=level.level;
    document.getElementById('xpText').textContent=`${level.current} / ${level.needed} XP`;
    document.getElementById('xpBar').style.width=level.percent+'%';
    document.getElementById('discoveryCount').textContent=p.discovered.length+' / '+TYPES.length;
    document.getElementById('craftCount').textContent=p.crafts;
    document.getElementById('winRate').textContent=p.crafts?Math.round(p.wins/p.crafts*100)+'%':'—';
    const quests=document.getElementById('expeditionList');quests.replaceChildren();
    for(const [index,quest] of CraftingProgression.QUESTS.entries()){
      const card=document.createElement('article');card.className='quest-card'+(index<p.questIndex?' complete':index===p.questIndex?' current':' locked');
      const title=document.createElement('h3');title.textContent=(index<p.questIndex?'✓ ':String(index+1)+'. ')+quest.title;
      const description=document.createElement('p');description.textContent=quest.description;description.className='small';
      const button=document.createElement('button');button.textContent=index<p.questIndex?'Completed':index===p.questIndex?'Begin stage · '+quest.reward+' XP':'Locked';button.disabled=index!==p.questIndex;
      button.onclick=()=>{craftContext={quest:true};currentTarget={id:quest.id,name:quest.title,types:quest.types.slice()};selectedComponents.clear();renderTarget();renderComponents();clearResult();document.querySelector('[data-tab="play"]').click();document.getElementById('rewardStatus').textContent='Expedition: use at most '+quest.limit+' components'+(quest.all?' and counter every target type.':'.');};
      card.append(title,description,button);quests.append(card);
    }
    const discovery=document.getElementById('discoveryGrid');discovery.replaceChildren();
    for(const type of TYPES){const card=document.createElement('div');card.className='discovery-tile'+(p.discovered.includes(type)?' discovered':'');const title=document.createElement('strong');title.textContent=type;const info=document.createElement('span');info.textContent=p.discovered.includes(type)?'Weak to: '+(WEAKNESSES[type].join(', ')||'no known counter'):'Craft a component of this type to discover it.';card.append(title,info);discovery.append(card);}
    const achievements=document.getElementById('achievementList');achievements.replaceChildren();
    for(const achievement of CraftingProgression.ACHIEVEMENTS){const card=document.createElement('article');card.className='achievement'+(achievement.check(p)?' unlocked':'');const title=document.createElement('h3');title.textContent=(achievement.check(p)?'◆ ':'◇ ')+achievement.name;const desc=document.createElement('p');desc.textContent=achievement.description;card.append(title,desc);achievements.append(card);}
    const library=document.getElementById('recipeLibrary');library.replaceChildren();
    for(const recipe of p.recipes){const card=document.createElement('article');card.className='recipe-card';const title=document.createElement('h3');title.textContent=recipe.name;const ids=document.createElement('p');ids.className='mono small';ids.textContent=recipe.ids.join(', ');const load=document.createElement('button');load.textContent='Load recipe';load.onclick=()=>{selectedComponents.clear();recipe.ids.forEach(id=>selectedComponents.add(id));renderComponents();document.querySelector('[data-tab="play"]').click();document.getElementById('rewardStatus').textContent='Loaded '+recipe.name;};const remove=document.createElement('button');remove.className='secondary';remove.textContent='Delete';remove.onclick=()=>{gameState.progression.recipes=gameState.progression.recipes.filter(r=>r.id!==recipe.id);saveState();renderProgression();};card.append(title,ids,load,remove);library.append(card);}
    if(!p.recipes.length)library.textContent='Build a combination, name it, and keep it in your recipe book.';
  }
  document.getElementById('saveRecipe').onclick=()=>{
    try{gameState.progression=CraftingProgression.saveRecipe(gameState.progression,document.getElementById('recipeName').value,[...selectedComponents],TYPES);saveState();renderProgression();document.getElementById('rewardStatus').textContent='Recipe saved.';}catch(error){document.getElementById('rewardStatus').textContent=error.message;}
  };
  document.getElementById('selectEffective').onclick=()=>{selectedComponents.clear();const weak=weakTo(currentTarget.types);const random=mulberry32(compPageSeed);for(let i=0;i<256;i++){const id=Math.floor(random()*1e9)>>>0;if(randTypes(id).some(t=>weak.includes(t))){selectedComponents.add(id);break;}}renderComponents();};
  renderProgression();
