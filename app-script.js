
'use strict';
const DICIONARIO={
"Gírias do Povão": {
"tá": "está",
"vamo": "vamos",
"bora": "vamos embora",
"mermão": "meu irmão",
"mano": "meu amigo",
"caraca": "nossa",
"saca só": "preste atenção",
"se liga": "preste atenção",
"pega a visão": "entenda bem",
"tá ligado": "entende",
"tá suave": "está tudo bem",
"é nóis": "estamos juntos",
"massa": "legal",
"da hora": "muito legal",
"top": "excelente",
"show": "perfeito",
"maneiro": "legal",
"bacana": "legal",
"irado": "incrível",
"brabo": "muito bom",
"sinistro": "impressionante",
"demais": "muito",
"galera": "pessoal",
"povão": "pessoal",
"ta": "ESTÁ"
},
"Expressões Populares": {
"barato demais": "preço muito baixo",
"tá de graça": "está muito barato",
"sai correndo": "aproveite rápido",
"aproveita": "aproveite agora",
"corre lá": "vá agora",
"não perde": "não perca",
"é agora ou nunca": "aproveite esta oportunidade",
"tá bombando": "está muito popular",
"é o queridinho": "é o mais escolhido",
"tá esgotando": "está acabando o estoque",
"últimas unidades": "poucas unidades disponíveis",
"só hoje": "apenas hoje",
"por tempo limitado": "por pouco tempo"
},
"Marcas e Termos Técnicos": {
"magsafe": "magsêif",
"wireless": "uâir-léss",
"bluetooth": "blútuf",
"wifi": "uífai",
"usb": "i-usbê",
"hdmi": "eitch-di-em-ai",
"smartphone": "smartfône",
"tablet": "táblet",
"notebook": "nôutbuk",
"led": "lêd",
"oled": "ô-lêd",
"4k": "quatro quê",
"full hd": "ful eitch-dê",
"gps": "gê-pê-ésse",
"nfc": "êne-êfê-cê",
"rgb": "ér-gê-bê",
"ssd": "ésse-ésse-dê",
"cpu": "cê-pê-ú",
"airpods": "ér-póds",
"galaxy": "gálaxi",
"iphone": "aifône",
"xiaomi": "xiáomi",
"samsung": "sâmsung",
"apple": "épol",
"amazon": "âmazon",
"aliexpress": "áli-éx-press",
"shopee": "xópi"
},
"Símbolos e Valores": {
"r$": "reais",
"us$": "dólares",
"%": "por cento",
"+": "mais",
"-": "menos",
"=": "igual",
"&": "e",
"@": "arroba",
"#": "hashtag"
},
"Personalizado": {},
"BEBE": {}
};
const CHAVE='ioxadv.rascunhos.v2', CHAVE_CORR='ioxadv.correcoes.v1', CHAVE_PREF='ioxadv.prefs.v1';
const $=id=>document.getElementById(id);
const titulo=$('titulo'),area=$('texto'),estado=$('estado'),lista=$('lista'),vazio=$('listaVazia'),file=$('arquivo'),estadoVoz=$('estadoVoz'),estadoCorr=$('estadoCorr'),estadoDic=$('estadoDic');
let idAtual=null,alterado=false;

const ALNUM=/[0-9A-Za-zÀ-ÖØ-öø-ÿ]/, LETRA=/[A-Za-zÀ-ÖØ-öø-ÿ]/;

function lerRS(){try{const d=JSON.parse(localStorage.getItem(CHAVE));return Array.isArray(d)?d:[]}catch(e){return[]}}
function gravarRS(d){try{localStorage.setItem(CHAVE,JSON.stringify(d));return true}catch(e){estado.textContent='Não foi possível salvar: o armazenamento está cheio ou bloqueado.';return false}}
function lerCorr(){try{const d=JSON.parse(localStorage.getItem(CHAVE_CORR));return Array.isArray(d)?d:[]}catch(e){return[]}}
function gravarCorr(d){try{localStorage.setItem(CHAVE_CORR,JSON.stringify(d))}catch(e){estadoCorr.textContent='Não foi possível guardar as correções.'}}
function prefs(){try{return Object.assign({ditado:false,leitura:true},JSON.parse(localStorage.getItem(CHAVE_PREF))||{})}catch(e){return{ditado:false,leitura:true}}}
function gravarPrefs(pr){try{localStorage.setItem(CHAVE_PREF,JSON.stringify(pr))}catch(e){}}
function contador(){const t=area.value.trim();const n=(t.match(/[^\s]+/gu)||[]).length;$('contador').textContent=n+' palavras · '+area.value.length+' caracteres'}
function aviso(t){estado.textContent=t}
function sujo(){alterado=true}

