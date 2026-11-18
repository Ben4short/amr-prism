/* =========================================================================
   AMR Prism — synthetic demonstration dataset
   All isolates, patients, and results are fictional and for illustration only.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  function g(symbol, cls, sub, mech, identity, coverage, contig, method, product, scope) {
    return {
      symbol: symbol,
      name: product || symbol,
      class: cls || '',
      subclass: sub || '',
      mechanism: mech || '',
      identity: identity == null ? 100 : identity,
      coverage: coverage == null ? 100 : coverage,
      contig: contig || 'contig_1',
      method: method || 'EXACTX',
      product: product || '',
      scope: scope || 'core',
      type: 'AMR'
    };
  }
  function p(drug, mic, sir, method, note) {
    return { drug: drug, mic: mic, sir: sir, method: method || 'BMD', note: note || '' };
  }
  function iso(o) { o.images = o.images || []; return o; }

  const ISOLATES = [
    iso({
      id: 'EC-2401', species: 'Escherichia coli', source: 'Urine', collectionDate: '2026-01-12',
      location: 'Medical ICU', age: '67', sex: 'F', notes: 'Community-onset febrile UTI; ESBL confirmed by combination disk test. No prior carbapenem exposure.',
      genes: [
        g('blaCTX-M-15', 'BETA-LACTAM', 'CTX-M', 'ESBL', 100, 100, 'pEC2401_1', 'EXACTX', 'CTX-M-15 family extended-spectrum beta-lactamase'),
        g('blaTEM-1B', 'BETA-LACTAM', 'TEM', 'penicillinase', 100, 100, 'pEC2401_1', 'EXACTX', 'TEM-1 beta-lactamase'),
        g('blaOXA-1', 'BETA-LACTAM', 'OXA', 'penicillinase', 99.7, 100, 'pEC2401_1', 'BLASTP', 'OXA-1 beta-lactamase'),
        g("aac(6')-Ib-cr", 'AMINOGLYCOSIDE; QUINOLONE', "AAC(6')-Ib-cr", 'bifunctional acetyltransferase', 100, 100, 'pEC2401_1', 'EXACTX', "AAC(6')-Ib-cr"),
        g('aac(3)-IId', 'AMINOGLYCOSIDE', 'AAC(3)', 'acetyltransferase', 100, 100, 'pEC2401_1', 'EXACTX', 'AAC(3)-IId'),
        g('qnrS1', 'QUINOLONE', 'QNR', 'target protection', 100, 100, 'pEC2401_1', 'EXACTX', 'QnrS1'),
        g('sul1', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pEC2401_1', 'EXACTX', 'Sul1'),
        g('dfrA17', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pEC2401_1', 'EXACTX', 'DfrA17'),
        g('tet(A)', 'TETRACYCLINE', 'TET', 'efflux', 100, 100, 'pEC2401_1', 'EXACTX', 'TetA'),
        g('catB3', 'PHENICOL', 'CAT', 'acetyltransferase', 100, 100, 'pEC2401_1', 'EXACTX', 'CatB3')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('amoxicillin-clavulanate', '32/16', 'R'), p('piperacillin-tazobactam', '64/4', 'I'),
        p('cefazolin', '>8', 'R'), p('cefoxitin', '8', 'S'), p('ceftriaxone', '>64', 'R'), p('cefotaxime', '>64', 'R'),
        p('ceftazidime', '32', 'R'), p('cefepime', '16', 'R'), p('meropenem', '0.25', 'S'), p('ertapenem', '0.5', 'S'),
        p('gentamicin', '16', 'R'), p('tobramycin', '16', 'R'), p('amikacin', '32', 'I'),
        p('ciprofloxacin', '>4', 'R'), p('levofloxacin', '4', 'R'), p('trimethoprim-sulfamethoxazole', '>4/76', 'R'),
        p('tetracycline', '>16', 'R'), p('doxycycline', '8', 'I'), p('chloramphenicol', '32', 'R'),
        p('colistin', '0.5', 'S'), p('nitrofurantoin', '16', 'S'), p('fosfomycin', '16', 'S'),
        p('ceftazidime-avibactam', '1/4', 'S'), p('ceftolozane-tazobactam', '2/4', 'S')
      ]
    }),
    iso({
      id: 'KP-2402', species: 'Klebsiella pneumoniae', source: 'Blood', collectionDate: '2026-01-18',
      location: 'Medical ICU', age: '72', sex: 'M', notes: 'KPC-2-producing K. pneumoniae bacteremia. OmpK36 porin loss detected by targeted sequencing. Prior meropenem exposure.',
      genes: [
        g('blaKPC-2', 'BETA-LACTAM', 'KPC', 'carbapenemase', 100, 100, 'pKP2402_1', 'EXACTX', 'KPC-2 carbapenemase'),
        g('blaSHV-11', 'BETA-LACTAM', 'SHV', 'penicillinase', 100, 100, 'chr', 'EXACTX', 'SHV-11 beta-lactamase'),
        g('blaTEM-1A', 'BETA-LACTAM', 'TEM', 'penicillinase', 100, 100, 'pKP2402_1', 'EXACTX', 'TEM-1A beta-lactamase'),
        g('aac(3)-IIa', 'AMINOGLYCOSIDE', 'AAC(3)', 'acetyltransferase', 100, 100, 'pKP2402_1', 'EXACTX', 'AAC(3)-IIa'),
        g('sul2', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pKP2402_1', 'EXACTX', 'Sul2'),
        g('dfrA14', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pKP2402_1', 'EXACTX', 'DfrA14'),
        g('gyrA_S83L', 'QUINOLONE', 'GYRASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GyrA S83L')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('amoxicillin-clavulanate', '>32/16', 'R'), p('piperacillin-tazobactam', '>128/4', 'R'),
        p('cefazolin', '>8', 'R'), p('cefoxitin', '>32', 'R'), p('ceftriaxone', '>64', 'R'), p('cefotaxime', '>64', 'R'),
        p('ceftazidime', '>64', 'R'), p('cefepime', '>32', 'R'), p('meropenem', '32', 'R'), p('imipenem', '16', 'R'),
        p('ertapenem', '>8', 'R'), p('aztreonam', '>64', 'R'), p('gentamicin', '16', 'R'), p('tobramycin', '16', 'R'),
        p('amikacin', '8', 'S'), p('ciprofloxacin', '>4', 'R'), p('levofloxacin', '>8', 'R'),
        p('trimethoprim-sulfamethoxazole', '>4/76', 'R'), p('tetracycline', '4', 'S'), p('colistin', '0.5', 'S'),
        p('tigecycline', '1', 'S'), p('ceftazidime-avibactam', '2/4', 'S'), p('meropenem-vaborbactam', '2/8', 'S'),
        p('imipenem-relebactam', '1/4', 'S'), p('ceftolozane-tazobactam', '>32/4', 'R')
      ]
    }),
    iso({
      id: 'PA-2403', species: 'Pseudomonas aeruginosa', source: 'Wound', collectionDate: '2026-01-22',
      location: 'Burn ICU', age: '45', sex: 'M', notes: 'VIM-2 metallo-beta-lactamase; ArmA 16S rRNA methyltransferase. Ceftazidime-avibactam resistance consistent with MBL. Colistin retained.',
      genes: [
        g('blaVIM-2', 'BETA-LACTAM', 'VIM', 'metallo-beta-lactamase', 100, 100, 'pPA2403_1', 'EXACTX', 'VIM-2 MBL'),
        g('blaPDC-3', 'BETA-LACTAM', 'PDC', 'AmpC', 99.8, 100, 'chr', 'BLASTP', 'Pseudomonas-derived cephalosporinase 3'),
        g('blaOXA-50', 'BETA-LACTAM', 'OXA', 'intrinsic OXA', 100, 100, 'chr', 'EXACTX', 'OXA-50'),
        g('armA', 'AMINOGLYCOSIDE', '16S rRNA methyltransferase', 'target protection', 100, 100, 'pPA2403_1', 'EXACTX', 'ArmA'),
        g('sul1', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pPA2403_1', 'EXACTX', 'Sul1'),
        g('dfrB1', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pPA2403_1', 'EXACTX', 'DfrB1'),
        g('gyrA_T83I', 'QUINOLONE', 'GYRASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GyrA T83I'),
        g('parC_S87L', 'QUINOLONE', 'TOPOISOMERASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'ParC S87L'),
        g('tet(G)', 'TETRACYCLINE', 'TET', 'efflux', 100, 100, 'pPA2403_1', 'EXACTX', 'TetG'),
        g('catB7', 'PHENICOL', 'CAT', 'acetyltransferase', 100, 100, 'pPA2403_1', 'EXACTX', 'CatB7')
      ],
      phenotypes: [
        p('piperacillin-tazobactam', '>128/4', 'R'), p('ceftazidime', '>64', 'R'), p('cefepime', '>32', 'R'),
        p('meropenem', '32', 'R'), p('imipenem', '32', 'R'), p('aztreonam', '32', 'R'),
        p('gentamicin', '>16', 'R'), p('tobramycin', '>16', 'R'), p('amikacin', '>64', 'R'),
        p('ciprofloxacin', '>4', 'R'), p('levofloxacin', '>8', 'R'), p('colistin', '1', 'S'),
        p('ceftazidime-avibactam', '32/4', 'R'), p('ceftolozane-tazobactam', '>32/4', 'R'),
        p('imipenem-relebactam', '16/4', 'R'), p('trimethoprim-sulfamethoxazole', '>4/76', 'R'),
        p('tetracycline', '16', 'R'), p('chloramphenicol', '64', 'R')
      ]
    }),
    iso({
      id: 'AB-2404', species: 'Acinetobacter baumannii', source: 'BAL', collectionDate: '2026-01-25',
      location: 'Surgical ICU', age: '58', sex: 'M', notes: 'OXA-23 carbapenemase with intrinsic OXA-66 and ADC-25. ArmA methyltransferase. XDR phenotype.',
      genes: [
        g('blaOXA-23', 'BETA-LACTAM', 'OXA-23', 'carbapenemase', 100, 100, 'pAB2404_1', 'EXACTX', 'OXA-23 carbapenemase'),
        g('blaOXA-66', 'BETA-LACTAM', 'OXA-51-like', 'intrinsic OXA', 100, 100, 'chr', 'EXACTX', 'OXA-66'),
        g('blaADC-25', 'BETA-LACTAM', 'ADC', 'AmpC', 100, 100, 'chr', 'EXACTX', 'ADC-25'),
        g('armA', 'AMINOGLYCOSIDE', '16S rRNA methyltransferase', 'target protection', 100, 100, 'pAB2404_1', 'EXACTX', 'ArmA'),
        g('sul2', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pAB2404_1', 'EXACTX', 'Sul2'),
        g('dfrA12', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pAB2404_1', 'EXACTX', 'DfrA12'),
        g('tet(B)', 'TETRACYCLINE', 'TET', 'efflux', 100, 100, 'pAB2404_1', 'EXACTX', 'TetB'),
        g('catB8', 'PHENICOL', 'CAT', 'acetyltransferase', 100, 100, 'pAB2404_1', 'EXACTX', 'CatB8'),
        g('gyrA_S83L', 'QUINOLONE', 'GYRASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GyrA S83L'),
        g('parC_S80L', 'QUINOLONE', 'TOPOISOMERASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'ParC S80L')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('ampicillin-sulbactam', '32/16', 'R'), p('piperacillin-tazobactam', '>128/4', 'R'),
        p('ceftazidime', '>64', 'R'), p('cefepime', '>32', 'R'), p('meropenem', '64', 'R'), p('imipenem', '64', 'R'),
        p('gentamicin', '>16', 'R'), p('tobramycin', '>16', 'R'), p('amikacin', '>64', 'R'),
        p('ciprofloxacin', '>4', 'R'), p('levofloxacin', '>8', 'R'), p('trimethoprim-sulfamethoxazole', '>4/76', 'R'),
        p('tetracycline', '>16', 'R'), p('doxycycline', '>16', 'R'), p('minocycline', '8', 'I'), p('tigecycline', '1', 'S'),
        p('colistin', '1', 'S'), p('chloramphenicol', '64', 'R'), p('ceftazidime-avibactam', '>32/4', 'R'),
        p('meropenem-vaborbactam', '32/8', 'R'), p('imipenem-relebactam', '32/4', 'R')
      ]
    }),
    iso({
      id: 'SA-2405', species: 'Staphylococcus aureus', source: 'Blood', collectionDate: '2026-02-02',
      location: 'Cardiology', age: '61', sex: 'M', notes: 'MRSA bacteremia. D-test positive (inducible clindamycin resistance). Vancomycin and daptomycin retained.',
      genes: [
        g('mecA', 'BETA-LACTAM', 'MECA', 'PBP2a', 100, 100, 'SCCmec', 'EXACTX', 'PBP2a'),
        g('blaZ', 'BETA-LACTAM', 'PENICILLINASE', 'penicillinase', 100, 100, 'pSA2405', 'EXACTX', 'Beta-lactamase'),
        g('ermC', 'MACROLIDE; LINCOSAMIDE', 'ERM', 'rRNA methylase', 100, 100, 'pSA2405', 'EXACTX', 'ErmC'),
        g("aac(6')-aph(2'')", 'AMINOGLYCOSIDE', "AAC(6')-aph(2'')", 'bifunctional enzyme', 100, 100, 'chr', 'EXACTX', 'AAC(6′)-aph(2″)'),
        g('gyrA_S84L', 'QUINOLONE', 'GYRASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GyrA S84L'),
        g('grlA_S80Y', 'QUINOLONE', 'TOPOISOMERASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GrlA S80Y')
      ],
      phenotypes: [
        p('penicillin', '>8', 'R'), p('oxacillin', '>8', 'R'), p('cefazolin', '>8', 'R'), p('cefoxitin', '>8', 'R'),
        p('ceftaroline', '1', 'S'), p('erythromycin', '>8', 'R'), p('clindamycin', '4', 'R'),
        p('gentamicin', '16', 'R'), p('tobramycin', '16', 'R'), p('amikacin', '32', 'I'),
        p('ciprofloxacin', '4', 'R'), p('levofloxacin', '4', 'R'), p('trimethoprim-sulfamethoxazole', '1/19', 'S'),
        p('tetracycline', '2', 'S'), p('vancomycin', '1', 'S'), p('linezolid', '2', 'S'), p('daptomycin', '0.5', 'S'),
        p('rifampin', '0.5', 'S'), p('chloramphenicol', '8', 'S')
      ]
    }),
    iso({
      id: 'EF-2406', species: 'Enterococcus faecium', source: 'Urine', collectionDate: '2026-02-05',
      location: 'Nephrology', age: '70', sex: 'F', notes: 'VanA VRE. Ampicillin resistance is intrinsic (PBP5). Linezolid and daptomycin retained. TMP-SMX is susceptible in vitro but not clinically reliable.',
      genes: [
        g('vanA', 'GLYCOPEPTIDE', 'VANA', 'target alteration', 100, 100, 'Tnp1546', 'EXACTX', 'VanA'),
        g("aac(6')-Ii", 'AMINOGLYCOSIDE', "AAC(6')-Ii", 'intrinsic acetyltransferase', 100, 100, 'chr', 'EXACTX', "AAC(6')-Ii"),
        g('msrC', 'MACROLIDE', 'MSR', 'efflux', 100, 100, 'chr', 'EXACTX', 'MsrC')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('penicillin', '>32', 'R'), p('vancomycin', '>32', 'R'), p('teicoplanin', '>32', 'R'),
        p('linezolid', '2', 'S'), p('daptomycin', '2', 'S'), p('trimethoprim-sulfamethoxazole', '2/38', 'S'),
        p('nitrofurantoin', '32', 'S'), p('rifampin', '1', 'S'), p('chloramphenicol', '8', 'S'), p('tetracycline', '2', 'S')
      ]
    }),
    iso({
      id: 'EC-2407', species: 'Escherichia coli', source: 'Urine', collectionDate: '2026-02-09',
      location: 'Outpatient', age: '34', sex: 'F', notes: 'Fluoroquinolone-resistant E. coli without ESBL or carbapenemase. Target mutations only; no acquired β-lactamase detected.',
      genes: [
        g('gyrA_S83L', 'QUINOLONE', 'GYRASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GyrA S83L'),
        g('parC_S80I', 'QUINOLONE', 'TOPOISOMERASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'ParC S80I')
      ],
      phenotypes: [
        p('ampicillin', '2', 'S'), p('ceftriaxone', '0.5', 'S'), p('cefepime', '1', 'S'), p('meropenem', '0.25', 'S'),
        p('gentamicin', '2', 'S'), p('ciprofloxacin', '>4', 'R'), p('levofloxacin', '8', 'R'), p('moxifloxacin', '4', 'R'),
        p('trimethoprim-sulfamethoxazole', '1/19', 'S'), p('tetracycline', '2', 'S'), p('nitrofurantoin', '16', 'S'),
        p('fosfomycin', '16', 'S'), p('colistin', '0.5', 'S')
      ]
    }),
    iso({
      id: 'KP-2408', species: 'Klebsiella pneumoniae', source: 'Urine', collectionDate: '2026-02-11',
      location: 'Long-term care', age: '81', sex: 'F', notes: 'mcr-1.1-positive K. pneumoniae. Colistin and polymyxin B resistant; carbapenems remain susceptible. No carbapenemase detected.',
      genes: [
        g('mcr-1.1', 'POLYMYXIN', 'MCR', 'LPS modification', 100, 100, 'pKP2408', 'EXACTX', 'MCR-1.1'),
        g('blaSHV-1', 'BETA-LACTAM', 'SHV', 'penicillinase', 100, 100, 'chr', 'EXACTX', 'SHV-1'),
        g('blaTEM-1B', 'BETA-LACTAM', 'TEM', 'penicillinase', 100, 100, 'pKP2408', 'EXACTX', 'TEM-1B'),
        g('sul2', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pKP2408', 'EXACTX', 'Sul2'),
        g('dfrA12', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pKP2408', 'EXACTX', 'DfrA12'),
        g('tet(A)', 'TETRACYCLINE', 'TET', 'efflux', 100, 100, 'pKP2408', 'EXACTX', 'TetA')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('amoxicillin-clavulanate', '8/4', 'S'), p('piperacillin-tazobactam', '8/4', 'S'),
        p('ceftriaxone', '0.5', 'S'), p('cefepime', '1', 'S'), p('meropenem', '0.25', 'S'),
        p('colistin', '8', 'R'), p('polymyxin-b', '8', 'R'), p('gentamicin', '2', 'S'), p('ciprofloxacin', '0.5', 'S'),
        p('trimethoprim-sulfamethoxazole', '>4/76', 'R'), p('tetracycline', '16', 'R'), p('chloramphenicol', '8', 'S'),
        p('nitrofurantoin', '16', 'S'), p('fosfomycin', '16', 'S')
      ]
    }),
    iso({
      id: 'PA-2409', species: 'Pseudomonas aeruginosa', source: 'Sputum', collectionDate: '2026-02-14',
      location: 'Respiratory ICU', age: '66', sex: 'M', notes: 'OprD porin loss detected by targeted sequencing. MexAB-OprM overexpression by RT-qPCR (4.8-fold). No acquired carbapenemase. PDC-5 AmpC present.',
      genes: [
        g('blaPDC-5', 'BETA-LACTAM', 'PDC', 'AmpC', 100, 100, 'chr', 'EXACTX', 'PDC-5'),
        g('blaOXA-50', 'BETA-LACTAM', 'OXA', 'intrinsic OXA', 100, 100, 'chr', 'EXACTX', 'OXA-50'),
        g('gyrA_T83I', 'QUINOLONE', 'GYRASE', 'target alteration', 100, 100, 'chr', 'POINT_MUTATION', 'GyrA T83I')
      ],
      phenotypes: [
        p('piperacillin-tazobactam', '128/4', 'R'), p('ceftazidime', '16', 'R'), p('cefepime', '8', 'S'),
        p('meropenem', '16', 'R'), p('imipenem', '16', 'R'), p('aztreonam', '16', 'R'),
        p('gentamicin', '2', 'S'), p('tobramycin', '2', 'S'), p('amikacin', '4', 'S'),
        p('ciprofloxacin', '4', 'R'), p('levofloxacin', '8', 'R'), p('colistin', '1', 'S'),
        p('ceftazidime-avibactam', '8/4', 'S'), p('ceftolozane-tazobactam', '4/4', 'S'),
        p('trimethoprim-sulfamethoxazole', '2/38', 'S'), p('tetracycline', '4', 'S')
      ]
    }),
    iso({
      id: 'ECL-2410', species: 'Enterobacter cloacae', source: 'Blood', collectionDate: '2026-02-17',
      location: 'Hematology', age: '54', sex: 'F', notes: 'AmpC derepressed (ceftazidime induction assay). OmpC/OmpF porin loss by SDS-PAGE. No acquired carbapenemase. Ceftazidime-avibactam retained.',
      genes: [
        g('blaACT-7', 'BETA-LACTAM', 'ACT', 'AmpC', 100, 100, 'chr', 'EXACTX', 'ACT-7'),
        g('blaTEM-1B', 'BETA-LACTAM', 'TEM', 'penicillinase', 100, 100, 'pECL2410', 'EXACTX', 'TEM-1B'),
        g('sul1', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pECL2410', 'EXACTX', 'Sul1'),
        g('dfrA12', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pECL2410', 'EXACTX', 'DfrA12')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('amoxicillin-clavulanate', '>32/16', 'R'), p('piperacillin-tazobactam', '>128/4', 'R'),
        p('cefoxitin', '>32', 'R'), p('ceftriaxone', '>64', 'R'), p('cefotaxime', '>64', 'R'), p('ceftazidime', '64', 'R'),
        p('cefepime', '32', 'R'), p('meropenem', '8', 'R'), p('ertapenem', '4', 'R'),
        p('gentamicin', '4', 'S'), p('ciprofloxacin', '0.5', 'S'), p('trimethoprim-sulfamethoxazole', '>4/76', 'R'),
        p('tetracycline', '4', 'S'), p('colistin', '0.5', 'S'), p('ceftazidime-avibactam', '2/4', 'S'),
        p('meropenem-vaborbactam', '1/8', 'S')
      ]
    }),
    iso({
      id: 'SA-2411', species: 'Staphylococcus aureus', source: 'Skin abscess', collectionDate: '2026-02-20',
      location: 'Emergency', age: '29', sex: 'M', notes: 'MSSA. Penicillinase only; oxacillin susceptible. No mecA/mecC detected.',
      genes: [
        g('blaZ', 'BETA-LACTAM', 'PENICILLINASE', 'penicillinase', 100, 100, 'pSA2411', 'EXACTX', 'Beta-lactamase')
      ],
      phenotypes: [
        p('penicillin', '>8', 'R'), p('oxacillin', '1', 'S'), p('cefazolin', '1', 'S'), p('cefoxitin', '4', 'S'),
        p('erythromycin', '0.5', 'S'), p('clindamycin', '0.25', 'S'), p('gentamicin', '2', 'S'), p('ciprofloxacin', '0.5', 'S'),
        p('trimethoprim-sulfamethoxazole', '1/19', 'S'), p('tetracycline', '2', 'S'), p('vancomycin', '1', 'S'),
        p('linezolid', '2', 'S'), p('daptomycin', '0.5', 'S'), p('doxycycline', '2', 'S')
      ]
    }),
    iso({
      id: 'EC-2412', species: 'Escherichia coli', source: 'Urine', collectionDate: '2026-02-22',
      location: 'Medical ICU', age: '76', sex: 'M', notes: 'Carbapenem-resistant E. coli. mCIM negative (no carbapenemase activity). OmpC/OmpF porin status not assessed. CTX-M-15 ESBL detected. This is an unexplained-resistance teaching case.',
      genes: [
        g('blaCTX-M-15', 'BETA-LACTAM', 'CTX-M', 'ESBL', 100, 100, 'pEC2412', 'EXACTX', 'CTX-M-15'),
        g('blaTEM-1B', 'BETA-LACTAM', 'TEM', 'penicillinase', 100, 100, 'pEC2412', 'EXACTX', 'TEM-1B'),
        g('aac(3)-IIa', 'AMINOGLYCOSIDE', 'AAC(3)', 'acetyltransferase', 100, 100, 'pEC2412', 'EXACTX', 'AAC(3)-IIa'),
        g('sul1', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pEC2412', 'EXACTX', 'Sul1'),
        g('dfrA17', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pEC2412', 'EXACTX', 'DfrA17')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('amoxicillin-clavulanate', '32/16', 'R'), p('piperacillin-tazobactam', '64/4', 'I'),
        p('ceftriaxone', '>64', 'R'), p('cefotaxime', '>64', 'R'), p('ceftazidime', '32', 'R'), p('cefepime', '16', 'R'),
        p('meropenem', '8', 'R'), p('ertapenem', '4', 'R'), p('imipenem', '4', 'R'), p('aztreonam', '>64', 'R'),
        p('gentamicin', '16', 'R'), p('tobramycin', '16', 'R'), p('amikacin', '8', 'S'),
        p('ciprofloxacin', '0.5', 'S'), p('trimethoprim-sulfamethoxazole', '>4/76', 'R'), p('colistin', '0.5', 'S'),
        p('tigecycline', '1', 'S')
      ]
    }),
    iso({
      id: 'KP-2413', species: 'Klebsiella pneumoniae', source: 'Urine', collectionDate: '2026-02-25',
      location: 'Outpatient', age: '63', sex: 'F', notes: 'blaKPC-2 allele detected at 62% coverage; truncation predicted, likely non-functional. SHV-12 ESBL confirmed. Carbapenems remain susceptible. This is a silent-determinant teaching case.',
      genes: [
        g('blaKPC-2', 'BETA-LACTAM', 'KPC', 'carbapenemase', 99.9, 62, 'pKP2413', 'BLASTP', 'KPC-2 (partial)'),
        g('blaSHV-12', 'BETA-LACTAM', 'SHV', 'ESBL', 100, 100, 'pKP2413', 'EXACTX', 'SHV-12 ESBL'),
        g('blaTEM-1B', 'BETA-LACTAM', 'TEM', 'penicillinase', 100, 100, 'pKP2413', 'EXACTX', 'TEM-1B'),
        g('sul2', 'SULFONAMIDE', 'SUL', 'target bypass', 100, 100, 'pKP2413', 'EXACTX', 'Sul2'),
        g('dfrA14', 'TRIMETHOPRIM', 'DFR', 'target bypass', 100, 100, 'pKP2413', 'EXACTX', 'DfrA14')
      ],
      phenotypes: [
        p('ampicillin', '>32', 'R'), p('amoxicillin-clavulanate', '32/16', 'R'), p('piperacillin-tazobactam', '64/4', 'I'),
        p('ceftriaxone', '>64', 'R'), p('cefotaxime', '>64', 'R'), p('ceftazidime', '16', 'R'), p('cefepime', '8', 'S'),
        p('meropenem', '0.5', 'S'), p('ertapenem', '0.25', 'S'), p('imipenem', '0.5', 'S'), p('aztreonam', '32', 'R'),
        p('gentamicin', '2', 'S'), p('ciprofloxacin', '0.5', 'S'), p('trimethoprim-sulfamethoxazole', '>4/76', 'R'),
        p('tetracycline', '4', 'S'), p('colistin', '0.5', 'S')
      ]
    })
  ];

  AMR.DEMO = {
    id: 'demo-2026-02',
    name: 'Demo cohort · Feb 2026',
    description: 'Synthetic 13-isolate cohort spanning ESBL, KPC, MBL, OXA-23, MRSA, VRE, mcr-1, porin/efflux, and silent/unknown mechanisms.',
    createdAt: '2026-02-26T09:00:00Z',
    source: 'AMR Prism synthetic teaching set',
    images: [],
    isolates: ISOLATES
  };

  /* ------------------------------------------------------------------ */
  /* Final-year study scaffold                                           */
  /* 5 species x 10 public genomes = 50 isolates, 8 study drugs.         */
  /* Genes and phenotypes are intentionally blank until the student      */
  /* imports AMRFinderPlus output and enters the lab AST results.        */
  /* ------------------------------------------------------------------ */
  const STUDY_SPECIES = [
    { code: 'EC', name: 'Escherichia coli' },
    { code: 'PM', name: 'Proteus mirabilis' },
    { code: 'KP', name: 'Klebsiella pneumoniae' },
    { code: 'EF', name: 'Enterococcus spp.' },
    { code: 'PA', name: 'Pseudomonas aeruginosa' }
  ];

  const STUDY_ISOLATES = [];
  STUDY_SPECIES.forEach(function (sp) {
    for (let i = 1; i <= 10; i++) {
      STUDY_ISOLATES.push(iso({
        id: sp.code + '-' + String(i).padStart(2, '0'),
        species: sp.name,
        source: 'Public genome',
        collectionDate: '',
        location: '',
        age: '',
        sex: '',
        notes: 'Public genome. Import the AMRFinderPlus resistance gene table, then enter the lab AST result in Lab results.',
        genes: [],
        phenotypes: [],
        images: []
      }));
    }
  });

  AMR.STUDY = {
    id: 'fy-study-2026',
    name: 'Final-year study · 5 species × 10 strains',
    description: 'Fifty public genomes (10 each of E. coli, P. mirabilis, K. pneumoniae, Enterococcus spp. and P. aeruginosa) screened with AMRFinderPlus and compared with lab AST results for eight study drugs.',
    createdAt: '2026-11-10T00:00:00Z',
    source: 'Public genomes + AMRFinderPlus',
    drugPanel: (AMR.KB && AMR.KB.STUDY_DRUGS ? AMR.KB.STUDY_DRUGS : ['ampicillin', 'amoxicillin', 'cefuroxime', 'ceftriaxone', 'cefepime', 'ciprofloxacin', 'gentamicin', 'imipenem']).slice(),
    images: [],
    isolates: STUDY_ISOLATES
  };

  AMR.makeEmptyDataset = function (name) {
    return {
      id: 'ds-' + Date.now(),
      name: name || 'Untitled dataset',
      description: '',
      createdAt: new Date().toISOString(),
      source: 'User import',
      images: [],
      isolates: []
    };
  };
})(window.AMR);
