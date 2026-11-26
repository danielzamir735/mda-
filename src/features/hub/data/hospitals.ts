import type { Hospital } from '../components/HospitalAccordionItem';

// Every hospital the app knows about. The hospital info screen lists them;
// the ER-load screen lets people report on every one that has an ER.

export const LEVEL_A: Hospital[] = [
  { name: 'רמב"ם',           city: 'חיפה', en: ['Rambam', 'Haifa'],        central: '04-777-2222', er: '04-777-1300', lat: 32.833, lng: 34.990, navQueries: { general: 'מיון רמב"ם',              pediatric: 'מיון ילדים רות רמב"ם' } }, // i18n-ok: Hebrew name and map query
  { name: 'בלינסון',          city: 'פתח תקווה', en: ['Beilinson', 'Petah Tikva'],   central: '03-937-7377', er: '03-937-7021', lat: 32.089, lng: 34.882, navQueries: { general: 'מיון בילינסון',            pediatric: 'מיון ילדים שניידר',            maternity: 'בית חולים לנשים בילינסון' } }, // i18n-ok: Hebrew name and map query
  { name: 'איכילוב',          city: 'תל אביב', en: ['Ichilov', 'Tel Aviv'],     central: '03-697-4444', er: '03-697-3232', lat: 32.080, lng: 34.789, navQueries: { general: 'מיון איכילוב',             pediatric: 'מיון דנה איכילוב',             maternity: 'מיון ליס איכילוב' } }, // i18n-ok: Hebrew name and map query
  { name: 'תל השומר שיבא',    city: 'רמת גן', en: ['Sheba Tel HaShomer', 'Ramat Gan'],      central: '03-530-3030', er: '03-530-3101', lat: 32.043, lng: 34.828, navQueries: { general: 'מיון שיבא תל השומר',      pediatric: 'מיון ילדים ספרא תל השומר',     maternity: 'מיון יולדות שיבא' } }, // i18n-ok: Hebrew name and map query
  { name: 'הדסה עין כרם',     city: 'ירושלים', en: ['Hadassah Ein Kerem', 'Jerusalem'],     central: '02-677-7111', er: '02-677-7222', lat: 31.765, lng: 35.149, navQueries: { general: 'מיון הדסה עין כרם',       pediatric: 'מיון ילדים הדסה עין כרם',      maternity: 'מיון יולדות הדסה עין כרם' } }, // i18n-ok: Hebrew name and map query
  { name: 'שערי צדק',         city: 'ירושלים', en: ['Shaare Zedek', 'Jerusalem'],     central: '02-655-5111', er: '02-655-5509', lat: 31.772, lng: 35.181, navQueries: { general: 'מיון שערי צדק',            pediatric: 'מיון ילדים שערי צדק',          maternity: 'מיון נשים שערי צדק' } }, // i18n-ok: Hebrew name and map query
  { name: 'סורוקה',           city: 'באר שבע', en: ['Soroka', 'Beersheba'],     central: '08-640-0111', er: '08-640-0888', lat: 31.258, lng: 34.800, navQueries: { general: 'מיון סורוקה',              pediatric: 'מיון ילדים סורוקה',            maternity: 'מיון יולדות סבן סורוקה' } }, // i18n-ok: Hebrew name and map query
];

