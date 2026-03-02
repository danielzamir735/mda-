export interface Hospital {
  name: string;
  city: string;
  switchboard: string;
  er: string;
}

export const LEVEL_A: Hospital[] = [
  { name: 'הדסה עין כרם', city: 'ירושלים', switchboard: '02-677-7111', er: '02-677-7111' },
  { name: 'שיבא תל השומר', city: 'רמת גן', switchboard: '03-530-2222', er: '03-530-2222' },
  { name: 'איכילוב (סוראסקי)', city: 'תל אביב', switchboard: '03-697-4444', er: '03-697-4444' },
  { name: 'רמב"ם', city: 'חיפה', switchboard: '04-777-2222', er: '04-777-2222' },
  { name: 'סורוקה', city: 'באר שבע', switchboard: '08-640-0111', er: '08-640-0111' },
];

export const LEVEL_B: Hospital[] = [
  { name: 'העמק', city: 'עפולה', switchboard: '04-649-4000', er: '04-649-4166' },
  { name: 'בני ציון', city: 'חיפה', switchboard: '04-835-9359', er: '04-835-9210' },
  { name: 'כרמל', city: 'טירת הכרמל', switchboard: '04-825-0211', er: '04-825-0240' },
  { name: 'הלל יפה', city: 'חדרה', switchboard: '04-774-4477', er: '04-774-4277' },
  { name: 'מאיר', city: 'כפר סבא', switchboard: '09-747-2555', er: '09-747-2322' },
  { name: 'לניאדו', city: 'נתניה', switchboard: '09-860-4666', er: '09-860-4624' },
  { name: 'שניידר', city: 'תל אביב', switchboard: '03-925-3726', er: '03-925-3656' },
  { name: 'וולפסון', city: 'חולון', switchboard: '03-502-8211', er: '03-502-8313' },
  { name: 'קפלן', city: 'רחובות', switchboard: '08-944-1211', er: '08-944-1200' },
  { name: 'הדסה הר הצופים', city: 'ירושלים', switchboard: '02-584-4044', er: '02-584-4333' },
  { name: 'שמיר (אסף הרופא)', city: 'ראשון לציון', switchboard: '08-977-9999', er: '08-977-9910' },
  { name: 'ברזילי', city: 'אשקלון', switchboard: '08-674-5555', er: '08-674-5100' },
  { name: 'יוספטל', city: 'אילת', switchboard: '08-635-8011', er: '08-635-8011' },
  { name: 'פוריה', city: 'טבריה', switchboard: '04-665-2211', er: '04-665-2211' },
  { name: 'זיו', city: 'צפת', switchboard: '04-682-8000', er: '04-682-8000' },
];
