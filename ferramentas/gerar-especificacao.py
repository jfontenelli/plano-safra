"""
Gera a Especificação Funcional (.docx) a partir dos .md de docs/desenvolvimento/, no modelo da empresa.

  python ferramentas/gerar-especificacao.py

- Modelo: ferramentas/especificacao/modelo.docx (cópia do crm/CH 00000.doc salva como .docx). O cabeçalho, os
  participantes, o rodapé e o histórico de revisão vêm do modelo.
- Preenche as seções 1 Objetivo, 2 Atores, 3 Escopo, 4 Análise de impacto (um arquivo por tela, em ordem),
  5 Observações técnicas e 6 Plano de testes (os "Cenários de teste" de cada tela, juntados aqui).
- Saída: crm/Especificacao-Funcional-Plano-de-Safra.docx (gerado de novo a cada vez: corrigir sempre nos .md).
- Precisa do python-docx (pip install python-docx).
"""
import copy
import re
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / 'docs' / 'desenvolvimento'
MODELO = RAIZ / 'ferramentas' / 'especificacao' / 'modelo.docx'
SAIDA = RAIZ / 'crm' / 'Especificacao-Funcional-Plano-de-Safra.docx'
LARGURA_IMAGEM = Cm(16)

# Títulos de seção do modelo (Heading 1, numerados pelo próprio Word) → arquivo .md de cada seção
SECOES = [
    ('objetivo', '01-objetivo.md'),
    ('atores envolvidos', '02-atores.md'),
    ('escopo', '03-escopo.md'),
    ('análise de impacto', None),       # 04-analise-de-impacto/*.md
    ('observações técnicas', '05-observacoes-tecnicas.md'),
    ('plano de testes', None),          # "Cenários de teste" de cada tela
]
TITULO_TESTES = 'cenários de teste'


