import { X } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { useTranslation } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PrayerCardProps {
  text: string;
  count: string;
}

const PRAYER_FONT = "'David Libre', 'Frank Ruhl Libre', 'Times New Roman', serif";

/** The prayer itself is always said in Hebrew, so it stays Hebrew and right-to-left in both languages. */
function PrayerCard({ text, count }: PrayerCardProps) {
  return (
    <div className="rounded-2xl border border-amber-500/30 dark:border-amber-400/30 bg-amber-100/60 dark:bg-amber-400/5 backdrop-blur-sm p-4 flex flex-col gap-2">
      <p
        className="text-amber-950 dark:text-amber-100 font-bold leading-loose text-center"
        style={{ fontSize: '1.35rem', fontFamily: PRAYER_FONT }}
        lang="he"
        dir="rtl"
      >
        {text}
      </p>
      <span className="text-xs font-bold text-amber-800 dark:text-amber-300 text-center tracking-wide">{count}</span>
    </div>
  );
}

export default function SoulDepartureModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-gradient-to-br from-amber-50 via-slate-50 to-indigo-50 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#0f172a]">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-amber-500/25 dark:border-amber-400/20">
        <div className="flex items-center gap-2">
          {/* Star of David SVG icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-amber-800 dark:text-amber-400 shrink-0">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M8 9.5L16 9.5M6.5 13.5L17.5 13.5M9 7L15 7M9 16L15 16" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.4"/>
          </svg>
          <h2 className="text-amber-900 dark:text-amber-100 font-bold text-xl">{t('sdTitle')}</h2>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-fg/5 border border-amber-500/25 dark:border-amber-400/20"
          aria-label={t('close')}
        >
          <X size={20} className="text-amber-800 dark:text-amber-300" />
        </HapticButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Intro instruction */}
        <div className="rounded-2xl p-4 bg-fg/5 border border-amber-500/20 dark:border-amber-400/15">
          <p className="text-fg-muted text-sm leading-relaxed text-start">
            {t('sdIntro')}
          </p>
        </div>

        {/* Prayer cards */}
        <div className="flex flex-col gap-3">
          {/* i18n-ok: prayer text, always said in Hebrew */}
          <PrayerCard text="שְׁמַע יִשְׂרָאֵל, ה׳ אֱלֹקֵינוּ, ה׳ אֶחָד" count={t('sdOnce')} />
          {/* i18n-ok: prayer text, always said in Hebrew */}
          <PrayerCard text="בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד" count={t('sdTimes', { n: 3 })} />
          {/* i18n-ok: prayer text, always said in Hebrew */}
          <PrayerCard text="ה׳ הוּא הָאֱלֹהִים" count={t('sdTimes', { n: 7 })} />
          {/* i18n-ok: prayer text, always said in Hebrew */}
          <PrayerCard text="ה׳ מֶלֶךְ, ה׳ מָלָךְ, ה׳ יִמְלֹךְ לְעוֹלָם וָעֶד" count={t('sdOnce')} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-amber-500/25 dark:bg-amber-400/15" />
          <span className="text-amber-800 dark:text-amber-400/60 text-xs font-semibold tracking-widest">✦</span>
          <div className="flex-1 h-px bg-amber-500/25 dark:bg-amber-400/15" />
        </div>

        {/* Non-relatives instruction */}
        <div className="rounded-2xl p-4 bg-fg/5 border border-line">
          <p className="text-fg-muted text-sm leading-relaxed text-start">
            {t('sdNonRelatives')}
          </p>
        </div>

        {/* Non-relatives prayer */}
        <div className="rounded-2xl p-5 flex flex-col items-center gap-2 bg-surface-2 border border-line-strong">
          <p
            className="text-fg font-bold text-center leading-loose"
            style={{ fontSize: '1.4rem', fontFamily: PRAYER_FONT }}
            lang="he"
            dir="rtl"
          >
            {/* i18n-ok: prayer text, always said in Hebrew */}
            בָּרוּךְ דַּיַּן הָאֱמֶת
          </p>
        </div>

        {/* EMT message */}
        <div className="rounded-2xl p-5 flex flex-col gap-3 bg-blue-500/10 dark:bg-blue-800/15 border border-blue-400/30 dark:border-blue-400/25">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-700 dark:text-blue-400 shrink-0">
              <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" fill="currentColor" opacity="0.8"/>
            </svg>
            <h3 className="text-blue-700 dark:text-blue-300 font-bold text-base">{t('sdEmtTitle')}</h3>
          </div>
          <p className="text-fg-muted text-sm leading-relaxed text-start">
            {t('sdEmtP1Before')}
            {/* i18n-ok: verse quoted in Hebrew */}
            <span className="text-blue-700 dark:text-blue-200 font-semibold" lang="he" dir="rtl">״תּוֹסֵף רוּחָם יִגְוָעוּן״</span>
            {t('sdEmtP1After')}
          </p>
          <p className="text-fg-muted text-sm leading-relaxed text-start">
            {t('sdEmtP2')}
          </p>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
