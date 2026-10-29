
const fs=require('fs');
class El{constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.value='';this.className='';this.dataset={};this.children=[];
 this.classList={add(){},remove(){}};this.style={};this.hidden=false;}
 setAttribute(k,v){this[k]=v} getAttribute(k){return this[k]}
 addEventListener(){} appendChild(c){this.children.push(c)} remove(){} focus(){} click(){} closest(){return null}
 scrollIntoView(){} querySelectorAll(){return []}}
const cache={};
global.document={body:new El('body'),head:new El('head'),createElement:t=>new El(t),
 getElementById:id=>cache[id]||(cache[id]=new El(id)),
 querySelector:sel=>{const k=sel.replace('#','');return cache[k]||(cache[k]=new El(k));},
 querySelectorAll:()=>[],addEventListener(){},readyState:'complete',baseURI:'https://x/'};
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.crypto=require('crypto').webcrypto;
global.Blob=class{constructor(a,o){this.size=JSON.stringify(a).length}};
global.URL={createObjectURL:()=>'blob:x',revokeObjectURL:()=>{}};
global.TextEncoder=require('util').TextEncoder;
global.confirm=()=>false;
global.atob=s=>Buffer.from(s,'base64').toString('binary');
global.btoa=s=>Buffer.from(s,'binary').toString('base64');
global.navigator={};
global.window=global;
global.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
const html=fs.readFileSync('Gavetas-Advogado-v2.html','utf8');
const js=html.match(/<script>\s*"use strict";([\s\S]*?)<\/script>/)[1];
const extra = `
;(async()=>{
  console.log("gaveta:", gavetaAtual().n);
  console.log("pagina chars:", document.querySelector("#pagina").innerHTML.length);
  console.log("chips:", document.querySelector("#chips").children.length);
  console.log("kanban:", (document.querySelector("#kanban").innerHTML.match(/kcol/g)||[]).length);
  console.log("normaliza:", normalizarFala("Égua, R$ 1.299 no pix, art. 5º da LC 214/2025, CPF 123.456.789-00."));
  console.log("blocos:", emBlocos("Um. Dois, três. Quatro!").length);
  const h = await sha256Hex("abc");
  console.log("sha ok:", h.startsWith("ba7816bf"));
  const it = await salvarProva({tipo:"página",titulo:"teste",texto:paginaTexto()});
  console.log("cofre:", state.vault.length, it.hash.slice(0,8));
  console.log("texto tem base legal:", paginaTexto().includes("BASE LEGAL"));
  state.modo="contador"; state.gaveta=null;
  renderModo(); renderChips(); renderPagina();
  console.log("contador ok:", document.querySelector("#pagina").innerHTML.includes("SONEGA"));
})();
`;
try{ eval(js + extra); console.log("INIT OK"); }
catch(e){ console.log("ERRO:", e.message, (e.stack||"").split("\n")[1]); }
