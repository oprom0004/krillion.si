// Independently curated finite answer sets. Facts checked 2026-10-22.
// Scores are editorial practice values, never measured player frequencies.
import { EXTRA_BANK } from './extra-bank.mjs';
export const BANK_VERSION = '2026-10-22.2';
const sources = {
  nasa: 'https://science.nasa.gov/solar-system/planets/',
  elements: 'https://iupac.org/what-we-do/periodic-table-of-elements/',
  states: 'https://www.census.gov/library/reference/code-lists/ansi.html',
  canada: 'https://our-languages.canada.ca/en/writing-tips-plus/abbreviations-canadian-provinces-and-territories',
  si: 'https://www.bipm.org/en/measurement-units/si-base-units',
  prefixes: 'https://www.bipm.org/en/measurement-units/si-prefixes',
  un: 'https://www.un.org/en/our-work/official-languages',
  nato: 'https://www.nato.int/nato_static_fl2014/assets/pdf/pdf_2018_01/20180111_nato-alphabet-sign-signal.pdf',
  chess: 'https://handbook.fide.com/chapter/E012023'
};
// Each entry may include explicit aliases, separated by |. Short symbols match
// exactly only. Order is a fixed editorial familiarity ranking, not survey data.
function question(id, text, entries, expected, source) {
  const tiers = ['plankton', 'schooler', 'rare', 'deepcut', 'krillion'];
  const answers = entries.split(';').map((entry, i, all) => {
    const [answer, ...aliases] = entry.split('|');
    return { answer, aliases, tier: tiers[Math.round(i * 4 / (all.length - 1))] };
  });
  return { id, text, answers, expected, source: sources[source] || source, checked: '2026-10-22' };
}
const planets = 'Earth|Terra;Mars;Jupiter;Saturn;Venus;Mercury;Neptune;Uranus';
const provinces = 'Ontario|ON;Quebec|Québec|QC;British Columbia|BC;Alberta|AB;Nova Scotia|NS;Manitoba|MB;Saskatchewan|SK;New Brunswick|NB;Newfoundland and Labrador|Newfoundland & Labrador|NL;Prince Edward Island|PEI|PE';
const territories = 'Yukon|YT|Yukon Territory;Northwest Territories|NWT|NT;Nunavut|NU';
export const BANK = [
  question('planets', 'Name one of the eight planets in our Solar System. Planet names only; dwarf planets do not count.', planets, 8, 'nasa'),
  question('rocky-planets', 'Name one of the four terrestrial planets in our Solar System.', 'Earth|Terra;Mars;Venus;Mercury', 4, 'nasa'),
  question('giant-planets', 'Name a gas giant or ice giant planet in our Solar System.', 'Jupiter;Saturn;Neptune;Uranus', 4, 'nasa'),
  question('alkali-metals', 'Name a Group 1 alkali metal. Hydrogen is excluded. Element names or symbols count.', 'Lithium|Li;Sodium|Na;Potassium|K;Rubidium|Rb;Caesium|Cesium|Cs;Francium|Fr', 6, 'elements'),
  question('alkaline-earth', 'Name a Group 2 alkaline earth metal. Element names or symbols count.', 'Calcium|Ca;Magnesium|Mg;Barium|Ba;Beryllium|Be;Strontium|Sr;Radium|Ra', 6, 'elements'),
  question('halogens', 'Name an element in Group 17 of the periodic table, including the synthetic element. Names or symbols count.', 'Chlorine|Cl;Fluorine|F;Iodine|I;Bromine|Br;Astatine|At;Tennessine|Ts', 6, 'elements'),
  question('group-18', 'Name an element in Group 18 of the periodic table, including oganesson. Names or symbols count.', 'Helium|He;Neon|Ne;Argon|Ar;Krypton|Kr;Xenon|Xe;Radon|Rn;Oganesson|Og', 7, 'elements'),
  question('period-2', 'Name an element in Period 2 of the periodic table: atomic numbers 3 through 10. Names or symbols count.', 'Carbon|C;Oxygen|O;Nitrogen|N;Lithium|Li;Neon|Ne;Fluorine|F;Boron|B;Beryllium|Be', 8, 'elements'),
  question('period-3', 'Name an element in Period 3 of the periodic table: atomic numbers 11 through 18. Names or symbols count.', 'Sodium|Na;Aluminium|Aluminum|Al;Silicon|Si;Magnesium|Mg;Sulfur|Sulphur|S;Chlorine|Cl;Phosphorus|P;Argon|Ar', 8, 'elements'),
  question('one-letter-symbol', 'Name a chemical element with a one-letter symbol. Element names or symbols count.', 'Oxygen|O;Hydrogen|H;Carbon|C;Nitrogen|N;Sulfur|Sulphur|S;Phosphorus|P;Potassium|K;Iodine|I;Fluorine|F;Boron|B;Uranium|U;Tungsten|W|Wolfram;Vanadium|V;Yttrium|Y', 14, 'elements'),
  question('first-ten-elements', 'Name one of the first ten chemical elements by atomic number. Element names or symbols count.', 'Hydrogen|H;Helium|He;Carbon|C;Oxygen|O;Nitrogen|N;Lithium|Li;Neon|Ne;Fluorine|F;Boron|B;Beryllium|Be', 10, 'elements'),
  question('us-states', 'Name one of the 50 U.S. states. State names or two-letter postal abbreviations count; territories and Washington, D.C. do not.', 'California|CA;New York|NY;Texas|TX;Florida|FL;Hawaii|HI;Alaska|AK;Washington|WA|Washington State|State of Washington;Nevada|NV;Arizona|AZ;Colorado|CO;Ohio|OH;Georgia|GA;Virginia|VA;New Jersey|NJ;Pennsylvania|PA;Massachusetts|MA;Michigan|MI;Illinois|IL;North Carolina|NC;Oregon|OR;Maryland|MD;Tennessee|TN;Louisiana|LA;South Carolina|SC;Wisconsin|WI;Minnesota|MN;Indiana|IN;Kentucky|KY;Alabama|AL;Oklahoma|OK;Utah|UT;Iowa|IA;Kansas|KS;Arkansas|AR;Mississippi|MS;Missouri|MO;Connecticut|CT;New Mexico|NM;Nebraska|NE;Idaho|ID;Maine|ME;New Hampshire|NH;Rhode Island|RI;West Virginia|WV;Delaware|DE;Montana|MT;Vermont|VT;North Dakota|ND;South Dakota|SD;Wyoming|WY', 50, 'states'),
  question('canada-all', 'Name a Canadian province or territory. Full names or official postal abbreviations count.', provinces + ';' + territories, 13, 'canada'),
  question('canada-provinces', 'Name one of Canada’s ten provinces. Territories do not count. Full names or official postal abbreviations count.', provinces, 10, 'canada'),
  question('canada-territories', 'Name one of Canada’s three territories. Provinces do not count. Full names or official postal abbreviations count.', territories, 3, 'canada'),
  question('si-base-units', 'Name one of the seven SI base units. Write the unit name, not its symbol.', 'Metre|Meter|Metres|Meters;Second|Seconds;Kilogram|Kilograms;Ampere|Amperes|Amp|Amps;Kelvin|Kelvins;Mole|Moles;Candela|Candelas', 7, 'si'),
  question('si-base-quantities', 'Name one of the seven SI base quantities, not a unit or derived quantity.', 'Length;Mass;Time;Electric current|Electrical current|Current;Thermodynamic temperature|Temperature;Amount of substance|Chemical amount;Luminous intensity', 7, 'si'),
  question('si-prefixes', 'Name an SI decimal prefix, including the four added in 2022. Write the prefix name, not its symbol.', 'Kilo;Milli;Centi;Mega;Giga;Micro;Nano;Tera;Pico;Deca|Deka;Hecto;Deci;Peta;Femto;Exa;Atto;Zetta;Zepto;Yotta;Yocto;Ronna;Ronto;Quetta;Quecto', 24, 'prefixes'),
  question('un-languages', 'Name one of the six official languages of the United Nations. English language names only.', 'English;French;Spanish;Chinese|Mandarin|Mandarin Chinese|Standard Chinese;Russian;Arabic|Modern Standard Arabic', 6, 'un'),
  question('nato-alphabet', 'Name a word in the current 26-letter NATO spelling alphabet. Give the code word, not the letter.', 'Alfa|Alpha;Bravo;Charlie;Delta;Echo;Foxtrot;Golf;Hotel;India;Juliett|Juliet;Kilo;Lima;Mike;November;Oscar;Papa;Quebec|Québec;Romeo;Sierra;Tango;Uniform;Victor;Whiskey|Whisky;X-ray|Xray|X ray;Yankee;Zulu', 26, 'nato'),
  question('chess-pieces', 'Name one of the six types of piece in standard chess, including the pawn. Names only, not notation letters.', 'King|Kings;Queen|Queens;Pawn|Pawns;Rook|Rooks|Castle|Castles;Bishop|Bishops;Knight|Knights|Horse|Horses', 6, 'chess')
  ,...EXTRA_BANK.map(row => question(...row))
];
