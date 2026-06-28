"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdditiveInfo = getAdditiveInfo;
exports.getAdditiveRiskColor = getAdditiveRiskColor;
exports.analyzeAdditives = analyzeAdditives;
const ADDITIVES_DB = {
    'e100': { code: 'E100', name: 'Curcumine', risk: 'faible', category: 'Colorant', effects: ['Aucun risque connu'], description: 'Colorant jaune naturel extrait du curcuma. Antioxydant naturel.' },
    'e101': { code: 'E101', name: 'Riboflavine (B2)', risk: 'faible', category: 'Colorant', effects: ['Aucun risque connu'], description: 'Vitamine B2, colorant jaune naturel. Bon pour la santé.' },
    'e102': { code: 'E102', name: 'Tartrazine', risk: 'eleve', category: 'Colorant', effects: ['Hyperactivité chez les enfants', 'Réactions allergiques', 'Urticaire', 'Asthme'], description: 'Colorant jaune synthétique. Interdit dans certains pays. Lié à des troubles du comportement chez les enfants.' },
    'e104': { code: 'E104', name: 'Jaune de quinoléine', risk: 'eleve', category: 'Colorant', effects: ['Hyperactivité chez les enfants', 'Allergies'], description: 'Colorant synthétique jaune-vert. Interdit aux USA et en Australie.' },
    'e110': { code: 'E110', name: 'Jaune orangé S', risk: 'eleve', category: 'Colorant', effects: ['Hyperactivité chez les enfants', 'Réactions allergiques', 'Urticaire'], description: 'Colorant synthétique orange. Controversé, lié à des troubles du comportement.' },
    'e120': { code: 'E120', name: 'Cochenille', risk: 'modere', category: 'Colorant', effects: ['Réactions allergiques rares', 'Non végétarien'], description: 'Colorant rouge naturel extrait d\'insectes. Allergène pour certaines personnes.' },
    'e122': { code: 'E122', name: 'Azorubine', risk: 'eleve', category: 'Colorant', effects: ['Hyperactivité chez les enfants', 'Allergies', 'Rhinite'], description: 'Colorant rouge synthétique. Interdit dans plusieurs pays.' },
    'e124': { code: 'E124', name: 'Ponceau 4R', risk: 'eleve', category: 'Colorant', effects: ['Hyperactivité chez les enfants', 'Allergies', 'Cancérigène possible'], description: 'Colorant rouge synthétique. Interdit aux USA. Potentiellement cancérigène.' },
    'e129': { code: 'E129', name: 'Rouge allura AC', risk: 'eleve', category: 'Colorant', effects: ['Hyperactivité chez les enfants', 'Allergies'], description: 'Colorant rouge synthétique. Controversé, lié à des troubles du comportement.' },
    'e131': { code: 'E131', name: 'Bleu patenté V', risk: 'modere', category: 'Colorant', effects: ['Allergies rares', 'Nausées'], description: 'Colorant bleu synthétique. Interdit dans certains pays.' },
    'e132': { code: 'E132', name: 'Indigotine', risk: 'modere', category: 'Colorant', effects: ['Nausées', 'Allergies rares'], description: 'Colorant bleu synthétique. Peut causer des nausées chez certaines personnes.' },
    'e133': { code: 'E133', name: 'Bleu brillant FCF', risk: 'modere', category: 'Colorant', effects: ['Hyperactivité possible', 'Allergies'], description: 'Colorant bleu synthétique. Interdit dans certains pays européens.' },
    'e150a': { code: 'E150a', name: 'Caramel', risk: 'faible', category: 'Colorant', effects: ['Aucun risque connu'], description: 'Caramel naturel. Utilisé dans les colas et bières.' },
    'e150d': { code: 'E150d', name: 'Caramel au sulfite d\'ammonium', risk: 'modere', category: 'Colorant', effects: ['Contient du 4-MEI potentiellement cancérigène'], description: 'Caramel industriel utilisé dans les colas. Peut contenir du 4-MEI, substance controversée.' },
    'e160a': { code: 'E160a', name: 'Bêta-carotène', risk: 'faible', category: 'Colorant', effects: ['Aucun risque connu', 'Précurseur vitamine A'], description: 'Colorant orange naturel. Bénéfique en quantités normales.' },
    'e171': { code: 'E171', name: 'Dioxyde de titane', risk: 'critique', category: 'Colorant', effects: ['Potentiellement cancérigène', 'Nanoparticules', 'Inflammation intestinale'], description: 'Colorant blanc. INTERDIT en France depuis 2020. Nanoparticules pouvant traverser la barrière intestinale.' },
    'e200': { code: 'E200', name: 'Acide sorbique', risk: 'faible', category: 'Conservateur', effects: ['Allergies cutanées rares'], description: 'Conservateur naturel. Généralement bien toléré.' },
    'e202': { code: 'E202', name: 'Sorbate de potassium', risk: 'faible', category: 'Conservateur', effects: ['Allergies cutanées rares'], description: 'Conservateur courant, peu de risques connus.' },
    'e210': { code: 'E210', name: 'Acide benzoïque', risk: 'modere', category: 'Conservateur', effects: ['Allergies', 'Asthme', 'Urticaire', 'Hyperactivité'], description: 'Conservateur. Peut former du benzène (cancérigène) en présence de vitamine C.' },
    'e211': { code: 'E211', name: 'Benzoate de sodium', risk: 'eleve', category: 'Conservateur', effects: ['Hyperactivité chez les enfants', 'Allergies', 'Formation de benzène', 'Dommages ADN'], description: 'Conservateur très courant dans les sodas. Peut former du benzène cancérigène avec la vitamine C.' },
    'e220': { code: 'E220', name: 'Dioxyde de soufre', risk: 'eleve', category: 'Conservateur', effects: ['Asthme', 'Allergies', 'Maux de tête', 'Nausées'], description: 'Sulfite utilisé dans le vin et fruits secs. Dangereux pour les asthmatiques.' },
    'e250': { code: 'E250', name: 'Nitrite de sodium', risk: 'critique', category: 'Conservateur', effects: ['Cancérigène (colorectal)', 'Formation de nitrosamines', 'Méthémoglobinémie'], description: 'Conservateur dans les charcuteries. CLASSÉ CANCÉRIGÈNE par l\'OMS. Lié au cancer colorectal.' },
    'e251': { code: 'E251', name: 'Nitrate de sodium', risk: 'eleve', category: 'Conservateur', effects: ['Se transforme en nitrites', 'Cancérigène probable'], description: 'Se transforme en nitrites dans le corps. Mêmes risques que E250.' },
    'e252': { code: 'E252', name: 'Nitrate de potassium', risk: 'eleve', category: 'Conservateur', effects: ['Se transforme en nitrites', 'Cancérigène probable'], description: 'Se transforme en nitrites dans le corps. Utilisé dans les charcuteries.' },
    'e300': { code: 'E300', name: 'Acide ascorbique (Vitamine C)', risk: 'faible', category: 'Antioxydant', effects: ['Aucun risque', 'Bénéfique'], description: 'Vitamine C. Antioxydant naturel bénéfique.' },
    'e301': { code: 'E301', name: 'Ascorbate de sodium', risk: 'faible', category: 'Antioxydant', effects: ['Aucun risque connu'], description: 'Forme de vitamine C. Sans danger.' },
    'e306': { code: 'E306', name: 'Tocophérols (Vitamine E)', risk: 'faible', category: 'Antioxydant', effects: ['Aucun risque', 'Bénéfique'], description: 'Vitamine E naturelle. Antioxydant bénéfique.' },
    'e320': { code: 'E320', name: 'BHA', risk: 'eleve', category: 'Antioxydant', effects: ['Perturbateur endocrinien', 'Cancérigène possible', 'Allergies'], description: 'Antioxydant synthétique. Classé cancérigène possible par le CIRC. Perturbateur endocrinien.' },
    'e321': { code: 'E321', name: 'BHT', risk: 'modere', category: 'Antioxydant', effects: ['Perturbateur endocrinien possible', 'Allergies'], description: 'Antioxydant synthétique. Controversé, possibles effets endocriniens.' },
    'e322': { code: 'E322', name: 'Lécithines', risk: 'faible', category: 'Émulsifiant', effects: ['Aucun risque connu', 'Souvent de soja (allergène)'], description: 'Émulsifiant naturel, souvent extrait du soja ou tournesol. Bien toléré.' },
    'e322i': { code: 'E322i', name: 'Lécithine', risk: 'faible', category: 'Émulsifiant', effects: ['Aucun risque connu', 'Souvent de soja (allergène)'], description: 'Émulsifiant naturel. Bien toléré mais peut contenir du soja.' },
    'e330': { code: 'E330', name: 'Acide citrique', risk: 'faible', category: 'Acidifiant', effects: ['Érosion dentaire en excès'], description: 'Acidifiant naturel présent dans les agrumes. Très courant, sans danger.' },
    'e331': { code: 'E331', name: 'Citrate de sodium', risk: 'faible', category: 'Acidifiant', effects: ['Aucun risque connu'], description: 'Régulateur d\'acidité courant. Sans danger.' },
    'e338': { code: 'E338', name: 'Acide phosphorique', risk: 'modere', category: 'Acidifiant', effects: ['Déminéralisation osseuse', 'Érosion dentaire', 'Problèmes rénaux'], description: 'Acidifiant dans les colas. Lié à la perte de densité osseuse et calculs rénaux.' },
    'e407': { code: 'E407', name: 'Carraghénane', risk: 'modere', category: 'Épaississant', effects: ['Inflammation intestinale', 'Troubles digestifs'], description: 'Épaississant extrait d\'algues. Controversé, lié à des inflammations intestinales.' },
    'e420': { code: 'E420', name: 'Sorbitol', risk: 'modere', category: 'Édulcorant', effects: ['Troubles digestifs', 'Diarrhée', 'Ballonnements'], description: 'Édulcorant. Effet laxatif à forte dose.' },
    'e421': { code: 'E421', name: 'Mannitol', risk: 'modere', category: 'Édulcorant', effects: ['Troubles digestifs', 'Effet laxatif'], description: 'Édulcorant avec effet laxatif à forte dose.' },
    'e440': { code: 'E440', name: 'Pectine', risk: 'faible', category: 'Épaississant', effects: ['Aucun risque connu'], description: 'Gélifiant naturel extrait des fruits. Sans danger.' },
    'e450': { code: 'E450', name: 'Diphosphates', risk: 'modere', category: 'Émulsifiant', effects: ['Hyperactivité', 'Problèmes rénaux', 'Déminéralisation osseuse'], description: 'Émulsifiant phosphaté. En excès, peut nuire aux reins et aux os.' },
    'e451': { code: 'E451', name: 'Triphosphates', risk: 'modere', category: 'Émulsifiant', effects: ['Problèmes rénaux', 'Déminéralisation osseuse'], description: 'Phosphate. Mêmes risques que E450 en excès.' },
    'e452': { code: 'E452', name: 'Polyphosphates', risk: 'modere', category: 'Émulsifiant', effects: ['Problèmes rénaux', 'Déminéralisation osseuse'], description: 'Phosphate. À éviter en excès pour protéger les reins.' },
    'e471': { code: 'E471', name: 'Mono- et diglycérides', risk: 'faible', category: 'Émulsifiant', effects: ['Aucun risque majeur connu'], description: 'Émulsifiant très courant. Peut être d\'origine animale ou végétale.' },
    'e500': { code: 'E500', name: 'Carbonates de sodium', risk: 'faible', category: 'Régulateur', effects: ['Aucun risque connu'], description: 'Bicarbonate de soude. Sans danger.' },
    'e621': { code: 'E621', name: 'Glutamate monosodique (MSG)', risk: 'modere', category: 'Exhausteur de goût', effects: ['Maux de tête', 'Syndrome du restaurant chinois', 'Obésité possible'], description: 'Exhausteur de goût controversé. Peut causer des maux de tête chez les personnes sensibles.' },
    'e627': { code: 'E627', name: 'Guanylate disodique', risk: 'modere', category: 'Exhausteur de goût', effects: ['Déconseillé aux goutteux', 'Allergies'], description: 'Exhausteur de goût souvent combiné au MSG. À éviter en cas de goutte.' },
    'e631': { code: 'E631', name: 'Inosinate disodique', risk: 'modere', category: 'Exhausteur de goût', effects: ['Déconseillé aux goutteux'], description: 'Exhausteur de goût. À éviter en cas de goutte.' },
    'e635': { code: 'E635', name: 'Ribonucléotides disodiques', risk: 'modere', category: 'Exhausteur de goût', effects: ['Déconseillé aux goutteux', 'Réactions cutanées'], description: 'Mélange d\'exhausteurs de goût. Peut causer des réactions chez les personnes sensibles.' },
    'e900': { code: 'E900', name: 'Diméthylpolysiloxane', risk: 'modere', category: 'Anti-mousse', effects: ['Peu étudié', 'Origine synthétique'], description: 'Anti-mousse synthétique utilisé dans les huiles de friture (McDonald\'s). Peu étudié.' },
    'e950': { code: 'E950', name: 'Acésulfame K', risk: 'modere', category: 'Édulcorant', effects: ['Cancérigène possible', 'Perturbateur microbiome'], description: 'Édulcorant artificiel. Études contradictoires sur le risque de cancer.' },
    'e951': { code: 'E951', name: 'Aspartame', risk: 'eleve', category: 'Édulcorant', effects: ['Cancérigène possible (CIRC)', 'Maux de tête', 'Perturbateur microbiome'], description: 'Édulcorant artificiel. Classé cancérigène possible par l\'OMS en 2023.' },
    'e952': { code: 'E952', name: 'Cyclamate', risk: 'eleve', category: 'Édulcorant', effects: ['Cancérigène possible', 'Interdit aux USA'], description: 'Édulcorant interdit aux USA depuis 1969. Cancérigène possible.' },
    'e955': { code: 'E955', name: 'Sucralose', risk: 'modere', category: 'Édulcorant', effects: ['Perturbateur microbiome', 'Résistance à l\'insuline possible'], description: 'Édulcorant artificiel. Peut perturber la flore intestinale.' },
    'e960': { code: 'E960', name: 'Stévia', risk: 'faible', category: 'Édulcorant', effects: ['Aucun risque majeur connu'], description: 'Édulcorant naturel extrait de la plante stévia. Bien toléré.' },
};
function getAdditiveInfo(code) {
    const normalized = code.toLowerCase().replace('en:', '').replace(/[^a-z0-9]/g, '');
    return ADDITIVES_DB[normalized] || null;
}
function getAdditiveRiskColor(risk) {
    switch (risk) {
        case 'faible': return '#22c55e';
        case 'modere': return '#f97316';
        case 'eleve': return '#ef4444';
        case 'critique': return '#dc2626';
        default: return '#888';
    }
}
function analyzeAdditives(additiveCodes) {
    return additiveCodes
        .map((code) => getAdditiveInfo(code))
        .filter((a) => a !== null);
}
