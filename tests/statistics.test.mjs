import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { scores, record, handleStatistics } from '../server/endless-statistics.mjs';
import { observedTier } from '../public/endless-game/scoring.mjs';
import { BANK, BANK_VERSION } from '../public/endless-game/bank.mjs';
import { normalize, PREVIEW_MS, TIERS } from '../public/endless-game/rules.mjs';
import { createEngine } from '../public/endless-game/practice-engine.mjs';
import { createStatisticsClient } from '../public/endless-game/statistics-client.mjs';
const day=Date.UTC(2026,9,22), q=BANK[0], answerId=normalize(q.answers[0].answer);
function database() {
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  sql.exec(readFileSync(new URL('../migrations/0001_endless_statistics.sql',import.meta.url),'utf8'));
  return {sql,prepare(query){let args=[];return {bind(...values){args=values;return this},async all(){return {results:sql.prepare(query).all(...args)}},async first(){return sql.prepare(query).get(...args)||null},async run(){const result=sql.prepare(query).run(...args);return {meta:{changes:Number(result.changes)}}}}}};
}
async function add(db,n,answer=answerId,p=q) {
  for(let i=0;i<n;i++) {const id=crypto.randomUUID();await db.prepare('INSERT INTO visitors VALUES(?,?)').bind(id,day).run();await record(db,id,{questionId:p.id,answerId:answer},day)}
}
test('observed tiers use exact frequency boundaries and require 50 samples',()=>{
  for(const [count,score] of [[20,10],[19,30],[10,30],[9,60],[5,60],[4,85],[2,85],[1,100],[0,100]])assert.equal(observedTier(count,100).score,score);
  assert.throws(()=>observedTier(1,49));
});
test('49 first answers stay preset; 50 activates observed scoring independently per question',async()=>{
  const db=database();await add(db,49);
  assert.deepEqual((await scores(db,day)).questions[q.id],{mode:'preset',sampleSize:49});
  await add(db,1);const s=(await scores(db,day)).questions;
  assert.equal(s[q.id].mode,'observed');assert.equal(s[q.id].sampleSize,50);
  assert.equal(s[q.id].answers[answerId].proportion,1);assert.equal(s[q.id].answers[answerId].score,10);
  assert.equal(s[q.id].answers[normalize(q.answers[1].answer)].score,100);
  assert.deepEqual(s[BANK[1].id],{mode:'preset',sampleSize:0});
  await add(db,10,normalize(q.answers[1].answer));
  assert.equal((await scores(db,day+1000)).questions[q.id].sampleSize,50,'daily snapshot stays fixed');
  assert.equal((await scores(db,day+86400000)).questions[q.id].sampleSize,60);
  db.sql.close();
});
test('atomic first-answer key deduplicates retries and never replaces first choice',async()=>{
  const db=database(),id=crypto.randomUUID();await db.prepare('INSERT INTO visitors VALUES(?,?)').bind(id,day).run();
  const result=await Promise.all(Array.from({length:12},()=>record(db,id,{questionId:q.id,answerId},day)));
  assert.equal(result.filter(r=>r.counted).length,1);
  assert.equal((await record(db,id,{questionId:q.id,answerId:normalize(q.answers[1].answer)},day)).counted,false);
  assert.equal(db.sql.prepare('SELECT answer_id FROM first_answers').get().answer_id,answerId);
  for(const data of [{questionId:q.id,answerId,rawAnswer:'private input'},{questionId:q.id,answerId:'INVALID'},null,[],{questionId:'unknown',answerId}])assert.equal((await record(db,id,data)).status,400);
  db.sql.close();
});
test('all categories can activate together within the D1 free-plan query limit',async()=>{
  const db=database();
  for(const p of BANK)await add(db,50,normalize(p.answers[0].answer),p);
  let queries=0;const counted={prepare(query){queries++;return db.prepare(query)}};
  const snapshot=await scores(counted,day);
  assert.equal(Object.values(snapshot.questions).filter(p=>p.mode==='observed').length,42);
  assert.ok(queries<=47,`score queries: ${queries}; leave room for visitor lookups`);
  db.sql.close();
});
test('HTTP API issues anonymous HttpOnly cookie, rejects cross-origin writes and hides backend errors',async()=>{
  const db=database(),env={ENDLESS_STATS:db},url='https://example.com/api/endless/';
  const initial=await handleStatistics(new Request(url+'scores'),env,day);
  assert.equal(initial.status,200);assert.equal(initial.headers.get('Cache-Control'),'no-store');
  const cookie=initial.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly; SameSite=Lax/);assert.match(cookie,/; Secure/);
  assert.equal((await initial.json()).minimum,50);
  const send=(origin='https://example.com',useCookie=true,body={questionId:q.id,answerId})=>handleStatistics(new Request(url+'record',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(useCookie?{Cookie:cookie.split(';')[0]}:{})},body:JSON.stringify(body)}),env,day);
  assert.equal((await send('https://evil.com')).status,403);
  assert.equal((await send(undefined,false)).status,401);
  assert.deepEqual(await (await send()).json(),{ok:true,counted:true});
  assert.deepEqual(await (await send()).json(),{ok:true,counted:false});
  assert.equal((await send(undefined,true,{questionId:q.id,answerId,rawAnswer:'secret'})).status,400);
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM first_answers').get().n,1);
  assert.equal((await handleStatistics(new Request(url+'scores'),{})).status,503);
  db.sql.close();const failed=await handleStatistics(new Request(url+'scores'),env);assert.equal(failed.status,503);assert.equal(await failed.text(),'{"error":"Statistics are temporarily unavailable."}');
});
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};
test('client queue survives offline and lost response; server retry counts once and sends canonical IDs only',async()=>{
  const db=database(),store=storage();let cookie='',offline=true,lose=true;const payloads=[];
  const fetcher=async(path,opts)=>{
    if(offline)throw new Error('offline');
    if(opts.body)payloads.push(JSON.parse(opts.body));
    const response=await handleStatistics(new Request('https://example.com'+path,{...opts,headers:{...opts.headers,Origin:'https://example.com',Cookie:cookie}}),{ENDLESS_STATS:db},day);
    if(response.headers.has('Set-Cookie'))cookie=response.headers.get('Set-Cookie').split(';')[0];
    if(opts.body&&lose){lose=false;throw new Error('response lost')}
    return response;
  };
  let client=createStatisticsClient({storage:store,fetcher});client.enqueue(q.id,answerId);await client.flush();
  await new Promise(r=>setImmediate(r));offline=false;await client.flush();
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM first_answers').get().n,1);
  client=createStatisticsClient({storage:store,fetcher});await client.flush();
  client.enqueue(q.id,normalize(q.answers[1].answer));await client.flush();
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM first_answers').get().n,1);
  assert.equal(payloads.length,2);assert.deepEqual(payloads[0],{questionId:q.id,answerId});
  db.sql.close();
});
test('client memory fallback handles unavailable storage and drops obsolete entries without blocking later ones',async()=>{
  const sent=[],store={getItem(){return null},setItem(){throw new Error('quota')}};
  const fetcher=async(path,opts)=>{if(!opts.body)return Response.json({version:BANK_VERSION,questions:{}});sent.push(JSON.parse(opts.body));return Response.json({}, {status:sent.length===1?400:200})};
  const client=createStatisticsClient({storage:store,fetcher});
  client.enqueue(q.id,answerId);await new Promise(r=>setImmediate(r));await client.flush();
  client.enqueue(BANK[1].id,normalize(BANK[1].answers[0].answer));await new Promise(r=>setImmediate(r));await client.flush();
  client.enqueue(q.id,answerId);await client.flush();assert.equal(sent.length,2);
});
test('engine freezes observed scores for dive and reload; only accepted answers are queued',async()=>{
  let t=100000;const queued=[],store=storage();
  const snapshot={questions:Object.fromEntries(BANK.map(p=>[p.id,{mode:'observed',sampleSize:50,snapshotDay:'2026-10-22',answers:Object.fromEntries(p.answers.map(a=>[normalize(a.answer),{score:30,tier:'schooler',count:5,proportion:0.1}]))}]))};
  const opts={storage:store,now:()=>t,random:()=>0.5,uuid:()=>crypto.randomUUID(),statistics:{getScores:async()=>snapshot,enqueue:(...args)=>queued.push(args)}};
  let engine=createEngine(opts),s=await engine.api('start',{}),p=BANK.find(p=>p.id===s.prompts[0].id);
  snapshot.questions[p.id].answers[normalize(p.answers[0].answer)].score=100;
  t+=PREVIEW_MS;const rejected=await engine.api('answer',{runId:s.runId,round:0,answer:'not a valid answer'});assert.equal(rejected.rejected,true);assert.equal(queued.length,0);
  engine=createEngine(opts);
  const reply=await engine.api('answer',{runId:s.runId,round:0,answer:p.answers[0].aliases[0]||p.answers[0].answer});
  assert.equal(reply.result.score,30);assert.equal(reply.result.scoringMode,'observed');assert.deepEqual(queued,[[p.id,normalize(p.answers[0].answer)]]);
  await engine.api('answer',{runId:s.runId,round:0,answer:p.answers[1].answer});assert.equal(queued.length,1);
  s=await engine.api('next',{runId:s.runId});t+=PREVIEW_MS+26000;
  const timeout=await engine.api('answer',{runId:s.runId,round:1,answer:'',timeout:true});assert.equal(timeout.result.score,0);assert.equal(queued.length,1);
});
test('offline statistics do not prevent locally validated gameplay or preset scores',async()=>{
  let t=100000;const queued=[];const engine=createEngine({storage:storage(),now:()=>t,statistics:{getScores:async()=>{throw new Error('offline')},enqueue:(...x)=>queued.push(x)}});
  const s=await engine.api('start',{}),p=BANK.find(p=>p.id===s.prompts[0].id);assert.equal(s.statisticsUnavailable,true);t+=PREVIEW_MS;
  const reply=await engine.api('answer',{runId:s.runId,round:0,answer:p.answers[0].answer});assert.equal(reply.result.score,TIERS[p.answers[0].tier].score);assert.equal(reply.result.scoringMode,'preset');assert.equal(queued.length,1);
});
