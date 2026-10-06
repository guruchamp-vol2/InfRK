(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.CraftingProgression=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const QUESTS=[
    {id:'q1',title:'A humble beginning',description:'Overcome stone with a single component.',types:['stone'],limit:1,reward:80},
    {id:'q2',title:'Cool the embers',description:'Find a counter to fire using at most two components.',types:['fire'],limit:2,reward:100},
    {id:'q3',title:'Turn the tide',description:'Challenge water with two components or fewer.',types:['water'],limit:2,reward:120},
    {id:'q4',title:'Break the alloy',description:'Discover a way through metal.',types:['metal'],limit:2,reward:140},
    {id:'q5',title:'Into the overgrowth',description:'Defeat a plant target with one component.',types:['plant'],limit:1,reward:160},
    {id:'q6',title:'Winter’s edge',description:'Overcome ice with a pair of components.',types:['ice'],limit:2,reward:180},
    {id:'q7',title:'Ground the storm',description:'Counter electric energy.',types:['electric'],limit:2,reward:200},
    {id:'q8',title:'An antidote to trouble',description:'Find a counter to poison.',types:['poison'],limit:2,reward:220},
    {id:'q9',title:'A clash of elements',description:'Counter both fire and water in one craft.',types:['fire','water'],limit:3,reward:250,all:true},
    {id:'q10',title:'Masterwork',description:'Counter stone, metal and plant in one craft.',types:['stone','metal','plant'],limit:3,reward:400,all:true}
  ];
  const ACHIEVEMENTS=[
    {id:'first',name:'First spark',description:'Complete your first successful craft.',check:p=>p.wins>=1},
    {id:'explorer',name:'Explorer',description:'Discover ten component types.',check:p=>p.discovered.length>=10},
    {id:'collector',name:'Archivist',description:'Save five named recipes.',check:p=>p.recipes.length>=5},
    {id:'veteran',name:'Seasoned crafter',description:'Make fifty crafts.',check:p=>p.crafts>=50},
    {id:'quester',name:'Trailblazer',description:'Complete five expedition stages.',check:p=>p.questIndex>=5},
    {id:'daily',name:'A daily ritual',description:'Complete three different daily challenges.',check:p=>p.dailyWins.length>=3},
    {id:'master',name:'Master of the forge',description:'Complete the full expedition.',check:p=>p.questIndex>=QUESTS.length},
    {id:'encyclopedia',name:'Living encyclopedia',description:'Discover all 34 component types.',check:p=>p.discovered.length>=34}
  ];
  const validId=v=>Number.isSafeInteger(v) && v>=0 && v<=999999999999;
  const count=v=>Number.isFinite(v)?Math.max(0,Math.min(10000000,Math.floor(v))):0;
  function normalize(raw,types=[]){
    raw=raw && typeof raw==='object'?raw:{};
    const recipes=(Array.isArray(raw.recipes)?raw.recipes:[]).slice(0,100).flatMap(r=>{
      if(!r || typeof r.name!=='string' || !Array.isArray(r.ids))return [];
      const ids=[...new Set(r.ids.filter(validId))].slice(0,20);
      if(!ids.length)return [];
      return [{id:ids.slice().sort((a,b)=>a-b).join(','),name:r.name.trim().slice(0,60)||'Untitled recipe',ids,createdAt:Number.isSafeInteger(r.createdAt)?Math.max(0,r.createdAt):0}];
    });
    return {
      xp:count(raw.xp),crafts:count(raw.crafts),wins:Math.min(count(raw.wins),count(raw.crafts)),questIndex:Math.min(QUESTS.length,count(raw.questIndex)),
      discovered:[...new Set((Array.isArray(raw.discovered)?raw.discovered:[]).filter(t=>types.includes(t)))],
      rewarded:[...new Set((Array.isArray(raw.rewarded)?raw.rewarded:[]).filter(k=>typeof k==='string' && k.length<500))].slice(-2000),
      dailyWins:[...new Set((Array.isArray(raw.dailyWins)?raw.dailyWins:[]).filter(d=>typeof d==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))].slice(-365),recipes
    };
  }
  function level(xp){return Math.floor(Math.sqrt(Math.max(0,xp)/100))+1;}
  function progress(xp){const current=level(xp),start=(current-1)**2*100,end=current**2*100;return {level:current,current:xp-start,needed:end-start,percent:Math.min(100,(xp-start)/(end-start)*100)};}
  function record(value,craft,target,weaknesses,types,context={}){
    const p=normalize(value,types);
    const ids=[...new Set(craft.ids.filter(validId))];
    if(!ids.length)return {state:p,xp:0,quest:false,daily:false,unlocked:[]};
    const before=new Set(ACHIEVEMENTS.filter(a=>a.check(p)).map(a=>a.id));
    p.crafts++;
    const success=target.types.some(type=>craft.types.some(t=>(weaknesses[type]||[]).includes(t)));
    if(success)p.wins++;
    p.discovered=[...new Set([...p.discovered,...craft.types.filter(t=>types.includes(t))])];
    const key=String(target.id)+':'+ids.slice().sort((a,b)=>a-b).join(',');
    let earned=0,questDone=false,dailyDone=false;
    if(!p.rewarded.includes(key)){
      earned=success?35:10;p.rewarded.push(key);p.rewarded=p.rewarded.slice(-2000);
    }
    const quest=QUESTS[p.questIndex];
    if(context.quest && quest && target.id===quest.id && ids.length<=quest.limit){
      const results=quest.types.map(type=>craft.types.some(t=>(weaknesses[type]||[]).includes(t)));
      if(quest.all?results.every(Boolean):results.some(Boolean)){earned+=quest.reward;p.questIndex++;questDone=true;}
    }
    if(context.daily && typeof context.day==='string' && /^\d{4}-\d{2}-\d{2}$/.test(context.day) && success && ids.length<=3 && !p.dailyWins.includes(context.day)){
      p.dailyWins.push(context.day);p.dailyWins=p.dailyWins.slice(-365);earned+=150;dailyDone=true;
    }
    p.xp=Math.min(10000000,p.xp+earned);
    return {state:p,xp:earned,quest:questDone,daily:dailyDone,unlocked:ACHIEVEMENTS.filter(a=>a.check(p) && !before.has(a.id)).map(a=>a.name)};
  }
  function saveRecipe(value,name,ids,types){
    const p=normalize(value,types);const valid=[...new Set(ids.filter(validId))].slice(0,20);
    if(!valid.length)throw Error('Select components before saving a recipe.');
    if(typeof name!=='string' || !name.trim())throw Error('Give the recipe a name.');
    const id=valid.slice().sort((a,b)=>a-b).join(',');const existing=p.recipes.find(r=>r.id===id);
    if(existing)existing.name=name.trim().slice(0,60);
    else {if(p.recipes.length>=100)throw Error('Recipe library is full. Remove a recipe first.');p.recipes.unshift({id,name:name.trim().slice(0,60),ids:valid,createdAt:Date.now()});}
    return p;
  }
  return {QUESTS,ACHIEVEMENTS,normalize,level,progress,record,saveRecipe};
});
