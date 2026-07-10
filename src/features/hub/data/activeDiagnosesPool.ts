// מאגר "אבחנות פעילות" — משמש את רובריקת האתגר היומי "אבחנות פעילות" (Block G)
// לבחירת אבחנת-היום בצורה דטרמיניסטית (hash של התאריך), בדיוק כמו MED_DRUG_POOL/
// COMMON_MED_POOL עבור "תרופת היום". שים לב: קיים עותק זהה ב-Deno Edge Function
// (supabase/functions/generate-daily-questions/index.ts) — יש לעדכן את שניהם יחד.

export interface DiagnosisEntry {
  abbr: string;
  en: string;
  he: string;
}

export const DIAGNOSIS_POOL: DiagnosisEntry[] = [
  // ── לב וכלי דם ──
  { abbr: 'HTN', en: 'Hypertension', he: 'יתר לחץ דם' },
  { abbr: 'IHD', en: 'Ischemic Heart Disease', he: 'מחלת לב איסכמית' },
  { abbr: 's/p MI', en: 'Myocardial Infarction', he: 'אוטם שריר הלב (בעבר)' },
  { abbr: 'CHF', en: 'Congestive Heart Failure', he: 'אי ספיקת לב' },
  { abbr: 'AFib', en: 'Atrial Fibrillation', he: 'פרפור עליות' },
  { abbr: 's/p CABG', en: 'Coronary Artery Bypass Graft', he: 'ניתוח מעקפים (בעבר)' },
  { abbr: 'Pacemaker', en: 'Pacemaker', he: 'קוצב לב' },
  { abbr: 's/p PTCA', en: 'Percutaneous Coronary Angioplasty', he: 'צנתור לב — בלון/תומכן (בעבר)' },
  { abbr: 'Angina', en: 'Angina Pectoris', he: 'תעוקת חזה' },
  { abbr: 'VHD', en: 'Valvular Heart Disease', he: 'מחלת מסתמי לב' },
  { abbr: 'PVD', en: 'Peripheral Vascular Disease', he: 'מחלת כלי דם היקפיים' },
  { abbr: 'AAA', en: 'Abdominal Aortic Aneurysm', he: 'מפרצת אבי העורקים הבטני' },
  { abbr: 'DVT', en: 'Deep Vein Thrombosis', he: 'פקקת ורידים עמוקים' },
  { abbr: 'ICD', en: 'Implantable Cardioverter Defibrillator', he: 'דפיברילטור מושתל' },
  { abbr: 'Cardiomyopathy', en: 'Cardiomyopathy', he: 'מיופתיה של שריר הלב' },
  { abbr: 'Pericarditis', en: 'Pericarditis', he: 'דלקת קרום הלב' },
  { abbr: 'Endocarditis', en: 'Endocarditis', he: 'דלקת פנים הלב' },
  { abbr: 'HLD', en: 'Hyperlipidemia', he: 'כולסטרול גבוה (היפרליפידמיה)' },
  { abbr: 'SVT', en: 'Paroxysmal Supraventricular Tachycardia', he: 'טכיקרדיה על-חדרית התקפית' },
  { abbr: 'Long QT', en: 'Long QT Syndrome', he: 'תסמונת QT ארוך' },
  { abbr: 'Ao. Stenosis', en: 'Aortic Valve Stenosis', he: 'היצרות מסתם אאורטלי' },
  { abbr: 'MR', en: 'Mitral Regurgitation', he: 'אי ספיקת מסתם מיטרלי' },
  { abbr: 'Claudication', en: 'Intermittent Claudication', he: 'צליעה לסירוגין' },

  // ── נשימה ──
  { abbr: 'Asthma', en: 'Asthma', he: 'אסתמה' },
  { abbr: 'COPD', en: 'Chronic Obstructive Pulmonary Disease', he: 'מחלת ריאות חסימתית כרונית' },
  { abbr: 'OSA', en: 'Obstructive Sleep Apnea', he: 'דום נשימה חסימתי בשינה' },
  { abbr: 'Home O2', en: 'Home Oxygen Therapy', he: 'טיפול בחמצן ביתי' },
  { abbr: 's/p PE', en: 'Pulmonary Embolism', he: 'תסחיף ריאתי (בעבר)' },
  { abbr: 'Pulm. Fibrosis', en: 'Pulmonary Fibrosis', he: 'פיברוזיס ריאתי' },
  { abbr: 'Bronchiectasis', en: 'Bronchiectasis', he: 'ברונכיאקטזיס' },
  { abbr: 's/p TB', en: 'Tuberculosis', he: 'שחפת (בעבר)' },
  { abbr: 'Lung Ca', en: 'Lung Cancer', he: 'סרטן ריאה' },
  { abbr: 'Trach.', en: 'Tracheostomy', he: 'פיום קנה' },
  { abbr: 'Sarcoidosis', en: 'Sarcoidosis', he: 'סרקואידוזיס' },
  { abbr: 'Pulm. HTN', en: 'Pulmonary Hypertension', he: 'יתר לחץ דם ריאתי' },

  // ── נוירולוגיה ──
  { abbr: 's/p CVA', en: 'Cerebrovascular Accident', he: 'שבץ מוחי (בעבר)' },
  { abbr: 's/p TIA', en: 'Transient Ischemic Attack', he: 'אירוע איסכמי חולף (בעבר)' },
  { abbr: 'Epilepsy', en: 'Epilepsy', he: 'אפילפסיה' },
  { abbr: 'Dementia', en: 'Dementia', he: 'שיטיון' },
  { abbr: "Alzheimer's", en: "Alzheimer's Disease", he: 'מחלת אלצהיימר' },
  { abbr: "Parkinson's", en: "Parkinson's Disease", he: 'מחלת פרקינסון' },
  { abbr: 'MS', en: 'Multiple Sclerosis', he: 'טרשת נפוצה' },
  { abbr: 'Migraine', en: 'Migraine', he: 'מיגרנה' },
  { abbr: 'Neuropathy', en: 'Peripheral Neuropathy', he: 'נוירופתיה היקפית' },
  { abbr: 'VP Shunt', en: 'Ventriculoperitoneal Shunt', he: 'שאנט מוחי' },
  { abbr: 's/p TBI', en: 'Traumatic Brain Injury', he: 'פגיעת ראש טראומטית (בעבר)' },
  { abbr: 'Myasthenia Gravis', en: 'Myasthenia Gravis', he: 'מיאסתניה גרביס' },
  { abbr: 'ALS', en: 'Amyotrophic Lateral Sclerosis', he: 'טרשת צידית חד-גבית' },
  { abbr: 'Cognitive Dis.', en: 'Cognitive Disorder', he: 'הפרעה קוגניטיבית' },
  { abbr: 'Guillain-Barré', en: 'Guillain-Barré Syndrome', he: 'תסמונת גיאן-בארה' },
  { abbr: "Huntington's", en: "Huntington's Disease", he: 'מחלת הנטינגטון' },
  { abbr: 'Trigeminal Neuralgia', en: 'Trigeminal Neuralgia', he: 'נוירלגיה של העצב השלישי' },

  // ── מטבולי / אנדוקריני ──
  { abbr: 'DM1', en: 'Diabetes Mellitus Type 1', he: 'סוכרת נעורים (סוג 1)' },
  { abbr: 'DM2', en: 'Diabetes Mellitus Type 2', he: 'סוכרת סוג 2' },
  { abbr: 'Hypothyroid', en: 'Hypothyroidism', he: 'תת-פעילות בלוטת התריס' },
  { abbr: 'Hyperthyroid', en: 'Hyperthyroidism', he: 'יתר-פעילות בלוטת התריס' },
  { abbr: 'Obesity', en: 'Obesity', he: 'השמנת יתר' },
  { abbr: 'Gout', en: 'Gout', he: 'גאוט (שיגדון)' },
  { abbr: 'Osteoporosis', en: 'Osteoporosis', he: 'אוסטיאופורוזיס' },
  { abbr: 'Adrenal Insuff.', en: 'Adrenal Insufficiency', he: 'אי ספיקת יותרת הכליה' },
  { abbr: 'Metabolic Syndrome', en: 'Metabolic Syndrome', he: 'תסמונת מטבולית' },
  { abbr: 'Vit. D Deficiency', en: 'Vitamin D Deficiency', he: 'חוסר ויטמין D' },
  { abbr: 'Hyperparathyroidism', en: 'Hyperparathyroidism', he: 'יתר-פעילות בלוטת יותרת התריס' },
  { abbr: "Cushing's", en: "Cushing's Syndrome", he: 'תסמונת קושינג' },
  { abbr: "Addison's", en: "Addison's Disease", he: 'מחלת אדיסון' },

  // ── כליות ודרכי שתן ──
  { abbr: 'CRF', en: 'Chronic Renal Failure', he: 'אי ספיקת כליות כרונית' },
  { abbr: 'ESRD', en: 'End Stage Renal Disease (Dialysis)', he: 'אי ספיקת כליות סופנית (דיאליזה)' },
  { abbr: 'Nephrolithiasis', en: 'Kidney Stones', he: 'אבנים בכליות' },
  { abbr: 'BPH', en: 'Benign Prostatic Hyperplasia', he: 'הגדלה שפירה של הערמונית' },
  { abbr: 'Recurrent UTI', en: 'Recurrent Urinary Tract Infections', he: 'זיהומים חוזרים בדרכי השתן' },
  { abbr: 'Neurogenic Bladder', en: 'Neurogenic Bladder', he: 'שלפוחית נוירוגנית' },
  { abbr: 'Foley Catheter', en: 'Indwelling Urinary Catheter', he: 'קטטר שתן קבוע' },
  { abbr: 'PKD', en: 'Polycystic Kidney Disease', he: 'מחלת כליות פוליציסטית' },
  { abbr: 'Hydronephrosis', en: 'Hydronephrosis', he: 'הידרונפרוזיס' },

  // ── מערכת העיכול ──
  { abbr: 'GERD', en: 'Gastroesophageal Reflux Disease', he: 'ריפלוקס קיבתי-ושטי' },
  { abbr: 'PUD', en: 'Peptic Ulcer Disease', he: 'כיב פפטי' },
  { abbr: 'IBD', en: 'Inflammatory Bowel Disease', he: 'מחלת מעי דלקתית' },
  { abbr: "Crohn's", en: "Crohn's Disease", he: 'מחלת קרוהן' },
  { abbr: 'UC', en: 'Ulcerative Colitis', he: 'קוליטיס כיבית' },
  { abbr: 'Cirrhosis', en: 'Liver Cirrhosis', he: 'שחמת הכבד' },
  { abbr: 'Chronic Hepatitis', en: 'Chronic Hepatitis', he: 'דלקת כבד כרונית' },
  { abbr: 'Cholelithiasis', en: 'Gallstones', he: 'אבני מרה' },
  { abbr: 'Celiac', en: 'Celiac Disease', he: 'מחלת צליאק' },
  { abbr: 's/p Bariatric Surgery', en: 'Bariatric Surgery', he: 'ניתוח בריאטרי (בעבר)' },
  { abbr: 'Diverticulitis', en: 'Recurrent Diverticulitis', he: 'דיברטיקוליטיס חוזר' },
  { abbr: 'Chronic Pancreatitis', en: 'Chronic Pancreatitis', he: 'דלקת לבלב כרונית' },

  // ── המטולוגיה ואונקולוגיה ──
  { abbr: 'Anemia', en: 'Chronic Anemia', he: 'אנמיה כרונית' },
  { abbr: 'Leukemia', en: 'Leukemia', he: 'לוקמיה' },
  { abbr: 'Lymphoma', en: 'Lymphoma', he: 'לימפומה' },
  { abbr: 'Multiple Myeloma', en: 'Multiple Myeloma', he: 'מיאלומה נפוצה' },
  { abbr: 'Thrombocytopenia', en: 'Thrombocytopenia', he: 'ירידה בטסיות דם' },
  { abbr: 'Hemophilia', en: 'Hemophilia', he: 'המופיליה' },
  { abbr: 'Sickle Cell', en: 'Sickle Cell Disease', he: 'אנמיה חרמשית' },
  { abbr: 'Malignancy', en: 'Active Malignancy', he: 'גידול סרטני פעיל' },
  { abbr: 'Breast Ca', en: 'Breast Cancer', he: 'סרטן שד' },
  { abbr: 'Colon Ca', en: 'Colorectal Cancer', he: 'סרטן המעי הגס' },

  // ── פסיכיאטריה ──
  { abbr: 'Depression', en: 'Major Depressive Disorder', he: 'דיכאון' },
  { abbr: 'Anxiety', en: 'Anxiety Disorder', he: 'חרדה' },
  { abbr: 'Bipolar', en: 'Bipolar Disorder', he: 'הפרעה דו-קוטבית' },
  { abbr: 'Schizophrenia', en: 'Schizophrenia', he: 'סכיזופרניה' },
  { abbr: 'PTSD', en: 'Post-Traumatic Stress Disorder', he: 'הפרעת דחק פוסט-טראומטית' },
  { abbr: 'OCD', en: 'Obsessive-Compulsive Disorder', he: 'הפרעה טורדנית-כפייתית' },
  { abbr: 'Substance Abuse', en: 'Substance Use Disorder', he: 'שימוש כרוני בסמים' },
  { abbr: 'Alcohol Use Disorder', en: 'Alcohol Use Disorder', he: 'שימוש כרוני באלכוהול' },
  { abbr: 'Eating Disorder', en: 'Eating Disorder', he: 'הפרעת אכילה' },
  { abbr: 'ADHD', en: 'Attention Deficit Hyperactivity Disorder', he: 'הפרעת קשב וריכוז' },
  { abbr: 'Panic Disorder', en: 'Panic Disorder', he: 'הפרעת פאניקה' },
  { abbr: 'Personality Disorder', en: 'Personality Disorder', he: 'הפרעת אישיות' },

  // ── שלד ופרקים / ראומטולוגיה ──
  { abbr: 'RA', en: 'Rheumatoid Arthritis', he: 'דלקת מפרקים שגרונית' },
  { abbr: 'OA', en: 'Osteoarthritis', he: 'ניוון מפרקים (אוסטיאוארתריטיס)' },
  { abbr: 'Lupus', en: 'Systemic Lupus Erythematosus', he: 'זאבת' },
  { abbr: 'Fibromyalgia', en: 'Fibromyalgia', he: 'פיברומיאלגיה' },
  { abbr: 'Ankylosing Spondylitis', en: 'Ankylosing Spondylitis', he: 'ספונדיליטיס מקשחת' },
  { abbr: 's/p Hip Replacement', en: 'Total Hip Replacement', he: 'החלפת מפרק ירך (בעבר)' },
  { abbr: 's/p Knee Replacement', en: 'Total Knee Replacement', he: 'החלפת מפרק ברך (בעבר)' },
  { abbr: 'Chronic Osteomyelitis', en: 'Chronic Osteomyelitis', he: 'דלקת עצם כרונית' },
  { abbr: 'Scoliosis', en: 'Scoliosis', he: 'עקמת' },
  { abbr: 'Chronic Back Pain', en: 'Chronic Low Back Pain', he: 'כאבי גב תחתון כרוניים' },
  { abbr: 'Spinal Stenosis', en: 'Spinal Stenosis', he: 'היצרות תעלת השדרה' },
  { abbr: 'Herniated Disc', en: 'Herniated Disc', he: 'בקע דיסק' },

  // ── חיסון / אלרגיה / עור ──
  { abbr: 'Hx Anaphylaxis', en: 'History of Anaphylaxis', he: 'היסטוריה של אנפילקסיס' },
  { abbr: 'Food Allergy', en: 'Severe Food Allergy', he: 'אלרגיה חמורה למזון' },
  { abbr: 'Drug Allergy', en: 'Drug Allergy', he: 'אלרגיה לתרופות' },
  { abbr: 'Psoriasis', en: 'Psoriasis', he: 'פסוריאזיס' },
  { abbr: 'Immunosuppressed', en: 'Immunosuppression', he: 'דיכוי חיסוני' },
  { abbr: 'HIV', en: 'HIV Infection', he: 'נשא HIV' },
  { abbr: "Sjögren's", en: "Sjögren's Syndrome", he: 'תסמונת שגרן' },
  { abbr: 'Scleroderma', en: 'Scleroderma', he: 'טרשת עור' },

  // ── גינקולוגיה / מיילדות ──
  { abbr: 'Pregnancy', en: 'Current Pregnancy', he: 'הריון נוכחי' },
  { abbr: 's/p Hysterectomy', en: 'Hysterectomy', he: 'כריתת רחם (בעבר)' },
  { abbr: 'Menopause', en: 'Menopause', he: 'גיל המעבר' },

  // ── הרגלים ותפקוד ──
  { abbr: 'Smoking', en: 'Chronic Smoking', he: 'עישון כרוני' },
  { abbr: 'Bedridden', en: 'Bedridden / Immobile', he: 'מרותק למיטה' },
  { abbr: 'Fall Risk', en: 'High Fall Risk', he: 'סיכון גבוה לנפילות' },
  { abbr: 'Malnutrition', en: 'Malnutrition', he: 'תת-תזונה' },

  // ── חושים / א.א.ג ──
  { abbr: 'Glaucoma', en: 'Glaucoma', he: 'גלאוקומה' },
  { abbr: 's/p Cataract Surgery', en: 'Cataract Surgery', he: 'ניתוח קטרקט (בעבר)' },
  { abbr: 'Hearing Impairment', en: 'Hearing Impairment', he: 'לקות שמיעה' },
  { abbr: 'Legal Blindness', en: 'Legal Blindness', he: 'עיוורון' },
  { abbr: 'Recurrent Vertigo', en: 'Recurrent Vertigo', he: 'סחרחורות חוזרות' },
  { abbr: "Ménière's", en: "Ménière's Disease", he: 'מחלת מנייר' },
  { abbr: 'Diabetic Retinopathy', en: 'Diabetic Retinopathy', he: 'רטינופתיה סוכרתית' },

  // ── ילדים / מולד ──
  { abbr: 'Down Syndrome', en: 'Down Syndrome', he: 'תסמונת דאון' },
  { abbr: 'Cerebral Palsy', en: 'Cerebral Palsy', he: 'שיתוק מוחין' },
  { abbr: 'Autism', en: 'Autism Spectrum Disorder', he: 'הפרעת קשת האוטיזם' },
  { abbr: 'Congenital Heart Disease', en: 'Congenital Heart Disease', he: 'מחלת לב מולדת' },
  { abbr: 'Cystic Fibrosis', en: 'Cystic Fibrosis', he: 'פיברוזיס כיסתי' },
  { abbr: 'Developmental Delay', en: 'Developmental Delay', he: 'עיכוב התפתחותי' },

  // ── זיהומים ואחר ──
  { abbr: 'Recurrent Sepsis', en: 'Recurrent Sepsis', he: 'אלח דם חוזר' },
  { abbr: 'MRSA Carrier', en: 'MRSA Carrier', he: 'נשא MRSA' },
  { abbr: 'Recurrent Cellulitis', en: 'Recurrent Cellulitis', he: 'זיהומי עור חוזרים (צלוליטיס)' },
  { abbr: 'Pressure Ulcer', en: 'Chronic Pressure Ulcer', he: 'פצע לחץ כרוני' },
  { abbr: 'Chronic Wound', en: 'Chronic Non-Healing Wound', he: 'פצע כרוני שאינו מחלים' },
  { abbr: 'Lymphedema', en: 'Chronic Lymphedema', he: 'בצקת לימפטית כרונית' },
  { abbr: 's/p Amputation', en: 'Limb Amputation', he: 'קטיעת גפה (בעבר)' },
  { abbr: 's/p Organ Transplant', en: 'Organ Transplant', he: 'השתלת איבר (בעבר)' },
];
