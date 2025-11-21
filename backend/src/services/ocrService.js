import Tesseract from 'tesseract.js';

// OCR для анализа состава продуктов (БЕСПЛАТНО)
export const extractTextFromImage = async (imagePath) => {
  try {
    console.log('🔍 Starting OCR text extraction...');
    
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng+rus',
      {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      }
    );

    console.log('✅ OCR completed');

    return {
      success: true,
      text: text.trim()
    };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: 'Failed to extract text',
      text: ''
    };
  }
};

// Анализ состава на вредные добавки
export const analyzeComposition = async (text) => {
  const eAdditives = [];
  const allergens = [];
  const warnings = [];

  // Поиск E-добавок
  const ePattern = /E\d{3,4}/gi;
  const foundEAdditives = text.match(ePattern) || [];
  eAdditives.push(...foundEAdditives);

  // Поиск аллергенов (русский и английский)
  const commonAllergens = [
    'milk', 'egg', 'peanut', 'soy', 'wheat', 'fish', 'shellfish', 'tree nuts',
    'молоко', 'яйцо', 'арахис', 'соя', 'пшеница', 'рыба', 'моллюски', 'орехи'
  ];
  
  for (const allergen of commonAllergens) {
    if (text.toLowerCase().includes(allergen.toLowerCase())) {
      allergens.push(allergen);
    }
  }

  // Вредные добавки (упрощенный список наиболее опасных)
  const harmfulAdditives = [
    'E102', 'E110', 'E120', 'E124', 'E127', 'E129', 'E131', 'E132', 'E133',
    'E142', 'E151', 'E154', 'E155', 'E211', 'E212', 'E213', 'E214', 'E215',
    'E216', 'E217', 'E218', 'E219', 'E220', 'E221', 'E222', 'E223', 'E224',
    'E228', 'E230', 'E231', 'E232', 'E233', 'E239', 'E240', 'E249', 'E250',
    'E251', 'E252', 'E621', 'E622', 'E623', 'E624', 'E625'
  ];
  
  const foundHarmful = eAdditives.filter(e => 
    harmfulAdditives.includes(e.toUpperCase())
  );
  
  if (foundHarmful.length > 0) {
    warnings.push(`⚠️ Найдены потенциально вредные добавки: ${foundHarmful.join(', ')}`);
  }

  // Поиск других нежелательных веществ
  const unwantedSubstances = [
    { name: 'пальмовое масло', warning: 'Содержит пальмовое масло' },
    { name: 'palm oil', warning: 'Contains palm oil' },
    { name: 'трансжиры', warning: 'Содержит трансжиры' },
    { name: 'trans fat', warning: 'Contains trans fats' },
    { name: 'гидрогенизированный', warning: 'Содержит гидрогенизированные жиры' },
    { name: 'hydrogenated', warning: 'Contains hydrogenated fats' },
    { name: 'глутамат натрия', warning: 'Содержит глутамат натрия (усилитель вкуса)' },
    { name: 'msg', warning: 'Contains MSG (flavor enhancer)' }
  ];

  for (const substance of unwantedSubstances) {
    if (text.toLowerCase().includes(substance.name.toLowerCase())) {
      warnings.push(`⚠️ ${substance.warning}`);
    }
  }

  // Расчет health score (0-10)
  let healthScore = 10;
  
  // Штрафы за вредные добавки
  healthScore -= foundHarmful.length * 2;
  
  // Штрафы за обычные E-добавки
  const regularEAdditives = eAdditives.length - foundHarmful.length;
  healthScore -= regularEAdditives * 0.5;
  
  // Штрафы за нежелательные вещества
  healthScore -= warnings.length * 1;
  
  // Ограничение от 1 до 10
  healthScore = Math.max(1, Math.min(10, Math.round(healthScore)));

  return {
    ingredients: extractIngredients(text),
    allergens: [...new Set(allergens)],
    e_additives: [...new Set(eAdditives)],
    health_score: healthScore,
    warnings
  };
};

// Извлечение списка ингредиентов
const extractIngredients = (text) => {
  // Поиск секции с составом
  const compositionPatterns = [
    /(?:состав|состав продукта|ингредиенты|ingredients|composition):?\s*([^.]+)/i,
    /(?:содержит|contains):?\s*([^.]+)/i
  ];

  for (const pattern of compositionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const ingredientsText = match[1];
      return ingredientsText
        .split(/[,;]/)
        .map(i => i.trim())
        .filter(i => i.length > 2 && i.length < 50)
        .slice(0, 20); // max 20 ингредиентов
    }
  }

  return [];
};

export default { extractTextFromImage, analyzeComposition };
