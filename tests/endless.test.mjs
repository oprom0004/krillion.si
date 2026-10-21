import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { BANK, BANK_VERSION } from '../public/endless-game/bank.mjs';
import { createEngine, STORAGE_KEY, matchPractice } from '../public/endless-game/practice-engine.mjs';
import { matchAnswer, normalize, PREVIEW_MS, ROUND_MS } from '../public/endless-game/rules.mjs';
const expected = {
  planets:8, 'rocky-planets':4, 'giant-planets':4, 'alkali-metals':6, 'alkaline-earth':6,
  halogens:6, 'group-18':7, 'period-2':8, 'period-3':8, 'one-letter-symbol':14,
  'first-ten-elements':10, 'us-states':50, 'canada-all':13, 'canada-provinces':10,
  'canada-territories':3, 'si-base-units':7, 'si-base-quantities':7, 'si-prefixes':24,
  'un-languages':6, 'nato-alphabet':26, 'chess-pieces':6
};
function harness(storage) {
  let t = 100000, n = 0;
  const map = new Map();
  storage ??= { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v) };
  const opts = {storage, now:()=>t, random:()=>0.51, uuid:()=>`test-${++n}`};
  return { ...createEngine(opts), storage, advance:ms=>{t+=ms}, reload:()=>createEngine(opts) };
}
test('21 finite sets have complete canonical counts and every alias resolves uniquely', () => {
  assert.equal(BANK.length,21); assert.equal(new Set(BANK.map(p=>p.id)).size,21);
  for(const p of BANK) {
    assert.equal(p.answers.length,expected[p.id],p.id);
    const seen = new Map();
    for(const a of p.answers) for(const alias of [a.answer,...a.aliases]) {
      const key=normalize(alias);
      assert.ok(!seen.has(key)||seen.get(key)===a.answer,`${p.id}: ambiguous ${alias}`);
      seen.set(key,a.answer);
      assert.equal(matchAnswer(alias,p.answers)?.answer,a.answer,`${p.id}: ${alias}`);
      assert.equal(matchAnswer(alias.toUpperCase(),p.answers)?.answer,a.answer);
    }
    assert.match(p.source,/^https:\/\//);
  }
});
test('scope boundaries exclude related but invalid answers', () => {
  const excluded = {planets:['Pluto','Sun','Moon'], 'rocky-planets':['Jupiter'],
    'alkali-metals':['Hydrogen'], halogens:['Helium'], 'group-18':['Fluorine'],
    'us-states':['Washington DC','Puerto Rico','Canada'], 'canada-provinces':['Yukon'],
    'canada-territories':['Ontario'], 'si-base-units':['Celsius','Newton'],
    'si-prefixes':['Kibi'], 'un-languages':['German'], 'nato-alphabet':['Apple'], 'chess-pieces':['Dragon']};
  for(const [id,words] of Object.entries(excluded)) for(const word of words) assert.equal(matchPractice(word,BANK.find(p=>p.id===id)),null,`${id}: ${word}`);
});
test('three complete dives cover all 21 categories, score once, reveal answers and keep diving',async()=>{
  const h=harness(), ids=[];
  for(let dive=0;dive<4;dive++) {
    let state=await h.api('start',{}); assert.equal(new Set(state.prompts.map(p=>p.id)).size,7);
    if(dive<3) ids.push(...state.prompts.map(p=>p.id));
    await assert.rejects(h.api('review?run='+state.runId),/Finish/);
    for(let round=0;round<7;round++) {
      h.advance(PREVIEW_MS);
      const p=BANK.find(p=>p.id===state.prompts[round].id);
      const reply=await h.api('answer',{runId:state.runId,round,answer:p.answers.at(-1).answer});
      assert.equal(reply.result.answer,p.answers.at(-1).answer);assert.equal(reply.result.score,100);
      state=reply.state;
      const duplicate=await h.api('answer',{runId:state.runId,round,answer:p.answers[0].answer});
      assert.equal(duplicate.alreadyScored,true);assert.equal(duplicate.state.score,(round+1)*100);
      if(round<6) state=await h.api('next',{runId:state.runId});
    }
    assert.equal(state.completed,true);assert.equal(state.score,700);
    const review=await h.api('review?run='+state.runId);
    assert.equal(review.prompts.length,7);assert.equal(review.betterThan,null);
    assert.equal(review.prompts[0].answers.length,expected[state.prompts[0].id]);
  }
  assert.equal(new Set(ids).size,21);
});
test('early submit, invalid retry, spelling confirmation, refresh and deadline',async()=>{
  const h=harness();let s=await h.api('start',{});
  await assert.rejects(h.api('answer',{runId:s.runId,round:0,answer:'test'}),/timer/);
  h.advance(PREVIEW_MS);
  const reject=await h.api('answer',{runId:s.runId,round:0,answer:'qzxqzxqzx'});
  assert.equal(reject.rejected,true);
  const p=BANK.find(p=>p.id===s.prompts[0].id), a=p.answers.find(a=>normalize(a.answer).length>5);
  const typo=a.answer.slice(0,-1);
  const correction=await h.api('answer',{runId:s.runId,round:0,answer:typo});
  assert.equal(correction.correction,a.answer);
  assert.equal((await h.api('state?run='+s.runId)).results.length,0);
  const accepted=await h.api('answer',{runId:s.runId,round:0,answer:a.answer,confirm:true});
  assert.equal(accepted.state.results.length,1);
  const fresh=h.reload();s=await fresh.api('state?run='+s.runId);assert.equal(s.score,accepted.result.score);
  s=await fresh.api('next',{runId:s.runId});h.advance(PREVIEW_MS+ROUND_MS+1);
  const timeout=await fresh.api('answer',{runId:s.runId,round:1,answer:BANK.find(p=>p.id===s.prompts[1].id).answers[0].answer,timeout:true});
  assert.equal(timeout.result.score,0);assert.equal(timeout.state.round,2);
  const resumed=await h.reload().api('state?run='+s.runId);assert.equal(resumed.results.length,2);
});
test('pause and resume retain remaining time; background/reload cannot reset timer',async()=>{
  const h=harness();let s=await h.api('start',{});h.advance(PREVIEW_MS+5000);
  const remaining=s.roundStart+ROUND_MS-105000-PREVIEW_MS;
  s=await h.api('pause',{runId:s.runId,paused:true});h.advance(60000);
  await assert.rejects(h.api('answer',{runId:s.runId,round:0,answer:'x'}),/menu/);
  s=await h.reload().api('pause',{runId:s.runId,paused:false});
  assert.equal(s.roundStart+ROUND_MS-s.serverNow,remaining);
  h.advance(remaining+1);
  s=await h.reload().api('state?run='+s.runId);
  assert.ok(s.serverNow>=s.roundStart+ROUND_MS);
});
test('storage blocked or quota exceeded still permits play; malformed saves recover',async()=>{
  let stored;
  const storage={getItem:()=>stored??null,setItem:(_k,v)=>{if(stored)throw new Error('quota');stored=v}};
  const h=harness(storage);let s=await h.api('start',{});h.advance(PREVIEW_MS);
  const p=BANK.find(p=>p.id===s.prompts[0].id);
  const reply=await h.api('answer',{runId:s.runId,round:0,answer:p.answers[0].answer});
  assert.equal(reply.state.persistent,false);
  assert.equal((await h.api('state?run='+s.runId)).results.length,1);
  const broken=harness({getItem:()=>'{not-json',setItem:()=>{throw new Error('blocked')}});
  assert.equal((await broken.api('today')).persistent,false);
  s=await broken.api('start',{});assert.equal(s.prompts.length,7);
});
test('versioned or corrupt run is rejected without exposing partial state',async()=>{
  const h=harness();const s=await h.api('start',{});
  const db=JSON.parse(h.storage.getItem(STORAGE_KEY));db.runs[s.runId].ids=['nonexistent'];
  h.storage.setItem(STORAGE_KEY,JSON.stringify(db));
  await assert.rejects(h.reload().api('state?run='+s.runId),/cannot be resumed/);
  assert.equal((await h.reload().api('start',{})).prompts.length,7);
  assert.equal(db.version,BANK_VERSION);
});
test('standalone game ships all scene assets and does not call a remote judge',()=>{
  const root=new URL('../public/endless-game/',import.meta.url);
  for(const name of ['krill','krill-gold','plankton','tooclever','schooler','rare','deepcut','evil']) assert.ok(existsSync(new URL(`assets/${name}.svg`,root)),name);
  for(const file of ['index.html','app.mjs','presentation.mjs','ocean.mjs','style.css']) {
    const source=readFileSync(new URL(file,root),'utf8');
    assert.doesNotMatch(source,/["']\/assets\//,`${file} must use game-local assets`);
  }
  assert.ok(existsSync(new URL('assets/vt323-latin-400-normal.woff2',root)));
  assert.doesNotMatch(readFileSync(new URL('app.mjs',root),'utf8'),/fetch\(/);
  assert.doesNotMatch(readFileSync(new URL('practice-engine.mjs',root),'utf8'),/fetch\(/);
  assert.match(readFileSync(new URL('LICENSE.txt',root),'utf8'),/MIT License/);
});
