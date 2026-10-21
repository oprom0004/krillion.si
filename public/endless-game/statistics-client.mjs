import { BANK, BANK_VERSION } from './bank.mjs';
import { normalize } from './rules.mjs';
const KEY='ksi:endless:statistics:v1';
const valid=(q,a)=>BANK.some(p=>p.id===q&&p.answers.some(x=>normalize(x.answer)===a));
export function createStatisticsClient({storage,fetcher=globalThis.fetch}={}) {
  let memory={queue:[],sent:[]}, flushing=false, sessionReady=false, persistent=!!storage;
  const load=()=>{if(persistent)try{const value=JSON.parse(storage.getItem(KEY)||'null');if(value&&Array.isArray(value.queue)&&Array.isArray(value.sent))memory={queue:value.queue.filter(x=>x&&valid(x.questionId,x.answerId)).slice(0,BANK.length),sent:value.sent.filter(id=>BANK.some(p=>p.id===id))}}catch{persistent=false}return memory};
  const save=x=>{memory=x;try{if(persistent)storage.setItem(KEY,JSON.stringify(x))}catch{persistent=false}};
  async function request(path,body) {
    const response=await fetcher('/api/endless/'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(2500),
      ...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    if(!response.ok) {const e=new Error('Statistics unavailable');e.status=response.status;throw e;}
    return response.json();
  }
  async function getScores() {
    const value=await request('scores');
    if(value.version!==BANK_VERSION || !value.questions) throw new Error('Scoring version mismatch');
    sessionReady=true;return value;
  }
  async function flush() {
    if(flushing)return;flushing=true;
    try {
      if(!load().queue.length)return;
      if(!sessionReady) await getScores();
      for(const item of [...load().queue]) {
        try {await request('record',{questionId:item.questionId,answerId:item.answerId})}
        catch(e){if(e.status===401)sessionReady=false;if(e.status!==400)throw e;}
        const data=load();data.queue=data.queue.filter(x=>x.questionId!==item.questionId);
        if(!data.sent.includes(item.questionId))data.sent.push(item.questionId);
        save(data);
      }
    } catch {/* Persist pending canonical IDs, retry later; never block gameplay. */}
    finally {flushing=false;}
  }
  function enqueue(questionId,answerId) {
    if(!valid(questionId,answerId))return;
    const data=load();
    if(data.sent.includes(questionId)||data.queue.some(x=>x.questionId===questionId))return;
    data.queue.push({questionId,answerId});save(data);void flush();
  }
  return {getScores,enqueue,flush};
}
