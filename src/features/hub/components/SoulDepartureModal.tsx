import { X } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PrayerCardProps {
  text: string;
  count: string;
  countColor?: string;
}

function PrayerCard({ text, count, countColor = 'text-amber-300' }: PrayerCardProps) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 backdrop-blur-sm p-4 flex flex-col gap-2">
      <p
        className="text-amber-100 font-bold leading-loose text-center"
        style={{ fontSize: '1.35rem', fontFamily: "'David Libre', 'Frank Ruhl Libre', 'Times New Roman', serif", direction: 'rtl' }}
        lang="he"
      >
        {text}
      </p>
      <span className={`text-xs font-bold ${countColor} text-center tracking-wide`}>{count}</span>
    </div>
  );
}

export default function SoulDepartureModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden" role="dialog" aria-modal="true" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* Header */}
      <div
        className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(251, 191, 36, 0.2)' }}
      >
        <div className="flex items-center gap-2">
          {/* Star of David SVG icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-amber-400 shrink-0">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M8 9.5L16 9.5M6.5 13.5L17.5 13.5M9 7L15 7M9 16L15 16" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.4"/>
          </svg>
          <h2 className="text-amber-100 font-bold text-xl" style={{ direction: 'rtl' }}>תפילה ליציאת נשמה</h2>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}
          aria-label="סגור"
        >
          <X size={20} className="text-amber-300" />
        </HapticButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" dir="rtl">

        {/* Intro instruction */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}
        >
          <p className="text-slate-300 text-sm leading-relaxed text-right">
            ראוי לעמוד בצד המיטה של הנפטר ולא למרגלותיה. בשעת יציאת הנשמה יש לומר:
          </p>
        </div>

        {/* Prayer cards */}
        <div className="flex flex-col gap-3">
          <PrayerCard
            text="שְׁמַע יִשְׂרָאֵל, יְהוָה אֱלֹהֵינוּ, יְהוָה אֶחָד"
            count="פעם אחת"
          />
          <PrayerCard
            text="בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד"
            count="× 3 פעמים"
          />
          <PrayerCard
            text="ה׳ הוּא הָאֱלֹהִים"
            count="× 7 פעמים"
          />
          <PrayerCard
            text="ה׳ מֶלֶךְ, ה׳ מָלָךְ, ה׳ יִמְלֹךְ לְעוֹלָם וָעֶד"
            count="פעם אחת"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(251,191,36,0.15)' }} />
          <span className="text-amber-400/60 text-xs font-semibold tracking-widest">✦</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(251,191,36,0.15)' }} />
        </div>

        {/* Non-relatives instruction */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.2)' }}
        >
          <p className="text-slate-300 text-sm leading-relaxed text-right">
            העומדים בשעת יציאת הנשמה שאינם קרובי משפחה יאמרו:
          </p>
        </div>

        {/* Non-relatives prayer */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-2"
          style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.25)' }}
        >
          <p
            className="text-slate-100 font-bold text-center leading-loose"
            style={{ fontSize: '1.4rem', fontFamily: "'David Libre', 'Frank Ruhl Libre', 'Times New Roman', serif", direction: 'rtl' }}
            lang="he"
          >
            בָּרוּךְ דַּיַּן הָאֱמֶת
          </p>
        </div>

        {/* EMT message */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: 'rgba(30,64,175,0.15)', border: '1px solid rgba(96,165,250,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-400 shrink-0">
              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" fill="currentColor" opacity="0.8"/>
            </svg>
            <h3 className="text-blue-300 font-bold text-base">מסר לחובשים ולפרמדיקים</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed text-right">
            עמיתי חובשים ופרמדיקים, זכרו! הרגעים האחרונים של הפרדת הנשמה מהגוף הם זמן נשגב ומשמעותי. עבור המטופל, אלו שעותיו האחרונות על פני האדמה, המלוות בעוצמה פנימית עמוקה, כפי שכתוב בתהילים: <span className="text-blue-200 font-semibold">״תּוֹסֵף רוּחָם יִגְוָעוּן״</span> (קד, כט) — ישנה תוספת כוח מיוחדת בנפש לפני המעבר.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed text-right">
            תפקידכם הוא להיות שם עבורו, לסייע ולרומם את הרגעים הללו. על פי המסורת, יציאת הנשמה היא התגלות אלוהית, והנפטר רואה אור גדול. נוכחותכם ברגעים אלו היא זכות גדולה, המטילה עליכם חובה להתנהלות מלאת כבוד, הכלה ויראת קודש, הראויה למעמד המקודש הזה.
          </p>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
