importScripts('progression.js','crafting-core.js');
onmessage=e=>{
  const data=e.data || {};
  const {action,TYPES,weaknesses=[],sample=false}=data;
  const start=Number(data.start ?? 0),count=Number(data.count),maxRes=Number(data.maxRes ?? 1000),spaceSize=Number(data.spaceSize ?? 1000000000);
  if((action != null && !['sequential','samplePool'].includes(action)) || !Array.isArray(TYPES) || !TYPES.length || TYPES.length>100 || !TYPES.every(t=>typeof t==='string') || !Array.isArray(weaknesses) ||
     !CraftingCore.validId(start) || !Number.isSafeInteger(count) || count<1 || count>1000000 ||
     !Number.isSafeInteger(maxRes) || maxRes<1 || maxRes>1000 || !Number.isSafeInteger(spaceSize) || spaceSize<1 || spaceSize>CraftingCore.MAX_ID+1 ||
     (action==='samplePool' && count>2000) || (!sample && action!=='samplePool' && start+count-1>CraftingCore.MAX_ID)) {
    postMessage({type:'error',text:'Invalid scan inputs. Use at most 1,000,000 checks, 1,000 results, or 2,000 pool samples.'});return;
  }
  let found=0,checked=0;
  const random=CraftingCore.mulberry32(CraftingCore.randTypes?((start>>>0)^Math.floor(start/4294967296)):start);
  const weak=new Set(weaknesses),pool=[],seen=new Set();
  for(let i=0;i<count;i++){
    const id=sample || action==='samplePool'?Math.floor(random()*spaceSize):start+i;
    const adds=CraftingCore.randTypes(id,TYPES);checked++;
    if(action==='samplePool'){if(!seen.has(id)){pool.push({id,adds});seen.add(id);}}
    else if(adds.some(t=>weak.has(t)) && !seen.has(id)){seen.add(id);postMessage({type:'result',id,adds});if(++found>=maxRes)break;}
    if(i && i%10000===0)postMessage({type:'status',text:`Checked ${i} / ${count}`});
  }
  if(action==='samplePool')postMessage({type:'pool',pool});
  postMessage({type:'done',checked,found});
};