function paresDe(categorias){
 const mapa=new Map();
 categorias.forEach(c=>{
  const g=DICIONARIO[c];if(!g)return;
  Object.keys(g).forEach(k=>mapa.set(k.toLowerCase(),g[k]));
 });
 lerCorr().forEach(x=>{if(x.de)mapa.set(x.de.toLowerCase(),x.para)});
 return [...mapa.entries()].map(([de,para])=>({de,para})).sort((a,b)=>b.de.length-a.de.length);
}

function inicioDeFrase(texto,pos){
 let i=pos-1;
 while(i>=0&&/\s/.test(texto[i]))i--;
 if(i<0)return true;
 return '.!?…:'.includes(texto[i])||texto[i]==='\n';
}
function casarCaso(texto,pos,valor){
 const primeira=valor.charAt(0);
 const maiusculas=valor===valor.toUpperCase()&&/[A-ZÀ-Þ]/.test(valor);
 if(maiusculas){
  if(inicioDeFrase(texto,pos))return valor;
  return valor.toLowerCase();
 }
 if(inicioDeFrase(texto,pos)&&/[a-zà-ÿ]/.test(primeira))return valor.charAt(0).toUpperCase()+valor.slice(1);
 return valor;
}
function trocarTermo(texto,de,para){
 const alvo=de.toLowerCase();
 const exigeAlnum=ALNUM.test(de);
 const baixo=texto.toLowerCase();
 let saida='',i=0;
 for(;;){
  const k=baixo.indexOf(alvo,i);
  if(k<0){saida+=texto.slice(i);break}
  const antes=k>0?texto[k-1]:'';
  const depois=k+de.length<texto.length?texto[k+de.length]:'';
  const bloqueia=exigeAlnum
   ?(antes&&ALNUM.test(antes))||(depois&&ALNUM.test(depois))
   :(antes&&LETRA.test(antes))||(depois&&LETRA.test(depois));
  if(bloqueia){saida+=texto.slice(i,k+1);i=k+1;continue}
  saida+=texto.slice(i,k)+casarCaso(texto,k,para);
  i=k+de.length;
 }
 return saida;
}
function aplicar(texto,pares){
 if(!texto||!pares.length)return texto;
 let saida=texto;
 pares.forEach(x=>{saida=trocarTermo(saida,x.de,x.para)});
 return saida;
}
const CAT_TEXTO=['Gírias do Povão','Expressões Populares'];
const CAT_FALA=['Marcas e Termos Técnicos','Símbolos e Valores'];
function corrigirTexto(t){return aplicar(t,paresDe(prefs().ditado?CAT_TEXTO:[]))}
function prepararLeitura(t){
 let s=t;
 s=s.replace(/(?:R\$|US\$)\s?(\d[\d.,]*)/gi,(m,valor)=>m.toLowerCase().startsWith('r')?valor+' reais':valor+' dólares');
 s=s.replace(/(\d[\d.,]*)\s?%/g,(m,valor)=>valor+' por cento');
 return aplicar(s,paresDe(prefs().leitura?CAT_FALA:[]));
}

function renderTabela(id,grupo){
 const t=$(id);t.textContent='';
 const cab=document.createElement('tr');
 ['Ouvido ou escrito','Vira'].forEach(x=>{const th=document.createElement('th');th.textContent=x;cab.append(th)});
 t.append(cab);
 Object.keys(grupo).forEach(k=>{
  const tr=document.createElement('tr');
  const a=document.createElement('td'),c1=document.createElement('code');c1.textContent=k;a.append(c1);
  const b=document.createElement('td'),c2=document.createElement('code');c2.textContent=grupo[k];b.append(c2);
  tr.append(a,b);t.append(tr);
 });
}
function renderDic(){
 const g=DICIONARIO;
 renderTabela('tabGirias',g['Gírias do Povão']||{});
 renderTabela('tabExpr',g['Expressões Populares']||{});
 renderTabela('tabMarcas',g['Marcas e Termos Técnicos']||{});
 renderTabela('tabSimb',g['Símbolos e Valores']||{});
 $('qtdGirias').textContent=Object.keys(g['Gírias do Povão']||{}).length+' termos';
 $('qtdExpr').textContent=Object.keys(g['Expressões Populares']||{}).length+' termos';
 $('qtdMarcas').textContent=Object.keys(g['Marcas e Termos Técnicos']||{}).length+' termos';
 $('qtdSimb').textContent=Object.keys(g['Símbolos e Valores']||{}).length+' termos';
 const pr=prefs();
 $('usarNoDitado').checked=!!pr.ditado;
 $('usarNaLeitura').checked=!!pr.leitura;
 estadoDic.textContent='Dicionário carregado. '+lerCorr().length+' correção(ões) personalizada(s).';
}
$('usarNoDitado').onchange=e=>{const pr=prefs();pr.ditado=e.target.checked;gravarPrefs(pr);estadoDic.textContent=pr.ditado?'Gírias serão trocadas no texto ditado.':'Gírias mantidas como você fala.'};
$('usarNaLeitura').onchange=e=>{const pr=prefs();pr.leitura=e.target.checked;gravarPrefs(pr);estadoDic.textContent=pr.leitura?'Marcas e símbolos serão pronunciados na leitura.':'Leitura literal, sem trocas.'};

