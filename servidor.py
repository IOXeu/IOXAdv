#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
servidor.py - Sala VIP: gírias -> fala -> áudio.

Regras de fonética ficam em audio_humanizador.py (uma fonte só, sem duplicar).
Este arquivo cuida da tela, da fila de áudios e da aprovação.

O que ele NÃO faz: vídeo 1080x1920, trilha, montagem. Só MP3.

Uso:
    pip install flask edge-tts
    python servidor.py
    http://127.0.0.1:5000
"""

import asyncio
import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template_string, request, send_from_directory

import audio_humanizador as voz

BASE = Path(__file__).parent
PASTA_TEMP = BASE / "temp"
PASTA_AUDIOS = BASE / "audios"
for pasta in (PASTA_TEMP, PASTA_AUDIOS):
    pasta.mkdir(exist_ok=True)

app = Flask(__name__)

HTML = r"""<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sala VIP - gírias em voz</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#FFFBF5;color:#2B211E;font-family:system-ui,-apple-system,sans-serif}
header{padding:16px 24px;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;border-bottom:1px solid #E8DDD0;background:#fff;position:sticky;top:0;z-index:10}
.logo{font-size:24px;font-weight:700}.logo span{color:#C87B5A}
.badge{background:#EEF4E8;border:1px solid #C8D8B8;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600}
.aviso{margin:16px 24px;padding:14px;border-left:5px solid #C87B5A;background:#fff;font-size:15px;border-radius:8px}
.main{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:0 24px 32px;max-width:1200px;margin:auto}
@media(max-width:820px){.main{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid #E8DDD0;border-radius:16px;padding:18px}
h2{font-size:19px;margin-bottom:10px}
textarea,select{width:100%;padding:12px;border-radius:12px;border:1px solid #E8DDD0;margin-top:8px;font:16px system-ui;background:#FFFBF5}
textarea{min-height:110px}
.btn{padding:12px 18px;border-radius:22px;border:1px solid #E8DDD0;background:#fff;font-size:15px;font-weight:700;cursor:pointer}
.btn.black{background:#1A1A1A;color:#fff}
.btn.terracota{background:#C87B5A;color:#fff;border-color:#C87B5A}
.acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.rail{display:flex;gap:8px;overflow-x:auto;padding:10px 0}
.pill{white-space:nowrap;padding:8px 14px;border-radius:20px;background:#FDF6EC;border:1px solid #E8DDD0;font-size:14px;cursor:pointer}
pre{background:#FDF6EC;border:1px solid #E8DDD0;border-radius:10px;padding:12px;font-size:15px;white-space:pre-wrap;margin-top:10px}
.draft{border:1px solid #E8DDD0;border-radius:14px;padding:12px;margin-bottom:12px;background:#FFFBF5}
.draft audio{width:100%;margin-top:8px}
small{color:#7A6A5E}
</style></head>
<body>
<header>
 <div class="logo">Sala <span>VIP</span> - gírias em voz</div>
 <div class="badge">{{ resumo }}</div>
</header>
<div class="aviso"><b>Antes de usar:</b> este servidor gera <b>áudio</b> (MP3). Não há vídeo, trilha nem montagem 1080x1920. O texto é enviado ao serviço de voz da Microsoft para virar som.</div>
<div class="main">
 <div class="card">
  <h2>1. Frase para narração</h2>
  <textarea id="frase">Oxe, esse kit tá arretado de bom, visse? Égua, olha a pavulagem desse mano no rolê, bah tchê que tri frio!</textarea>
  <h2 style="margin-top:16px">2. Voz</h2>
  <select id="cat">
   <option value="reels">Reels (Francisca)</option>
   <option value="vendas">Vendas (Thalita)</option>
   <option value="neutro">Neutro (Antonio)</option>
   <option value="nordeste">Nordeste</option>
   <option value="norte">Norte</option>
   <option value="sudeste">Sudeste</option>
   <option value="sul">Sul</option>
  </select>
  <div class="acoes">
   <button class="btn black" type="button" onclick="analisar()">Ver como será falado</button>
   <button class="btn terracota" type="button" onclick="gerar()">Gerar áudio</button>
  </div>
  <pre id="analise" aria-live="polite">Clique em "Ver como será falado".</pre>
  <h2 style="margin-top:18px">Gírias carregadas</h2>
  <div class="rail" id="rail"></div>
 </div>
 <div class="card">
  <h2>Áudios gerados</h2>
  <p><small>Aprovar move o MP3 para a pasta audios/. Rejeitar apaga.</small></p>
  <div id="drafts" style="margin-top:12px"></div>
 </div>
</div>
<script>
const GIRIAS = {{ girias_json|safe }};
const rail = document.getElementById('rail');
GIRIAS.forEach(g => {
  const b = document.createElement('button');
  b.className = 'pill'; b.type = 'button'; b.textContent = g.expressao;
  b.title = 'fala: ' + g.texto_fala;
  b.onclick = () => { const campo = document.getElementById('frase'); campo.value += ' ' + g.expressao; campo.focus(); };
  rail.appendChild(b);
});
async function analisar(){
  const texto = document.getElementById('frase').value;
  const r = await fetch('/api/preparar', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({texto})});
  const j = await r.json();
  document.getElementById('analise').textContent = j.fala || j.erro;
}
async function gerar(){
  const texto = document.getElementById('frase').value;
  const categoria = document.getElementById('cat').value;
  const alvo = document.getElementById('analise');
  alvo.textContent = 'Gerando... aguarde alguns segundos.';
  const r = await fetch('/api/gerar', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({texto, categoria})});
  const j = await r.json();
  alvo.textContent = j.erro ? ('Erro: ' + j.erro) : ('Pronto: ' + j.id);
  carregar();
}
async function carregar(){
  const r = await fetch('/api/previews');
  const lista = await r.json();
  const el = document.getElementById('drafts');
  el.innerHTML = '';
  if(!lista.length){ el.innerHTML = '<p><small>Nenhum áudio ainda.</small></p>'; return; }
  lista.forEach(d => {
    const div = document.createElement('div'); div.className = 'draft';
    const titulo = document.createElement('b'); titulo.textContent = d.id;
    const info = document.createElement('small'); info.textContent = ' · ' + d.categoria;
    const player = document.createElement('audio'); player.controls = true; player.src = '/temp/' + d.id + '.mp3';
    const fala = document.createElement('p'); const sub = document.createElement('small'); sub.textContent = d.fala.substring(0, 140); fala.appendChild(sub);
    const acoes = document.createElement('div'); acoes.className = 'acoes';
    const ok = document.createElement('button'); ok.className = 'btn black'; ok.type = 'button'; ok.textContent = 'Aprovar';
    ok.onclick = async () => { await fetch('/api/aprovar/' + d.id); carregar(); };
    const no = document.createElement('button'); no.className = 'btn'; no.type = 'button'; no.textContent = 'Rejeitar';
    no.onclick = async () => { await fetch('/api/rejeitar/' + d.id); carregar(); };
    acoes.append(ok, no);
    div.append(titulo, info, player, fala, acoes);
    el.appendChild(div);
  });
}
carregar();
</script>
</body></html>"""


@app.route("/")
def index():
    girias = [{"expressao": t, "texto_fala": f} for t, f in voz.DICIONARIO_FONEMAS.items()]
    return render_template_string(
        HTML,
        resumo=voz.resumo(),
        girias_json=json.dumps(girias, ensure_ascii=False),
    )


@app.route("/temp/<path:filename>")
def serve_temp(filename):
    return send_from_directory(PASTA_TEMP, filename)


@app.route("/audios/<path:filename>")
def serve_audio(filename):
    return send_from_directory(PASTA_AUDIOS, filename)


@app.route("/api/preparar", methods=["POST"])
def preparar():
    dados = request.get_json(silent=True) or {}
    texto = str(dados.get("texto", "")).strip()
    if not texto:
        return jsonify({"erro": "Texto vazio."}), 400
    return jsonify({"fala": voz.humanizar_texto(texto, str(dados.get("categoria", "reels")))})


@app.route("/api/previews")
def previews():
    itens = []
    for arq in PASTA_TEMP.glob("draft_*.json"):
        try:
            itens.append(json.loads(arq.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue
    itens.sort(key=lambda x: x.get("data", ""), reverse=True)
    return jsonify(itens)


@app.route("/api/gerar", methods=["POST"])
def gerar():
    dados = request.get_json(silent=True) or {}
    texto = str(dados.get("texto", "")).strip()
    categoria = str(dados.get("categoria", "reels"))
    if not texto:
        return jsonify({"erro": "Texto vazio."}), 400

    agora = datetime.now()
    idv = "draft_" + agora.strftime("%Y%m%d_%H%M%S_%f")
    destino = PASTA_TEMP / (idv + ".mp3")
    try:
        asyncio.run(voz.salvar_audio(texto, destino, categoria))
    except Exception as erro:
        return jsonify({"erro": str(erro)}), 502

    (PASTA_TEMP / (idv + ".json")).write_text(
        json.dumps({
            "id": idv,
            "texto_original": texto,
            "fala": voz.humanizar_texto(texto, categoria),
            "categoria": categoria,
            "data": agora.isoformat(),
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return jsonify({"id": idv})


def _idvalido(idv: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_\-]+", idv))


@app.route("/api/aprovar/<idv>")
def aprovar(idv):
    if not _idvalido(idv):
        return jsonify({"erro": "Identificador inválido."}), 400
    movidos = 0
    for arq in PASTA_TEMP.glob(idv + "*"):
        shutil.move(str(arq), str(PASTA_AUDIOS / arq.name.replace("draft_", "FINAL_")))
        movidos += 1
    if not movidos:
        return jsonify({"erro": "Áudio não encontrado."}), 404
    return jsonify({"ok": True})


@app.route("/api/rejeitar/<idv>")
def rejeitar(idv):
    if not _idvalido(idv):
        return jsonify({"erro": "Identificador inválido."}), 400
    for arq in PASTA_TEMP.glob(idv + "*"):
        arq.unlink(missing_ok=True)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print("=" * 58)
    print("Sala VIP - gírias em voz")
    print(voz.resumo())
    print("Endereço: http://127.0.0.1:5000")
    print("=" * 58)
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "5000")), debug=False)
