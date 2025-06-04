const fs = require('fs');
const path = require('path');
async function getFiles(dir){
  const entries = await fs.promises.readdir(dir,{withFileTypes:true});
  const files = await Promise.all(entries.map(e=>{
    const res = path.resolve(dir,e.name);
    return e.isDirectory()?getFiles(res):res;
  }));
  return Array.prototype.concat(...files);
}
async function audit(){
  const root = path.resolve(__dirname,'../src');
  const files = await getFiles(root);
  const totals = {js:0,css:0,html:0,other:0};
  for(const file of files){
    const stat = await fs.promises.stat(file);
    const ext = path.extname(file).slice(1);
    if(totals[ext]!=null){totals[ext]+=stat.size;} else {totals.other+=stat.size;}
  }
  const format=b=> (b/1024).toFixed(2)+' KB';
  console.log('Bundle Size Audit for src directory');
  for(const [t,s] of Object.entries(totals)) console.log(`${t.toUpperCase()}: ${format(s)}`);
  const total = Object.values(totals).reduce((a,b)=>a+b,0);
  console.log(`TOTAL: ${format(total)}`);
}
audit();
