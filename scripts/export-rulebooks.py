from pathlib import Path
import re,html,json
ROOT=Path(__file__).resolve().parents[1]
EDITIONS=json.loads((ROOT/'src/data/editions.json').read_text())
def inline(s):
    s=html.escape(s)
    s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'<a href="\2">\1</a>',s)
    return re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
def md(text):
    lines=text.splitlines();out=[];i=0
    while i<len(lines):
        s=lines[i]
        if not s: i+=1;continue
        if s.startswith('#'):
            h=len(s)-len(s.lstrip('#'));out.append(f'<h{h}>{inline(s[h:].strip())}</h{h}>');i+=1
        elif s=='---':out.append('<hr>');i+=1
        elif s.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                row=[x.strip() for x in lines[i].strip('|').split('|')];i+=1
                if all(re.fullmatch(r':?-+:?',x) for x in row):continue
                tag='th' if not rows else 'td';rows.append('<tr>'+''.join(f'<{tag}>{inline(x)}</{tag}>' for x in row)+'</tr>')
            out.append('<table>'+''.join(rows)+'</table>')
        elif re.match(r'(- |\d+\. )',s):
            ordered=bool(re.match(r'\d+\. ',s));tag='ol' if ordered else 'ul';items=[]
            while i<len(lines) and re.match(r'(- |\d+\. )',lines[i]):
                items.append('<li>'+inline(re.sub(r'^(- |\d+\. )','',lines[i]))+'</li>');i+=1
            out.append(f'<{tag}>'+''.join(items)+f'</{tag}>')
        else:
            para=[s];i+=1
            while i<len(lines) and lines[i] and not re.match(r'(#|\||- |\d+\. )',lines[i]):para.append(lines[i]);i+=1
            out.append('<p>'+inline(' '.join(para))+'</p>')
    return '\n'.join(out)
PALETTE={p['color']:p['hex'] for p in json.loads((ROOT/'src/data/pieces.json').read_text())}
css=(ROOT/'scripts/rulebook-style.css').read_text()
css+=':root{'+''.join(f'--filament-{color}:{value};' for color,value in PALETTE.items())+'}'

def cover(lang,edition,config):
    special=edition=='tacustav-2026'
    sk=lang=='sk'
    kicker=('Rodinný 3D hlavolam' if sk else 'A family 3D puzzle game')
    title=('KAŽDÁ DŽURA MÁ SVOJ DIELIK.' if sk else 'EVERY GAP HAS ITS PIECE.') if special else ('Dobré veci do seba zapadnú.' if sk else 'Good things fit together.')
    subtitle=('Pravidlá stavby · Slovenské vydanie' if sk else 'Site rules · English edition') if special else ('Rodinné pravidlá · Slovenské vydanie' if sk else 'Family rulebook · English edition')
    specs='2–8 hráčov / 9 kôl / 2 poschodia' if sk else '2–8 players / 9 rounds / 2 layers'
    alt=('Rodinná partia Tačustav skladá hlavolamy s labradorom v prilbe.' if sk else 'The Tačustav family crew builds puzzles with a Labrador in a hard hat.') if special else ('Farebné priestorové dieliky Wongo na svetlom stole.' if sk else 'Colourful Wongo block pieces on a light tabletop.')
    edition_label='TAČUSTAV EDITION <span class="cover-year">2026</span>' if special else ('Klasická edícia' if sk else 'Classic edition')
    play='Hrať online' if sk else 'Play online'
    qr=f'<a class="cover-access" href="{config["url"]}"><img class="cover-qr" src="/art/qr-{edition}.svg" width="132" height="132" alt="{play}: {config["url"]}"><strong>{play}</strong><span>wongo.duras.me</span></a>'
    return f'<section class="rulebook-cover" aria-label="{subtitle}"><img class="cover-art" src="{config["artwork"]}" width="1024" height="1536" alt="{alt}"><header class="cover-heading"><span class="cover-kicker">{kicker}</span><h1>WONGO</h1><div class="cover-edition">{edition_label}</div></header>{qr}<div class="cover-caption"><h2>{title}</h2><p>{subtitle}</p><p class="cover-specs">{specs}</p></div></section>'

for edition,config in EDITIONS.items():
    destination=ROOT/'public'/config['rulesPath'].lstrip('/')
    destination.mkdir(parents=True,exist_ok=True)
    for lang,break1,break2,title,printlabel,back,section in [
    ('en','## The building challenge','## Use the virtual puzzle library','Family rulebook','Print rulebook','Back to Wongo','Rules'),
    ('sk','## Úloha pri skladaní','## Virtuálna knižnica zadaní','Rodinné pravidlá','Vytlačiť pravidlá','Späť na Wongo','Pravidlá')]:
        source=(ROOT/f'docs/rulebook-{lang}.md').read_text();a,rest=source.split(break1,1);b,c=rest.split(break2,1);pages=[a,break1+b,break2+c]
        body=''.join(f'<section class="sheet"><div class="brand"><span>{html.escape(config["name"])}</span><span class="mark">2–8 players · 9 rounds</span></div>{md(p)}<footer class="folio"><span>WONGO 3D · {section} · {lang.upper()}</span><span>{i+2} / 4</span></footer></section>' for i,p in enumerate(pages))
        if lang=='sk':body=body.replace('2–8 players · 9 rounds','2–8 hráčov · 9 kôl')
        body=cover(lang,edition,config)+body
        pdf_label='Stiahnuť PDF' if lang=='sk' else 'Download PDF'
        result=f'<!doctype html>\n<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(config["name"])} — {title}</title><style>{css}</style></head><body data-edition="{edition}"><nav class="toolbar" aria-label="{title}"><a href="{config["url"]}">← {back}</a><div class="toolbar-actions"><a class="pdf-download" href="rulebook-{lang}.pdf" download>{pdf_label}</a><button type="button" onclick="window.print()">{printlabel}</button></div></nav><main>{body}</main></body></html>\n'
        (destination/f'rulebook-{lang}.html').write_text(result)
print('Generated both editions in English and Slovak: illustrated cover + 3 A4 rules pages each.')
