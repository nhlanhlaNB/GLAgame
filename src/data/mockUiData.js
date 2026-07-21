export const sdgOptions = [
  'SDG 1 No Poverty',
  'SDG 2 Zero Hunger',
  'SDG 3 Good Health',
  'SDG 4 Quality Education',
  'SDG 5 Gender Equality',
  'SDG 6 Clean Water',
  'SDG 7 Affordable Energy',
  'SDG 8 Decent Work',
  'SDG 9 Innovation',
  'SDG 10 Reduced Inequalities',
  'SDG 11 Sustainable Cities',
  'SDG 13 Climate Action'
]

export const rubricRows = [
  { key: 'ai_card_relevance', label: 'AI Card Relevance', max: 20, meaning: 'Selected AI cards must fit the problem.' },
  { key: 'combination_strength', label: 'Combination Strength', max: 15, meaning: 'Selected AI cards should work together.' },
  { key: 'practical_feasibility', label: 'Practical Feasibility', max: 15, meaning: 'Solution must be realistic to implement.' },
  { key: 'african_context_and_feasibility', label: 'African Context and Feasibility', max: 15, meaning: 'Considers African realities such as cost, infrastructure, language, access, communities, youth and public services.' },
  { key: 'sdg_alignment', label: 'SDG Alignment', max: 15, meaning: 'Solution must support the linked SDGs.' },
  { key: 'creativity_and_innovation', label: 'Creativity and Innovation', max: 10, meaning: 'Idea should be useful, original, imaginative and able to inspire innovation.' },
  { key: 'ethical_and_responsible_use', label: 'Ethical and Responsible Use', max: 10, meaning: 'Considers privacy, fairness, safety, inclusion, non-discrimination and responsible AI use.' }
]

export const demoPlayers = [
  { id: 1, name: 'Lerato M.', average: 91, completed: 16, coin: 1380, badge: 'Innovation Leader' },
  { id: 2, name: 'Thabo K.', average: 87, completed: 14, coin: 1218, badge: 'SDG Champion' },
  { id: 3, name: 'Amina D.', average: 84, completed: 12, coin: 1025, badge: 'Responsible AI Thinker' },
  { id: 4, name: 'You', average: 0, completed: 0, coin: 0, badge: 'New Player' }
]

export const adminReportRows = [
  { id: 1, report: 'Player impact summary', type: 'PDF', status: 'Ready', owner: 'GRIT Lab Africa' },
  { id: 2, report: 'Card usage export', type: 'CSV', status: 'Ready', owner: 'Admin' },
  { id: 3, report: 'Certificate register', type: 'CSV', status: 'Draft', owner: 'Admin' },
  { id: 4, report: 'Analytics partner report', type: 'PDF', status: 'Review', owner: 'Programme team' }
]

export const languageCards = {
  French: ['IA qui comprend le texte', 'Carte Problème: chômage des jeunes', 'Solution responsable pour les ODD'],
  Portuguese: ['IA que entende texto', 'Carta de Problema: desemprego juvenil', 'Solução responsável para os ODS'],
  Arabic: ['ذكاء اصطناعي يفهم النص', 'بطاقة مشكلة: بطالة الشباب', 'حل مسؤول لأهداف التنمية'],
  Kiswahili: ['AI inayeelewa maandishi', 'Kadi ya Tatizo: ukosefu wa ajira kwa vijana', 'Suluhisho la kuwajibika kwa SDGs'],
  isiZulu: ['I-AI eqonda umbhalo', 'Ikhadi Lenkinga: ukungasebenzi kwentsha', 'Isixazululo esinomthwalo kuma-SDG']
}

export const achievementTemplates = [
  { id: 'first', title: 'First Solver', requirement: 'Submit your first solution', icon: '🌱' },
  { id: 'ten', title: 'Certification Ready', requirement: 'Complete 10 problem cards', icon: '🎓' },
  { id: 'ethics', title: 'Responsible AI Thinker', requirement: 'Score 8+ in ethics', icon: '🛡️' },
  { id: 'creative', title: 'Innovation Builder', requirement: 'Score 8+ in creativity', icon: '💡' },
  { id: 'coin', title: 'GLA Coin Collector', requirement: 'Earn 500+ GLA coin', icon: '🪙' }
]

export const hintLevels = [
  { id: 'basic', title: 'Basic Hint', cost: 20, description: 'Gives a gentle direction without giving away the answer.' },
  { id: 'guided', title: 'Guided Hint', cost: 35, description: 'Suggests what type of AI card combination may help.' },
  { id: 'example', title: 'Example Hint', cost: 50, description: 'Shows a short example structure for a good explanation.' }
]
