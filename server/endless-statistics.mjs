import { BANK, BANK_VERSION } from '../public/endless-game/bank.mjs';
import { normalize } from '../public/endless-game/rules.mjs';
import { MIN_SAMPLE, observedTier } from '../public/endless-game/scoring.mjs';
const cookieName = 'ksi_endless_player';
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const json = (body, status=200, extra={}) => Response.json(body, {status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});

export async function scores(db, now=Date.now()) {
  const day = new Date(now).toISOString().slice(0,10);
  const rows = (await db.prepare('SELECT question_id, answer_id, COUNT(*) AS n FROM first_answers GROUP BY question_id, answer_id').all()).results;
  const saved = (await db.prepare('SELECT * FROM score_snapshots WHERE day=?').bind(day).all()).results;
  const counts = new Map();
  for(const r of rows) {
    if(!counts.has(r.question_id)) counts.set(r.question_id,{});
    counts.get(r.question_id)[r.answer_id]=Number(r.n);
  }
  const output = {}, needsSnapshot=[];
  for(const p of BANK) {
    const allowed = new Set(p.answers.map(a=>normalize(a.answer)));
    const values = Object.fromEntries(Object.entries(counts.get(p.id)||{}).filter(([id])=>allowed.has(id)));
    const n = Object.values(values).reduce((a,b)=>a+b,0);
    if(n<MIN_SAMPLE) { output[p.id]={mode:'preset',sampleSize:n};continue; }
    const existing=saved.find(s=>s.question_id===p.id);
    if(!existing) {
      const answers=Object.fromEntries(p.answers.map(a=>{const id=normalize(a.answer);return[id,observedTier(values[id]||0,n)]}));
      await db.prepare('INSERT OR IGNORE INTO score_snapshots(day,question_id,sample_size,answers_json) VALUES(?,?,?,?)')
        .bind(day,p.id,n,JSON.stringify(answers)).run();
      needsSnapshot.push(p.id);
    }
    if(existing)output[p.id]={mode:'observed',sampleSize:existing.sample_size,snapshotDay:day,answers:JSON.parse(existing.answers_json)};
  }
  // Read concurrent publication winners together. Even when all 42 categories
  // activate at once, this stays below D1's 50-query free-plan invocation limit.
  if(needsSnapshot.length) {
    const published=(await db.prepare('SELECT * FROM score_snapshots WHERE day=?').bind(day).all()).results;
    for(const id of needsSnapshot) {
      const snapshot=published.find(s=>s.question_id===id);
      if(!snapshot)throw new Error('Scoring snapshot unavailable');
      output[id]={mode:'observed',sampleSize:snapshot.sample_size,snapshotDay:day,answers:JSON.parse(snapshot.answers_json)};
    }
  }
  return {version:BANK_VERSION,minimum:MIN_SAMPLE,questions:output};
}

export async function record(db, visitorId, data, now=Date.now()) {
  if(!data || Array.isArray(data) || Object.keys(data).some(k=>!['questionId','answerId'].includes(k))) return {error:'Expected a question ID and canonical answer ID.',status:400};
  const p=BANK.find(p=>p.id===data.questionId);
  if(!p || typeof data.answerId!=='string' || !p.answers.some(a=>normalize(a.answer)===data.answerId)) return {error:'Unknown question or answer.',status:400};
  // A unique database key provides atomic deduplication, including concurrent
  // requests and retries after a response was lost. Later choices never replace it.
  const result=await db.prepare('INSERT OR IGNORE INTO first_answers(visitor_id,question_id,answer_id,submitted_at) VALUES(?,?,?,?)')
    .bind(visitorId,p.id,data.answerId,now).run();
  return {ok:true,counted:result.meta.changes===1};
}

export async function handleStatistics(request, env, now=Date.now()) {
  const url=new URL(request.url), route=url.pathname.replace(/\/$/,'');
  if(!env.ENDLESS_STATS) return json({error:'Statistics are temporarily unavailable.'},503);
  try {
    let id=request.headers.get('Cookie')?.match(/(?:^|;\s*)ksi_endless_player=([^;]+)/)?.[1];
    const validId=uuidPattern.test(id||'') && await env.ENDLESS_STATS.prepare('SELECT id FROM visitors WHERE id=?').bind(id).first();
    if(route==='/api/endless/scores' && request.method==='GET') {
      const extra={};
      if(!validId) {
        id=crypto.randomUUID();
        await env.ENDLESS_STATS.prepare('INSERT INTO visitors(id,created_at) VALUES(?,?)').bind(id,now).run();
        extra['Set-Cookie']=`${cookieName}=${id}; Path=/api/endless; HttpOnly; SameSite=Lax; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`;
      }
      return json(await scores(env.ENDLESS_STATS,now),200,extra);
    }
    if(route==='/api/endless/record' && request.method==='POST') {
      if(request.headers.get('Origin')!==url.origin) return json({error:'Same-origin request required.'},403);
      if(!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'JSON required.'},415);
      if(!validId) return json({error:'Open a practice dive before recording statistics.'},401);
      if(Number(request.headers.get('Content-Length')||0)>512) return json({error:'Request too large.'},413);
      const raw=await request.text();if(raw.length>512)return json({error:'Request too large.'},413);
      let data;try{data=JSON.parse(raw)}catch{return json({error:'Invalid JSON.'},400)}
      const result=await record(env.ENDLESS_STATS,id,data,now);
      return json(result,result.status||200);
    }
    return json({error:'Not found.'},404);
  } catch {
    // Never return request bodies, cookies, SQL strings or database errors.
    return json({error:'Statistics are temporarily unavailable.'},503);
  }
}
