import type { CSSProperties, ReactNode } from 'react';
import photographs from '../data/tacustav-photos.json';
type Language='en'|'sk';

/** Exact regions of uploaded posters; faces and bodies are never redrawn. */
export function SourcePhoto({id,language,compact=false}:{id:string;language:Language;compact?:boolean}) {
  const person=photographs.crew.find(candidate=>candidate.id===id);
  if(!person)return null;
  const source=photographs.sources[person.source as keyof typeof photographs.sources];
  const [x,y,width,height]=person.crop;
  const imageStyle:CSSProperties={width:`${source.width/width*100}%`,left:`${-x/width*100}%`,top:`${-y/height*100}%`};
  return <div className="crew-photo-crop" style={{aspectRatio:`${width}/${height}`}}>
    <img src={source.src} width={source.width} height={source.height} style={imageStyle} alt={person.alt[language]} loading={compact?'lazy':'eager'}/>
  </div>;
}

export function RealCrew({language,compact=false}:{language:Language;compact?:boolean}) {
  return <div className={`real-crew${compact?' real-crew--compact':''}`} aria-label={language==='sk'?'Partia Tačustav':'The Tačustav crew'}>
    <div className="crew-paper-lines" aria-hidden="true"/>
    {photographs.crew.map(person=><figure className={`crew-photo crew-photo--${person.id}`} key={person.id}>
      <SourcePhoto id={person.id} language={language} compact={compact}/><figcaption>{person.caption[language]}</figcaption>
    </figure>)}
    <span className="crew-tape-label">{language==='sk'?'PRACOVNÁ SILA: RODINA':'WORKFORCE: FAMILY'}</span>
  </div>;
}

export function AxelGuide({language,children}:{language:Language;children:ReactNode}) {
  return <aside className="axel-guide" aria-label={language==='sk'?'Axel vysvetľuje pravidlá':'Axel explains the rules'}>
    <div className="axel-photo"><SourcePhoto id="dog" language={language}/></div>
    <div className="axel-speech"><strong>Axel, stavby majster</strong><p>{children}</p></div>
  </aside>;
}
