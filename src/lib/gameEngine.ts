export interface QuestionPrompt {
  id: string;
  category: string;
  prompt: string;
  clue: string;
  surfaceFloaters: string[]; // Common, scores 200m - 1500m
  tooCleverTraps: string[];  // Smart textbook, scores 2500m - 4500m
  deepSinkers: string[];     // Obscure valid, scores 6000m - 7000m
}

export const QUESTION_BANK: QuestionPrompt[] = [
  {
    id: 'geo-southern-hemisphere',
    category: 'Geography',
    prompt: 'A sovereign nation located entirely in the Southern Hemisphere',
    clue: 'Think beyond Australia, Brazil, or South Africa.',
    surfaceFloaters: ['australia', 'new zealand', 'brazil', 'south africa', 'argentina', 'chile', 'peru'],
    tooCleverTraps: ['madagascar', 'uruguay', 'bolivia', 'paraguay', 'angola', 'namibia', 'botswana'],
    deepSinkers: ['nauru', 'tuvalu', 'vanuatu', 'eswatini', 'lesotho', 'kiribati', 'tonga', 'samoa', 'malawi', 'burundi', 'rwanda']
  },
  {
    id: 'hist-roman-emperors',
    category: 'World History',
    prompt: 'A Roman Emperor who ruled before the Fall of the Western Roman Empire',
    clue: 'Bypass the Julio-Claudian celebrities like Caesar, Augustus, or Nero.',
    surfaceFloaters: ['augustus', 'julius caesar', 'nero', 'caligula', 'marcus aurelius', 'trajan', 'constantine'],
    tooCleverTraps: ['tiberius', 'claudius', 'hadrian', 'vespasian', 'titus', 'commodus', 'diocletian'],
    deepSinkers: ['pertinax', 'didius julianus', 'pescennius niger', 'clodius albinus', 'gordian i', 'gordian ii', 'pupienus', 'balbinus', 'probus', 'tacitus', 'florianus', 'majorian']
  },
  {
    id: 'lit-shakespeare-plays',
    category: 'Literature',
    prompt: 'A play written or co-authored by William Shakespeare',
    clue: 'Avoid Romeo & Juliet and Hamlet, but beware the "Titus Andronicus" trap!',
    surfaceFloaters: ['hamlet', 'romeo and juliet', 'macbeth', 'othello', 'midsummer night\'s dream', 'the tempest', 'king lear'],
    tooCleverTraps: ['titus andronicus', 'the merchant of venice', 'twelfth night', 'much ado about nothing', 'the winter\'s tale', 'coriolanus'],
    deepSinkers: ['cymbeline', 'pericles', 'the two noble kinsmen', 'troilus and cressida', 'timon of athens', 'love\'s labour\'s lost', 'king john', 'henry vi part 1']
  },
  {
    id: 'chem-transition-metals',
    category: 'Science',
    prompt: 'A transition metal on the periodic table of elements',
    clue: 'Forget gold, silver, iron, or copper.',
    surfaceFloaters: ['iron', 'gold', 'silver', 'copper', 'zinc', 'nickel', 'titanium', 'platinum'],
    tooCleverTraps: ['tungsten', 'cobalt', 'chromium', 'manganese', 'palladium', 'mercury', 'vanadium'],
    deepSinkers: ['rhenium', 'osmium', 'iridium', 'ruthenium', 'rhodium', 'technetium', 'hafnium', 'tantalum', 'niobium', 'zirconium', 'scandium', 'yttrium']
  },
  {
    id: 'geo-landlocked-countries',
    category: 'Geography',
    prompt: 'A landlocked sovereign country anywhere in the world',
    clue: 'Switzerland and Mongolia are textbook; plunge into micro-enclaves and Africa.',
    surfaceFloaters: ['switzerland', 'austria', 'mongolia', 'bolivia', 'paraguay', 'nepal'],
    tooCleverTraps: ['afghanistan', 'luxembourg', 'liechtenstein', 'czech republic', 'slovakia', 'hungary', 'kazakhstan'],
    deepSinkers: ['san marino', 'vatican city', 'andorra', 'bhutan', 'eswatini', 'lesotho', 'laos', 'chad', 'niger', 'mali', 'burkina faso', 'central african republic']
  },
  {
    id: 'bio-deep-sea-creatures',
    category: 'Marine Biology',
    prompt: 'A species or organism that lives in the bathyal, abyssal, or hadal ocean zone',
    clue: 'Anglerfish and Giant Squid are surface-level answers.',
    surfaceFloaters: ['anglerfish', 'giant squid', 'blobfish', 'viperfish', 'gulper eel'],
    tooCleverTraps: ['colossal squid', 'frilled shark', 'goblin shark', 'dumbo octopus', 'yeti crab'],
    deepSinkers: ['hadal snailfish', 'pseudoliparis belyaevi', 'xenophyophore', 'benthopecten', 'bathynomus giganteus', 'riftia pachyptila', 'amphipod hirondellea gigas', 'barreleye fish']
  },
  {
    id: 'hist-peace-treaties',
    category: 'World History',
    prompt: 'A named historical peace treaty or accord signed before the year 2000',
    clue: 'Versailles and Treaty of Paris are the most common.',
    surfaceFloaters: ['treaty of versailles', 'treaty of paris', 'treaty of tordesillas', 'camp david accords', 'peace of westphalia'],
    tooCleverTraps: ['treaty of utrecht', 'treaty of brest-litovsk', 'treaty of ghent', 'treaty of portsmouth', 'treaty of guadalupe hidalgo'],
    deepSinkers: ['treaty of kadesh', 'treaty of verdun', 'treaty of wedmore', 'peace of calixtus', 'treaty of hubertusburg', 'treaty of nystad', 'treaty of burcht', 'treaty of tianjin']
  },
  {
    id: 'film-best-picture',
    category: 'Cinema',
    prompt: 'An Academy Award (Oscar) Best Picture winner',
    clue: 'Titanic, Forrest Gump, and Oppenheimer will leave you floating.',
    surfaceFloaters: ['titanic', 'forrest gump', 'oppenheimer', 'the godfather', 'gladiator', 'parasite', 'everything everywhere all at once'],
    tooCleverTraps: ['the artist', 'birdman', 'the hurt locker', 'moonlight', 'spotlight', 'crash', 'chicago', 'green book'],
    deepSinkers: ['wings', 'cavalcade', 'you can\'t take it with you', 'the life of emile zola', 'the great ziegfeld', 'gentleman\'s agreement', 'all the king\'s men', 'marty', 'gigi']
  },
  {
    id: 'geo-island-nations',
    category: 'Geography',
    prompt: 'An independent island nation located in the Pacific or Indian Ocean',
    clue: 'Japan, New Zealand, and Madagascar are too famous.',
    surfaceFloaters: ['japan', 'new zealand', 'madagascar', 'philippines', 'indonesia', 'australia', 'cuba'],
    tooCleverTraps: ['fiji', 'maldives', 'mauritius', 'seychelles', 'papua new guinea', 'solomon islands'],
    deepSinkers: ['palau', 'federated states of micronesia', 'marshall islands', 'nauru', 'kiribati', 'tuvalu', 'vanuatu', 'comoros', 'sao tome and principe']
  },
  {
    id: 'science-nobel-physics',
    category: 'Science',
    prompt: 'A recipient of the Nobel Prize in Physics',
    clue: 'Albert Einstein, Marie Curie, and Richard Feynman are top-of-mind.',
    surfaceFloaters: ['albert einstein', 'marie curie', 'richard feynman', 'stephen hawking', 'niels bohr', 'isaac newton'],
    tooCleverTraps: ['max planck', 'werner heisenberg', 'erwin schrodinger', 'enrico fermi', 'paul dirac', 'wilhelm rontgen'],
    deepSinkers: ['heike kamerlingh onnes', 'gabriel lippmann', 'johannes van der waals', 'charles edouard guillaume', 'percy williams bridgman', 'frits zernike', 'willis lamb', 'polykarp kusch']
  }
];