export const LEVEL_B: Hospital[] = [
  { name: 'המרכז הרפואי לגליל', city: 'נהריה', en: ['Galilee Medical Center', 'Nahariya'],      central: '04-910-7107', er: '04-9107766',  lat: 33.007, lng: 35.094 }, // i18n-ok: Hebrew name and map query
  { name: 'זיו',               city: 'צפת', en: ['Ziv', 'Safed'],         central: '04-682-8811', er: '04-682-8838', lat: 32.970, lng: 35.501 }, // i18n-ok: Hebrew name and map query
  { name: 'פוריה',             city: 'טבריה', en: ['Poriya', 'Tiberias'],       central: '04-665-2211', er: '04-665-2850', lat: 32.746, lng: 35.567 }, // i18n-ok: Hebrew name and map query
  { name: 'העמק',              city: 'עפולה', en: ['HaEmek', 'Afula'],       central: '04-649-4000', er: '04-649-4166', lat: 32.613, lng: 35.302 }, // i18n-ok: Hebrew name and map query
  { name: 'בני ציון',          city: 'חיפה', en: ['Bnai Zion', 'Haifa'],        central: '04-835-9359', er: '04-835-9210', lat: 32.815, lng: 34.993 }, // i18n-ok: Hebrew name and map query
  { name: 'כרמל',              city: 'חיפה', en: ['Carmel', 'Haifa'],        central: '04-825-0211', er: '04-825-0240', lat: 32.807, lng: 34.972 }, // i18n-ok: Hebrew name and map query
  { name: 'מעלה הכרמל',        city: 'טירת הכרמל', en: ['Maale HaCarmel', 'Tirat Carmel'], central: '-',           er: '-',            lat: 32.758, lng: 34.976 }, // i18n-ok: Hebrew name and map query
  { name: 'הלל יפה',           city: 'חדרה', en: ['Hillel Yaffe', 'Hadera'],        central: '04-774-4477', er: '04-774-4277', lat: 32.430, lng: 34.925 }, // i18n-ok: Hebrew name and map query
  { name: 'מאיר',              city: 'כפר סבא', en: ['Meir', 'Kfar Saba'],     central: '09-747-2555', er: '09-747-2322', lat: 32.178, lng: 34.908 }, // i18n-ok: Hebrew name and map query
  { name: 'לניאדו',            city: 'נתניה', en: ['Laniado', 'Netanya'],       central: '09-860-4666', er: '09-8604619',  lat: 32.320, lng: 34.860 }, // i18n-ok: Hebrew name and map query
  { name: 'שניידר (ילדים)',    city: 'פתח תקווה', en: ['Schneider (Children\'s)', 'Petah Tikva'],   central: '03-925-3726', er: '03-925-3656', lat: 32.091, lng: 34.883 }, // i18n-ok: Hebrew name and map query
  { name: 'וולפסון',           city: 'חולון', en: ['Wolfson', 'Holon'],       central: '03-502-8211', er: '03-5028317',  lat: 32.013, lng: 34.774 }, // i18n-ok: Hebrew name and map query
  { name: 'מעייני הישועה',     city: 'בני ברק', en: ['Mayanei HaYeshua', 'Bnei Brak'],     central: '03-5771111',  er: '053-7345978', lat: 32.086, lng: 34.836 }, // i18n-ok: Hebrew name and map query
  { name: 'קפלן',              city: 'רחובות', en: ['Kaplan', 'Rehovot'],      central: '08-944-1211', er: '08-944-1553', lat: 31.903, lng: 34.813 }, // i18n-ok: Hebrew name and map query
  { name: 'ברזילי',            city: 'אשקלון', en: ['Barzilai', 'Ashkelon'],      central: '08-674-5111', er: '08-674-5561', lat: 31.669, lng: 34.573 }, // i18n-ok: Hebrew name and map query
  { name: 'אסף הרופא',         city: 'צריפין', en: ['Assaf Harofeh (Shamir)', 'Tzrifin'],      central: '08-977-9020', er: '08-977-9333', lat: 31.930, lng: 34.830 }, // i18n-ok: Hebrew name and map query
  { name: 'הדסה הר הצופים',   city: 'ירושלים', en: ['Hadassah Mount Scopus', 'Jerusalem'],     central: '02-584-4111', er: '02-584-4111', lat: 31.794, lng: 35.239, navQueries: { general: 'מיון הדסה הר הצופים ירושלים', pediatric: 'מיון ילדים הדסה הר הצופים', maternity: 'מיון יולדות הדסה הר הצופים' } }, // i18n-ok: Hebrew name and map query
  { name: 'אסותא אשדוד',      city: 'אשדוד', en: ['Assuta Ashdod', 'Ashdod'],       central: '08-300-4100', er: '072-339-8728', lat: 31.801, lng: 34.644, navQueries: { general: 'מיון אסותא אשדוד',              pediatric: 'מיון ילדים אסותא אשדוד',              maternity: 'מיון יולדות אסותא אשדוד' } }, // i18n-ok: Hebrew name and map query
  { name: 'יוספטל',           city: 'אילת', en: ['Yoseftal', 'Eilat'],        central: '08-635-8011', er: '08-635-8011', lat: 29.557, lng: 34.964, navQueries: { general: 'מיון יוספטל אילת',               pediatric: 'מיון ילדים יוספטל אילת',               maternity: 'מיון יולדות יוספטל אילת' } }, // i18n-ok: Hebrew name and map query
];
