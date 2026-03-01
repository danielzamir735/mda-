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
    id: 'vehicle',
    name: 'בדיקת רכב',
    items: [
      { id: 'veh-lights', name: 'אורות חירום (כחולים)', requiredAmount: 'תקין' },
      { id: 'veh-siren', name: 'סירנה', requiredAmount: 'תקין' },
      { id: 'veh-oil', name: 'שמן מנוע', requiredAmount: 'תקין' },
      { id: 'veh-fuel', name: 'דלק', requiredAmount: 'מלא' },
      { id: 'veh-tires', name: 'לחץ צמיגים', requiredAmount: 'תקין' },
      { id: 'veh-firstaid', name: 'ערכת עזרה ראשונה בסיסית', requiredAmount: 'תקין' },
    ],
  },
];
