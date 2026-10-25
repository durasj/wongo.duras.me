from pathlib import Path
import re,html,json
ROOT=Path(__file__).resolve().parents[1]
EDITION=json.loads((ROOT/'src/data/edition.json').read_text())['name']
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
css='''
:root{--ink:#173d3a;--muted:#566c69;--paper:#fffef9;--accent:#efb844;--line:#d9e2da}*{box-sizing:border-box}body{margin:0;background:#e9eee8;color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.5}.toolbar{max-width:210mm;margin:20px auto;display:flex;align-items:center;justify-content:space-between;padding:0 8px;gap:16px}.toolbar a{color:var(--ink)}button{border:0;border-radius:100px;padding:12px 22px;background:var(--ink);color:white;font:inherit;cursor:pointer}.sheet{width:210mm;min-height:297mm;margin:20px auto;padding:17mm 18mm 16mm;background:var(--paper);box-shadow:0 3px 24px #173d3a13;position:relative}.brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--ink);padding-bottom:10px;margin-bottom:20px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}.mark{background:var(--accent);padding:3px 9px;letter-spacing:.08em}h1{font-size:42px;letter-spacing:-.055em;line-height:1.1;margin:0 0 8px}h2{font-size:19px;line-height:1.25;margin:23px 0 10px;letter-spacing:-.025em}h1+h2{font-size:13px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 24px}p{margin:0 0 12px}ul,ol{padding-left:21px;margin:8px 0 14px}li{padding-left:3px;margin:6px 0}strong{font-weight:750}table{border-collapse:collapse;width:100%;margin:14px 0 12px;font-size:13px}th,td{border-bottom:1px solid var(--line);padding:7px 10px;text-align:left}th{background:#edf1e9}th:last-child,td:last-child{text-align:right}a{color:#267669;text-underline-offset:3px}hr{border:0;border-top:1px solid var(--line);margin:22px 0}.folio{position:absolute;bottom:10mm;left:18mm;right:18mm;display:flex;justify-content:space-between;color:var(--muted);font-size:10px;letter-spacing:.05em}.sheet>p:last-of-type{margin-bottom:15px}@page{size:A4;margin:0}@media print{body{background:white;font-size:10pt;line-height:1.42}.toolbar{display:none}.sheet{margin:0;box-shadow:none;width:210mm;height:297mm;min-height:0;padding:15mm 17mm 17mm;break-after:page;overflow:visible}.sheet:last-child{break-after:auto}.brand{margin-bottom:16px}h1{font-size:32pt}h2{font-size:14pt;margin-top:17px;break-after:avoid}h1+h2{font-size:9pt;margin-bottom:18px}p{margin-bottom:9px}li{margin:5px 0}table{font-size:9.5pt}th,td{padding:5px 9px}a{color:inherit;text-decoration:none}h2,p,li{orphans:2;widows:2}table{break-inside:avoid}.folio{bottom:9mm;left:17mm;right:17mm;font-size:8pt}}@media screen and (max-width:840px){.toolbar{margin:16px}.sheet{width:calc(100% - 24px);min-height:0;padding:28px;margin:12px;}.folio{position:static;margin-top:32px}.brand{font-size:10px}h1{font-size:34px}}
'''
for lang,break1,break2,title,printlabel,back,section in [
('en','## The building challenge','## Use the virtual puzzle library','Family rulebook','Print rulebook','Back to Wongo','Rules'),
('sk','## Úloha pri skladaní','## Virtuálna knižnica zadaní','Rodinné pravidlá','Vytlačiť pravidlá','Späť na Wongo','Pravidlá')]:
    source=(ROOT/f'docs/rulebook-{lang}.md').read_text();a,rest=source.split(break1,1);b,c=rest.split(break2,1);pages=[a,break1+b,break2+c]
    body=''.join(f'<section class="sheet"><div class="brand"><span>Wongo / 3D</span><span class="mark">4–8 players · 9 rounds</span></div>{md(p)}<footer class="folio"><span>WONGO 3D · {section} · {lang.upper()}</span><span>{i+1} / 3</span></footer></section>' for i,p in enumerate(pages))
    if lang=='sk':body=body.replace('4–8 players · 9 rounds','4–8 hráčov · 9 kôl')
    body=body.replace('Wongo / 3D',html.escape(EDITION))
    result=f'<!doctype html>\n<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(EDITION)} — {title}</title><style>{css}</style></head><body><nav class="toolbar" aria-label="{title}"><a href="/">← {back}</a><button type="button" onclick="window.print()">{printlabel}</button></nav><main>{body}</main></body></html>\n'
    (ROOT/f'public/downloads/rulebook-{lang}.html').write_text(result)
print('Generated English and Slovak rulebooks: 3 A4 pages each.')