function renderCorr(){
 const c=lerCorr(),ul=$('listaCorr');ul.textContent='';
 estadoCorr.textContent=c.length?(c.length+' correção(ões) ativa(s), aplicadas ao ditado e à leitura.'):'Nenhuma correção cadastrada.';
 c.forEach((x,i)=>{
  const li=document.createElement('li');
  const box=document.createElement('div');
  const s=document.createElement('strong');s.textContent=x.de+' → '+x.para;
  const small=document.createElement('small');small.textContent='Categoria: Personalizado';
  box.append(s,small);
  const del=document.createElement('button');del.type='button';del.className='perigo';del.textContent='Remover';
  del.onclick=()=>{const d=lerCorr();d.splice(i,1);gravarCorr(d);renderCorr();renderDic()};
  li.append(box,del);ul.append(li);
 });
}
$('addCorr').onclick=()=>{
 const de=$('de').value.trim(),para=$('para').value.trim();
 if(!de||!para){estadoCorr.textContent='Preencha os dois campos: o que foi entendido e como deve ser escrito.';return}
 const d=lerCorr();
 const i=d.findIndex(x=>x.de.toLowerCase()===de.toLowerCase());
 if(i>=0)d[i]={de,para};else d.push({de,para});
 gravarCorr(d);$('de').value='';$('para').value='';renderCorr();renderDic();
 estadoCorr.textContent='Correção guardada: '+de+' → '+para+'. Vale para os próximos ditados e leituras.';
};
$('aplicarCorr').onclick=()=>{
 if(!area.value.trim()){estadoCorr.textContent='Não há texto na tela para corrigir.';return}
 const antes=area.value;
 const depois=aplicar(antes,paresDe(CAT_TEXTO.concat(CAT_FALA)));
 if(antes===depois){estadoCorr.textContent='Nada foi alterado: nenhum termo do dicionário apareceu no texto.';return}
 area.value=depois;sujo();contador();
 estadoCorr.textContent='Dicionário completo aplicado ao texto. Confira o resultado antes de salvar.';
};

