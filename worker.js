// Web Worker: scans large ranges of component IDs for matches
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function randTypes(id, TYPES) {
  const r = mulberry32(id >>> 0);
  const count = 2 + Math.floor(r()*3); // 2..4
  const arr = [];
  const pool = TYPES.slice();
  for (let i=0;i<count && pool.length;i++) {
    const idx = Math.floor(r()*pool.length);
    arr.push(pool.splice(idx,1)[0]);
  }
  return arr;
}

onmessage = (e) => {
  // Supports three actions/modes:
  // - sequential scan: check IDs start..start+count-1 (default)
  // - sample mode: draw `count` random samples from a virtual space of size `spaceSize` and report matches
  // - samplePool: draw `count` random samples and return the sampled pool (for combination searching client-side)
  const { action, start, count, maxRes, weaknesses, TYPES, sample, spaceSize } = e.data;
  let found = 0;
  let checked = 0;
  const weakSet = new Set(weaknesses || []);

  if (action === 'samplePool') {
    const total = Math.max(1, Number(spaceSize) || 1e9);
    const rng = mulberry32((start>>>0) || 1);
    const pool = [];
    for (let i=0;i<count;i++) {
      const id = Math.floor(rng()*total) >>> 0;
      const adds = randTypes(id, TYPES);
      pool.push({ id, adds });
      if (i % 1000 === 0) postMessage({ type: 'status', text: `Sampled ${i} / ${count} (pool)` });
    }
    postMessage({ type: 'pool', pool });
    postMessage({ type: 'done', checked: count, found: 0 });
    return;
  }

  if (sample) {
    // sample `count` ids across [0, spaceSize)
    const total = Math.max(1, Number(spaceSize) || 1e9);
    const rng = mulberry32((start>>>0) || 1);
    for (let i=0; i<count; i++) {
      const id = Math.floor(rng()*total) >>> 0;
      const adds = randTypes(id, TYPES);
      checked++;
      if (adds.some(t => weakSet.has(t))) {
        postMessage({ type: "result", id, adds });
        found++;
        if (found >= maxRes) break;
      }
      if (i % 1000 === 0) {
        postMessage({ type: "status", text: `Sampled ${i} / ${count} (space ${total.toLocaleString()})… found ${found}` });
      }
    }
    postMessage({ type: "done", checked, found });
    return;
  }

  // sequential (original) behavior
  for (let i=0; i<count; i++) {
    const id = start + i;
    const adds = randTypes(id, TYPES);
    checked++;
    if (adds.some(t => weakSet.has(t))) {
      postMessage({ type: "result", id, adds });
      found++;
      if (found >= maxRes) break;
    }
    if (i % 1000 === 0) {
      postMessage({ type: "status", text: `Scanned ${i} / ${count}… found ${found}` });
    }
  }
  postMessage({ type: "done", checked, found });
};