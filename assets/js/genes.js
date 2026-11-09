/* =========================================================================
   AMR Prism — gene / mechanism knowledge base
   Each entry encodes: molecular action -> drug classes affected -> expected SIR.
   ========================================================================= */
window.AMR = window.AMR || {};
(function (AMR) {
  'use strict';

  const G = [];
  function add(e) { G.push(e); }

  /* ---------- β-lactamases: penicillinases ---------- */
  add({
    id: 'penicillinase', display: 'Penicillinase (TEM/SHV/OXA-1/blaZ)', family: 'Penicillinase',
    exact: ['tem-1', 'tem-1a', 'tem-1b', 'tem-2', 'shv-1', 'shv-11', 'oxa-1', 'oxa-2', 'oxa-9', 'blaz', 'pc1'],
    match: [/^(bla)?(tem|shv|oxa-1|oxa-2|oxa-9)(-|$)/i, /^blaz$/i],
    class: 'BETA-LACTAM', subclass: 'PENICILLINASE',
    mechanism: 'Class A/D penicillinase', evidenceType: 'enzyme', confidence: 0.9,
    action: 'Hydrolyzes penicillins. Clavulanate and tazobactam inhibit most TEM/SHV/OXA-1 enzymes; blaZ is inhibited by clavulanate but not by oxacillin.',
    effects: { penicillins: 'R', cephalosporins: 'S', carbapenems: 'S', monobactams: 'S', bl_inhibitor: 'S', ceph_inhibitor: 'S', carb_inhibitor: 'S' },
    overrides: { 'cefazolin': 'variable', 'amoxicillin-clavulanate': 'S', 'piperacillin-tazobactam': 'S', 'ampicillin-sulbactam': 'S' },
    notes: 'TEM-1/SHV-1 are narrow-spectrum penicillinases. ESBL variants require separate logic. blaZ explains penicillin resistance in S. aureus but not oxacillin resistance.',
    caveats: 'Cefazolin may test resistant with high inoculum or high-level TEM/SHV expression. Do not use this entry for ESBL variants.'
  });

  /* ---------- β-lactamases: ESBLs ---------- */
  add({
    id: 'esbl-ctxm', display: 'CTX-M ESBL', family: 'CTX-M',
    match: [/^(bla)?ctx-m/i, /^ctx-m/i],
    class: 'BETA-LACTAM', subclass: 'CTX-M',
    mechanism: 'Class A extended-spectrum β-lactamase (ESBL)', evidenceType: 'enzyme', confidence: 0.95,
    action: 'Hydrolyzes penicillins, third-generation cephalosporins (especially cefotaxime/ceftriaxone), and aztreonam. Clavulanate, tazobactam, and avibactam inhibit CTX-M; carbapenems remain active.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'S', monobactams: 'R', bl_inhibitor: 'variable', ceph_inhibitor: 'S', carb_inhibitor: 'S' },
    overrides: { 'cefoxitin': 'S', 'cefepime': 'variable', 'ceftazidime': 'variable', 'ceftaroline': 'variable', 'amoxicillin-clavulanate': 'R', 'piperacillin-tazobactam': 'variable', 'ceftazidime-avibactam': 'S', 'ceftolozane-tazobactam': 'S', 'meropenem-vaborbactam': 'S', 'imipenem-relebactam': 'S' },
    notes: 'CTX-M-15 is the most common CTX-M variant and often coexists with OXA-1, AAC(6′)-Ib-cr, and TetA on the same plasmid.',
    caveats: 'Cefepime and ceftazidime susceptibility vary by variant and inoculum. Piperacillin–tazobactam should not be assumed active even when susceptible in vitro (inoculum effect).'
  });
  add({
    id: 'esbl-shv-tem', display: 'SHV/TEM ESBL', family: 'SHV/TEM ESBL',
    match: [/^(bla)?shv-(2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65|66|67|68|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99|100|101|102|103|104|105|106|107|108|109|110|111|112|113|114|115|116|117|118|119|120|121|122|123|124|125|126|127|128|129|130|131|132|133|134|135|136|137|138|139|140|141|142|143|144|145|146|147|148|149|150|151|152|153|154|155|156|157|158|159|160|161|162|163|164|165|166|167|168|169|170|171|172|173|174|175|176|177|178|179|180|181|182|183|184|185|186|187|188|189|190|191|192|193|194|195|196|197|198|199|200)(?!\d)/i, /^(bla)?tem-(3|4|6|8|9|10|11|12|15|16|17|19|20|21|22|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65|66|67|68|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99|100|101|102|103|104|105|106|107|108|109|110|111|112|113|114|115|116|117|118|119|120|121|122|123|124|125|126|127|128|129|130|131|132|133|134|135|136|137|138|139|140|141|142|143|144|145|146|147|148|149|150|151|152|153|154|155|156|157|158|159|160|161|162|163|164|165|166|167|168|169|170|171|172|173|174|175|176|177|178|179|180|181|182|183|184|185|186|187|188|189|190|191|192|193|194|195|196|197|198|199|200)(?!\d)/i],
    class: 'BETA-LACTAM', subclass: 'SHV/TEM ESBL',
    mechanism: 'Class A extended-spectrum β-lactamase (ESBL)', evidenceType: 'enzyme', confidence: 0.92,
    action: 'Hydrolyzes penicillins, third-generation cephalosporins, and aztreonam; inhibited by clavulanate, tazobactam, and avibactam. Carbapenems are stable.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'S', monobactams: 'R', bl_inhibitor: 'variable', ceph_inhibitor: 'S', carb_inhibitor: 'S' },
    overrides: { 'cefoxitin': 'S', 'cefepime': 'variable', 'ceftazidime': 'variable', 'amoxicillin-clavulanate': 'R', 'piperacillin-tazobactam': 'variable', 'ceftazidime-avibactam': 'S', 'ceftolozane-tazobactam': 'S' },
    notes: 'SHV-12 and TEM-52 are common ESBL variants. Variant numbering is used heuristically; confirm with the AMRFinderPlus subclass field.',
    caveats: 'Not every numbered SHV/TEM allele is an ESBL. The AMRFinderPlus Subclass field should override this heuristic.'
  });
  add({
    id: 'esbl-other', display: 'Other ESBL', family: 'ESBL',
    match: [/^(bla)?(veb|per|bel|ges|gim|spm|sme|imi|nmc|kpc|oxa-48)/i],
    class: 'BETA-LACTAM', subclass: 'ESBL',
    mechanism: 'Extended-spectrum β-lactamase (variant-dependent)', evidenceType: 'enzyme', confidence: 0.85,
    action: 'Hydrolyzes penicillins and extended-spectrum cephalosporins; inhibitor and carbapenem activity depends on the specific enzyme.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'S', monobactams: 'R', bl_inhibitor: 'variable', ceph_inhibitor: 'S', carb_inhibitor: 'S' },
    overrides: { 'cefoxitin': 'S', 'cefepime': 'variable', 'ceftazidime': 'variable', 'ceftazidime-avibactam': 'variable' },
    notes: 'VEB, PER, BEL, and GES variants are less common ESBLs. GES variants can also be carbapenemases.',
    caveats: 'Variant-level functional data are required; do not extrapolate inhibitor susceptibility.'
  });

  /* ---------- β-lactamases: AmpC ---------- */
  add({
    id: 'ampc', display: 'AmpC cephalosporinase', family: 'AmpC',
    match: [/^(bla)?(ampc|pdc|adc|act|acm|mox|fox|dha|acc|cmy|lat|mira|cfxa|cep)/i, /^(bla)?(cmy|fox|dha|acc|act|mox)-/i],
    class: 'BETA-LACTAM', subclass: 'AmpC',
    mechanism: 'Class C cephalosporinase (AmpC)', evidenceType: 'enzyme', confidence: 0.9,
    action: 'Hydrolyzes penicillins, first- to third-generation cephalosporins, and cephamycins. Poorly hydrolyzes cefepime and carbapenems. Not inhibited by clavulanate or tazobactam; avibactam inhibits it.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'S', monobactams: 'R', bl_inhibitor: 'R', ceph_inhibitor: 'S', carb_inhibitor: 'S' },
    overrides: { 'cefoxitin': 'R', 'cefepime': 'variable', 'ceftazidime': 'R', 'ceftriaxone': 'R', 'cefotaxime': 'R', 'cefazolin': 'R', 'amoxicillin-clavulanate': 'R', 'piperacillin-tazobactam': 'R', 'ceftazidime-avibactam': 'S', 'ceftolozane-tazobactam': 'S', 'meropenem-vaborbactam': 'S', 'imipenem-relebactam': 'S' },
    notes: 'Chromosomal AmpC in P. aeruginosa (PDC), A. baumannii (ADC), and Enterobacter spp. can be inducible or derepressed. Plasmid AmpC (CMY, DHA, FOX, ACC, ACT/MIR) behaves similarly.',
    caveats: 'AmpC plus porin loss can raise carbapenem MICs. Cefepime may remain active unless combined with porin loss or overexpression.'
  });

  /* ---------- β-lactamases: carbapenemases ---------- */
  add({
    id: 'kpc', display: 'KPC carbapenemase', family: 'KPC',
    match: [/^(bla)?kpc/i],
    class: 'BETA-LACTAM', subclass: 'KPC',
    mechanism: 'Class A serine carbapenemase (KPC)', evidenceType: 'enzyme', confidence: 0.97,
    action: 'Hydrolyzes penicillins, cephalosporins, aztreonam, and carbapenems. Avibactam, vaborbactam, and relebactam inhibit KPC; tazobactam and clavulanate do not reliably inhibit it.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'R', monobactams: 'R', bl_inhibitor: 'R', ceph_inhibitor: 'S', carb_inhibitor: 'S' },
    overrides: { 'ceftazidime-avibactam': 'S', 'ceftolozane-tazobactam': 'R', 'meropenem-vaborbactam': 'S', 'imipenem-relebactam': 'S', 'aztreonam-avibactam': 'S', 'cefiderocol': 'variable' },
    notes: 'KPC-2 and KPC-3 are the most common variants. KPC is the dominant carbapenemase in K. pneumoniae in many regions.',
    caveats: 'KPC expression plus porin loss can raise MICs of inhibitor combinations. Ceftazidime–avibactam resistance can emerge via KPC mutations.'
  });
  add({
    id: 'mbl', display: 'Metallo-β-lactamase (NDM/VIM/IMP)', family: 'MBL',
    match: [/^(bla)?(ndm|vim|imp|gim|spm|sim|aim|dia|sme)/i],
    class: 'BETA-LACTAM', subclass: 'MBL',
    mechanism: 'Class B metallo-β-lactamase (MBL)', evidenceType: 'enzyme', confidence: 0.97,
    action: 'Hydrolyzes penicillins, cephalosporins, and carbapenems. Not inhibited by clavulanate, tazobactam, avibactam, vaborbactam, or relebactam. Aztreonam is stable to MBLs but is often hydrolyzed by co-carried serine β-lactamases.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'R', monobactams: 'variable', bl_inhibitor: 'R', ceph_inhibitor: 'R', carb_inhibitor: 'R' },
    overrides: { 'ceftazidime-avibactam': 'R', 'ceftolozane-tazobactam': 'R', 'meropenem-vaborbactam': 'R', 'imipenem-relebactam': 'R', 'aztreonam-avibactam': 'S', 'cefiderocol': 'variable' },
    notes: 'NDM, VIM, and IMP are the major acquired MBLs. NDM-1 and VIM-2 are frequently co-carried with aminoglycoside and sulfonamide resistance genes.',
    caveats: 'Aztreonam may appear active in vitro against an MBL-only isolate but should not be used alone when a co-carried ESBL/AmpC is present. Aztreonam–avibactam is the targeted combination.'
  });
  add({
    id: 'oxa-48', display: 'OXA-48-like carbapenemase', family: 'OXA-48',
    match: [/^(bla)?oxa-(48|181|232|162|204|244|370|436|438|439|484|505|517|519|535|538|546|547|548|566|567|568|569|570|571|572|573|574|575|576|577|578|579|580|581|582|583|584|585|586|587|588|589|590|591|592|593|594|595|596|597|598|599|600)/i],
    class: 'BETA-LACTAM', subclass: 'OXA-48-like',
    mechanism: 'Class D carbapenemase (OXA-48-like)', evidenceType: 'enzyme', confidence: 0.94,
    action: 'Hydrolyzes penicillins and carbapenems weakly; cephalosporin hydrolysis is variable and often weak. Avibactam inhibits OXA-48; vaborbactam and relebactam do not reliably inhibit it.',
    effects: { penicillins: 'R', cephalosporins: 'variable', carbapenems: 'R', monobactams: 'S', bl_inhibitor: 'variable', ceph_inhibitor: 'S', carb_inhibitor: 'R' },
    overrides: { 'ceftazidime-avibactam': 'S', 'ceftolozane-tazobactam': 'R', 'meropenem-vaborbactam': 'R', 'imipenem-relebactam': 'R', 'aztreonam': 'S', 'aztreonam-avibactam': 'S', 'cefiderocol': 'variable' },
    notes: 'OXA-48 is common in K. pneumoniae and E. coli. Carbapenem MICs can be low (e.g., 2–8 mg/L) and may be missed by automated panels.',
    caveats: 'Cephalosporin resistance often reflects a co-carried ESBL. OXA-48 alone may not raise carbapenem MICs above the breakpoint.'
  });
  add({
    id: 'oxa-23', display: 'OXA-23 carbapenemase', family: 'OXA-23',
    match: [/^(bla)?oxa-(23|24|25|26|27|40|51|58|64|65|66|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|97|98|99|100|101|102|103|104|105|106|107|108|109|110|111|112|113|114|115|116|117|118|119|120|121|122|123|124|125|126|127|128|129|130|131|132|133|134|135|136|137|138|139|140|141|142|143|144|145|146|147|148|149|150|151|152|153|154|155|156|157|158|159|160|161|162|163|164|165|166|167|168|169|170|171|172|173|174|175|176|177|178|179|180|181|182|183|184|185|186|187|188|189|190|191|192|193|194|195|196|197|198|199|200)/i],
    class: 'BETA-LACTAM', subclass: 'OXA-23-like',
    mechanism: 'Class D carbapenemase (OXA-23-like)', evidenceType: 'enzyme', confidence: 0.95,
    action: 'Hydrolyzes carbapenems and penicillins. OXA-23 is the dominant acquired carbapenemase in A. baumannii. Avibactam does not reliably inhibit OXA-23; sulbactam has some intrinsic activity.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'R', monobactams: 'R', bl_inhibitor: 'R', ceph_inhibitor: 'R', carb_inhibitor: 'R' },
    overrides: { 'ampicillin-sulbactam': 'R', 'ceftazidime-avibactam': 'R', 'ceftolozane-tazobactam': 'R', 'meropenem-vaborbactam': 'R', 'imipenem-relebactam': 'R', 'cefiderocol': 'variable' },
    notes: 'OXA-23 is plasmid-borne in A. baumannii and often coexists with OXA-66 (intrinsic OXA-51-like) and ADC AmpC.',
    caveats: 'Sulbactam activity is dose-dependent and may be overcome by high-level OXA-23 expression.'
  });
  add({
    id: 'oxa-other', display: 'OXA carbapenemase / variant', family: 'OXA',
    match: [/^(bla)?oxa/i],
    class: 'BETA-LACTAM', subclass: 'OXA',
    mechanism: 'Class D β-lactamase (variant-dependent)', evidenceType: 'enzyme', confidence: 0.78,
    action: 'OXA enzymes vary from narrow-spectrum penicillinases to carbapenemases. Inhibitor and carbapenem profiles depend on the variant.',
    effects: { penicillins: 'R', cephalosporins: 'variable', carbapenems: 'variable', monobactams: 'variable', bl_inhibitor: 'variable', ceph_inhibitor: 'variable', carb_inhibitor: 'variable' },
    overrides: { 'ceftazidime-avibactam': 'variable' },
    notes: 'OXA-50 in P. aeruginosa and OXA-51/66 in A. baumannii are intrinsic and generally low-level. Acquired OXA-23/24/48/58 are clinically important carbapenemases.',
    caveats: 'Variant-level annotation is essential; this fallback intentionally yields low confidence.'
  });

  /* ---------- Aminoglycosides ---------- */
  add({
    id: 'aac3', display: 'AAC(3) acetyltransferase', family: 'AAC(3)',
    match: [/^aac\(3\)/i, /^aac3/i],
    class: 'AMINOGLYCOSIDE', subclass: 'AAC(3)',
    mechanism: 'Aminoglycoside acetyltransferase AAC(3)', evidenceType: 'enzyme', confidence: 0.92,
    action: 'Acetylates the 3-amino group of gentamicin, tobramycin, and netilmicin. Amikacin is generally not a substrate.',
    effects: { aminoglycosides: 'S' }, overrides: { 'gentamicin': 'R', 'tobramycin': 'R', 'amikacin': 'S', 'streptomycin': 'S', 'kanamycin': 'variable' },
    notes: 'AAC(3)-IIa is common in K. pneumoniae and E. coli; AAC(3)-IId is common in E. coli.',
    caveats: 'Aminoglycoside-modifying enzyme profiles are drug-specific; do not extrapolate pan-resistance.'
  });
  add({
    id: 'aac6ib', display: "AAC(6′)-Ib acetyltransferase", family: "AAC(6′)",
    match: [/^aac\(6'\)-ib$/i, /^aac\(6'\)-ib-/i, /^aac6ib/i],
    class: 'AMINOGLYCOSIDE', subclass: "AAC(6′)-Ib",
    mechanism: "Aminoglycoside acetyltransferase AAC(6′)-Ib", evidenceType: 'enzyme', confidence: 0.9,
    action: 'Acetylates tobramycin, amikacin, kanamycin, and netilmicin; gentamicin is a poor substrate. The -cr variant also acetylates ciprofloxacin.',
    effects: { aminoglycosides: 'S' }, overrides: { 'tobramycin': 'R', 'amikacin': 'variable', 'gentamicin': 'S', 'kanamycin': 'R', 'streptomycin': 'S' },
    notes: "AAC(6′)-Ib is often plasmid-borne. The -cr variant adds low-level fluoroquinolone resistance.",
    caveats: 'Amikacin susceptibility can remain despite AAC(6′)-Ib; confirm with the local enzyme variant and MIC.'
  });
  add({
    id: 'aac6ibcr', display: "AAC(6′)-Ib-cr", family: "AAC(6′)-Ib-cr",
    match: [/^aac\(6'\)-ib-cr/i, /^aac6ibcr/i],
    class: 'AMINOGLYCOSIDE; QUINOLONE', subclass: "AAC(6′)-Ib-cr",
    mechanism: "Bifunctional AAC(6′)-Ib-cr acetyltransferase", evidenceType: 'enzyme', confidence: 0.94,
    action: 'Acetylates tobramycin, amikacin, and kanamycin, and also acetylates ciprofloxacin and norfloxacin. Levofloxacin and moxifloxacin are less affected.',
    effects: { aminoglycosides: 'S', fluoroquinolones: 'S' },
    overrides: { 'tobramycin': 'R', 'amikacin': 'variable', 'gentamicin': 'S', 'ciprofloxacin': 'R', 'levofloxacin': 'S', 'moxifloxacin': 'S' },
    notes: 'The -cr variant is a common plasmid-borne link between aminoglycoside and fluoroquinolone resistance.',
    caveats: 'Ciprofloxacin MIC may be only modestly elevated; combine with target mutation or efflux for high-level resistance.'
  });
  add({
    id: 'aac6aph2', display: "AAC(6′)-aph(2″)", family: "AAC(6′)-aph(2″)",
    match: [/^aac\(6'\)-aph\(2''\)/i, /^aac6aph2/i],
    class: 'AMINOGLYCOSIDE', subclass: "AAC(6′)-aph(2″)",
    mechanism: "Bifunctional AAC(6′)-aph(2″) enzyme", evidenceType: 'enzyme', confidence: 0.95,
    action: 'Modifies gentamicin, tobramycin, amikacin, and kanamycin; confers broad aminoglycoside resistance in Gram-positive cocci.',
    effects: { aminoglycosides: 'R' }, overrides: { 'streptomycin': 'S' },
    notes: 'Common in MRSA and enterococci; often coexists with mecA or vanA.',
    caveats: 'Aminoglycoside synergy testing (HLAR) is separate from routine MIC interpretation.'
  });
  add({
    id: 'ant2', display: "ANT(2″) adenylyltransferase", family: "ANT(2″)",
    match: [/^ant\(2''\)/i, /^ant2/i, /^aadb/i],
    class: 'AMINOGLYCOSIDE', subclass: "ANT(2″)",
    mechanism: "Aminoglycoside adenylyltransferase ANT(2″)", evidenceType: 'enzyme', confidence: 0.9,
    action: 'Adenylylates gentamicin, tobramycin, and kanamycin. Amikacin is generally spared.',
    effects: { aminoglycosides: 'S' }, overrides: { 'gentamicin': 'R', 'tobramycin': 'R', 'amikacin': 'S', 'kanamycin': 'R' },
    notes: 'A common cause of gentamicin/tobramycin resistance in Gram-negative rods.',
    caveats: 'Confirm amikacin separately; combinations with AAC(3) can broaden resistance.'
  });
  add({
    id: 'aph3', display: "APH(3′)-I phosphotransferase", family: "APH(3′)",
    match: [/^aph\(3'\)/i, /^aph3/i],
    class: 'AMINOGLYCOSIDE', subclass: "APH(3′)",
    mechanism: "Aminoglycoside phosphotransferase APH(3′)", evidenceType: 'enzyme', confidence: 0.88,
    action: 'Phosphorylates kanamycin and neomycin; gentamicin, tobramycin, and amikacin are generally spared.',
    effects: { aminoglycosides: 'S' }, overrides: { 'kanamycin': 'R', 'neomycin': 'R', 'gentamicin': 'S', 'tobramycin': 'S', 'amikacin': 'S' },
    notes: 'Often co-carried with other aminoglycoside resistance genes on integrons.',
    caveats: 'Not a pan-aminoglycoside determinant.'
  });
  add({
    id: 'rmt', display: '16S rRNA methyltransferase (ArmA/Rmt)', family: '16S rRNA methyltransferase',
    match: [/^(armA|rmt[A-H]|npmA|npmB)/i],
    class: 'AMINOGLYCOSIDE', subclass: '16S rRNA methyltransferase',
    mechanism: '16S rRNA methyltransferase — target protection', evidenceType: 'target', confidence: 0.97,
    action: 'Methylates the 16S rRNA aminoglycoside binding site, conferring high-level resistance to essentially all aminoglycosides, including amikacin.',
    effects: { aminoglycosides: 'R' },
    notes: 'ArmA and RmtB are common in K. pneumoniae and E. coli, often on plasmids with ESBL/carbapenemase genes.',
    caveats: 'Pan-aminoglycoside resistance is expected; streptomycin may be variably affected.'
  });
  add({
    id: 'str', display: 'Streptomycin adenylyltransferase (strA/strB)', family: 'STR',
    match: [/^(stra|strb)$/i, /^str[ab]-/i],
    class: 'AMINOGLYCOSIDE', subclass: 'STR',
    mechanism: 'Streptomycin adenylyltransferase', evidenceType: 'enzyme', confidence: 0.85,
    action: 'Inactivates streptomycin; other aminoglycosides are not substrates.',
    effects: { aminoglycosides: 'S' }, overrides: { 'streptomycin': 'R' },
    notes: 'Common in integrons and transposons; not a pan-aminoglycoside marker.',
    caveats: 'Streptomycin is rarely used systemically; interpret in context.'
  });
  add({
    id: 'aac6ii', display: "AAC(6′)-Ii (intrinsic Enterococcus)", family: "AAC(6′)-Ii",
    match: [/^aac\(6'\)-ii/i, /^aac6ii/i],
    class: 'AMINOGLYCOSIDE', subclass: "AAC(6′)-Ii",
    mechanism: "Intrinsic low-level AAC(6′)-Ii in E. faecium", evidenceType: 'enzyme', confidence: 0.8,
    action: 'Modifies aminoglycosides at low level; does not by itself abolish aminoglycoside synergy. High-level resistance requires additional determinants.',
    effects: { aminoglycosides: 'S' }, overrides: { 'gentamicin': 'variable', 'tobramycin': 'variable', 'amikacin': 'variable' },
    notes: 'E. faecium is intrinsically resistant to low levels of aminoglycosides; standard breakpoints may not predict synergy.',
    caveats: 'Use high-level aminoglycoside resistance (HLAR) testing for combination therapy decisions.'
  });

  /* ---------- Fluoroquinolones ---------- */
  add({
    id: 'gyra', display: 'GyrA target alteration', family: 'GyrA',
    match: [/^gyra(_|$)/i],
    class: 'QUINOLONE', subclass: 'GYRASE',
    mechanism: 'DNA gyrase target alteration (GyrA)', evidenceType: 'target', confidence: 0.96,
    action: 'Amino-acid substitutions in the quinolone-resistance-determining region (QRDR) reduce fluoroquinolone binding to DNA gyrase.',
    effects: { fluoroquinolones: 'R' }, overrides: { 'ciprofloxacin': 'R', 'levofloxacin': 'R', 'moxifloxacin': 'R' },
    notes: 'Common substitutions: S83L, D87N (E. coli), S84L (S. aureus), T83I (P. aeruginosa).',
    caveats: 'A gyrA mutation alone may produce low-level resistance; parC mutations add synergy. Confirm the specific substitution.'
  });
  add({
    id: 'parc', display: 'ParC target alteration', family: 'ParC',
    match: [/^(parc|grla)(_|$)/i],
    class: 'QUINOLONE', subclass: 'TOPOISOMERASE',
    mechanism: 'Topoisomerase IV target alteration (ParC/GrlA)', evidenceType: 'target', confidence: 0.9,
    action: 'QRDR substitutions in ParC/GrlA reduce fluoroquinolone binding to topoisomerase IV. Alone they usually cause low-level resistance; with GyrA they cause high-level resistance.',
    effects: { fluoroquinolones: 'variable' }, overrides: { 'ciprofloxacin': 'variable', 'levofloxacin': 'variable', 'moxifloxacin': 'variable' },
    notes: 'Common substitutions: S80I (E. coli), S80Y (S. aureus GrlA), S87L (P. aeruginosa).',
    caveats: 'Interpret together with GyrA and efflux; ParC alone may not cross the clinical breakpoint.'
  });
  add({
    id: 'qnr', display: 'Qnr plasmid-mediated protection', family: 'Qnr',
    match: [/^qnr[a-s]/i, /^qnr/i],
    class: 'QUINOLONE', subclass: 'QNR',
    mechanism: 'Qnr pentapeptide repeat protein — target protection', evidenceType: 'target', confidence: 0.85,
    action: 'Binds DNA gyrase and topoisomerase IV, reducing fluoroquinolone binding. Usually causes low-level resistance and facilitates selection of QRDR mutations.',
    effects: { fluoroquinolones: 'variable' }, overrides: { 'ciprofloxacin': 'variable', 'levofloxacin': 'variable', 'moxifloxacin': 'variable' },
    notes: 'QnrA, QnrB, QnrS are plasmid-borne. Often co-carried with ESBL genes.',
    caveats: 'MICs may remain susceptible in vitro; clinical failure can occur. Combine with target mutations for high-level resistance.'
  });
  add({
    id: 'oqxab', display: 'OqxAB efflux pump', family: 'OqxAB',
    match: [/^oqx[ab]/i],
    class: 'QUINOLONE; TETRACYCLINE', subclass: 'EFFLUX',
    mechanism: 'RND-family efflux pump (OqxAB)', evidenceType: 'efflux', confidence: 0.75,
    action: 'Exports fluoroquinolones, tetracyclines, chloramphenicol, and some β-lactams; overexpression raises MICs.',
    effects: { fluoroquinolones: 'variable', tetracyclines: 'variable', phenicols: 'variable' },
    notes: 'Chromosomally encoded in K. pneumoniae; expression is regulated.',
    caveats: 'Gene presence does not prove overexpression. Efflux phenotypes are substrate- and host-dependent.'
  });
  add({
    id: 'qepa', display: 'QepA efflux pump', family: 'QepA',
    match: [/^qepa/i],
    class: 'QUINOLONE', subclass: 'EFFLUX',
    mechanism: 'Major facilitator superfamily fluoroquinolone efflux pump', evidenceType: 'efflux', confidence: 0.78,
    action: 'Actively exports fluoroquinolones, lowering intracellular drug concentration.',
    effects: { fluoroquinolones: 'variable' }, overrides: { 'ciprofloxacin': 'variable', 'levofloxacin': 'variable' },
    notes: 'Plasmid-borne; often co-carried with qnr and aac(6′)-Ib-cr.',
    caveats: 'Contribution to resistance depends on expression and outer-membrane permeability.'
  });

  /* ---------- Tetracyclines / glycylcyclines ---------- */
  add({
    id: 'tet-efflux', display: 'Tet efflux pump', family: 'Tet',
    match: [/^tet\([abcdeghl]\)$/i, /^tet[abcdeghl]$/i, /^tet\([abcdeghl]\)-/i],
    class: 'TETRACYCLINE', subclass: 'EFFLUX',
    mechanism: 'Tetracycline-specific efflux pump', evidenceType: 'efflux', confidence: 0.88,
    action: 'Exports tetracycline and, to varying degrees, doxycycline and minocycline. Tigecycline is generally not a substrate.',
    effects: { tetracyclines: 'R', glycylcyclines: 'S' },
    overrides: { 'tetracycline': 'R', 'doxycycline': 'variable', 'minocycline': 'variable', 'tigecycline': 'S' },
    notes: 'tet(A), tet(B), tet(C), tet(D), tet(G), tet(H), tet(K), tet(L) are common efflux genes. tet(K) and tet(L) are typical in Gram-positive cocci.',
    caveats: 'Minocycline and doxycycline susceptibility varies by pump and host. Tigecycline is not reliably predicted by tet efflux genes.'
  });
  add({
    id: 'tet-ribosomal', display: 'Tet ribosomal protection', family: 'Tet',
    match: [/^tet\([moqsw]\)$/i, /^tet[moqsw]$/i, /^tet\([moqsw]\)-/i],
    class: 'TETRACYCLINE', subclass: 'RIBOSOMAL PROTECTION',
    mechanism: 'Tetracycline ribosomal protection protein', evidenceType: 'target', confidence: 0.9,
    action: 'Protects the ribosome from tetracycline, doxycycline, and minocycline. Tigecycline is generally not affected.',
    effects: { tetracyclines: 'R', glycylcyclines: 'S' },
    overrides: { 'tetracycline': 'R', 'doxycycline': 'R', 'minocycline': 'R', 'tigecycline': 'S' },
    notes: 'tet(M) and tet(O) are common in Gram-positive cocci and can be chromosomal or conjugative.',
    caveats: 'Tigecycline activity is preserved for most ribosomal protection proteins.'
  });
  add({
    id: 'tetx', display: 'Tet(X) tigecycline-inactivating enzyme', family: 'Tet(X)',
    match: [/^tet\(x\)/i, /^tetx/i],
    class: 'TETRACYCLINE; GLYCYLCYCLINE', subclass: 'TET(X)',
    mechanism: 'Flavin-dependent tetracycline hydroxylase Tet(X)', evidenceType: 'enzyme', confidence: 0.96,
    action: 'Hydroxylates tetracyclines, including tigecycline and eravacycline, rendering them inactive.',
    effects: { tetracyclines: 'R', glycylcyclines: 'R' },
    notes: 'Tet(X3), Tet(X4), and Tet(X5) are plasmid-borne and confer high-level tigecycline resistance.',
    caveats: 'Rare but emerging; do not assume tigecycline activity when tet(X) is present.'
  });

  /* ---------- Macrolides / lincosamides ---------- */
  add({
    id: 'erm', display: 'Erm rRNA methylase', family: 'Erm',
    match: [/^erm\([a-z]\)/i, /^erm[a-z]$/i],
    class: 'MACROLIDE; LINCOSAMIDE; STREPTOGRAMIN', subclass: 'ERM',
    mechanism: '23S rRNA methyltransferase — MLSB target alteration', evidenceType: 'target', confidence: 0.95,
    action: 'Methylates 23S rRNA, reducing binding of macrolides, lincosamides, and streptogramin B. Can be constitutive or inducible.',
    effects: { macrolides: 'R', lincosamides: 'R', streptogramins: 'R' },
    notes: 'erm(B) is common in streptococci/enterococci; erm(A) and erm(C) in staphylococci. Inducible erm can test clindamycin-susceptible until D-test induction.',
    caveats: 'Inducible resistance may not be captured by routine clindamycin MIC. A positive D-test predicts clinical failure.'
  });
  add({
    id: 'mef', display: 'Mef efflux pump', family: 'Mef',
    match: [/^mef\([ae]\)/i, /^mef[a-z]$/i],
    class: 'MACROLIDE', subclass: 'MEF',
    mechanism: 'Macrolide efflux pump (Mef)', evidenceType: 'efflux', confidence: 0.88,
    action: 'Exports macrolides only; lincosamides remain active (M phenotype).',
    effects: { macrolides: 'R', lincosamides: 'S' },
    notes: 'mef(A) and mef(E) are common in streptococci. The M phenotype is macrolide-resistant, clindamycin-susceptible.',
    caveats: 'Do not infer clindamycin resistance from mef alone.'
  });
  add({
    id: 'mph', display: 'Mph macrolide phosphotransferase', family: 'Mph',
    match: [/^mph\([a-z]\)/i, /^mph[a-z]$/i],
    class: 'MACROLIDE', subclass: 'MPH',
    mechanism: 'Macrolide phosphotransferase', evidenceType: 'enzyme', confidence: 0.88,
    action: 'Phosphorylates macrolides, including erythromycin and azithromycin; lincosamides are unaffected.',
    effects: { macrolides: 'R', lincosamides: 'S' },
    notes: 'mph(A) is common in E. coli and can be co-carried with ESBL genes.',
    caveats: 'Macrolides are not routinely used for Gram-negative infections; interpret in context.'
  });
  add({
    id: 'msr', display: 'Msr ABC efflux pump', family: 'Msr',
    match: [/^msr\([a-z]\)/i, /^msr[a-z]$/i],
    class: 'MACROLIDE; STREPTOGRAMIN', subclass: 'MSR',
    mechanism: 'ABC-family macrolide/streptogramin efflux pump', evidenceType: 'efflux', confidence: 0.85,
    action: 'Exports macrolides and streptogramin B; lincosamides are not substrates.',
    effects: { macrolides: 'R', streptogramins: 'R', lincosamides: 'S' },
    notes: 'msr(A) is common in staphylococci; gives the MS phenotype.',
    caveats: 'Clindamycin remains active unless another determinant (e.g., erm) is present.'
  });

  /* ---------- Glycopeptides / oxazolidinones / lipopeptides ---------- */
  add({
    id: 'vana', display: 'VanA glycopeptide resistance', family: 'VanA',
    match: [/^vana/i, /^vanha/i],
    class: 'GLYCOPEPTIDE', subclass: 'VANA',
    mechanism: 'D-Ala-D-Lac cell-wall precursor replacement (VanA)', evidenceType: 'target', confidence: 0.98,
    action: 'Remodels the peptidoglycan precursor to D-Ala-D-Lac, reducing vancomycin and teicoplanin binding. High-level inducible resistance.',
    effects: { glycopeptides: 'R' }, overrides: { 'vancomycin': 'R', 'teicoplanin': 'R' },
    notes: 'VanA is the most common acquired VRE determinant in E. faecium and E. faecalis.',
    caveats: 'Expression is inducible; phenotypic tests may be delayed. Combination therapy requires susceptibility testing.'
  });
  add({
    id: 'vanb', display: 'VanB glycopeptide resistance', family: 'VanB',
    match: [/^vanb/i],
    class: 'GLYCOPEPTIDE', subclass: 'VANB',
    mechanism: 'D-Ala-D-Lac cell-wall precursor replacement (VanB)', evidenceType: 'target', confidence: 0.96,
    action: 'Confers vancomycin resistance but teicoplanin remains active because VanB is not induced by teicoplanin.',
    effects: { glycopeptides: 'variable' }, overrides: { 'vancomycin': 'R', 'teicoplanin': 'S' },
    notes: 'VanB is transferable and common in enterococci.',
    caveats: 'Teicoplanin susceptibility must be confirmed; VanB expression can be heterogeneous.'
  });
  add({
    id: 'vanc', display: 'VanC intrinsic glycopeptide resistance', family: 'VanC',
    match: [/^vanc/i],
    class: 'GLYCOPEPTIDE', subclass: 'VANC',
    mechanism: 'Intrinsic low-level D-Ala-D-Ser replacement (VanC)', evidenceType: 'target', confidence: 0.9,
    action: 'Confers low-level vancomycin resistance in E. gallinarum and E. casseliflavus; teicoplanin remains active.',
    effects: { glycopeptides: 'variable' }, overrides: { 'vancomycin': 'R', 'teicoplanin': 'S' },
    notes: 'Intrinsic to specific Enterococcus species; not a transferable VRE marker.',
    caveats: 'Species identification is essential before interpreting vanC.'
  });
  add({
    id: 'cfr', display: 'Cfr rRNA methyltransferase', family: 'Cfr',
    match: [/^cfr/i],
    class: 'OXAZOLIDINONE; PHENICOL; LINCOSAMIDE; STREPTOGRAMIN', subclass: 'CFR',
    mechanism: '23S rRNA methyltransferase (Cfr) — PhLOPSA resistance', evidenceType: 'target', confidence: 0.95,
    action: 'Methylates A2503 in 23S rRNA, conferring resistance to phenicols, lincosamides, oxazolidinones, pleuromutilins, and streptogramin A.',
    effects: { oxazolidinones: 'R', phenicols: 'R', lincosamides: 'R', streptogramins: 'R' },
    notes: 'cfr is plasmid-borne and has been reported in S. aureus and enterococci.',
    caveats: 'Linezolid resistance may be low-level and missed by some phenotypic methods.'
  });
  add({
    id: 'optrA', display: 'OptrA/PoxtA oxazolidinone efflux', family: 'OptrA/PoxtA',
    match: [/^(optrA|poxtA)/i],
    class: 'OXAZOLIDINONE; PHENICOL', subclass: 'OPTR',
    mechanism: 'ABC-family oxazolidinone/phenicol efflux pump', evidenceType: 'efflux', confidence: 0.9,
    action: 'Exports linezolid and chloramphenicol, reducing susceptibility.',
    effects: { oxazolidinones: 'R', phenicols: 'R' },
    notes: 'optrA and poxtA are transferable and increasingly reported in enterococci and staphylococci.',
    caveats: 'Linezolid MIC may be only modestly elevated; confirm with reference testing.'
  });

  /* ---------- Polymyxins ---------- */
  add({
    id: 'mcr', display: 'MCR phosphoethanolamine transferase', family: 'MCR',
    match: [/^mcr/i],
    class: 'POLYMYXIN', subclass: 'MCR',
    mechanism: 'Phosphoethanolamine transferase — LPS modification', evidenceType: 'target', confidence: 0.96,
    action: 'Adds phosphoethanolamine to lipid A, reducing the negative charge and colistin/polymyxin B binding.',
    effects: { polymyxins: 'R' }, overrides: { 'colistin': 'R', 'polymyxin-b': 'R' },
    notes: 'mcr-1 to mcr-10 are plasmid-borne. mcr-1 is the most widely reported.',
    caveats: 'Colistin MICs can be low and method-dependent; broth microdilution is preferred.'
  });
  add({
    id: 'pmrab', display: 'PmrAB/ PhoPQ two-component alteration', family: 'PmrAB',
    match: [/^(pmra|pmrb|phop|phoq|mgrb)/i],
    class: 'POLYMYXIN', subclass: 'PMRAB',
    mechanism: 'Two-component regulatory modification of lipid A', evidenceType: 'target', confidence: 0.8,
    action: 'Constitutive activation of PmrAB or PhoPQ adds phosphoethanolamine/aminoarabinose to lipid A, reducing polymyxin binding.',
    effects: { polymyxins: 'variable' }, overrides: { 'colistin': 'variable', 'polymyxin-b': 'variable' },
    notes: 'Chromosomal mutations are common in colistin-resistant K. pneumoniae, P. aeruginosa, and A. baumannii.',
    caveats: 'Gene presence alone is insufficient; regulatory mutations and expression must be assessed.'
  });

  /* ---------- Folate / phenicol / fosfomycin / rifampin ---------- */
  add({
    id: 'sul', display: 'Sul sulfonamide-resistant dihydropteroate synthase', family: 'Sul',
    match: [/^sul[123]$/i, /^sul[123]-/i],
    class: 'SULFONAMIDE', subclass: 'SUL',
    mechanism: 'Alternative dihydropteroate synthase (Sul)', evidenceType: 'target', confidence: 0.93,
    action: 'Bypasses sulfonamide inhibition of dihydropteroate synthase in folate synthesis.',
    effects: { folate: 'R' }, overrides: { 'sulfamethoxazole': 'R', 'trimethoprim-sulfamethoxazole': 'R' },
    notes: 'sul1, sul2, and sul3 are common in integrons and conjugative plasmids.',
    caveats: 'Sulfonamide resistance alone may not make TMP-SMX fully resistant if trimethoprim retains activity; interpret the combination.'
  });
  add({
    id: 'dfr', display: 'Dfr trimethoprim-resistant dihydrofolate reductase', family: 'Dfr',
    match: [/^dfr[a-z0-9]*$/i, /^dfr/i],
    class: 'TRIMETHOPRIM', subclass: 'DFR',
    mechanism: 'Alternative dihydrofolate reductase (Dfr)', evidenceType: 'target', confidence: 0.93,
    action: 'Bypasses trimethoprim inhibition of dihydrofolate reductase.',
    effects: { folate: 'R' }, overrides: { 'trimethoprim': 'R', 'trimethoprim-sulfamethoxazole': 'R' },
    notes: 'dfrA and dfrB variants are common in class 1 integrons, often with sul1.',
    caveats: 'The combination TMP-SMX requires both components to be active; dfr alone is sufficient to compromise it.'
  });
  add({
    id: 'cat', display: 'CAT chloramphenicol acetyltransferase', family: 'CAT',
    match: [/^(cat[a-z0-9]*|cata|cmla|flor|fexa)$/i, /^(cat|cmla|flor)/i],
    class: 'PHENICOL', subclass: 'CAT',
    mechanism: 'Chloramphenicol acetyltransferase or phenicol efflux', evidenceType: 'enzyme', confidence: 0.9,
    action: 'Acetylates chloramphenicol (CAT) or exports phenicols (CmlA/FloR), reducing intracellular active drug.',
    effects: { phenicols: 'R' }, overrides: { 'chloramphenicol': 'R' },
    notes: 'catA, catB, cmlA, and floR are common in Gram-negative and Gram-positive pathogens.',
    caveats: 'Chloramphenicol is rarely used systemically in many settings; interpret as a resistance marker.'
  });
  add({
    id: 'fos', display: 'FosA/FosB fosfomycin resistance', family: 'Fos',
    match: [/^fos[a-z0-9]*$/i, /^fos/i],
    class: 'FOSFOMYCIN', subclass: 'FOS',
    mechanism: 'Fosfomycin glutathione transferase / target bypass', evidenceType: 'enzyme', confidence: 0.9,
    action: 'Inactivates fosfomycin by glutathione conjugation (FosA/FosB) or bypasses the MurA target.',
    effects: { fosfomycins: 'R' }, overrides: { 'fosfomycin': 'R' },
    notes: 'fosA is intrinsic in some species; fosA3 and fosC2 are plasmid-borne.',
    caveats: 'Fosfomycin susceptibility testing is method-dependent; use agar dilution or approved MIC methods.'
  });
  add({
    id: 'rpoB', display: 'RpoB rifampin target alteration', family: 'RpoB',
    match: [/^rpob/i],
    class: 'RIFAMYCIN', subclass: 'RPOB',
    mechanism: 'RNA polymerase target alteration (RpoB)', evidenceType: 'target', confidence: 0.96,
    action: 'Amino-acid substitutions in RpoB reduce rifampin binding to the β-subunit of RNA polymerase.',
    effects: { rifamycins: 'R' }, overrides: { 'rifampin': 'R' },
    notes: 'Common substitutions: H526Y, S531L, D516V. Also the basis of rifampin resistance in M. tuberculosis.',
    caveats: 'Rifampin is used as combination therapy; single-agent resistance is clinically important.'
  });

  /* ---------- Cell-wall / PBP ---------- */
  add({
    id: 'meca', display: 'MecA/MecC PBP2a', family: 'MecA',
    match: [/^mec[ac]$/i, /^mec[ac]-/i],
    class: 'BETA-LACTAM', subclass: 'MECA',
    mechanism: 'Alternative penicillin-binding protein PBP2a (MecA/MecC)', evidenceType: 'target', confidence: 0.98,
    action: 'PBP2a has low affinity for most β-lactams and continues peptidoglycan cross-linking when native PBPs are inhibited. Ceftaroline and ceftobiprole bind PBP2a and remain active.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'S', bl_inhibitor: 'R', ceph_inhibitor: 'variable' },
    overrides: { 'oxacillin': 'R', 'penicillin': 'R', 'cefazolin': 'R', 'cefoxitin': 'R', 'ceftriaxone': 'R', 'cefotaxime': 'R', 'ceftazidime': 'R', 'cefepime': 'R', 'ceftaroline': 'S', 'ceftobiprole': 'S', 'amoxicillin-clavulanate': 'R', 'piperacillin-tazobactam': 'R', 'ampicillin-sulbactam': 'R' },
    notes: 'mecA is the molecular basis of MRSA. mecC is a divergent homolog found in livestock-associated S. aureus.',
    caveats: 'Ceftaroline and ceftobiprole are the β-lactams that retain activity against PBP2a. Oxacillin resistance can also arise from PBP modifications in coagulase-negative staphylococci.'
  });

  /* ---------- Permeability / efflux (often inferred from notes) ---------- */
  add({
    id: 'porin-loss', display: 'Outer-membrane porin loss', family: 'Porin',
    match: [/^(ompk35|ompk36|ompc|ompf|oprd|carO|porin)/i],
    class: 'PERMEABILITY', subclass: 'PORIN',
    mechanism: 'Reduced outer-membrane permeability (porin loss)', evidenceType: 'inferred', confidence: 0.65,
    action: 'Loss of porins reduces entry of hydrophilic drugs, especially carbapenems. The effect is amplified by co-produced β-lactamases because less drug reaches the periplasm.',
    effects: { carbapenems: 'variable', cephalosporins: 'variable', monobactams: 'variable' },
    overrides: { 'meropenem': 'variable', 'imipenem': 'variable', 'ertapenem': 'variable', 'cefepime': 'variable' },
    conditional: 'beta-lactamase',
    notes: 'AMRFinderPlus does not routinely report porin loss. It may be entered from sequencing notes or inferred from a carbapenem-resistant isolate with a β-lactamase but no carbapenemase.',
    caveats: 'Porin loss alone rarely causes high-level carbapenem resistance. It is a modifier, not a stand-alone carbapenemase.'
  });
  add({
    id: 'efflux', display: 'Efflux pump overexpression', family: 'Efflux',
    match: [/^(mexab|mexxy|mexcd|mexef|mexgh|mexjk|mexmn|adeabc|adeijk|acrab|acrtolc|efflux)/i],
    class: 'EFFLUX', subclass: 'RND',
    mechanism: 'RND-family efflux pump overexpression', evidenceType: 'efflux', confidence: 0.6,
    action: 'Active export of fluoroquinolones, tetracyclines, β-lactams, and other substrates lowers intracellular drug concentration. Requires regulatory mutations or overexpression.',
    effects: { fluoroquinolones: 'variable', tetracyclines: 'variable', carbapenems: 'variable', phenicols: 'variable', glycylcyclines: 'variable' },
    overrides: { 'ciprofloxacin': 'variable', 'levofloxacin': 'variable', 'meropenem': 'variable', 'imipenem': 'variable', 'tigecycline': 'variable' },
    notes: 'In P. aeruginosa, MexAB-OprM overexpression affects β-lactams and fluoroquinolones. In A. baumannii, AdeABC affects tigecycline and aminoglycosides.',
    caveats: 'Gene presence is not overexpression. Interpret with expression data and the isolate background.'
  });

  /* ---------- Intrinsic species determinants ---------- */
  add({
    id: 'pbp5', display: 'PBP5 intrinsic low-affinity target (E. faecium)', family: 'PBP5',
    match: [/^pbp5/i, /^pbp5-/i],
    class: 'BETA-LACTAM', subclass: 'PBP5',
    mechanism: 'Intrinsic low-affinity PBP5 in E. faecium', evidenceType: 'target', confidence: 0.95,
    action: 'PBP5 has low affinity for ampicillin and most β-lactams, producing intrinsic ampicillin resistance in E. faecium.',
    effects: { penicillins: 'R', cephalosporins: 'R', carbapenems: 'variable' }, overrides: { 'ampicillin': 'R', 'penicillin': 'R', 'amoxicillin': 'R', 'amoxicillin-clavulanate': 'R' },
    notes: 'E. faecalis usually remains ampicillin-susceptible; E. faecium is intrinsically resistant.',
    caveats: 'Ampicillin resistance in E. faecium is expected and not explained by a single acquired gene.'
  });
  add({
    id: 'shv-intrinsic', display: 'Chromosomal SHV penicillinase (K. pneumoniae)', family: 'SHV',
    match: [/^shv-1$/i, /^shv$/i],
    class: 'BETA-LACTAM', subclass: 'SHV-1',
    mechanism: 'Chromosomal SHV-1 penicillinase', evidenceType: 'enzyme', confidence: 0.9,
    action: 'Hydrolyzes ampicillin and some early penicillins; clavulanate inhibits SHV-1. Does not explain extended-spectrum cephalosporin resistance.',
    effects: { penicillins: 'R', cephalosporins: 'S', carbapenems: 'S', bl_inhibitor: 'S' },
    overrides: { 'ampicillin': 'R', 'amoxicillin': 'S', 'amoxicillin-clavulanate': 'S', 'piperacillin-tazobactam': 'S', 'cefazolin': 'variable' },
    notes: 'K. pneumoniae is intrinsically resistant to ampicillin due to chromosomal SHV-1.',
    caveats: 'Do not confuse SHV-1 with ESBL SHV variants.'
  });

  /* ---------- Resolve index and functions ---------- */
  const INDEX = {};
  G.forEach(function (e) {
    (e.exact || []).forEach(function (x) { INDEX[x.toLowerCase()] = e; });
  });

  function normalizeGeneSymbol(sym) {
    if (!sym) return '';
    return String(sym).toLowerCase()
      .replace(/[′’`´]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, '')
      .replace(/^bla(?=[a-z])/, 'bla');
  }

  function resolveGene(raw, meta) {
    meta = meta || {};
    const sym = normalizeGeneSymbol(raw || meta.symbol || '');
    if (!sym) return null;
    const bare = sym.replace(/^bla/, '');
    // Exact match first
    if (INDEX[sym]) return INDEX[sym];
    if (INDEX[bare]) return INDEX[bare];
    // Mutation-aware target entries
    if (/^gyra/i.test(sym)) return INDEX['gyra'] || G.find(function (e) { return e.id === 'gyra'; });
    if (/^(parc|grla)/i.test(sym)) return INDEX['parc'] || G.find(function (e) { return e.id === 'parc'; });
    if (/^rpob/i.test(sym)) return INDEX['rpob'] || G.find(function (e) { return e.id === 'rpob'; });
    if (/^pbp5/i.test(sym)) return G.find(function (e) { return e.id === 'pbp5'; });
    // Regex matches, prefer more specific (longer exact / non-fallback)
    let best = null;
    G.forEach(function (e) {
      if (e.exact && e.exact.indexOf(bare) >= 0) { best = e; return; }
      (e.match || []).forEach(function (re) {
        if (re.test(sym) || re.test(bare)) {
          if (!best || (e.id !== 'oxa-other' && best.id === 'oxa-other') || (e.id !== 'esbl-other' && best.id === 'esbl-other')) best = e;
        }
      });
    });
    if (best) return best;
    // Fallback from AMRFinderPlus class/subclass
    const cls = String(meta.class || '').toUpperCase();
    const sub = String(meta.subclass || '').toUpperCase();
    if (/BETA-LACTAM/.test(cls)) {
      if (/CARBAPENEM/.test(sub) || /KPC/.test(sub)) return G.find(function (e) { return e.id === 'kpc'; });
      if (/MBL|METALLO/.test(sub)) return G.find(function (e) { return e.id === 'mbl'; });
      if (/OXA-48/.test(sub)) return G.find(function (e) { return e.id === 'oxa-48'; });
      if (/OXA-23/.test(sub)) return G.find(function (e) { return e.id === 'oxa-23'; });
      if (/AMPC|CEPHALOSPORINASE/.test(sub)) return G.find(function (e) { return e.id === 'ampc'; });
      if (/ESBL|EXTENDED/.test(sub)) return G.find(function (e) { return e.id === 'esbl-other'; });
      return G.find(function (e) { return e.id === 'penicillinase'; });
    }
    if (/AMINOGLYCOSIDE/.test(cls)) {
      if (/METHYL/.test(sub) || /RMT/.test(sub)) return G.find(function (e) { return e.id === 'rmt'; });
      if (/AAC\(3\)/.test(sub)) return G.find(function (e) { return e.id === 'aac3'; });
      if (/AAC\(6'\).*APH/.test(sub)) return G.find(function (e) { return e.id === 'aac6aph2'; });
      if (/AAC\(6'\)/.test(sub)) return G.find(function (e) { return e.id === 'aac6ib'; });
      if (/ANT/.test(sub)) return G.find(function (e) { return e.id === 'ant2'; });
      if (/APH/.test(sub)) return G.find(function (e) { return e.id === 'aph3'; });
    }
    if (/QUINOLONE/.test(cls)) {
      if (/GYR/.test(sub)) return G.find(function (e) { return e.id === 'gyra'; });
      if (/PAR|TOPO/.test(sub)) return G.find(function (e) { return e.id === 'parc'; });
      if (/QNR/.test(sub)) return G.find(function (e) { return e.id === 'qnr'; });
      return G.find(function (e) { return e.id === 'qnr'; });
    }
    if (/TETRACYCLINE/.test(cls)) return G.find(function (e) { return e.id === 'tet-efflux'; });
    if (/MACROLIDE/.test(cls)) return G.find(function (e) { return e.id === 'erm'; });
    if (/GLYCOPEPTIDE/.test(cls)) return G.find(function (e) { return e.id === 'vana'; });
    if (/OXAZOLIDINONE/.test(cls)) return G.find(function (e) { return e.id === 'cfr'; });
    if (/POLYMYXIN/.test(cls)) return G.find(function (e) { return e.id === 'mcr'; });
    if (/SULFONAMIDE|FOLATE/.test(cls)) return G.find(function (e) { return e.id === 'sul'; });
    if (/PHENICOL/.test(cls)) return G.find(function (e) { return e.id === 'cat'; });
    if (/FOSFOMYCIN/.test(cls)) return G.find(function (e) { return e.id === 'fos'; });
    if (/RIFAMYCIN/.test(cls)) return G.find(function (e) { return e.id === 'rpoB'; });
    if (/EFFLUX/.test(cls)) return G.find(function (e) { return e.id === 'efflux'; });
    if (/PORIN|PERMEABILITY/.test(cls)) return G.find(function (e) { return e.id === 'porin-loss'; });
    return null;
  }

  function normalizeDrug(raw) {
    if (!raw) return null;
    let s = String(raw).toLowerCase()
      .replace(/[_]+/g, ' ')
      .replace(/\b(mic|sir|interpretation|result|susceptibility|category|value)\b/g, ' ')
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    s = s.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
    if (AMR.KB.DRUG_ALIASES[s]) return AMR.KB.DRUG_ALIASES[s];
    // try removing common prefixes/suffixes
    const variants = [s, s.replace(/\s*\(.*?\)\s*/g, ''), s.replace(/\s+(mic|sir)$/, ''), s.replace(/_/g, '-')];
    for (const v of variants) {
      if (AMR.KB.DRUG_ALIASES[v]) return AMR.KB.DRUG_ALIASES[v];
    }
    // substring match for wide headers like "Meropenem MIC"
    const keys = Object.keys(AMR.KB.DRUG_ALIASES).sort(function (a, b) { return b.length - a.length; });
    for (const k of keys) {
      if (k.length >= 4 && (s === k || s.indexOf(k + ' ') === 0 || s.indexOf(' ' + k) >= 0)) return AMR.KB.DRUG_ALIASES[k];
    }
    return null;
  }

  AMR.KB.GENE_ENTRIES = G;
  AMR.KB.GENE_INDEX = INDEX;
  AMR.KB.resolveGene = resolveGene;
  AMR.KB.normalizeDrug = normalizeDrug;
  AMR.KB.normalizeGeneSymbol = normalizeGeneSymbol;
})(window.AMR);
