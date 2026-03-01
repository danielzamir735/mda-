export interface ChecklistItem {
  id: string;
  name: string;
  requiredAmount: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export const AMBULANCE_CHECKLIST: ChecklistCategory[] = [
  {
    id: 'resuscitation',
    name: 'ערכת החייאה למבוגר',
    items: [
      { id: 'res-ambu', name: 'מפוח הנשמה (AMBU)', requiredAmount: '1' },
      { id: 'res-mask-2', name: 'מסיכה מס׳ 2', requiredAmount: '1' },
      { id: 'res-mask-5', name: 'מסיכה מס׳ 5', requiredAmount: '1' },
      { id: 'res-bp', name: 'מד לחץ דם', requiredAmount: '1' },
      { id: 'res-defib', name: 'דפיברילטור', requiredAmount: '1' },
      { id: 'res-defib-pads', name: 'פדות לדפיברילטור', requiredAmount: '2' },
      { id: 'res-laryngoscope', name: 'לרינגוסקופ', requiredAmount: '1' },
      { id: 'res-et-tube', name: 'צינור אנדוטרכאלי', requiredAmount: '1' },
    ],
  },
  {
    id: 'oxygen',
    name: 'ערכת חמצן נייד',
    items: [
      { id: 'oxy-tank', name: 'מיכל חמצן 2.4 ליטר', requiredAmount: '1' },
      { id: 'oxy-regulator', name: 'ווסת לחץ', requiredAmount: '1' },
      { id: 'oxy-key', name: 'מפתח לפתיחת שסתום', requiredAmount: '1' },
      { id: 'oxy-mask', name: 'מסיכת חמצן', requiredAmount: '1' },
      { id: 'oxy-cannula', name: 'קנולת חמצן (אף)', requiredAmount: '1' },
      { id: 'oxy-tube', name: 'צינורית חמצן', requiredAmount: '1' },
    ],
  },
  {
    id: 'supplies',
    name: 'ציוד משקי',
    items: [
      { id: 'sup-gurney', name: 'לונקה', requiredAmount: '1' },
      { id: 'sup-bodybag', name: 'שק חללים', requiredAmount: '1' },
      { id: 'sup-sheets', name: 'סדינים', requiredAmount: '10' },
      { id: 'sup-blankets', name: 'שמיכות', requiredAmount: '3' },
    ],
  },
  {
    id: 'monitor',
    name: 'מוניטור',
    items: [
      { id: 'mon-screen', name: 'תקינות מסך', requiredAmount: 'תקין' },
      { id: 'mon-battery', name: 'סוללה', requiredAmount: '50%+' },
      { id: 'mon-cable', name: 'כבל מוניטור', requiredAmount: '1' },
      { id: 'mon-ecg', name: 'כבל אקג', requiredAmount: '1' },
      { id: 'mon-spo2', name: 'כבל סטורציה', requiredAmount: '1' },
      { id: 'mon-pads', name: 'מדבקות', requiredAmount: '1' },
      { id: 'mon-bp-cuff', name: 'שרוול ל"ד', requiredAmount: '1' },
      { id: 'mon-ir-temp', name: 'מד חום IR', requiredAmount: '1' },
    ],
  },
  {
    id: 'vehicle',
    name: 'רכב ונהג',
    items: [
      { id: 'veh-license', name: 'רשיונות', requiredAmount: 'תקין' },
      { id: 'veh-lights', name: 'אורות וסירנה', requiredAmount: 'תקין' },
      { id: 'veh-oil', name: 'שמן', requiredAmount: 'תקין' },
      { id: 'veh-fuel', name: 'דלק', requiredAmount: 'מלא' },
      { id: 'veh-brake', name: 'נוזל בלמים', requiredAmount: 'תקין' },
      { id: 'veh-coolant', name: 'נוזל קירור', requiredAmount: 'תקין' },
      { id: 'veh-urea', name: 'אוריאה', requiredAmount: 'תקין' },
      { id: 'veh-spare', name: 'גלגל רזרבי', requiredAmount: '1' },
      { id: 'veh-jack', name: 'מגבה', requiredAmount: '1' },
      { id: 'veh-extinguisher', name: 'מטף', requiredAmount: '1' },
      { id: 'veh-gloves', name: 'כפפות עבודה', requiredAmount: '1' },
      { id: 'veh-trash', name: 'פח אשפה', requiredAmount: 'תקין' },
    ],
  },
];
