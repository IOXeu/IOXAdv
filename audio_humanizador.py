#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audio_humanizador.py - a única fonte das regras de gíria/fala.

Por que sem SSML: o edge-tts recusa marcação própria desde a versão 5.0, então
<sub alias>, <break> e <mstts:express-as> nunca chegavam ao áudio. A fonética
aqui é feita no texto: a gíria é trocada pela grafia que o serviço deve ler.

Uso direto:
    python audio_humanizador.py --exemplos
    python audio_humanizador.py --fala "Oxe, bah tchê, tudo demais"
    python audio_humanizador.py "Oxe, esse kit tá arretado" --voz reels -o saida.mp3
"""

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).parent
ARQ_DIC = BASE / "dicionario.json"
PASTA_AUDIOS = BASE / "audios"

VOZES = {
    "vendas": "pt-BR-ThalitaMultilingualNeural",
    "reels": "pt-BR-FranciscaNeural",
    "neutro": "pt-BR-AntonioNeural",
    "norte": "pt-BR-ThalitaMultilingualNeural",
    "nordeste": "pt-BR-FranciscaNeural",
    "sudeste": "pt-BR-AntonioNeural",
    "sul": "pt-BR-FranciscaNeural",
}

# edge-tts: rate em %, pitch em Hz.
AJUSTES = {
    "vendas": {"rate": "+0%", "pitch": "+18Hz"},
    "reels": {"rate": "+4%", "pitch": "+10Hz"},
    "neutro": {"rate": "+0%", "pitch": "+0Hz"},
    "norte": {"rate": "+3%", "pitch": "+8Hz"},
    "nordeste": {"rate": "+3%", "pitch": "+8Hz"},
    "sudeste": {"rate": "+1%", "pitch": "+0Hz"},
    "sul": {"rate": "+1%", "pitch": "+4Hz"},
}

EXTRAS = {"coraçãozinho": "coraçãumzí-nho", "gostosão": "gostozãum", "topzera": "topizêra"}

SUFIXOS = [
    (re.compile(r"\b(\w+)zinha\b", re.IGNORECASE), r"\1zí-nha"),
    (re.compile(r"\b(\w+)zinho\b", re.IGNORECASE), r"\1zí-nho"),
    (re.compile(r"\b(\w+)zão\b", re.IGNORECASE), r"\1zãum"),
]


def carregar_dicionario(caminho: Path = ARQ_DIC):
    """Aceita lista de registros ou dicionário de categorias. Devolve metadados e pares."""
    info = {"total": 0, "com_fala": 0, "sem_fala": [], "repetidas": 0, "arquivo": caminho.name}
    if not caminho.exists():
        info["erro"] = f"{caminho.name} não encontrado"
        return {}, info

    dados = json.loads(caminho.read_text(encoding="utf-8"))
    pares = {}

    def registrar(expressao, fala):
        chave = str(expressao).strip().lower()
        if not chave:
            return
        info["total"] += 1
        if not str(fala).strip():
            info["sem_fala"].append(str(expressao).strip())
            return
        if chave in pares:
            info["repetidas"] += 1
            return
        pares[chave] = str(fala).strip()
        info["com_fala"] += 1

    if isinstance(dados, list):
        for item in dados:
            if isinstance(item, dict):
                registrar(item.get("expressao") or item.get("termo") or "",
                          item.get("texto_fala") or item.get("fala") or "")
    elif isinstance(dados, dict):
        for categoria, grupo in dados.items():
            if isinstance(grupo, dict):
                for expressao, fala in grupo.items():
                    registrar(expressao, fala)
    else:
        info["erro"] = "formato não reconhecido"

    for termo, fala in EXTRAS.items():
        pares.setdefault(termo, fala)
    return pares, info


DICIONARIO_FONEMAS, INFO_DICIONARIO = carregar_dicionario()
TERMOS = sorted(DICIONARIO_FONEMAS, key=len, reverse=True)


def aplicar_fonemas(texto: str) -> str:
    """Troca cada gíria pela grafia falada. Texto puro, sem marcação."""
    saida = texto
    for termo in TERMOS:
        fala = DICIONARIO_FONEMAS[termo]
        if termo == fala.lower():
            continue
        padrao = re.compile(r"(?<![\wÀ-ÿ])" + re.escape(termo) + r"(?![\wÀ-ÿ])", re.IGNORECASE)
        saida = padrao.sub(fala, saida)
    for padrao, reposicao in SUFIXOS:
        saida = padrao.sub(reposicao, saida)
    return re.sub(r"\s+", " ", saida).strip()


def humanizar_texto(texto: str, categoria: str = "reels") -> str:
    limpo = re.sub(r"([^\W\d_])\1{2,}", r"\1", texto, flags=re.UNICODE)
    limpo = limpo.replace("...", ". ")
    return aplicar_fonemas(limpo)


async def salvar_audio(texto: str, caminho: Path, categoria: str = "reels") -> Path:
    import edge_tts

    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    ajuste = AJUSTES.get(categoria, AJUSTES["reels"])
    comunicador = edge_tts.Communicate(
        humanizar_texto(texto, categoria),
        voice=VOZES.get(categoria, VOZES["reels"]),
        rate=ajuste["rate"],
        pitch=ajuste["pitch"],
    )
    await comunicador.save(str(caminho))
    if not caminho.exists() or caminho.stat().st_size == 0:
        raise RuntimeError("O serviço de voz não devolveu áudio.")
    return caminho


EXEMPLOS = [
    "Égua, esse calor tá demais! Olha a pavulagem dele",
    "Oxe, esse kit tá arretado de bom, visse?",
    "Fala mano, tamo junto, vamos dar um rolê na quebrada?",
    "Bah tchê, que tri frio, guri!",
    "Promoção de gostosão, topzera, coraçãozinho",
]


def resumo() -> str:
    i = INFO_DICIONARIO
    if "erro" in i:
        return f"dicionário: {i['erro']}"
    linha = f"{i['com_fala']} gírias com fala definida (de {i['total']} registros)"
    if i["sem_fala"]:
        linha += f" · {len(i['sem_fala'])} sem texto_fala"
    if i["repetidas"]:
        linha += f" · {i['repetidas']} repetidas ignoradas"
    return linha


def main(argv=None):
    parser = argparse.ArgumentParser(description="Converte gírias na forma falada e gera MP3.")
    parser.add_argument("texto", nargs="?", help="frase a converter")
    parser.add_argument("--fala", metavar="TEXTO", help="só mostra como será falado, sem gerar áudio")
    parser.add_argument("--exemplos", action="store_true", help="converte as frases de teste")
    parser.add_argument("--voz", default="reels", choices=sorted(VOZES), help="categoria de voz")
    parser.add_argument("-o", "--saida", default=None, help="arquivo MP3 de saída")
    args = parser.parse_args(argv)

    print(resumo())

    if args.exemplos:
        for frase in EXEMPLOS:
            print(f"\noriginal: {frase}\nfalado:    {humanizar_texto(frase, args.voz)}")
        return 0
    if args.fala:
        print(humanizar_texto(args.fala, args.voz))
        return 0
    if not args.texto:
        parser.print_help()
        return 2

    destino = Path(args.saida) if args.saida else PASTA_AUDIOS / "narracao.mp3"
    try:
        asyncio.run(salvar_audio(args.texto, destino, args.voz))
    except ImportError:
        print("Falta o pacote: pip install edge-tts")
        return 1
    except Exception as erro:
        print(f"Falhou ao gerar áudio: {erro}")
        return 1
    print(f"Áudio salvo em {destino}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
