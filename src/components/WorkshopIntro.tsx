import { ArrowDownRight, ArrowRight, BookOpen, Check, HardHat, Timer, Users } from 'lucide-react';
import { RealCrew } from './RealCrew';

const copy = {
  sk: {
    kicker: 'Rodinná stavba · špeciál 2026',
    first: 'ROBÍME BORDEL.', second: 'ABY TO ZAPADLO!',
    lead: 'Najlacnejšia pracovná sila? Rodina.',
    body: 'Štyri farby, dve poschodia, deväť kôl. Staviame, búrame, trápime sa. Ale vždy po našom! Keď zostane džura, nie je to problém. Je to dizajn.',
    start: 'Bordel na počkanie', rules: 'Najprv školenie',
    players: '2–8 majstrov', rounds: '9 kôl', layers: '2 poschodia',
    stamp: 'PRÁCA NÁS BAVÍ. A VÁS BUDE VÝSLEDOK!', note: 'Záruka prekvapenia je v cene. Výhra nie.',
    strip: ['NEVIDITEĽNÉ RIEŠENIA', 'VIDITEĽNÝ NEPORIADOK', 'ZÁRUKA PREKVAPENIA'],
    caption: 'PARTIA JE PRIPRAVENÁ. A VY?',
  },
  en: {
    kicker: 'Family construction crew · 2026 special',
    first: 'WE MAKE A MESS.', second: 'THEN MAKE IT FIT!',
    lead: 'The cheapest workforce? Family.',
    body: 'Four colours, two layers, nine rounds. We build, demolish and struggle. Always our way! If there’s a gap left, it’s not a problem. It’s a design feature.',
    start: 'One mess, coming up', rules: 'Read the site briefing',
    players: '2–8 builders', rounds: '9 rounds', layers: '2 layers',
    stamp: 'WE ENJOY THE WORK. YOU’LL ENJOY THE RESULT!', note: 'Surprises included. Victory sold separately.',
    strip: ['INVISIBLE SOLUTIONS', 'VISIBLE MESS', 'SURPRISES GUARANTEED'],
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
      <div className="workshop-portrait workshop-portrait--photos"><RealCrew language={language}/><span className="site-stamp"><Check size={22}/>{language==='sk'?'AXEL SCHVÁLIL!\nASI.':'AXEL APPROVED!\nPROBABLY.'}</span></div>
    </div>
    <div className="site-tape" aria-label={t.stamp}>{t.strip.map(item=><span key={item}><Check size={16}/>{item}</span>)}</div>
    <div className="site-bottom-line"><strong>{t.stamp}</strong><span>{t.note}</span></div>
    <div className="workshop-promises" aria-label={language==='sk'?'Sľuby stavebnej partie':'The crew’s promises'}>
      <article><span>01 / {language==='sk'?'DŽURY':'GAPS'}</span><h2>{language==='sk'?'Aj tam, kde ich nechcete.':'Even where you don’t want them.'}</h2><p>{language==='sk'?'Na plagáte služba. Na vašej hracej ploche reklamácia.':'A service on the poster. A complaint on your puzzle board.'}</p></article>
      <article><span>02 / {language==='sk'?'OMIETKY':'PLASTER'}</span><h2>{language==='sk'?'Za nimi sa skrývajú hriechy.':'They hide a multitude of sins.'}</h2><p>{language==='sk'?'Dieliky sú priehľadné iba v náhľade. Chyby pred rodinou neschováte.':'Only the preview pieces turn transparent. Your family will still spot the mistakes.'}</p></article>
      <article><span>03 / {language==='sk'?'SEBECHVÁLENIE':'SELF-PRAISE'}</span><h2>{language==='sk'?'Na max. Bez príplatku.':'Maximum. No extra charge.'}</h2><p>{language==='sk'?'Keď to zapadne, povedzte všetkým, že ste to vedeli od začiatku.':'When it finally fits, tell everyone you knew it all along.'}</p></article>
    </div>
  </section>;
}
