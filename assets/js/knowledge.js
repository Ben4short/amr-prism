/* =========================================================================
   AMR Prism — knowledge base (drugs, species context, axioms)
   Research/education use only. Breakpoints are illustrative defaults.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  const DRUG_CLASSES = {
    penicillins: { label: 'Penicillins', color: '#39e0c4', family: 'β-lactams' },
    cephalosporins: { label: 'Cephalosporins', color: '#7dd3fc', family: 'β-lactams' },
    carbapenems: { label: 'Carbapenems', color: '#a78bfa', family: 'β-lactams' },
    monobactams: { label: 'Monobactams', color: '#38bdf8', family: 'β-lactams' },
    bl_inhibitor: { label: 'β-lactam / inhibitor', color: '#2dd4bf', family: 'β-lactams' },
    ceph_inhibitor: { label: 'Cephalosporin / inhibitor', color: '#60a5fa', family: 'β-lactams' },
    carb_inhibitor: { label: 'Carbapenem / inhibitor', color: '#c084fc', family: 'β-lactams' },
    aminoglycosides: { label: 'Aminoglycosides', color: '#f5b84b', family: 'Protein synthesis' },
    fluoroquinolones: { label: 'Fluoroquinolones', color: '#fb7185', family: 'DNA synthesis' },
    tetracyclines: { label: 'Tetracyclines', color: '#f97316', family: 'Protein synthesis' },
    glycylcyclines: { label: 'Glycylcyclines', color: '#fdba74', family: 'Protein synthesis' },
    macrolides: { label: 'Macrolides', color: '#e879f9', family: 'Protein synthesis' },
    lincosamides: { label: 'Lincosamides', color: '#d946ef', family: 'Protein synthesis' },
    streptogramins: { label: 'Streptogramins', color: '#c026d3', family: 'Protein synthesis' },
    glycopeptides: { label: 'Glycopeptides', color: '#4ade80', family: 'Cell wall' },
    oxazolidinones: { label: 'Oxazolidinones', color: '#22d3ee', family: 'Protein synthesis' },
    lipopeptides: { label: 'Lipopeptides', color: '#34d399', family: 'Cell membrane' },
    polymyxins: { label: 'Polymyxins', color: '#fbbf24', family: 'Cell membrane' },
    folate: { label: 'Folate pathway', color: '#94a3b8', family: 'Metabolism' },
    phenicols: { label: 'Phenicols', color: '#f472b6', family: 'Protein synthesis' },
    fosfomycins: { label: 'Fosfomycins', color: '#a3e635', family: 'Cell wall' },
    nitrofurans: { label: 'Nitrofurans', color: '#facc15', family: 'Oxidative stress' },
    rifamycins: { label: 'Rifamycins', color: '#f87171', family: 'RNA synthesis' },
    other: { label: 'Other', color: '#8aa4ba', family: 'Other' }
  };

  function bp(s, r) { return { s: s, r: r }; }

  const DRUGS = {
    'ampicillin': {
      name: 'Ampicillin', short: 'AMP', class: 'penicillins',
      aliases: ['ampicillin', 'amp', 'ampicilin'],
      bp: { ent: bp(8, 32), sta: bp(0.25, 0.5), enc: bp(8, 16) }
    },
    'amoxicillin': {
      name: 'Amoxicillin', short: 'AMX', class: 'penicillins',
      aliases: ['amoxicillin', 'amoxycillin', 'amx']
    },
    'amoxicillin-clavulanate': {
      name: 'Amoxicillin–clavulanate', short: 'AMC', class: 'bl_inhibitor',
      aliases: ['amoxicillin-clavulanate', 'amoxicillin clavulanate', 'amoxicillin/clavulanate', 'amox-clav', 'amox clav', 'augmentin', 'amc', 'amclav'],
      bp: { ent: bp(8, 32), sta: bp(4, 8) }
    },
    'piperacillin': {
      name: 'Piperacillin', short: 'PIP', class: 'penicillins',
      aliases: ['piperacillin', 'pip']
    },
    'piperacillin-tazobactam': {
      name: 'Piperacillin–tazobactam', short: 'TZP', class: 'bl_inhibitor',
      aliases: ['piperacillin-tazobactam', 'piperacillin/tazobactam', 'piperacillin tazobactam', 'pip-tazo', 'pip/tazo', 'tazocin', 'tzp', 'ptz'],
      bp: { ent: bp(16, 128), psa: bp(16, 128) }
    },
    'ampicillin-sulbactam': {
      name: 'Ampicillin–sulbactam', short: 'SAM', class: 'bl_inhibitor',
      aliases: ['ampicillin-sulbactam', 'ampicillin/sulbactam', 'amp-sulb', 'unasyn', 'sam'],
      bp: { aba: bp(8, 32), ent: bp(8, 32) }
    },
    'oxacillin': {
      name: 'Oxacillin', short: 'OXA', class: 'penicillins',
      aliases: ['oxacillin', 'oxa', 'methicillin', 'met'],
      bp: { sta: bp(2, 4) }
    },
    'penicillin': {
      name: 'Penicillin G', short: 'PEN', class: 'penicillins',
      aliases: ['penicillin', 'penicillin g', 'benzylpenicillin', 'pen', 'pen g'],
      bp: { sta: bp(0.12, 0.25), enc: bp(8, 16) }
    },
    'cefazolin': {
      name: 'Cefazolin', short: 'CFZ', class: 'cephalosporins',
      aliases: ['cefazolin', 'cefazoline', 'cfz', 'kefzol'],
      bp: { ent: bp(2, 8), sta: bp(2, 4) }
    },
    'cefoxitin': {
      name: 'Cefoxitin', short: 'FOX', class: 'cephalosporins',
      aliases: ['cefoxitin', 'fox', 'mefoxin'],
      bp: { ent: bp(8, 32), sta: bp(4, 8) }
    },
    'ceftriaxone': {
      name: 'Ceftriaxone', short: 'CRO', class: 'cephalosporins',
      aliases: ['ceftriaxone', 'cro', 'rocephin'],
      bp: { ent: bp(1, 4) }
    },
    'cefotaxime': {
      name: 'Cefotaxime', short: 'CTX', class: 'cephalosporins',
      aliases: ['cefotaxime', 'ctx', 'claforan'],
      bp: { ent: bp(1, 4) }
    },
    'ceftazidime': {
      name: 'Ceftazidime', short: 'CAZ', class: 'cephalosporins',
      aliases: ['ceftazidime', 'caz', 'fortaz'],
      bp: { ent: bp(4, 16), psa: bp(8, 32) }
    },
    'cefepime': {
      name: 'Cefepime', short: 'FEP', class: 'cephalosporins',
      aliases: ['cefepime', 'fep', 'maxipime'],
      bp: { ent: bp(2, 16), psa: bp(8, 32) }
    },
    'ceftaroline': {
      name: 'Ceftaroline', short: 'CPT', class: 'cephalosporins',
      aliases: ['ceftaroline', 'cpt', 'teflaro'],
      bp: { sta: bp(1, 4) }
    },
    'ceftobiprole': {
      name: 'Ceftobiprole', short: 'BPR', class: 'cephalosporins',
      aliases: ['ceftobiprole', 'bpr'],
      bp: { sta: bp(1, 4) }
    },
    'meropenem': {
      name: 'Meropenem', short: 'MEM', class: 'carbapenems',
      aliases: ['meropenem', 'mem', 'meronem'],
      bp: { ent: bp(1, 4), psa: bp(2, 8), aba: bp(2, 8) }
    },
    'imipenem': {
      name: 'Imipenem', short: 'IPM', class: 'carbapenems',
      aliases: ['imipenem', 'ipm', 'primaxin'],
      bp: { ent: bp(1, 4), psa: bp(2, 8), aba: bp(2, 8) }
    },
    'ertapenem': {
      name: 'Ertapenem', short: 'ETP', class: 'carbapenems',
      aliases: ['ertapenem', 'etp', 'invanz'],
      bp: { ent: bp(0.5, 2) }
    },
    'doripenem': {
      name: 'Doripenem', short: 'DOR', class: 'carbapenems',
      aliases: ['doripenem', 'dor'],
      bp: { ent: bp(1, 4), psa: bp(2, 8) }
    },
    'aztreonam': {
      name: 'Aztreonam', short: 'ATM', class: 'monobactams',
      aliases: ['aztreonam', 'atm', 'azactam'],
      bp: { ent: bp(4, 16), psa: bp(8, 32) }
    },
    'ceftazidime-avibactam': {
      name: 'Ceftazidime–avibactam', short: 'CZA', class: 'ceph_inhibitor',
      aliases: ['ceftazidime-avibactam', 'ceftazidime/avibactam', 'ceftaz-avi', 'ceftaz avi', 'cza', 'avycaz'],
      bp: { ent: bp(8, 16), psa: bp(8, 16) }
    },
    'ceftolozane-tazobactam': {
      name: 'Ceftolozane–tazobactam', short: 'C/T', class: 'ceph_inhibitor',
      aliases: ['ceftolozane-tazobactam', 'ceftolozane/tazobactam', 'ceftolozane-tazo', 'c/t', 'tolo-tazo', 'zerbaxa'],
      bp: { ent: bp(2, 4), psa: bp(4, 8) }
    },
    'meropenem-vaborbactam': {
      name: 'Meropenem–vaborbactam', short: 'MVB', class: 'carb_inhibitor',
      aliases: ['meropenem-vaborbactam', 'meropenem/vaborbactam', 'mero-vabo', 'mvb', 'vabomere'],
      bp: { ent: bp(4, 16) }
    },
    'imipenem-relebactam': {
      name: 'Imipenem–relebactam', short: 'I/R', class: 'carb_inhibitor',
      aliases: ['imipenem-relebactam', 'imipenem/relebactam', 'imi-releb', 'imr', 'recarbrio'],
      bp: { ent: bp(2, 4), psa: bp(2, 4) }
    },
    'aztreonam-avibactam': {
      name: 'Aztreonam–avibactam', short: 'ATM-AVI', class: 'ceph_inhibitor',
      aliases: ['aztreonam-avibactam', 'aztreonam/avibactam', 'atm-avi', 'aztreonam avibactam'],
      bp: { ent: bp(8, 16) }
    },
    'gentamicin': {
      name: 'Gentamicin', short: 'GEN', class: 'aminoglycosides',
      aliases: ['gentamicin', 'gentamycin', 'gen', 'gent'],
      bp: { ent: bp(4, 16), psa: bp(4, 16), aba: bp(4, 16), sta: bp(4, 16) }
    },
    'tobramycin': {
      name: 'Tobramycin', short: 'TOB', class: 'aminoglycosides',
      aliases: ['tobramycin', 'tob', 'nebcin'],
      bp: { ent: bp(4, 16), psa: bp(4, 16), aba: bp(4, 16), sta: bp(4, 16) }
    },
    'amikacin': {
      name: 'Amikacin', short: 'AMK', class: 'aminoglycosides',
      aliases: ['amikacin', 'amk', 'amikin'],
      bp: { ent: bp(16, 64), psa: bp(16, 64), aba: bp(16, 64), sta: bp(16, 64) }
    },
    'streptomycin': {
      name: 'Streptomycin', short: 'STR', class: 'aminoglycosides',
      aliases: ['streptomycin', 'str'],
      bp: { ent: bp(16, 64) }
    },
    'ciprofloxacin': {
      name: 'Ciprofloxacin', short: 'CIP', class: 'fluoroquinolones',
      aliases: ['ciprofloxacin', 'cipro', 'cip'],
      bp: { ent: bp(0.25, 1), psa: bp(0.5, 2), aba: bp(1, 4), sta: bp(1, 4) }
    },
    'levofloxacin': {
      name: 'Levofloxacin', short: 'LEV', class: 'fluoroquinolones',
      aliases: ['levofloxacin', 'levo', 'lev', 'levaquin'],
      bp: { ent: bp(0.5, 2), psa: bp(1, 4), aba: bp(1, 4), sta: bp(1, 4) }
    },
    'moxifloxacin': {
      name: 'Moxifloxacin', short: 'MOX', class: 'fluoroquinolones',
      aliases: ['moxifloxacin', 'moxi', 'mox', 'avelox'],
      bp: { ent: bp(1, 4), sta: bp(1, 4) }
    },
    'tetracycline': {
      name: 'Tetracycline', short: 'TET', class: 'tetracyclines',
      aliases: ['tetracycline', 'tet', 'tetracylin'],
      bp: { ent: bp(4, 16), aba: bp(4, 16), sta: bp(4, 16) }
    },
    'doxycycline': {
      name: 'Doxycycline', short: 'DOX', class: 'tetracyclines',
      aliases: ['doxycycline', 'doxy', 'dox'],
      bp: { ent: bp(4, 16), aba: bp(4, 16), sta: bp(4, 16) }
    },
    'minocycline': {
      name: 'Minocycline', short: 'MIN', class: 'tetracyclines',
      aliases: ['minocycline', 'mino', 'min'],
      bp: { aba: bp(4, 16), sta: bp(4, 16) }
    },
    'tigecycline': {
      name: 'Tigecycline', short: 'TGC', class: 'glycylcyclines',
      aliases: ['tigecycline', 'tige', 'tgc', 'tygacil'],
      bp: { ent: bp(2, 8), aba: bp(2, 8) }
    },
    'erythromycin': {
      name: 'Erythromycin', short: 'ERY', class: 'macrolides',
      aliases: ['erythromycin', 'ery', 'erythrocin'],
      bp: { sta: bp(0.5, 8) }
    },
    'azithromycin': {
      name: 'Azithromycin', short: 'AZM', class: 'macrolides',
      aliases: ['azithromycin', 'azi', 'azm', 'zithromax'],
      bp: { sta: bp(2, 8) }
    },
    'clarithromycin': {
      name: 'Clarithromycin', short: 'CLA', class: 'macrolides',
      aliases: ['clarithromycin', 'cla', 'biaxin'],
      bp: { sta: bp(2, 8) }
    },
    'clindamycin': {
      name: 'Clindamycin', short: 'CLI', class: 'lincosamides',
      aliases: ['clindamycin', 'clin', 'cli', 'dalacin'],
      bp: { sta: bp(0.5, 4) }
    },
    'vancomycin': {
      name: 'Vancomycin', short: 'VAN', class: 'glycopeptides',
      aliases: ['vancomycin', 'vanco', 'van'],
      bp: { sta: bp(2, 16), enc: bp(4, 32) }
    },
    'teicoplanin': {
      name: 'Teicoplanin', short: 'TEC', class: 'glycopeptides',
      aliases: ['teicoplanin', 'teico', 'tec', 'targocid'],
      bp: { sta: bp(2, 16), enc: bp(8, 32) }
    },
    'linezolid': {
      name: 'Linezolid', short: 'LZD', class: 'oxazolidinones',
      aliases: ['linezolid', 'lzd', 'zyvox'],
      bp: { sta: bp(4, 8), enc: bp(4, 8) }
    },
    'daptomycin': {
      name: 'Daptomycin', short: 'DAP', class: 'lipopeptides',
      aliases: ['daptomycin', 'dap', 'cubicin'],
      bp: { sta: bp(1, 4), enc: bp(4, 8) }
    },
    'colistin': {
      name: 'Colistin', short: 'COL', class: 'polymyxins',
      aliases: ['colistin', 'col', 'colistimethate', 'polymyxin e'],
      bp: { ent: bp(2, 4), psa: bp(2, 4), aba: bp(2, 4) }
    },
    'polymyxin-b': {
      name: 'Polymyxin B', short: 'PMB', class: 'polymyxins',
      aliases: ['polymyxin b', 'polymyxin-b', 'pmb'],
      bp: { ent: bp(2, 4), psa: bp(2, 4), aba: bp(2, 4) }
    },
    'trimethoprim-sulfamethoxazole': {
      name: 'Trimethoprim–sulfamethoxazole', short: 'SXT', class: 'folate',
      aliases: ['trimethoprim-sulfamethoxazole', 'trimethoprim/sulfamethoxazole', 'tmp-smx', 'tmp/smx', 'cotrimoxazole', 'co-trimoxazole', 'sxt', 'tmp smx'],
      bp: { ent: bp(2, 4), sta: bp(2, 4), aba: bp(2, 4), psa: bp(2, 4) }
    },
    'trimethoprim': {
      name: 'Trimethoprim', short: 'TMP', class: 'folate',
      aliases: ['trimethoprim', 'tmp'],
      bp: { ent: bp(2, 8) }
    },
    'sulfamethoxazole': {
      name: 'Sulfamethoxazole', short: 'SMX', class: 'folate',
      aliases: ['sulfamethoxazole', 'smx'],
      bp: { ent: bp(38, 76) }
    },
    'chloramphenicol': {
      name: 'Chloramphenicol', short: 'CHL', class: 'phenicols',
      aliases: ['chloramphenicol', 'chl', 'chloro'],
      bp: { ent: bp(8, 32), sta: bp(8, 32) }
    },
    'fosfomycin': {
      name: 'Fosfomycin', short: 'FOS', class: 'fosfomycins',
      aliases: ['fosfomycin', 'fos', 'monurol'],
      bp: { ent: bp(64, 256) }
    },
    'nitrofurantoin': {
      name: 'Nitrofurantoin', short: 'NIT', class: 'nitrofurans',
      aliases: ['nitrofurantoin', 'nit', 'macrobid'],
      bp: { ent: bp(32, 128) }
    },
    'rifampin': {
      name: 'Rifampin', short: 'RIF', class: 'rifamycins',
      aliases: ['rifampin', 'rifampicin', 'rif', 'rifadin'],
      bp: { sta: bp(1, 4) }
    },
    'kanamycin': {
      name: 'Kanamycin', short: 'KAN', class: 'aminoglycosides',
      aliases: ['kanamycin', 'kan'],
      bp: { ent: bp(16, 64) }
    },
    'neomycin': {
      name: 'Neomycin', short: 'NEO', class: 'aminoglycosides',
      aliases: ['neomycin', 'neo'],
      bp: { ent: bp(16, 64) }
    },
    'cefiderocol': {
      name: 'Cefiderocol', short: 'FDC', class: 'cephalosporins',
      aliases: ['cefiderocol', 'fdc', 'fetroja'],
      bp: { ent: bp(1, 4), psa: bp(1, 4), aba: bp(1, 4) }
    }
  };

  const DRUG_ALIASES = {};
  Object.keys(DRUGS).forEach(function (id) {
    const d = DRUGS[id];
    DRUG_ALIASES[id] = id;
    (d.aliases || []).forEach(function (a) {
      DRUG_ALIASES[a.toLowerCase().replace(/\s+/g, ' ').trim()] = id;
    });
    DRUG_ALIASES[d.name.toLowerCase().replace(/[–—]/g, '-')] = id;
  });

  const SPECIES = {
    'escherichia coli': { label: 'Escherichia coli', short: 'E. coli', group: 'ent', gram: 'negative' },
    'klebsiella pneumoniae': { label: 'Klebsiella pneumoniae', short: 'K. pneumoniae', group: 'ent', gram: 'negative' },
    'klebsiella oxytoca': { label: 'Klebsiella oxytoca', short: 'K. oxytoca', group: 'ent', gram: 'negative' },
    'enterobacter cloacae': { label: 'Enterobacter cloacae', short: 'E. cloacae', group: 'ent', gram: 'negative' },
    'enterobacter cloacae complex': { label: 'Enterobacter cloacae complex', short: 'E. cloacae complex', group: 'ent', gram: 'negative' },
    'proteus mirabilis': { label: 'Proteus mirabilis', short: 'P. mirabilis', group: 'ent', gram: 'negative' },
    'salmonella enterica': { label: 'Salmonella enterica', short: 'S. enterica', group: 'ent', gram: 'negative' },
    'pseudomonas aeruginosa': { label: 'Pseudomonas aeruginosa', short: 'P. aeruginosa', group: 'psa', gram: 'negative' },
    'acinetobacter baumannii': { label: 'Acinetobacter baumannii', short: 'A. baumannii', group: 'aba', gram: 'negative' },
    'staphylococcus aureus': { label: 'Staphylococcus aureus', short: 'S. aureus', group: 'sta', gram: 'positive' },
    'enterococcus faecium': { label: 'Enterococcus faecium', short: 'E. faecium', group: 'enc', gram: 'positive' },
    'enterococcus faecalis': { label: 'Enterococcus faecalis', short: 'E. faecalis', group: 'enc', gram: 'positive' },
    'streptococcus pneumoniae': { label: 'Streptococcus pneumoniae', short: 'S. pneumoniae', group: 'other', gram: 'positive' }
  };

  const INTRINSIC = {
    ent: [
      { drugs: ['vancomycin', 'teicoplanin', 'linezolid', 'daptomycin', 'erythromycin', 'azithromycin', 'clarithromycin', 'clindamycin', 'rifampin'], reason: 'Gram-negative outer membrane restricts entry of large hydrophobic and glycopeptide agents.' },
      { drugs: ['penicillin'], reason: 'Enterobacterales are not reliably susceptible to penicillin G; β-lactam agents with better penetration are used.' }
    ],
    psa: [
      { drugs: ['ampicillin', 'amoxicillin', 'amoxicillin-clavulanate', 'cefazolin', 'cefoxitin', 'ceftriaxone', 'cefotaxime', 'ertapenem'], reason: 'Chromosomal AmpC (PDC) expression plus low outer-membrane permeability and efflux give intrinsic resistance to these agents.' },
      { drugs: ['vancomycin', 'teicoplanin', 'linezolid', 'daptomycin', 'erythromycin', 'azithromycin', 'clarithromycin', 'clindamycin', 'rifampin', 'trimethoprim-sulfamethoxazole'], reason: 'Intrinsic low permeability / lack of target or uptake makes these agents unreliable against P. aeruginosa.' }
    ],
    aba: [
      { drugs: ['ampicillin', 'amoxicillin', 'amoxicillin-clavulanate', 'cefazolin', 'cefoxitin', 'ceftriaxone', 'cefotaxime', 'ertapenem'], reason: 'Chromosomal ADC (AmpC) and intrinsic OXA-51-like β-lactamase plus low permeability.' },
      { drugs: ['vancomycin', 'teicoplanin', 'linezolid', 'daptomycin', 'erythromycin', 'azithromycin', 'clarithromycin', 'clindamycin', 'rifampin'], reason: 'Intrinsic low permeability and absence of a susceptible target/uptake route.' }
    ],
    sta: [
      { drugs: ['colistin', 'polymyxin-b', 'aztreonam'], reason: 'The Gram-positive cell envelope lacks the LPS target of polymyxins; aztreonam has no meaningful activity against Gram-positive organisms.' }
    ],
    enc: [
      { drugs: ['cefazolin', 'cefoxitin', 'ceftriaxone', 'cefotaxime', 'ceftazidime', 'cefepime', 'ceftaroline', 'ceftobiprole'], reason: 'Enterococci express low-affinity PBPs (PBP5 in E. faecium) and are intrinsically resistant to cephalosporins.' },
      { drugs: ['clindamycin'], reason: 'Enterococci are intrinsically resistant to lincosamides.' }
    ]
  };

  // Species-specific intrinsic rules. These sit on top of the group-level rules
  // above and exist because intrinsic resistance is not uniform within a group
  // (for example, E. faecium is ampicillin resistant via PBP5 while E. faecalis
  // is usually susceptible).
  const INTRINSIC_SPECIES = {
    'enterococcus faecium': [
      {
        drugs: ['ampicillin', 'amoxicillin', 'amoxicillin-clavulanate', 'ampicillin-sulbactam', 'piperacillin', 'piperacillin-tazobactam', 'penicillin'],
        reason: 'E. faecium expresses the low-affinity penicillin-binding protein PBP5, which gives intrinsic resistance to aminopenicillins and penicillin; ampicillin is the class marker.'
      }
    ],
    'klebsiella pneumoniae': [
      {
        drugs: ['ampicillin', 'amoxicillin', 'amoxicillin-clavulanate', 'ampicillin-sulbactam'],
        reason: 'K. pneumoniae carries a chromosomal SHV penicillinase (often SHV-1) that is intrinsic to the species and inactivates aminopenicillins.'
      }
    ],
    'klebsiella oxytoca': [
      {
        drugs: ['ampicillin', 'amoxicillin', 'amoxicillin-clavulanate', 'ampicillin-sulbactam'],
        reason: 'K. oxytoca carries a chromosomal penicillinase that is intrinsic to the species and inactivates aminopenicillins.'
      }
    ],
    'proteus mirabilis': [
      {
        drugs: ['tetracycline', 'doxycycline', 'minocycline', 'nitrofurantoin', 'colistin', 'polymyxin-b'],
        reason: 'P. mirabilis is intrinsically resistant to tetracyclines, nitrofurantoin, and polymyxins through permeability and target/uptake differences.'
      }
    ]
  };

  const AXIOMS = [
    { id: 'A1', title: 'Mechanism must connect to the drug', text: 'A determinant can only explain resistance if its biochemical action affects the drug or the pathway the drug targets.' },
    { id: 'A2', title: 'Presence is not expression', text: 'A detected gene is a potential, not a phenotype. Transcription, translation, localization, and accessory mutations determine whether it is active.' },
    { id: 'A3', title: 'Phenotype is the integrated output', text: 'The observed SIR result integrates all resistance, permeability, efflux, and regulatory mechanisms, including those not measured.' },
    { id: 'A4', title: 'Concordance supports; discordance reveals a missing premise', text: 'Agreement strengthens a mechanistic explanation. Disagreement identifies a gap in the model or the data, not a reason to discard either.' },
    { id: 'A5', title: 'Absence of evidence is not evidence of absence', text: 'A negative AMRFinderPlus result cannot exclude mechanisms outside the database or below detection limits.' },
    { id: 'A6', title: 'Context precedes prediction', text: 'Species, site, drug exposure, and testing method set the background against which molecular determinants must be interpreted.' },
    { id: 'A7', title: 'Confidence is earned by independent evidence', text: 'High confidence requires mechanistic plausibility plus strong molecular evidence plus a reliable phenotype; any weak link lowers confidence.' },
    { id: 'A8', title: 'Actionable conclusions require uncertainty', text: 'Every prediction must carry its assumptions, alternative hypotheses, and the next test that would discriminate them.' }
  ];

  const CONCORDANCE = {
    'concordant-r': { label: 'Concordant R', short: 'R/R', color: '#ff6b78', tone: 'red', desc: 'A mechanistically valid determinant predicts resistance and the isolate is resistant.' },
    'concordant-s': { label: 'Concordant S', short: 'S/S', color: '#4ade80', tone: 'green', desc: 'No resistance mechanism predicts resistance, or a mechanism predicts susceptibility, and the isolate is susceptible.' },
    'partial': { label: 'Partial', short: 'R/I', color: '#f5b84b', tone: 'amber', desc: 'The prediction and phenotype agree on reduced susceptibility but differ in degree (R vs I).' },
    'silent': { label: 'Silent determinant', short: 'R/S', color: '#a78bfa', tone: 'purple', desc: 'A determinant predicts resistance but the isolate is susceptible — presence is not expression.' },
    'unexplained': { label: 'Unexplained resistance', short: '?/R', color: '#fb7185', tone: 'red', desc: 'The isolate is resistant but no detected determinant explains it — the evidence set is incomplete.' },
    'untested': { label: 'Not tested', short: '—', color: '#647f96', tone: 'outline', desc: 'A prediction exists but no phenotype is available.' },
    'no-call': { label: 'No call', short: '?', color: '#647f96', tone: 'outline', desc: 'Insufficient evidence for a comparison.' }
  };

  const MDR_CATEGORIES = {
    penicillins: 'Penicillins', cephalosporins: 'Cephalosporins', carbapenems: 'Carbapenems', monobactams: 'Monobactams',
    bl_inhibitor: 'β-lactam/inhibitor combinations', ceph_inhibitor: 'Cephalosporin/inhibitor combinations', carb_inhibitor: 'Carbapenem/inhibitor combinations',
    aminoglycosides: 'Aminoglycosides', fluoroquinolones: 'Fluoroquinolones', tetracyclines: 'Tetracyclines', glycylcyclines: 'Glycylcyclines',
    macrolides: 'Macrolides', lincosamides: 'Lincosamides', streptogramins: 'Streptogramins', glycopeptides: 'Glycopeptides',
    oxazolidinones: 'Oxazolidinones', lipopeptides: 'Lipopeptides', polymyxins: 'Polymyxins', folate: 'Folate pathway inhibitors',
    phenicols: 'Phenicols', fosfomycins: 'Fosfomycins', nitrofurans: 'Nitrofurans', rifamycins: 'Rifamycins', other: 'Other'
  };

  AMR.KB = {
    DRUGS: DRUGS,
    DRUG_ALIASES: DRUG_ALIASES,
    DRUG_CLASSES: DRUG_CLASSES,
    SPECIES: SPECIES,
    INTRINSIC: INTRINSIC,
    INTRINSIC_SPECIES: INTRINSIC_SPECIES,
    AXIOMS: AXIOMS,
    CONCORDANCE: CONCORDANCE,
    MDR_CATEGORIES: MDR_CATEGORIES,
    GENE_ENTRIES: [],
    GENE_INDEX: {},
    resolveGene: null,
    normalizeDrug: null
  };
})(window.AMR);