export interface AnswerEvaluation {
  rawAnswer: string;
  depthMeters: number;
  tier: 'surface' | 'mid' | 'deep' | 'abyssal' | 'invalid';
  tierLabel: string;
  message: string;
  valid: boolean;
}

export function evaluateAnswer(prompt: QuestionPrompt, userInput: string): AnswerEvaluation {
  const clean = userInput.trim().toLowerCase();
  if (!clean || clean.length < 2) {
    return {
      rawAnswer: userInput,
      depthMeters: 0,
      tier: 'invalid',
      tierLabel: 'Missed Answer',
      message: 'No valid answer entered within the time limit. Zero depth scored.',
      valid: false
    };
  }

  // Check 7000m Abyssal Sinkers
  for (const s of prompt.deepSinkers) {
    if (clean.includes(s) || s.includes(clean)) {
      return {
        rawAnswer: userInput,
        depthMeters: 7000,
        tier: 'abyssal',
        tierLabel: '7,000m Abyssal Sinker 👑',
        message: 'Flawless obscure knowledge! Only 0.05% of players identify this answer.',
        valid: true
      };
    }
  }

  // Check Too-Clever Traps (2,500m - 4,500m)
  for (const t of prompt.tooCleverTraps) {
    if (clean.includes(t) || t.includes(clean)) {
      const depth = Math.floor(Math.random() * 800) + 3200;
      return {
        rawAnswer: userInput,
        depthMeters: depth,
        tier: 'mid',
        tierLabel: `${depth}m Too-Clever Trap ⚠️`,
        message: 'Valid and clever, but thousands of other smart players typed the exact same answer!',
        valid: true
      };
    }
  }

  // Check Surface Floaters (200m - 1,400m)
  for (const f of prompt.surfaceFloaters) {
    if (clean.includes(f) || f.includes(clean)) {
      const depth = Math.floor(Math.random() * 600) + 600;
      return {
        rawAnswer: userInput,
        depthMeters: depth,
        tier: 'surface',
        tierLabel: `${depth}m Surface Floater 🌊`,
        message: 'The obvious crowd answer. You remain floating near the surface with the swarm.',
        valid: true
      };
    }
  }

  // If answer appears plausible but not in pre-mapped dictionary, award dynamic obscurity
  // based on character length and rarity factor
  const syntheticDepth = 4800 + Math.min(2200, clean.length * 150);
  return {
    rawAnswer: userInput,
    depthMeters: Math.min(7000, syntheticDepth),
    tier: syntheticDepth >= 6000 ? 'deep' : 'mid',
    tierLabel: `${Math.min(7000, syntheticDepth)}m Sinker ⚓`,
    message: 'Valid non-trivial candidate! Solid depth scored into the twilight trench.',
    valid: true
  };
}

export function getDailyPrompts(seedDate: string = new Date().toISOString().split('T')[0]): QuestionPrompt[] {
  // Deterministic 7 prompts for any calendar date
  let hash = 0;
  for (let i = 0; i < seedDate.length; i++) {
    hash = (hash << 5) - hash + seedDate.charCodeAt(i);
    hash |= 0;
  }
  const shuffled = [...QUESTION_BANK].sort((a, b) => {
    const hA = Math.sin(hash + a.id.length) * 10000;
    const hB = Math.sin(hash + b.id.length) * 10000;
    return (hA - Math.floor(hA)) - (hB - Math.floor(hB));
  });
  return shuffled.slice(0, 7);
}

export function getEndlessBatch(count: number = 7): QuestionPrompt[] {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