# ---------- Leitura do .md em blocos simples ----------
def blocos_md(texto):
    """Devolve [(tipo, dados)]: titulo (nível, texto), par, lista (ordenada, itens), tabela (linhas), imagem, nota."""
    texto = re.sub(r'<!--.*?-->', '', texto, flags=re.S)  # comentários da revisão não vão para o Word
    linhas = texto.splitlines()
    out, i = [], 0
    while i < len(linhas):
        l = linhas[i].rstrip()
        if not l.strip():
            i += 1; continue
        m = re.match(r'^(#{1,6})\s+(.*)', l)
        if m:
            out.append(('titulo', (len(m.group(1)), m.group(2).strip()))); i += 1; continue
        m = re.match(r'^!\[(.*?)\]\((.*?)\)\s*$', l.strip())
        if m:
            out.append(('imagem', (m.group(1), m.group(2)))); i += 1; continue
        if l.lstrip().startswith('|'):
            tab = []
            while i < len(linhas) and linhas[i].lstrip().startswith('|'):
                celulas = [c.strip() for c in linhas[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-{2,}:?', c) for c in celulas):
                    tab.append(celulas)
                i += 1
            out.append(('tabela', tab)); continue
        if re.match(r'^\s*([-*]|\d+\.)\s+', l):
            ordenada = bool(re.match(r'^\s*\d+\.', l)); itens = []
            while i < len(linhas) and re.match(r'^\s*([-*]|\d+\.)\s+', linhas[i]):
                itens.append(re.sub(r'^\s*([-*]|\d+\.)\s+', '', linhas[i]).strip()); i += 1
            out.append(('lista', (ordenada, itens))); continue
        if l.startswith('>'):
            nota = []
            while i < len(linhas) and linhas[i].startswith('>'):
                nota.append(linhas[i].lstrip('>').strip()); i += 1
            out.append(('nota', ' '.join(nota))); continue
        par = [l.strip()]; i += 1
        while i < len(linhas) and linhas[i].strip() and not re.match(r'^(#|\||!\[|>|\s*([-*]|\d+\.)\s)', linhas[i]):
            par.append(linhas[i].strip()); i += 1
        out.append(('par', ' '.join(par)))
    return out


# ---------- Escrita no Word ----------
def runs(p, texto, base_italico=False, tamanho=None):
    """Texto com **negrito**, *itálico* e `código` em runs."""
    for parte in re.split(r'(\*\*.+?\*\*|`.+?`|\*[^*]+?\*)', texto):
        if not parte:
            continue
        negrito = parte.startswith('**') and parte.endswith('**')
        italico = not negrito and parte.startswith('*') and parte.endswith('*')
        codigo = parte.startswith('`') and parte.endswith('`')
        conteudo = parte[2:-2] if negrito else parte[1:-1] if (italico or codigo) else parte
        r = p.add_run(conteudo)
        r.bold = negrito or None
        r.italic = (italico or base_italico) or None
        if codigo:
            r.font.name = 'Consolas'
        if tamanho:
            r.font.size = tamanho


class Escritor:
    """Insere parágrafos, títulos, listas, tabelas e imagens logo antes de um elemento do modelo."""

    def __init__(self, doc, ancora, base_md):
        self.doc, self.ancora, self.base = doc, ancora, base_md

    def _por(self, el):
        self.ancora.addprevious(el)
        return el

    def paragrafo(self, estilo=None):
        p = self.doc.add_paragraph(style=estilo)
        self._por(p._p)
        return p

    def texto(self, t, recuo=True):
        p = self.paragrafo()
        pf = p.paragraph_format
        pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        pf.line_spacing = 1.5
        pf.space_after = Pt(4)
        if recuo:
            pf.first_line_indent = Cm(0.76)
        runs(p, t)

    def titulo(self, nivel, t):
        p = self.paragrafo('Heading 2' if nivel <= 1 else 'Heading 3')
        p.paragraph_format.space_before = Pt(14 if nivel <= 1 else 10)
        p.paragraph_format.space_after = Pt(4)
        runs(p, t)
        if nivel <= 1:
            p.paragraph_format.page_break_before = False

    def nota(self, t):
        p = self.paragrafo()
        p.paragraph_format.left_indent = Cm(0.6)
        p.paragraph_format.space_after = Pt(6)
        runs(p, t, base_italico=True, tamanho=Pt(10))

    def lista(self, ordenada, itens):
        for n, item in enumerate(itens, 1):
            p = self.paragrafo()
            pf = p.paragraph_format
            pf.left_indent = Cm(1.0); pf.first_line_indent = Cm(-0.5); pf.space_after = Pt(2); pf.line_spacing = 1.3
            p.add_run(f'{n}.\t' if ordenada else '•\t')
            runs(p, item)

    def tabela(self, linhas):
        if not linhas:
            return
        n = max(len(l) for l in linhas)
        t = self.doc.add_table(rows=len(linhas), cols=n)
        t.style = self.doc.styles['Table Grid']
        for i, l in enumerate(linhas):
            for j in range(n):
                cel = t.cell(i, j); p = cel.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                runs(p, l[j] if j < len(l) else '', tamanho=Pt(9.5))
                if i == 0:
                    for r in p.runs:
                        r.bold = True
                    sombra = OxmlElement('w:shd')
                    sombra.set(qn('w:val'), 'clear'); sombra.set(qn('w:color'), 'auto'); sombra.set(qn('w:fill'), 'E6E6E6')
                    cel._tc.get_or_add_tcPr().append(sombra)
        self._por(t._tbl)
        self.paragrafo().paragraph_format.space_after = Pt(2)

    def imagem(self, alt, caminho):
        arq = (self.base / caminho).resolve()
        if not arq.exists():
            self.nota(f'[imagem não encontrada: {caminho}]'); return
        p = self.paragrafo()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(arq), width=LARGURA_IMAGEM)
        if alt:
            leg = self.paragrafo(); leg.alignment = WD_ALIGN_PARAGRAPH.CENTER
            runs(leg, alt, base_italico=True, tamanho=Pt(9))

    def blocos(self, bs, pular_primeiro_titulo=True, nivel_base=0):
        for k, (tipo, dados) in enumerate(bs):
            if tipo == 'titulo':
                nivel, t = dados
                if pular_primeiro_titulo and k == 0 and nivel == 1:
                    continue  # "# 3 Escopo": a seção já tem o título do modelo
                self.titulo(nivel - 1 + nivel_base, t)
            elif tipo == 'par':
                self.texto(dados)
            elif tipo == 'lista':
                self.lista(*dados)
            elif tipo == 'tabela':
                self.tabela(dados)
            elif tipo == 'imagem':
                self.imagem(*dados)
            elif tipo == 'nota':
                self.nota(dados)


def separar_testes(bs):
    """Tira a parte "## Cenários de teste" da tela; devolve (blocos da tela, blocos dos testes)."""
    tela, testes, nos_testes = [], [], False
    for b in bs:
        if b[0] == 'titulo' and b[1][0] == 2:
            nos_testes = b[1][1].strip().lower() == TITULO_TESTES
            if nos_testes:
                continue
        (testes if nos_testes else tela).append(b)
    return tela, testes


def normalizar(t):
    return re.sub(r'\s+', ' ', t).strip().lower()


def main():
    doc = docx.Document(str(MODELO))
    corpo = doc.element.body
    filhos = list(corpo.iterchildren())

    # Posição de cada título de seção (Heading 1) no modelo
    titulos = {}
    for el in filhos:
        if el.tag == qn('w:p'):
            p = docx.text.paragraph.Paragraph(el, doc)
            if p.style is not None and p.style.name == 'Heading 1':
                titulos[normalizar(p.text)] = el

    # Telas da Análise de impacto, em ordem do nome do arquivo
    telas = []
    for arq in sorted((FONTE / '04-analise-de-impacto').glob('*.md')):
        if arq.name.lower() == 'readme.md':
            continue
        tela, testes = separar_testes(blocos_md(arq.read_text(encoding='utf-8')))
        nome = next((d[1] for t, d in tela if t == 'titulo' and d[0] == 1), arq.stem)
        telas.append((arq, nome, tela, testes))

    for chave, arquivo in SECOES:
        h1 = titulos.get(chave)
        if h1 is None:
            raise SystemExit(f'Seção "{chave}" não encontrada no modelo.')
        # Apaga o conteúdo do modelo até o próximo Heading 1 ou tabela (o histórico de revisão)
        el = h1.getnext()
        while el is not None:
            if el.tag == qn('w:tbl'):
                break
            if el.tag == qn('w:p') and el in titulos.values():
                break
            if el.tag == qn('w:sectPr'):
                break
            prox = el.getnext(); corpo.remove(el); el = prox
        ancora = el
        if chave == 'análise de impacto':
            for arq, nome, tela, _ in telas:
                esc = Escritor(doc, ancora, arq.parent)
                esc.titulo(1, nome.replace('#', '').strip())
                esc.blocos(tela, pular_primeiro_titulo=True, nivel_base=1)
            if not telas:
                Escritor(doc, ancora, FONTE).texto('(a fazer)')
        elif chave == 'plano de testes':
            com_testes = [t for t in telas if t[3]]
            for arq, nome, _, testes in com_testes:
                esc = Escritor(doc, ancora, arq.parent)
                esc.titulo(1, nome)
                esc.blocos(testes, pular_primeiro_titulo=False)
            if not com_testes:
                Escritor(doc, ancora, FONTE).texto('(a fazer)')
        else:
            md = FONTE / arquivo
            Escritor(doc, ancora, md.parent).blocos(blocos_md(md.read_text(encoding='utf-8')))
        Escritor(doc, ancora, FONTE).paragrafo()  # respiro antes da próxima seção

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(SAIDA))
    print(f'Gerado: {SAIDA.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
