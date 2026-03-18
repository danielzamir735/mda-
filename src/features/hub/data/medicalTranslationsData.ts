export type Lang = 'en' | 'ru' | 'ar' | 'fr' | 'am';

export interface Phrase {
  id: string;
  category: string;
  he: string;
  en: string;
  ru: string;
  ar: string;
  fr: string;
  am: string;
}

export const CATEGORIES = ['הכל', 'כאב', 'נשימה', 'רקע', 'כללי', 'נשים'];

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  ru: 'Русский',
  ar: 'العربية',
  fr: 'Français',
  am: 'አማርኛ',
};

export const LANG_FLAGS: Record<Lang, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
  ar: '🇦🇪',
  fr: '🇫🇷',
  am: '🇪🇹',
};

export const LANG_DIR: Record<Lang, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ru: 'ltr',
  ar: 'rtl',
  fr: 'ltr',
  am: 'ltr',
};

export const PHRASES: Phrase[] = [
  {
    id: 'pain_where',
    category: 'כאב',
    he: 'איפה כואב לך? תצביע.',
    en: 'Where does it hurt? Point to it.',
    ru: 'Где болит? Покажите.',
    ar: 'أين يؤلمك؟ أشر إليه.',
    fr: 'Où avez-vous mal ? Montrez-moi.',
    am: 'የት ነው የሚያምዎት? ያሳዩኝ።',
  },
  {
    id: 'pain_scale',
    category: 'כאב',
    he: 'כמה כואב? מ-1 (קצת) עד 10 (מאוד)',
    en: 'How bad is the pain? From 1 (mild) to 10 (severe).',
    ru: 'Насколько сильна боль? От 1 (слабая) до 10 (очень сильная).',
    ar: 'ما شدة الألم؟ من ١ (خفيف) إلى ١٠ (شديد جداً).',
    fr: 'Quelle est l\'intensité de la douleur ? De 1 (légère) à 10 (intense).',
    am: 'ህመሙ ምን ያህል ነው? ከ1 (ቀላል) እስከ 10 (ከባድ)።',
  },
  {
    id: 'chest_pain',
    category: 'כאב',
    he: 'האם יש לך כאבים בחזה?',
    en: 'Do you have chest pain?',
    ru: 'У вас есть боль в груди?',
    ar: 'هل تعاني من ألم في الصدر؟',
    fr: 'Avez-vous des douleurs à la poitrine ?',
    am: 'የደረት ህመም አለብዎት?',
  },
  {
    id: 'breathe',
    category: 'נשימה',
    he: 'קח נשימה עמוקה',
    en: 'Take a deep breath.',
    ru: 'Сделайте глубокий вдох.',
    ar: 'خذ نفساً عميقاً.',
    fr: 'Prenez une grande inspiration.',
    am: 'ጥልቅ ትንፋሽ ይውሰዱ።',
  },
  {
    id: 'short_breath',
    category: 'נשימה',
    he: 'האם אתה מרגיש קוצר נשימה?',
    en: 'Are you having difficulty breathing?',
    ru: 'Вам трудно дышать?',
    ar: 'هل تعاني من صعوبة في التنفس؟',
    fr: 'Avez-vous des difficultés à respirer ?',
    am: 'ለመተንፈስ ይቸገራሉ?',
  },
  {
    id: 'allergies',
    category: 'רקע',
    he: 'האם יש לך רגישות לתרופות?',
    en: 'Do you have any allergies to medications?',
    ru: 'У вас есть аллергия на лекарства?',
    ar: 'هل لديك حساسية تجاه أي أدوية؟',
    fr: 'Avez-vous des allergies médicamenteuses ?',
    am: 'ለማንኛውም መድሃኒት አለርጂ አለብዎት?',
  },
  {
    id: 'meds',
    category: 'רקע',
    he: 'האם אתה לוקח תרופות קבועות?',
    en: 'Do you take any regular medications?',
    ru: 'Вы принимаете какие-либо лекарства постоянно?',
    ar: 'هل تتناول أي أدوية بانتظام؟',
    fr: 'Prenez-vous des médicaments régulièrement ?',
    am: 'በመደበኛነት የሚወስዱት መድሃኒት አለ?',
  },
  {
    id: 'heart',
    category: 'רקע',
    he: 'האם יש לך בעיות לב?',
    en: 'Do you have any heart problems?',
    ru: 'У вас есть проблемы с сердцем?',
    ar: 'هل تعاني من أي مشاكل في القلب؟',
    fr: 'Avez-vous des problèmes cardiaques ?',
    am: 'የልብ ችግር አለብዎት?',
  },
  {
    id: 'diabetes',
    category: 'רקע',
    he: 'האם אתה סוכרתי?',
    en: 'Do you have diabetes?',
    ru: 'У вас диабет?',
    ar: 'هل لديك مرض السكري؟',
    fr: 'Êtes-vous diabétique ?',
    am: 'የስኳር በሽታ አለብዎት?',
  },
  {
    id: 'when_start',
    category: 'כללי',
    he: 'מתי זה התחיל?',
    en: 'When did it start?',
    ru: 'Когда это началось?',
    ar: 'متى بدأ هذا؟',
    fr: 'Quand cela a-t-il commencé ?',
    am: 'መቼ ጀመረ?',
  },
  {
    id: 'vomit',
    category: 'כללי',
    he: 'האם הקאת?',
    en: 'Have you vomited?',
    ru: 'Вас рвало?',
    ar: 'هل تقيأت؟',
    fr: 'Avez-vous vomi ?',
    am: 'ትውከት ተሰምቶዎታል?',
  },
  {
    id: 'conscious',
    category: 'כללי',
    he: 'האם אתה מרגיש בסדר? הראה לי עם האצבע – כן / לא',
    en: 'Are you conscious? Show me – yes / no.',
    ru: 'Вы в сознании? Покажите – да / нет.',
    ar: 'هل أنت واعٍ؟ أشر لي – نعم / لا.',
    fr: 'Êtes-vous conscient ? Montrez-moi – oui / non.',
    am: 'ንቃተ-ህሊናዎ አለ? ያሳዩኝ – አዎ / አይደለም።',
  },
  {
    id: 'calm',
    category: 'כללי',
    he: 'הישאר רגוע. אנחנו כאן לעזור לך.',
    en: 'Stay calm. We are here to help you.',
    ru: 'Успокойтесь. Мы здесь, чтобы помочь вам.',
    ar: 'ابقَ هادئاً. نحن هنا لمساعدتك.',
    fr: 'Restez calme. Nous sommes là pour vous aider.',
    am: 'ጸጥ ይበሉ። እኛ ለመርዳት እዚህ ነን።',
  },
  {
    id: 'pregnant',
    category: 'נשים',
    he: 'האם את בהריון?',
    en: 'Are you pregnant?',
    ru: 'Вы беременны?',
    ar: 'هل أنتِ حامل؟',
    fr: 'Êtes-vous enceinte ?',
    am: 'እርጉዝ ናችሁ?',
  },
  {
    id: 'last_period',
    category: 'נשים',
    he: 'מתי הייתה הווסת האחרונה שלך?',
    en: 'When was your last menstrual period?',
    ru: 'Когда была ваша последняя менструация?',
    ar: 'متى كانت آخر دورة شهرية لكِ؟',
    fr: 'Quand avez-vous eu vos dernières règles ?',
    am: 'የመጨረሻ የወር አበባዎ መቼ ነበር?',
  },
];
