const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.anthropicApiKey });

function extractJson(response) {
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('claude returned no text content');
  return JSON.parse(textBlock.text);
}

const SCAN_SCHEMA = {
  type: 'object',
  properties: {
    stocks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          t: { type: 'string' },
          box_ind: { type: 'string', enum: ['ok', 'warn', 'fail'] },
          box_best: { type: 'string', enum: ['ok', 'warn', 'fail'] },
          note: { type: 'string' },
        },
        required: ['t', 'box_ind', 'box_best', 'note'],
        additionalProperties: false,
      },
    },
    report: { type: 'string' },
  },
  required: ['stocks', 'report'],
  additionalProperties: false,
};

async function synthesizeScan(stocksData) {
  const prompt = `אתה מנוע ניתוח מניות. לכל מניה ברשימה כבר חושבו נתונים אמיתיים ממקור נתונים פיננסי (Yahoo Finance) — אל תשנה אותם ואל תמציא נתונים חדשים, רק נתח אותם.

עבור כל מניה קבע:
- box_ind ("תעשייה עולה"): על סמך מומנטום תעודת הסל הסקטוריאלית (sectorMomentum) אם קיימת. ok אם המומנטום חיובי וברור, warn אם מעורב, fail אם שלילי. אם אין נתון סקטור, בחר warn.
- box_best ("הכי טובה בענף"): על סמך צמיחת הכנסות (revenueGrowth), שוליים (grossMargin, operatingMargin) ו-ROE. ok אם הנתונים חזקים באופן ברור (למשל צמיחה מעל 15% ושוליים בריאים), fail אם רווחיות חלשה/שלילית, אחרת warn.
- note: משפט עברי אחד קצר (עד 12 מילים) שמנמק את הציונים על סמך המספרים בפועל.

בנוסף כתוב "report": פסקה עברית קצרה (3-4 משפטים) שמסכמת מה השתנה, מי הכי חזקה, ומה דורש תשומת לב, על סמך הנתונים.

כל הטקסטים (note, report) צריכים להיות טקסט רגיל בלבד — בלי תגיות HTML ובלי Markdown.

נתוני המניות:
${JSON.stringify(stocksData)}`;

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 4096,
    thinking: { type: 'disabled' },
    output_config: { format: { type: 'json_schema', schema: SCAN_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });
  return extractJson(response);
}

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          t: { type: 'string', description: 'Ticker symbol, e.g. NVDA' },
          name: { type: 'string', description: 'שם קצר בעברית' },
        },
        required: ['t', 'name'],
        additionalProperties: false,
      },
    },
  },
  required: ['candidates'],
  additionalProperties: false,
};

async function extractTickers(text) {
  const prompt = `לפניך סיכום של סרטון/מאמר השקעות. חלץ ממנו עד 6 טיקרים אמיתיים של מניות סחירות בבורסה (לא נכסים פרטיים, לא קריפטו כללי, לא קלישאות). לכל טיקר תן שם קצר בעברית.
הסיכום:
"""${text.slice(0, 4000)}"""`;

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 1024,
    thinking: { type: 'disabled' },
    output_config: { format: { type: 'json_schema', schema: EXTRACT_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });
  return extractJson(response).candidates;
}

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          t: { type: 'string' },
          box_ind: { type: 'string', enum: ['ok', 'warn', 'fail'] },
          box_best: { type: 'string', enum: ['ok', 'warn', 'fail'] },
          note: { type: 'string' },
          trigger_suggestion: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        },
        required: ['t', 'box_ind', 'box_best', 'note', 'trigger_suggestion'],
        additionalProperties: false,
      },
    },
  },
  required: ['candidates'],
  additionalProperties: false,
};

async function synthesizeDiscovery(candidatesData) {
  const prompt = `עבור כל מועמדת מניה ברשימה, נתוני אמת כבר חושבו (מחיר, ממוצעים נעים, יסודות, מומנטום סקטור). בהתבסס עליהם בלבד קבע:
- box_ind ("תעשייה עולה"): לפי מומנטום תעודת הסל הסקטוריאלית.
- box_best ("הכי טובה בענף"): לפי צמיחת הכנסות, שוליים ו-ROE. fail אם החברה לא רווחית.
- note: משפט עברי קצר (עד 12 מילים).
- trigger_suggestion: מחיר טריגר שבירה סביר (מעט מתחת לממוצע 200 יומי או לתמיכה טכנית), או null אם אין מספיק מידע.

השדה note צריך להיות טקסט רגיל בלבד — בלי תגיות HTML ובלי Markdown.

נתונים:
${JSON.stringify(candidatesData)}`;

  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 2048,
    thinking: { type: 'disabled' },
    output_config: { format: { type: 'json_schema', schema: DISCOVERY_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });
  return extractJson(response).candidates;
}

module.exports = { extractTickers, synthesizeScan, synthesizeDiscovery };
