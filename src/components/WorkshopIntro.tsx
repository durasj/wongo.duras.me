import { ArrowDownRight, ArrowRight, BookOpen, Check, HardHat, Timer, Users } from 'lucide-react';

const copy = {
  sk: {
    kicker: 'Rodinná stavba · špeciál 2026',
    first: 'KAŽDÁ DŽURA', second: 'MÁ SVOJ DIELIK.',
    lead: 'Steny nechajte na pokoji. Dnes sa skladá na stole.',
    body: 'Tačustav nastupuje do služby: štyri farby, dve poschodia a celá rodina proti času. Otočiť, priložiť, zašpekulovať. A hlavne nenechať žiadnu džuru.',
    start: 'Ideme na stavbu', rules: 'Najprv školenie',
    players: '2–8 majstrov', rounds: '9 kôl', layers: '2 poschodia',
    stamp: 'RODINA STAVIA. ČAS BEŽÍ.', note: 'Dozor zabezpečený. Výsledok je na vás.',
    strip: ['BÚRAME REKORDY', 'SKLADÁME DIELIKY', 'DŽURY NEPREBERÁME'],
    caption: 'PARTIA JE PRIPRAVENÁ. A VY?',
  },
  en: {
    kicker: 'Family construction crew · 2026 special',
    first: 'EVERY GAP', second: 'HAS ITS PIECE.',
    lead: 'Leave the walls alone. Today we build on the table.',
    body: 'Tačustav is on the job: four colours, two layers, and the whole family against the clock. Turn it, try it, think it through. No gaps left behind.',
    start: 'Let’s get building', rules: 'Read the site briefing',
    players: '2–8 builders', rounds: '9 rounds', layers: '2 layers',
    stamp: 'FAMILY BUILDS. CLOCK TICKS.', note: 'Site supervision included. The rest is up to you.',
    strip: ['BREAK RECORDS', 'BUILD WITH PIECES', 'LEAVE NO GAPS'],
    caption: 'THE CREW IS READY. ARE YOU?',
  },
};

export function WorkshopIntro({language, onStart, onRules}: {language:'en'|'sk';onStart:()=>void;onRules:()=>void}) {
  const t=copy[language];
  return <section className="workshop-intro" aria-label={language==='sk'?'Vitajte na stavbe Tačustav':'Welcome to the Tačustav building site'}>
    <div className="workshop-hero">
      <div className="workshop-copy">
        <div className="site-kicker"><HardHat size={17}/>{t.kicker}</div>
        <div className="workshop-wordmark">WONGO<span>× TAČUSTAV</span></div>
        <h1>{t.first}<br/><span>{t.second}</span></h1>
        <p className="workshop-lead">{t.lead}</p><p className="workshop-description">{t.body}</p>
        <div className="workshop-actions"><button className="primary-button" onClick={onStart}>{t.start}<ArrowDownRight size={19}/></button><button className="site-rules-link" onClick={onRules}><BookOpen size={17}/>{t.rules}<ArrowRight size={15}/></button></div>
        <div className="crew-specs"><span><Users size={16}/>{t.players}</span><span><Timer size={16}/>{t.rounds}</span><span><HardHat size={16}/>{t.layers}</span></div>
      </div>
      <figure className="workshop-portrait"><img src="/art/tacustav-workshop.webp" width="1024" height="1536" fetchPriority="high" alt={language==='sk'?'Rodinná partia Tačustav skladá farebné hlavolamy pri pracovnom stole. Labrador v prilbe dozerá na stavbu.':'The Tačustav family crew builds colourful block puzzles at a workbench, supervised by a Labrador in a hard hat.'}/><figcaption>{t.caption}</figcaption><span className="site-stamp"><Check size={22}/>{language==='sk'?'DOZOR\nSCHVÁLIL':'SITE\nAPPROVED'}</span></figure>
    </div>
    <div className="site-tape" aria-label={t.stamp}>{t.strip.map(item=><span key={item}><Check size={16}/>{item}</span>)}</div>
    <div className="site-bottom-line"><strong>{t.stamp}</strong><span>{t.note}</span></div>
  </section>;
}
