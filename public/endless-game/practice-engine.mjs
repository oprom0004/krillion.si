// Local answer judge with optional same-origin anonymous scoring statistics.
import { BANK, BANK_VERSION } from './bank.mjs';
import { TIERS, ROUND_MS, PREVIEW_MS, matchAnswer, normalize } from './rules.mjs';

export const STORAGE_KEY = 'krillion-si:endless:engine:v1';
// These are different entities, not spelling errors to silently repair.
const excluded = { 'us-states': ['Washington DC','Washington D.C.','District of Columbia'], 'us-capitals': ['Washington DC','Washington D.C.','Washington'], 'canada-capitals': ['Ottawa','Saint John','St John'], 'si-base-units': ['Celsius','Degree Celsius','Degrees Celsius'], 'nato-countries': ['Ireland','Republic of Ireland','Austria','Switzerland','Ukraine','Russia','China','Japan','Australia','New Zealand','Cyprus','Malta'], 'eu-countries': ['United Kingdom','UK','Britain','Great Britain','Norway','Iceland','Switzerland','Russia','Ukraine','Turkey','Türkiye','US','USA'] };
const cleanInput = input => String(input).trim().replace(/^the\s+/i, '');
export function matchPractice(input, prompt) {
  const cleaned = cleanInput(input);
  if ((excluded[prompt.id] || []).some(value => normalize(value) === normalize(cleaned))) return null;
  // Honor a full explicit alias before stripping an optional article: e.g.
  // "The Championships" is itself a conventional name for Wimbledon.
  const direct = prompt.answers.find(a => [a.answer, ...a.aliases].some(x => normalize(x) === normalize(input)));
  if (direct) return { ...direct, correction: false };
  return matchAnswer(cleaned, prompt.answers);
}
export function createEngine({ storage, statistics = null, now = Date.now, random = Math.random, uuid = () => crypto.randomUUID() } = {}) {
  let memory = { version: BANK_VERSION, queue: [], runs: {}, number: 0 };
  let persistent = Boolean(storage);
  function load() {
    if (!persistent) return memory;
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === '2026-10-22.1' && Array.isArray(parsed.queue) && parsed.runs && Number.isInteger(parsed.number)) {
          // Append-only bank upgrade: keep in-progress dives and scores, and add
          // new categories to the unplayed queue without reusing old questions.
          parsed.queue = [...new Set([...parsed.queue, ...BANK.slice(21).map(p => p.id)])];
          parsed.version = BANK_VERSION;
        }
        if (parsed.version === BANK_VERSION && Array.isArray(parsed.queue) && parsed.runs && Number.isInteger(parsed.number)) memory = parsed;
      }
    } catch { persistent = false; }
    return memory;
  }
  function save(db) {
    memory = db;
    try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(db)); else persistent = false; }
    catch { persistent = false; }
  }
  function shuffle(ids) {
    const items = [...ids];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  const questions = ids => ids.map(id => BANK.find(p => p.id === id));
  function getRun(db, id) {
    const r = db.runs[id];
    if (!r || !Array.isArray(r.ids) || r.ids.length !== 7 || new Set(r.ids).size !== 7 ||
      questions(r.ids).some(p => !p) || !Array.isArray(r.results) ||
      !Number.isInteger(r.round) || r.round !== r.results.length || r.round < 0 || r.round > 7 ||
      r.results.some((x, i) => x.round !== i || !Number.isFinite(x.score)) ||
      (r.roundStart !== null && !Number.isFinite(r.roundStart))) {
      throw new Error('This saved dive cannot be resumed. Start a new dive.');
    }
    return r;
  }
  function state(r) {
    return {
      runId: r.id, date: r.date, dayNumber: r.number, mode: 'practice',
      source: 'Krillion.si curated practice bank', sample: false,
      prompts: questions(r.ids).map(({ id, text }) => ({ id, text })),
      serverNow: now(), round: r.round, roundStart: r.roundStart,
      pausedAt: r.pausedAt, completed: r.round === 7,
      results: structuredClone(r.results), score: r.results.reduce((s, x) => s + x.score, 0),
      persistent, bankSize: BANK.length, scoring: structuredClone(r.scoring||{}), statisticsUnavailable:!!r.statisticsUnavailable
    };
  }
  async function api(path, data) {
    const [route, query = ''] = path.split('?');
    let snapshot=null;
    if(route==='start' && statistics) {try{snapshot=await statistics.getScores()}catch{}}
    const db = load();
    const params = new URLSearchParams(query);
    if (route === 'today') return { date: new Date(now()).toISOString().slice(0, 10), dayNumber: db.number + 1, sample: false, bankSize: BANK.length, persistent };
    if (route === 'start') {
      const selected = [];
      db.queue = db.queue.filter(id => BANK.some(p => p.id === id));
      while (selected.length < 7) {
        if (!db.queue.length) db.queue = shuffle(BANK.map(p => p.id).filter(id => !selected.includes(id)));
        const id = db.queue.shift();
        if (!selected.includes(id)) selected.push(id);
      }
      const scoring=structuredClone(Object.fromEntries(selected.map(id=>[id,snapshot?.questions[id]||{mode:'preset',sampleSize:null}])));
      if(statistics)void statistics.flush?.();
      const r = { id: uuid(), ids: selected, scoring, statisticsUnavailable:!!statistics&&!snapshot, number: ++db.number, date: new Date(now()).toISOString().slice(0, 10), round: 0, results: [], roundStart: now() + PREVIEW_MS, pausedAt: null };
      db.runs[r.id] = r;
      const oldest = Object.keys(db.runs);
      while (oldest.length > 30) delete db.runs[oldest.shift()];
      save(db); return state(r);
    }
    const r = getRun(db, data?.runId || params.get('run'));
    if (route === 'state') return state(r);
    if (route === 'review') {
      if (r.round !== 7) throw new Error('Finish this dive to see all accepted answers.');
      return { prompts: questions(r.ids).map(p => ({ ...p, scoring:r.scoring?.[p.id]||{mode:'preset',sampleSize:null}, answers: p.answers.map(a => {
        const observed=r.scoring?.[p.id]?.mode==='observed'?r.scoring[p.id].answers[normalize(a.answer)]:null;
        return {...a,score:TIERS[a.tier].score,...observed};
      }).sort((a, b) => b.score - a.score || a.answer.localeCompare(b.answer)) })), population: 0, betterThan: null, dist: [] };
    }
    if (route === 'pause') {
      if (data.paused && r.round < 7 && r.roundStart !== null && !r.pausedAt && now() <= r.roundStart + ROUND_MS) r.pausedAt = now();
      else if (!data.paused && r.pausedAt !== null) { r.roundStart += now() - r.pausedAt; r.pausedAt = null; }
      save(db); return state(r);
    }
    if (route === 'next') {
      if (r.pausedAt !== null) throw new Error('Close the menu to continue.');
      if (r.round < 7 && r.roundStart === null) r.roundStart = now() + PREVIEW_MS;
      save(db); return state(r);
    }
    if (route === 'answer') {
      if (r.pausedAt !== null) throw new Error('Close the menu to continue.');
      if (r.round === 7 || r.roundStart === null || data.round !== r.round) return { alreadyScored: true, state: state(r) };
      if (now() < r.roundStart) throw new Error('Wait for the answer timer to start.');
      const prompt = questions(r.ids)[r.round];
      const raw = String(data.answer || '').trim().slice(0, 256);
      const expired = now() >= r.roundStart + ROUND_MS;
      // No fuzzy matching for symbols/short words. A near match must be confirmed;
      // an automatic timeout never turns a typo into a correct answer.
      let match = !expired && raw ? matchPractice(raw, prompt) : null;
      if (match && normalize(raw).length < 4 && ![match.answer, ...match.aliases].some(x => normalize(x) === normalize(raw))) match = null;
      const exact = match && [match.answer, ...match.aliases].some(x => normalize(x) === normalize(raw) || normalize(x) === normalize(cleanInput(raw)));
      if (!exact && match && data.confirm !== true) return { correction: match.answer, original: raw };
      if (!match && !expired && !data.timeout) return { rejected: true, message: 'That does not match this category. Try another answer before time runs out.' };
      const scoring=r.scoring?.[prompt.id];
      const observed=match&&scoring?.mode==='observed'?scoring.answers[normalize(match.answer)]:null;
      const result = { round: r.round, rawAnswer: raw || null, answer: match?.answer || null, tier: observed?.tier||match?.tier||null, score: observed?.score??(match?TIERS[match.tier].score:0),
        scoringMode:observed?'observed':'preset',sampleSize:scoring?.sampleSize??null,
        quip: !match?'The answer window closed. Review this category after the dive.':observed?
          `${(observed.proportion*100).toFixed(1)}% in ${scoring.sampleSize} first valid answers · ${scoring.snapshotDay} snapshot.`:
          'Preset practice score · this category needs 50 first valid answers for observed scoring.', promptText: prompt.text };
      r.results.push(result); r.round++; r.roundStart = null;
      save(db);
      if(match && statistics) {try{statistics.enqueue(prompt.id,normalize(match.answer))}catch{}}
      return { result, state: state(r) };
    }
    throw new Error('This action is not available in practice mode.');
  }
  return { api };
}
