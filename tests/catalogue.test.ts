import test from 'node:test';
import assert from 'node:assert/strict';
import { puzzles } from '../src/lib/puzzles';
import { assertPublishedCatalogueUnchanged } from '../src/lib/catalogue';

test('regeneration cannot silently overwrite, remove or duplicate a printed problem code', () => {
  const old = puzzles[0];
  assert.doesNotThrow(() => assertPublishedCatalogueUnchanged([old],[{...old,pieceIds:[...old.pieceIds].reverse(),footprint:[...old.footprint].reverse()}]));
  assert.throws(() => assertPublishedCatalogueUnchanged([old],[]),/Refusing to change/);
  assert.throws(() => assertPublishedCatalogueUnchanged([old],[{...old,pieceIds:[16,15,14]}]),/Refusing to change/);
  assert.throws(() => assertPublishedCatalogueUnchanged([old],[{...old,footprint:[[0,0]]}]),/Refusing to change/);
  assert.throws(() => assertPublishedCatalogueUnchanged([old],[old,old]),/Duplicate/);
  assert.doesNotThrow(() => assertPublishedCatalogueUnchanged([old],[old,{...old,code:'F4-E-001'}]));
});
