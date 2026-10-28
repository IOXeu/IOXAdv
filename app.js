/* IOXAdv — editor experimental local. Não é IA nem cofre. */
'use strict';
(() => {
 const main=document.querySelector('main');
 if(!main||document.getElementById('iox-editor'))return;
 const section=document.createElement('section');section.id='iox-editor';
 const heading=document.createElement('h2');heading.textContent='Editor de rascunhos';section.append(heading);
 const note=document.createElement('p');note.textContent='Teste somente com dados fictícios. O texto fica em memória até fechar a página. Sem IA, criptografia ou salvamento automático.';section.append(note);
 const label=document.createElement('label');label.htmlFor='iox-texto';label.textContent='Seu rascunho';section.append(label);
 const area=document.createElement('textarea');area.id='iox-texto';area.rows=14;area.placeholder='Digite aqui para testar o editor…';area.spellcheck=true;area.lang='pt-BR';
 area.style.cssText='display:block;width:100%;margin:10px 0;padding:12px;border:1px solid #adb8ca;border-radius:8px;font:16px system-ui;background:#fff;color:#101b32;resize:vertical';section.append(area);
 const count=document.createElement('p');section.append(count);
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap';section.append(actions);
 const state=document.createElement('p');state.setAttribute('role','status');state.setAttribute('aria-live','polite');section.append(state);
 let pending=false;
 const update=()=>{const t=area.value.trim();count.textContent=(t?t.split(/\s+/u).length:0)+' palavras · '+area.value.length+' caracteres';};
 area.addEventListener('input',()=>{pending=true;update();});
 function button(text,run){const b=document.createElement('button');b.type='button';b.textContent=text;b.style.cssText='padding:12px;border-radius:8px;border:1px solid #e9bb65;background:#101b32;color:#fff;font:inherit;cursor:pointer';b.addEventListener('click',run);actions.append(b);}
 button('Baixar TXT',()=>{
  if(!area.value.trim()){state.textContent='Digite um texto antes de exportar.';return;}
  const url=URL.createObjectURL(new Blob([area.value],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='ioxadv-rascunho.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  state.textContent='Download solicitado. Confira se o arquivo foi salvo; ele contém texto sem criptografia.';
 });
 const file=document.createElement('input');file.type='file';file.accept='.txt,text/plain';file.hidden=true;section.append(file);
 button('Abrir TXT',()=>file.click());
 file.addEventListener('change',async()=>{
  const f=file.files[0];if(!f)return;
  try{
   if(f.size>1024*1024)throw new Error('Limite de importação: 1 MB.');
   const text=await f.text();
   if(area.value&&!confirm('Substituir o texto atual? Exporte antes se precisar preservá-lo.'))return;
   area.value=text;pending=true;update();state.textContent='Texto importado para edição. Nenhum arquivo foi enviado ao servidor.';
  }catch(err){state.textContent='Não foi possível importar: '+err.message;}finally{file.value='';}
 });
 button('Limpar',()=>{if(area.value&&!confirm('Limpar o rascunho?'))return;area.value='';pending=false;update();state.textContent='Editor limpo. Arquivos já baixados não foram apagados.';});
 window.addEventListener('beforeunload',event=>{if(pending&&area.value){event.preventDefault();event.returnValue='';}});
 main.append(section);update();
})();
