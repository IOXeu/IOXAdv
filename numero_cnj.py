#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
numero_cnj.py - interpreta e valida o Numero Unico do processo (Resolucao CNJ 65/2008).

Estrutura: NNNNNNN-DD.AAAA.J.TR.OOOO  (20 digitos)
  NNNNNNN  numero sequencial da unidade de origem
  DD       digitos verificadores (modulo 97, ISO 7064)
  AAAA     ano do ajuizamento
  J        segmento do Judiciario
  TR       tribunal do segmento
  OOOO     unidade de origem

Uso:
    python numero_cnj.py "1067264-08.2023.8.26.0100"
    python numero_cnj.py --teste
"""

import re
import sys
import unicodedata

SEGMENTOS = {
    "1": "Supremo Tribunal Federal",
    "2": "Conselho Nacional de Justica",
    "3": "Superior Tribunal de Justica",
    "4": "Justica Federal",
    "5": "Justica do Trabalho",
    "6": "Justica Eleitoral",
    "7": "Justica Militar da Uniao",
    "8": "Justica dos Estados e do DF",
    "9": "Justica Militar Estadual",
}

EXTENSO = {
    "zero": "0", "um": "1", "dois": "2", "tres": "3", "quatro": "4", "cinco": "5",
    "seis": "6", "sete": "7", "oito": "8", "nove": "9",
    "vinte": "20", "trinta": "30", "quarenta": "40", "cinquenta": "50",
    "sessenta": "60", "setenta": "70", "oitenta": "80", "noventa": "90",
    "cem": "100", "cento": "100", "duzentos": "200", "duzentas": "200",
    "trezentos": "300", "quatrocentos": "400", "quinhentos": "500",
    "seiscentos": "600", "setecentos": "700", "oitocentos": "800", "novecentos": "900",
}


def sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texto) if not unicodedata.combining(c))


def somente_digitos(texto: str) -> str:
    """Aceita numero formatado, numero corrido ou digitos falados por extenso."""
    bruto = sem_acento(str(texto)).lower()
    for palavra, digito in sorted(EXTENSO.items(), key=lambda x: len(x[0]), reverse=True):
        bruto = re.sub(r"\b" + palavra + r"\b", " " + digito + " ", bruto)
    return re.sub(r"\D", "", bruto)


def reordenar(digitos: str) -> str:
    """Res. 65/2008: os verificadores vao para o fim (N AAAA J TR OOOO DD)."""
    return digitos[0:7] + digitos[9:20] + digitos[7:9]


def validar(digitos: str) -> bool:
    """Modulo 97 base 10 (ISO 7064): com DD no fim, o resto deve ser 1."""
    return len(digitos) == 20 and int(reordenar(digitos)) % 97 == 1


def verificador_esperado(digitos: str) -> str:
    corpo = digitos[0:7] + digitos[9:20]
    return f"{98 - (int(corpo) * 100) % 97:02d}"


def interpretar(texto: str) -> dict:
    digitos = somente_digitos(texto)
    if len(digitos) != 20:
        return {"ok": False, "erro": f"esperava 20 digitos, achei {len(digitos)}", "digitos": digitos}

    nnnnnnn, dd, aaaa = digitos[0:7], digitos[7:9], digitos[9:13]
    j, tr, oooo = digitos[13], digitos[14:16], digitos[16:20]

    if not aaaa.isdigit() or not (1900 <= int(aaaa) <= 2100):
        return {"ok": False, "erro": f"ano fora de faixa: {aaaa}", "digitos": digitos}
    if j not in SEGMENTOS:
        return {"ok": False, "erro": f"segmento invalido: {j}", "digitos": digitos}

    valido = validar(digitos)
    return {
        "ok": valido,
        "digitos": digitos,
        "formatado": f"{nnnnnnn}-{dd}.{aaaa}.{j}.{tr}.{oooo}",
        "sequencial": nnnnnnn,
        "verificador": dd,
        "ano": int(aaaa),
        "segmento": j,
        "segmento_nome": SEGMENTOS[j],
        "tribunal": tr,
        "origem": oooo,
        "verificador_correto": None if valido else verificador_esperado(digitos),
        "erro": None if valido else "digito verificador nao confere",
    }


def explicar(texto: str) -> str:
    r = interpretar(texto)
    if not r.get("ok"):
        if len(r.get("digitos", "")) != 20:
            return f"NAO ENTENDI: {r['erro']}"
        extra = f"\n  se o resto estiver certo, o DD seria {r['verificador_correto']}"
        return (f"NUMERO INVALIDO: {r['formatado']}\n"
                f"  motivo: {r['erro']}{extra}\n"
                f"  NAO ABRA O PROCESSO: confira e repita")
    return (f"{r['formatado']}\n"
            f"  sequencial : {r['sequencial']}\n"
            f"  ano        : {r['ano']}\n"
            f"  segmento   : {r['segmento']} - {r['segmento_nome']}\n"
            f"  tribunal   : {r['tribunal']}\n"
            f"  origem     : {r['origem']}\n"
            f"  conferencia: digito verificador OK")


TESTES = [
    "1067264-08.2023.8.26.0100",
    "1095132-58.2023.8.26.0100",
    "0001234-56.2026.8.26.0100",
    "um zero seis sete dois seis quatro zero oito dois zero dois tres oito dois seis zero um zero zero",
    "123",
]

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "--teste":
        for t in TESTES:
            print(f"\n> {t}\n{explicar(t)}")
    else:
        print(explicar(" ".join(sys.argv[1:])))
