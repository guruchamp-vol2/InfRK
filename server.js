const express=require('express');
const path=require('node:path');
const app=express();
app.disable('x-powered-by');
app.get('/health',(req,res)=>res.json({ok:true}));
for(const file of ['index.html','app.js','crafting-core.js','worker.js','progression.js','styles.css']) app.get(file==='index.html'?['/','/index.html']:'/'+file,(req,res)=>res.sendFile(path.join(__dirname,file)));
app.use((req,res)=>res.status(404).send('Not found'));
if(require.main===module)app.listen(process.env.PORT || 3000,()=>console.log('Crafting server started'));
module.exports=app;
