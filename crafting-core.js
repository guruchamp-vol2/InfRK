(function(root,factory){
  const core=factory();if(typeof module==='object' && module.exports)module.exports=core;else root.CraftingCore=core;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const Progression=typeof module==='object' && module.exports?require('./progression'):globalThis.CraftingProgression;
  const MAX_ID=999999999999;
  function validId(value){return Number.isSafeInteger(value) && value>=0 && value<=MAX_ID;}
  function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function seedForId(id){
    if(!validId(id))throw new Error('ID must be an integer from 0 to '+MAX_ID+'.');
    // Preserve legacy mappings for 32-bit IDs; mix high bits instead of silently wrapping.
    return ((id>>>0)^Math.imul(Math.floor(id/4294967296),0x9e3779b1))>>>0;
  }
  function randTypes(id,types){
    const random=mulberry32(seedForId(id)),pool=types.slice(),result=[];
    const count=2+Math.floor(random()*3);
    for(let i=0;i<count && pool.length;i++)result.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
    return result;
  }
  function normalizeState(raw,types,weaknesses){
    if(!raw || typeof raw!=='object' || Array.isArray(raw))throw new Error('Invalid progress file.');
    const number=(v,max=1000000)=>Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
    const typeList=value=>Array.isArray(value)?[...new Set(value.filter(t=>types.includes(t)))]:[];
    const history=(Array.isArray(raw.history)?raw.history:[]).slice(0,200).flatMap(h=>{
      if(!h || !Array.isArray(h.ids))return [];
      const ids=[...new Set(h.ids.filter(validId))].slice(0,20);if(!ids.length)return [];
      const itemTypes=[...new Set(ids.flatMap(id=>randTypes(id,types)))];
      const targetTypes=typeList(h.target?.types);
      const weak=targetTypes.length?[...new Set(targetTypes.flatMap(t=>weaknesses[t]||[]))]:typeList(h.target?.weak);
      return [{ids,types:itemTypes,target:{id:validId(h.target?.id)?h.target.id:'rock',name:typeof h.target?.name==='string'?h.target.name.slice(0,80):'Rock',types:targetTypes,weak},
        key:ids.slice().sort((a,b)=>a-b).join(','),success:itemTypes.some(t=>weak.includes(t)),timestamp:number(h.timestamp,Number.MAX_SAFE_INTEGER)}];
    });
    const favorites=new Set((Array.isArray(raw.favorites)?raw.favorites:[]).filter(k=>history.some(h=>h.key===k)));
    const wins=Object.fromEntries(['fire','water','earth','wind'].map(t=>[t,number(raw.challenges?.elements?.wins?.[t])]));
    const rockWins=number(raw.challenges?.rock?.wins),legendary=!!raw.challenges?.legendary?.completed;
    return {favorites,history,progression:Progression.normalize(raw.progression,types),challenges:{rock:{wins:rockWins,progress:Math.min(100,rockWins*20)},elements:{wins,progress:Object.values(wins).filter(n=>n>0).length*25},legendary:{completed:legendary,progress:legendary?100:0}}};
  }
  return {MAX_ID,validId,mulberry32,randTypes,normalizeState};
});