function render(){
 const d=lerRS().sort((a,b)=>b.atualizado-a.atualizado);
 lista.textContent='';
 vazio.style.display=d.length?'none':'block';
 d.forEach(r=>{
  const li=document.createElement('li');
  const box=document.createElement('div');
  const s=document.createElement('strong');s.textContent=r.titulo||'(sem nome)';
  const info=document.createElement('small');
  info.textContent=new Date(r.atualizado).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})+' · '+r.texto.length+' caracteres';
  box.append(s,info);
  const acoes=document.createElement('div');acoes.className='acoes';
  const abrirBtn=document.createElement('button');abrirBtn.type='button';abrirBtn.textContent='Abrir';abrirBtn.onclick=()=>carregar(r.id);
  const del=document.createElement('button');del.type='button';del.className='perigo';del.textContent='Apagar';del.onclick=()=>apagar(r.id,r.titulo);
  acoes.append(abrirBtn,del);li.append(box,acoes);lista.append(li);
 });
}
function carregar(id){
 const r=lerRS().find(x=>x.id===id);if(!r)return;
 if(alterado&&area.value.trim()&&!confirm('Descartar o texto atual e abrir outro rascunho?'))return;
 idAtual=r.id;titulo.value=r.titulo;area.value=r.texto;alterado=false;contador();
 aviso('Rascunho aberto: '+(r.titulo||'(sem nome)'));
}
function apagar(id,nome){
 if(!confirm('Apagar o rascunho "'+(nome||'(sem nome)')+'"? Isso não pode ser desfeito.'))return;
 gravarRS(lerRS().filter(x=>x.id!==id));
 if(id===idAtual)idAtual=null;
 render();aviso('Rascunho apagado.');
}
$('salvar').onclick=()=>{
 if(!area.value.trim()){aviso('Digite um texto antes de salvar.');return}
 const d=lerRS(),agora=Date.now();
 const nome=titulo.value.trim()||('Rascunho '+new Date(agora).toLocaleDateString('pt-BR'));
 if(idAtual){
  const r=d.find(x=>x.id===idAtual);
  if(r){r.titulo=nome;r.texto=area.value;r.atualizado=agora}
  else{d.push({id:crypto.randomUUID(),titulo:nome,texto:area.value,atualizado:agora})}
 }else{
  idAtual=crypto.randomUUID();
  d.push({id:idAtual,titulo:nome,texto:area.value,atualizado:agora});
 }
 if(gravarRS(d)){alterado=false;titulo.value=nome;render();aviso('Rascunho salvo neste navegador. Sem criptografia: use só dados fictícios.')}
};
$('novo').onclick=()=>{
 if(alterado&&area.value.trim()&&!confirm('Descartar o texto não salvo e começar outro?'))return;
 idAtual=null;titulo.value='';area.value='';alterado=false;contador();aviso('Novo rascunho em branco.');
};
$('baixar').onclick=()=>{
 if(!area.value.trim()){aviso('Digite um texto antes de baixar.');return}
 const url=URL.createObjectURL(new Blob([area.value],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');
 a.href=url;a.download=(titulo.value.trim()||'ioxadv-rascunho').replace(/[/\\:*?"<>|]/g,'-')+'.txt';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 aviso('Download solicitado. Confira se o arquivo foi salvo antes de fechar.');
};
$('abrir').onclick=()=>file.click();
file.onchange=async()=>{
 const f=file.files[0];if(!f)return;
 try{
  if(f.size>1048576)throw Error('O limite é de 1 MB.');
  const txt=await f.text();
  if(area.value.trim()&&!confirm('Substituir o texto atual pelo conteúdo do arquivo?'))return;
  area.value=txt;alterado=true;contador();
  aviso('Arquivo aberto localmente. Clique em Salvar rascunho para guardar.');
 }catch(err){aviso(err.message)}finally{file.value=''}
};
area.addEventListener('input',()=>{sujo();contador()});
titulo.addEventListener('input',sujo);

const synth=window.speechSynthesis;
$('ler').onclick=()=>{
 if(!area.value.trim()){estadoVoz.textContent='Não há texto na tela para ler.';return}
 if(!synth){estadoVoz.textContent='Este navegador não oferece leitura em voz alta.';return}
 synth.cancel();
 const preparado=prepararLeitura(area.value);
 const u=new SpeechSynthesisUtterance(preparado);
 u.lang='pt-BR';u.rate=parseFloat($('velocidade').value);
 u.onend=()=>{estadoVoz.textContent='Leitura concluída.'};
 u.onerror=e=>{estadoVoz.textContent='A leitura falhou ('+e.error+'). Verifique o áudio do aparelho ou tente outro navegador.'};
 synth.speak(u);
 estadoVoz.textContent=preparado===area.value?'Lendo em voz alta…':'Lendo com as trocas do dicionário (marcas e símbolos).';
};
$('parar').onclick=()=>{if(synth){synth.cancel();estadoVoz.textContent='Leitura interrompida.'}};
const Recon=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,ditando=false;
if(!Recon){
 $('suporteVoz').innerHTML='<span class="selo" style="background:#ff9c9c">Ditado indisponível neste navegador</span>';
 $('ditar').disabled=true;$('pararDitado').disabled=true;
}else{
 $('suporteVoz').innerHTML='<span class="selo" style="background:#9fe0b0">Ditado disponível</span> O áudio é processado por um serviço externo do navegador.';
}
$('ditar').onclick=()=>{
 if(!Recon)return;
 if(ditando){estadoVoz.textContent='O ditado já está ativo.';return}
 rec=new Recon();rec.lang='pt-BR';rec.continuous=true;rec.interimResults=true;
 let base=area.value?area.value+' ':'';
 rec.onstart=()=>{ditando=true;estadoVoz.textContent='Ditando… fale perto do microfone.'};
 rec.onresult=e=>{
  let final='',parcial='';
  for(let i=e.resultIndex;i<e.results.length;i++){
   const t=e.results[i][0].transcript;
   if(e.results[i].isFinal)final+=t+' ';else parcial+=t;
  }
  if(final){base+=corrigirTexto(final);area.value=base;contador();sujo()}
  estadoVoz.textContent=parcial?('Ouvindo: '+parcial):'Ditando…';
 };
 rec.onerror=e=>{estadoVoz.textContent='Ditado interrompido: '+e.error+'. Se for permissão, libere o microfone no navegador.'};
 rec.onend=()=>{ditando=false;estadoVoz.textContent='Ditado encerrado. Revise o texto e clique em Salvar rascunho.'};
 try{rec.start()}catch(err){estadoVoz.textContent='Não foi possível iniciar o ditado.'}
};
$('pararDitado').onclick=()=>{if(rec&&ditando)rec.stop()};

window.addEventListener('beforeunload',e=>{if(alterado&&area.value.trim()){e.preventDefault();e.returnValue=''}});
contador();render();renderCorr();renderDic();
