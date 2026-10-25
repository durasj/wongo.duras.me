import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEdition, editions } from '../src/lib/editions';

test('QR edition links override the remembered edition and use the production domain',()=>{
  assert.equal(resolveEdition('?edition=tacustav-2026','classic'),'tacustav-2026');
  assert.equal(resolveEdition('?edition=classic','tacustav-2026'),'classic');
  for(const [id,edition] of Object.entries(editions)){
    const url=new URL(edition.url);
    assert.equal(url.origin,'https://wongo.duras.me');
    assert.equal(resolveEdition(url.search,null),id);
  }
});

test('remembered editions survive plain links while invalid values fall back safely',()=>{
  assert.equal(resolveEdition('','tacustav-2026'),'tacustav-2026');
  assert.equal(resolveEdition('?p=W3-H-048','tacustav-2026'),'tacustav-2026');
  assert.equal(resolveEdition('?edition=unknown','tacustav-2026'),'tacustav-2026');
  assert.equal(resolveEdition('',null),'classic');
  assert.equal(resolveEdition('','unknown'),'classic');
});
