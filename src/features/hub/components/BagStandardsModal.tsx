import { useState, useEffect } from 'react';
import { ChevronRight, Backpack, CheckCircle2, Circle, XCircle, RotateCcw, Calendar, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useTranslation, translate, type TranslationKey } from '../../../hooks/useTranslation';
import { trackEvent } from '../../../utils/analytics';

// ─── Types ───────────────────────────────────────────────────────────────────

/** `k` is a dictionary key (with `v` filling {n}); `name` is a literal, already-English label.
 *  `qk` formats the quantity (e.g. "1 each"). */
interface BagItem { k?: TranslationKey; v?: string; name?: string; qty: string; qk?: TranslationKey }
interface Bag { id: string; title: TranslationKey; subtitle: TranslationKey; color: string; border: string; bg: string; iconColor: string; items: BagItem[] }
interface MDACategory { id: string; title: TranslationKey; color: string; border: string; bg: string; items: BagItem[] }
interface ItemStatus { status: 'have' | 'missing' | null; expiryDate?: string }
type BagInventory = Record<string, ItemStatus>

// ─── Data ────────────────────────────────────────────────────────────────────

const BAGS: Bag[] = [
  {
    id: 'maar',
    title: 'bagTFirstResponderBag',
    subtitle: 'bagTFirstResponder',
    color: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    items: [
      { k: 'bagBackpack', qty: '1' },
      { k: 'bagTriangularBandage', qty: '5' },
      { k: 'bagPersonalIsraeliDressing', qty: '5' },
      { k: 'bagMediumDressing', qty: '1' },
      { k: 'bagTourniquet', qty: '1' },
      { k: 'bagRollerBandage', qty: '10' },
      { k: 'bagMicroporeTape', qty: '2' },
      { k: 'bagAdhesiveBandages', qty: '200' },
      { k: 'bagTraumaShears', qty: '1' },
      { k: 'bagSterileGauzePad', qty: '20' },
      { k: 'bagRigidSplint', qty: '1' },
      { k: 'bagSaviorDisinfectant', qty: '2' },
      { k: 'bagPocketResuscitationMask', qty: '1' },
      { k: 'bagBurnDressingBurnshield', qty: '3' },
      { k: 'bagHypothermiaBlanket', qty: '2' },
      { k: 'bagDisposableGlovesPairs', qty: '20' },
      { k: 'bagHeadlamp', qty: '1' },
      { k: 'bagElasticBandages', qty: '5' },
      { k: 'bagEpipenAutoInjectorForAllergy', qty: '1' },
    ],
  },
  {
    id: 'chovesh',
    title: 'bagTEmtBag',
    subtitle: 'bagTCertifiedEmt',
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
    iconColor: 'text-blue-700 dark:text-blue-400',
    items: [
      { k: 'bagBackpack', qty: '1' },
      { k: 'bagTriangularBandage', qty: '8' },
      { k: 'bagPersonalIsraeliDressing', qty: '4' },
      { k: 'bagMediumDressing', qty: '1' },
      { k: 'bagTourniquet', qty: '2' },
      { k: 'bagRollerBandage', qty: '10' },
      { k: 'bagMicroporeTape', qty: '3' },
      { k: 'bagAdhesiveBandages', qty: '200' },
      { k: 'bagTraumaShears2', qty: '1' },
      { k: 'bagGauzePad', qty: '20' },
      { k: 'bagRigidSplint', qty: '1' },
      { k: 'bagSkinDisinfectant', qty: '1' },
      { k: 'bagBurnDressing', qty: '3' },
      { k: 'bagAshermanChestSeal', qty: '1' },
      { k: 'bagHypothermiaBlanket', qty: '1' },
      { k: 'bagOpa', v: '3,4,5', qty: '1', qk: 'bagQtyEach' },
      { k: 'bagGloves', qty: '20' },
      { k: 'bagAdjustableCervicalCollar', qty: '1' },
      { k: 'bagBpCuffStethoscope', qty: '1', qk: 'bagQtyEach' },
      { k: 'bagPulseOximeter', qty: '1' },
      { k: 'bagIvSetNacl09', qty: '4' },
      { k: 'bagPocketMask', qty: '1' },
      { k: 'bagSuctionCatheter', qty: '2' },
      { k: 'bagSuctionUnit', qty: '1' },
      { k: 'bagHeadlamp', qty: '1' },
      { k: 'bagElasticBandages', qty: '5' },
      { k: 'bagGlucoseGel', qty: '1' },
      { k: 'bagAspirin300Mg', qty: '10' },
      { k: 'bagHemostaticDressing', qty: '5' },
      { k: 'bagThermometer', qty: '2' },
      { k: 'bagEpipenAutoInjector', qty: '1' },
    ],
  },
  {
    id: 'paramedic',
    title: 'bagTParamedicBag',
    subtitle: 'bagTCertifiedParamedic',
    color: 'text-emt-red',
    border: 'border-emt-red/30',
    bg: 'bg-emt-red/10',
    iconColor: 'text-emt-red',
    items: [
      { k: 'bagDefibrillator', qty: '1' },
      { k: 'bagTourniquet', qty: '2' },
      { k: 'bagIvSetNacl092', qty: '4' },
      { k: 'bagBagValveMaskMasksFilter', qty: '1' },
      { k: 'bagSuctionUnitCatheters', qty: '1' },
      { k: 'bagCompleteIntubationKitLma', qty: '1' },
      { k: 'bagIntraosseousGunBigChildAdult', qty: '2' },
      { k: 'bagAshermanChestSeal', qty: '1' },
      { k: 'bagVenflonNeedleForChestDecompression', qty: '2' },
      { k: 'bagBpCuffStethoscopePulseOximeter', qty: '1', qk: 'bagQtyEach' },
      { k: 'bagGlucometerTestStrips', qty: '1' },
      { k: 'bagAdjustableCollarRigidSplint', qty: '1', qk: 'bagQtyEach' },
      { k: 'bagPortableOxygenCylinderRegulatorMasks', qty: '1' },
      { k: 'bagAdrenaline1Mg', qty: '5' },
      { k: 'bagAtropine1Mg', qty: '4' },
      { k: 'bagProcorAmiodarone150Mg', qty: '2' },
      { k: 'bagDormicumMidazolam5Mg', qty: '5' },
      { k: 'bagConcentratedGlucoseDextrose50', qty: '1' },
      { k: 'bagIsoketSpray', qty: '1' },
      { k: 'bagAspirin300Mg2', qty: '10' },
      { k: 'bagVentolinAtrovent', qty: '1', qk: 'bagQtyEach' },
      { k: 'bagAcamolParacetamolOptalginDipyrone', qty: '20', qk: 'bagQtyEach' },
    ],
  },
  {
    id: 'doctor_camp',
    title: 'bagTCampDoctorBag',
    subtitle: 'bagTCampDoctor',
    color: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
    iconColor: 'text-purple-700 dark:text-purple-400',
    items: [
      { k: 'bagFullResuscitationAndTraumaKit', qty: '1' },
      { name: 'Lidocaine 2%', qty: '1' },
      { name: 'Diazapam (Assival) 1mg/5mg', qty: '2' },
      { name: 'Furosemide 40mg', qty: '4' },
      { name: 'Prednisone 20mg', qty: '8' },
      { name: 'Diclofenac (Voltaren) 25mg', qty: '20' },
      { name: 'Pramin 10mg', qty: '10' },
      { name: 'Amoxicillin 250mg', qty: '20' },
      { name: 'Cephalexin 250mg', qty: '6' },
      { name: 'Penicillin 250mg', qty: '20' },
      { name: 'Fenistil Drops', qty: '1' },
      { name: 'Synthomycine 5%', qty: '1' },
      { name: 'Zofran 4mg', qty: '20' },
    ],
  },
  {
    id: 'doctor_walk',
    title: 'bagTHikingDoctorBag',
    subtitle: 'bagTHikingDoctor',
    color: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    iconColor: 'text-amber-800 dark:text-amber-400',
    items: [
      { k: 'bagBasicTraumaKitAsFor', qty: '1', qk: 'bagQtySet' },
      { k: 'bagBagValveMaskMasks', qty: '1' },
      { k: 'bagIvSetNacl092', qty: '2' },
      { k: 'bagAdrenaline1Mg', qty: '3' },
      { k: 'bagAtropine1Mg', qty: '2' },
      { name: 'Diazepam (Assival) 10mg', qty: '2' },
      { name: 'Furosemide 40mg', qty: '2' },
      { name: 'Prednisone 20mg', qty: '4' },
      { name: 'Diclofenac (Voltaren) 25mg', qty: '10' },
      { name: 'Lidocaine 2%', qty: '1' },
      { name: 'Amoxicillin 250mg', qty: '10' },
      { name: 'Pramin 10mg', qty: '5' },
      { name: 'Zofran 4mg', qty: '10' },
      { k: 'bagAspirin300Mg2', qty: '5' },
      { k: 'bagSyringesNeedles', qty: '', qk: 'bagQtyAssorted' },
      { k: 'bagDisposableGlovesPairs2', qty: '10' },
      { k: 'bagGlucometerTestStrips', qty: '1' },
      { k: 'bagBpCuffStethoscope', qty: '1', qk: 'bagQtyEach' },
    ],
  },
];

// ── איחוד הצלה — מפרט ציוד מתכלה לכונן BLS (עודכן ספטמבר 2026) ────────────────
const HATZALAH_BLS_CATEGORIES: MDACategory[] = [
  {
    id: 'trauma',
    title: 'bagTDressingsTrauma',
    color: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    items: [
      { k: 'bagRubberTourniquet', qty: '2' },
      { k: 'bagCatTourniquet', qty: '1' },
      { k: 'bagAdhesiveBandages2', qty: '10' },
      { k: 'bagRollerBandage5Cm', qty: '5' },
      { k: 'bagSterileGauzePad1010', qty: '20' },
      { k: 'bagSterileGauzePad55', qty: '20' },
      { k: 'bagLeukoplastTape', qty: '1' },
      { k: 'bagElasticBandage', qty: '2' },
      { k: 'bagMediumDressing', qty: '1' },
      { k: 'bagPersonalIsraeliDressing', qty: '3' },
      { k: 'bagTacticalIsraeliBandage', qty: '1' },
      { k: 'bagAshermanChestSeal2', qty: '1' },
      { k: 'bagHemostaticDressing', qty: '1' },
      { k: 'bagTriangularBandageForImmobilization', qty: '4' },
      { k: 'bagTraumaShears3', qty: '1' },
      { k: 'bagRescueSpaceBlanket', qty: '1' },
      { k: 'bagPovidoneIodineSolution20Ml', qty: '1' },
    ],
  },
  {
    id: 'airway',
    title: 'bagTResuscitationVentilationOxygen',
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    items: [
      { k: 'bag9vBatteryForDefibrillator', qty: '1' },
      { k: 'bagDefibrillatorPadLifeLine', qty: '1' },
      { k: 'bagPadForG3Defibrillator', qty: '1' },
      { k: 'bagOxygenCylinderRegulator', qty: '1' },
      { k: 'bagManualSuction', qty: '1' },
      { k: 'bagBvmMask', v: '5', qty: '1' },
      { k: 'bagBvmMask', v: '2', qty: '1' },
      { k: 'bagBvmMask', v: '0', qty: '1' },
      { k: 'bagAdultBagValveMaskIncl', qty: '1' },
      { k: 'bagChildBagValveMaskIncl', qty: '1' },
      { k: 'bagAdultOxygenMask', qty: '2' },
      { k: 'bagChildOxygenMask', qty: '2' },
      { k: 'bagSuctionCatheterRed', qty: '2' },
      { k: 'bagSuctionCatheterBlue', qty: '2' },
      { k: 'bagOpa', v: '00', qty: '1' },
      { k: 'bagOpa', v: '0', qty: '1' },
      { k: 'bagOpa', v: '1', qty: '1' },
      { k: 'bagOpa', v: '2', qty: '1' },
      { k: 'bagOpa', v: '3', qty: '2' },
      { k: 'bagOpa', v: '4', qty: '1' },
      { k: 'bagAdultViralFilter', qty: '2' },
      { k: 'bagChildViralFilter', qty: '1' },
    ],
  },
  {
    id: 'meds',
    title: 'bagTIvGlucoseMedications',
    color: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
    items: [
      { k: 'bagIvStartKit', qty: '1' },
      { k: 'bagSaline05L', qty: '1' },
      { k: 'bagSharpsContainer05L', qty: '1' },
      { k: 'bagAdrenalineInjectionKit', qty: '1' },
      { k: 'bagGlucometerLancets', qty: '10' },
      { k: 'bagGlucometerStripsFreestyle', qty: '10' },
      { k: 'bagGlucometerStripsNewModelSure', qty: '10' },
      { k: 'bag3vGlucometerBattery', qty: '2' },
      { k: 'bagAlcoholSwab', qty: '10' },
      { k: 'bagGlucoseGel', qty: '2' },
      { k: 'bagAspirin', qty: '10' },
    ],
  },
  {
    id: 'immob',
    title: 'bagTImmobilizationChildbirth',
    color: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
    items: [
      { k: 'bagRigidImmobilizationSplint', qty: '1' },
      { k: 'bagAdjustableCervicalCollar', qty: '1' },
      { k: 'bagChildbirthKit', qty: '1' },
    ],
  },
  {
    id: 'general',
    title: 'bagTGeneralAccessories',
    color: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
    items: [
      { k: 'bagGlovesSize', v: 'S', qty: '100' },
      { k: 'bagGlovesSize', v: 'M', qty: '100' },
      { k: 'bagGlovesSize', v: 'L', qty: '100' },
      { k: 'bagGlovesSize', v: 'XL', qty: '100' },
      { k: 'bagHandSanitizerGel', qty: '1' },
      { k: 'bagN95RespiratorMask', qty: '3' },
      { k: 'bagSurgicalMask', qty: '10' },
      { k: 'bagDisinfectingWipe', qty: '5' },
      { k: 'bagAdultBpCuffInclStethoscope', qty: '1' },
      { k: 'bagStethoscope', qty: '1' },
      { k: 'bagAaaBatteryForPulseOximeter', qty: '2' },
      { k: 'bagRazor', qty: '1' },
      { k: 'bagFabricStretcher', qty: '1' },
      { k: 'bagMciTriageTagSetPack', qty: '1' },
      { k: 'bagPermanentMarker', qty: '1' },
      { k: 'bagOxygenRegulatorSealingWasher', qty: '1' },
      { k: 'bagRagarClip', qty: '1' },
    ],
  },
];

// ── איחוד הצלה — מפרט ציוד מתכלה לכונן ALS "רגיל" (עודכן ספטמבר 2026) ──────────
const HATZALAH_ALS_CATEGORIES: MDACategory[] = [
  {
    id: 'intubation',
    title: 'bagTAirwayIntubation',
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
    items: [
      { k: 'bagSamIoIntraosseousNeedle25', qty: '1' },
      { k: 'bagAdultEtTubeStylet14', qty: '2' },
      { k: 'bagChildEtTubeStylet10', qty: '1' },
      { k: 'bagEndotrachealIntroducerBougie', qty: '1' },
      { k: 'bagLaryngoscopeHandle', qty: '1' },
      { k: 'bagMacBlade', v: '1', qty: '1' },
      { k: 'bagMacBlade', v: '2', qty: '1' },
      { k: 'bagMacBlade', v: '3', qty: '1' },
      { k: 'bagMacBlade', v: '4', qty: '1' },
      { k: 'bagAdultMagillForceps', qty: '1' },
      { k: 'bagWhiteTieForSecuringThe', qty: '3' },
      { k: 'bagFaceMaskForIntubationWith', qty: '4' },
      { k: 'bagRigidSafetyGogglesForIntubation', qty: '1' },
      { k: 'bag20CcSyringeWithoutNeedle', qty: '2' },
      { k: 'bagEtTube', v: '3', qty: '1' },
      { k: 'bagEtTube', v: '3.5', qty: '1' },
      { k: 'bagEtTube', v: '4', qty: '1' },
      { k: 'bagEtTube', v: '4.5', qty: '1' },
      { k: 'bagEtTube', v: '5', qty: '1' },
      { k: 'bagEtTube', v: '5.5', qty: '1' },
      { k: 'bagEtTube', v: '6', qty: '1' },
      { k: 'bagEtTube', v: '6.5', qty: '1' },
      { k: 'bagEtTube', v: '7', qty: '2' },
      { k: 'bagEtTube', v: '7.5', qty: '2' },
      { k: 'bagEtTube', v: '8', qty: '2' },
      { k: 'bagLubricatingGel27G', qty: '5' },
      { k: 'bagMcGrathBlade', v: '2', qty: '1' },
      { k: 'bagMcGrathBlade', v: '3', qty: '1' },
      { k: 'bagMcGrathBlade', v: '4', qty: '1' },
      { k: 'bagMcGrathBlade', v: 'X3', qty: '1' },
    ],
  },
  {
    id: 'airway',
    title: 'bagTVentilationOxygenRespiratory',
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    items: [
      { k: 'bag9vBatteryForDefibrillator', qty: '1' },
      { k: 'bagDefibrillatorPadLifeLine', qty: '1' },
      { k: 'bagOxygenCylinderRegulator', qty: '1' },
      { k: 'bagManualSuction', qty: '1' },
      { k: 'bagBvmMask', v: '5', qty: '1' },
      { k: 'bagBvmMask', v: '2', qty: '1' },
      { k: 'bagBvmMask', v: '0', qty: '1' },
      { k: 'bagAdultBagValveMaskIncl', qty: '1' },
      { k: 'bagChildBagValveMaskIncl', qty: '1' },
      { k: 'bagAdultOxygenMask', qty: '2' },
      { k: 'bagChildOxygenMask', qty: '1' },
      { k: 'bagAdultNebulizerMask', qty: '2' },
      { k: 'bagChildNebulizerMask', qty: '2' },
      { k: 'bagSuctionCatheterRed', qty: '1' },
      { k: 'bagSuctionCatheterBlue', qty: '2' },
      { k: 'bagOpa', v: '00', qty: '1' },
      { k: 'bagOpa', v: '0', qty: '1' },
      { k: 'bagOpa', v: '1', qty: '1' },
      { k: 'bagOpa', v: '2', qty: '1' },
      { k: 'bagOpa', v: '3', qty: '2' },
      { k: 'bagOpa', v: '4', qty: '1' },
      { k: 'bagAdultViralFilter', qty: '2' },
      { k: 'bagChildViralFilter', qty: '1' },
      { k: 'bagNgTube', v: '16', qty: '1' },
      { k: 'bagNgTube', v: '18', qty: '1' },
    ],
  },
  {
    id: 'trauma',
    title: 'bagTDressingsTraumaChestDecompression',
    color: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    items: [
      { k: 'bagRubberTourniquet', qty: '1' },
      { k: 'bagCatTourniquet', qty: '1' },
      { k: 'bagAdhesiveBandages2', qty: '20' },
      { k: 'bagRollerBandage5Cm', qty: '5' },
      { k: 'bagSterileGauzePad1010', qty: '10' },
      { k: 'bagSterileGauzePad55', qty: '20' },
      { k: 'bagRescueSpaceBlanket', qty: '1' },
      { k: 'bagLeukoplastTape', qty: '1' },
      { k: 'bagElasticBandage', qty: '2' },
      { k: 'bagMediumDressing', qty: '1' },
      { k: 'bagPersonalIsraeliDressing', qty: '2' },
      { k: 'bagTriangularBandageForImmobilization', qty: '4' },
      { k: 'bagTraumaShears3', qty: '1' },
      { k: 'bagTacticalIsraeliBandage', qty: '1' },
      { k: 'bagAshermanChestSeal2', qty: '1' },
      { k: 'bagHemostaticDressing', qty: '1' },
      { k: 'bagPovidoneIodineSolution20Ml', qty: '1' },
      { k: 'bagNeedleDecompressionKit', qty: '1' },
      { k: 'bagTPakChestDecompressionNeedle', qty: '1' },
      { k: 'bagIvTubing', qty: '3' },
    ],
  },
  {
    id: 'iv',
    title: 'bagTIvInjectionGlucose',
    color: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
    items: [
      { k: 'bagIvStartKit', qty: '1' },
      { k: 'bagSaline05L', qty: '1' },
      { k: 'bagSharpsContainer05L', qty: '1' },
      { k: 'bagSterileNeedleG181Pink', qty: '6' },
      { k: 'bagSterileNeedleG211Green', qty: '6' },
      { k: 'bagNasalAtomizerConeForIntranasal', qty: '2' },
      { k: 'bagStopcock3WayTapWith', qty: '2' },
      { k: 'bag1MlSyringe', qty: '3' },
      { k: 'bag10CcSyringeWithoutNeedle', qty: '6' },
      { k: 'bag253CcSyringe', qty: '6' },
      { k: 'bag5CcSyringeWithoutNeedle', qty: '6' },
      { k: 'bag6050CcCatheterTip', qty: '1' },
      { k: 'bagBlueIvCannulaG22', qty: '2' },
      { k: 'bagGreenIvCannulaG18', qty: '2' },
      { k: 'bagPinkIvCannulaG20', qty: '2' },
      { k: 'bagYellowIvCannulaG24', qty: '1' },
      { k: 'bagPediatricIntraosseousGunBig', qty: '1' },
      { k: 'bagAdultIntraosseousGunBig', qty: '1' },
      { k: 'bagGlucometerLancets', qty: '10' },
      { k: 'bagGlucometerStripsFreestyle', qty: '10' },
      { k: 'bagGlucometerStripsNewModelSure', qty: '10' },
      { k: 'bag3vGlucometerBattery', qty: '2' },
      { k: 'bagAlcoholSwab', qty: '5' },
    ],
  },
  {
    id: 'meds',
    title: 'bagTMedicationsAmpoules',
    color: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
    items: [
      { k: 'bagGlucoseGel', qty: '1' },
      { k: 'bagAspirin', qty: '10' },
      { k: 'bagSaline100CcNacl0', qty: '2' },
      { k: 'bagSaline0910Ml', qty: '6' },
      { k: 'bagAtrovent025Mg1', qty: '1' },
      { k: 'bagVentolinSolution20Ml', qty: '1' },
      { k: 'bagIsoketSprayNitrolingual', qty: '1' },
      { k: 'bagAdrenalineAmp1Mg1', qty: '10' },
      { k: 'bagAtropine1Mg1Ml', qty: '3' },
      { k: 'bagProcorAmiodaroneAmp', qty: '2' },
      { k: 'bagMagnesiumSulfate5G', qty: '1' },
      { k: 'bagHeparinFragmin5000Iu', qty: '1' },
      { k: 'bagAdenosine6Mg2Ml', qty: '5' },
      { k: 'bagLidocaine2Esracaine', qty: '2' },
      { k: 'bagFusidFurosemide20Mg2', qty: '10' },
      { k: 'bagDormicumMidazolam5Mg2', qty: '5' },
      { k: 'bagSoluMedrol125Mg2', qty: '2' },
      { k: 'bagNarcanNaloxone04Mg', qty: '5' },
      { k: 'bagGlucose50Dextrose', qty: '3' },
      { k: 'bagAcamolDexamolTablets', qty: '10' },
      { k: 'bagIvParacetamolAcamol', qty: '1' },
      { k: 'bagPramin10Mg2Ml', qty: '2' },
      { k: 'bagOptalginAmp', qty: '2' },
      { k: 'bagTramadolTramal100Mg2', qty: '1' },
      { k: 'bagEtomidateLipuro20Mg10', qty: '2' },
    ],
  },
  {
    id: 'monitor',
    title: 'bagTMonitorCorpuls',
    color: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
    items: [
      { k: 'bagEcgElectrodesF50PackOf', qty: '1' },
      { k: 'bagCorpulsPrinterPaper', qty: '1' },
      { k: 'bagCapnographySpontaneousBreathingNasalCorpuls', qty: '1' },
      { k: 'bagCapnographyVentilatedCorpuls', qty: '1' },
      { k: 'bagColorimetricCapnometerFilter', qty: '1' },
      { k: 'bagThermometerProbeCoversCorpulsPack', qty: '1' },
      { k: 'bagAdultDefibrillationPadCorpuls', qty: '1' },
      { k: 'bagInfantChildDefibrillationPadCorpuls', qty: '1' },
    ],
  },
  {
    id: 'general',
    title: 'bagTImmobilizationChildbirthGeneral',
    color: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
    items: [
      { k: 'bagRigidImmobilizationSplint', qty: '1' },
      { k: 'bagAdjustableCervicalCollar', qty: '1' },
      { k: 'bagChildbirthKit', qty: '1' },
      { k: 'bagUrineBag', qty: '1' },
      { k: 'bagGlovesSize', v: 'S', qty: '100' },
      { k: 'bagGlovesSize', v: 'M', qty: '30' },
      { k: 'bagGlovesSize', v: 'L', qty: '30' },
      { k: 'bagGlovesSize', v: 'XL', qty: '30' },
      { k: 'bagHandSanitizerGel', qty: '1' },
      { k: 'bagN95RespiratorMask', qty: '3' },
      { k: 'bagSurgicalMask', qty: '10' },
      { k: 'bagDisinfectingWipe', qty: '5' },
      { k: 'bagAdultBpCuffInclStethoscope', qty: '1' },
      { k: 'bagStethoscope', qty: '1' },
      { k: 'bagAaaBatteryForPulseOximeter', qty: '2' },
      { k: 'bagFabricStretcher', qty: '1' },
      { k: 'bagMciTriageTagSetPack', qty: '1' },
      { k: 'bagPermanentMarker', qty: '1' },
      { k: 'bagOxygenRegulatorSealingWasher', qty: '1' },
      { k: 'bagRagarClip', qty: '1' },
      { k: 'bagOrangeBandolierGrabUnit', qty: '1' },
    ],
  },
];

const MDA_CATEGORIES: MDACategory[] = [
  {
    id: 'meds',
    title: 'bagTMedicationsFluids',
    color: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
    items: [
      { k: 'bagAspirin300Mg2', qty: '10' },
      { k: 'bagGlucoseGel', qty: '1' },
      { k: 'bagPovidoneIodine20Ml', qty: '1' },
      { k: 'bagSaline09', qty: '1' },
    ],
  },
  {
    id: 'airway',
    title: 'bagTVentilationOxygenEquipment',
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    items: [
      { k: 'bagAdultResuscitationBagAmbu', qty: '1' },
      { k: 'bagChildResuscitationBagAmbu', qty: '1' },
      { k: 'bagAdultOxygenMaskM', qty: '1' },
      { k: 'bagAdultOxygenMaskS', qty: '1' },
      { k: 'bagChildOxygenMask', qty: '1' },
      { k: 'bagToddlerOxygenMask', qty: '1' },
      { k: 'bagInfantOxygenMask', qty: '1' },
      { k: 'bagOpaPlastic', v: '00', qty: '1' },
      { k: 'bagOpaPlastic', v: '0', qty: '1' },
      { k: 'bagOpaPlastic', v: '1', qty: '1' },
      { k: 'bagOpaPlastic', v: '2', qty: '1' },
      { k: 'bagOpaPlastic', v: '3', qty: '1' },
      { k: 'bagOpaPlastic', v: '4', qty: '1' },
      { k: 'bagManualSuction', qty: '1' },
      { k: 'bagSuctionCatheterSize', v: '18', qty: '1' },
      { k: 'bagSuctionCatheterSize', v: '8', qty: '1' },
      { k: 'bagDOxygenCylinderRegulator', qty: '1' },
    ],
  },
  {
    id: 'diagnostics',
    title: 'bagTDiagnosticsMeasurement',
    color: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
    items: [
      { k: 'bagBpCuffStethoscopeAdult', qty: '1' },
      { k: 'bagBpCuffStethoscopeChild', qty: '1' },
      { k: 'bagGlucometer5Lancets5Strips', qty: '1' },
    ],
  },
  {
    id: 'trauma',
    title: 'bagTDressingsTrauma',
    color: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    items: [
      { k: 'bagRubberTourniquet2', qty: '3' },
      { k: 'bagPersonalIsraeliDressing', qty: '1' },
      { k: 'bagMediumDressing', qty: '1' },
      { k: 'bagSterileGauzePad3x3', qty: '10' },
      { k: 'bagScissors', qty: '1' },
      { k: 'bagElasticBandages', qty: '5' },
      { k: 'bagAdultCervicalCollar', qty: '1' },
      { k: 'bagChildCervicalCollar', qty: '1' },
      { k: 'bagPersonalProtectiveKitPpe', qty: '1' },
      { k: 'bagAluminumBlanket', qty: '1' },
    ],
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Label in the current (or given) language. The Hebrew label is also the saved key for the MOH bags. */
function itemLabel(item: BagItem, lang?: 'he' | 'en'): string {
  return item.k ? translate(item.k, item.v !== undefined ? { n: item.v } : undefined, lang) : item.name ?? '';
}

function daysUntilExpiry(dateStr: string): number {
  const expiry = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatExpiryLabel(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-');
  const dateFormatted = `${day}/${month}/${year}`;
  if (days < 0) return translate('bagExpired', { date: dateFormatted });
  if (days === 0) return translate('bagExpiresToday', { date: dateFormatted });
  if (days === 1) return translate('bagExpiresTomorrow', { date: dateFormatted });
  if (days <= 7) return translate('bagExpiresInDays', { days, date: dateFormatted });
  return translate('bagValidUntil', { date: dateFormatted });
}

function loadInventory(key: string): BagInventory {
  const stored = localStorage.getItem(key);
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    const vals = Object.values(parsed);
    if (vals.length > 0 && typeof vals[0] === 'boolean') {
      const migrated: BagInventory = {};
      for (const [k, v] of Object.entries(parsed)) {
        migrated[k] = { status: v ? 'have' : null };
      }
      return migrated;
    }
    return parsed as BagInventory;
  } catch {
    return {};
  }
}

function saveInventory(key: string, inv: BagInventory) {
  localStorage.setItem(key, JSON.stringify(inv));
}

function cycleStatus(current: 'have' | 'missing' | null): 'have' | 'missing' | null {
  if (current === null) return 'have';
  if (current === 'have') return 'missing';
  return null;
}

function clearStatusOnly(inv: BagInventory): BagInventory {
  const cleared: BagInventory = {};
  for (const [k, v] of Object.entries(inv)) {
    cleared[k] = { status: null, expiryDate: v.expiryDate };
  }
  return cleared;
}

function checkExpiryNotifications() {
  if (!('Notification' in window)) return;
  const today = new Date().toDateString();
  if (localStorage.getItem('bag-expiry-notif-date') === today) return;
  localStorage.setItem('bag-expiry-notif-date', today);

  const keys = [
    'mda-kit-checklist',
    'hatzalah-bls-kit-checklist',
    'hatzalah-als-kit-checklist',
    ...BAGS.map(b => `bag-checklist-${b.id}`),
  ];

  let expired = 0, soon = 0;
  for (const key of keys) {
    for (const { expiryDate } of Object.values(loadInventory(key))) {
      if (!expiryDate) continue;
      const d = daysUntilExpiry(expiryDate);
      if (d < 0) expired++;
      else if (d <= 7) soon++;
    }
  }

  if (expired + soon === 0) return;

  const doNotify = () => {
    const parts: string[] = [];
    if (expired > 0) parts.push(translate('bagNotifExpired', { n: expired }));
    if (soon > 0) parts.push(translate('bagNotifSoon', { n: soon }));
    new Notification(translate('bagNotifTitle'), { body: parts.join(', ') + '.' });
  };

  if (Notification.permission === 'granted') doNotify();
  else if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => { if (p === 'granted') doNotify(); });
  }
}

// ─── ItemRow ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: BagItem;
  itemKey: string;
  status: ItemStatus;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  onToggle: () => void;
  onExpiryChange: (date: string | undefined) => void;
}

function ItemRow({ item, status, accentColor, accentBg, accentBorder, onToggle, onExpiryChange }: ItemRowProps) {
  const t = useTranslation();
  const [showDate, setShowDate] = useState(false);
  const days = status.expiryDate != null ? daysUntilExpiry(status.expiryDate) : null;
  const isExpired = days !== null && days < 0;
  const isSoon = days !== null && days >= 0 && days <= 7;
  const hasWarning = isExpired || isSoon;

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          status.status === 'have' ? 'bg-emerald-500/10 dark:bg-emerald-950/20' :
          status.status === 'missing' ? 'bg-red-500/10 dark:bg-red-950/20' : ''
        }`}
      >
        {/* Status icon — tap to cycle null → have → missing → null */}
        <button onClick={onToggle} className="shrink-0 active:scale-90 transition-transform flex flex-col items-center gap-0.5">
          {status.status === 'have'
            ? <CheckCircle2 size={22} className="text-emerald-700 dark:text-emerald-400" />
            : status.status === 'missing'
            ? <XCircle size={22} className="text-red-700 dark:text-red-400" />
            : <Circle size={22} className="text-fg-subtle" />}
        </button>

        <span className={`flex-1 text-sm font-medium ${
          status.status === 'missing' ? 'text-red-700 dark:text-red-400' :
          status.status === 'have' ? 'text-emerald-700 dark:text-emerald-400' :
          'text-fg'
        }`}>
          {item.k ? t(item.k, item.v !== undefined ? { n: item.v } : undefined) : item.name}
        </span>

        {hasWarning && (
          <AlertTriangle size={15} className={`shrink-0 ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`} />
        )}

        <button
          onClick={() => setShowDate(v => !v)}
          className={`shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg active:scale-90 transition-all ${
            status.expiryDate
              ? isExpired ? 'text-red-700 dark:text-red-400' : isSoon ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
              : 'text-fg-muted bg-surface-2'
          }`}
          aria-label={t('bagExpiryDate')}
        >
          <Calendar size={14} />
          {!status.expiryDate && <span className="text-[8px] font-medium leading-none">{t('bagExpiry')}</span>}
        </button>

        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${accentBg} ${accentColor} border ${accentBorder}`}>
          {item.qk ? t(item.qk, { n: item.qty }) : item.qty}
        </span>
      </div>

      {/* Expiry label (collapsed) */}
      {status.expiryDate && !showDate && (
        <p
          className={`px-14 pb-2 text-xs font-medium ${
            isExpired ? 'text-red-700 dark:text-red-400' : isSoon ? 'text-amber-800 dark:text-amber-400' : 'text-fg-muted'
          }`}
        >
          {formatExpiryLabel(status.expiryDate, days!)}
        </p>
      )}

      {/* Date picker (expanded) */}
      {showDate && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <input
            type="date"
            value={status.expiryDate ?? ''}
            onChange={e => {
              const val = e.target.value || undefined;
              onExpiryChange(val);
              if (val && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
              }
            }}
            className="flex-1 bg-surface-2 border border-line rounded-xl px-3 py-2 text-sm text-fg"
          />
          {status.expiryDate && (
            <button
              onClick={() => onExpiryChange(undefined)}
              className="text-red-700 dark:text-red-400 text-xs px-2 py-2 rounded-xl bg-red-500/10 dark:bg-red-950/20 shrink-0"
            >
              {t('delete')}
            </button>
          )}
          <button
            onClick={() => setShowDate(false)}
            className="text-fg-muted text-xs px-2 py-2 rounded-xl bg-surface-3 shrink-0"
          >
            {t('close')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const t = useTranslation();
  return (
    <div className="shrink-0 px-4 py-2 border-b border-line/60 flex flex-col gap-1.5 text-xs text-fg-muted">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-fg/70">{t('bagLegendTap')}</span>
        <span className="flex items-center gap-1"><Circle size={11} /> {t('bagNotMarked')}</span>
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={11} /> {t('bagHave')}</span>
        <span className="flex items-center gap-1 text-red-700 dark:text-red-400"><XCircle size={11} /> {t('bagMissing')}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Calendar size={11} className="text-blue-700 dark:text-blue-400 shrink-0" />
        <span>{t('bagLegendExpiry')}</span>
      </div>
    </div>
  );
}

// ─── Helper: count expiry warnings in an inventory ────────────────────────────

function countWarnings(inv: BagInventory): { expired: number; soon: number } {
  let expired = 0, soon = 0;
  for (const { expiryDate } of Object.values(inv)) {
    if (!expiryDate) continue;
    const d = daysUntilExpiry(expiryDate);
    if (d < 0) expired++;
    else if (d <= 7) soon++;
  }
  return { expired, soon };
}

// ─── Main component ───────────────────────────────────────────────────────────

type Standard = 'moh' | 'mda' | 'hatzalah';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BagStandardsModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [mohInventory, setMohInventory] = useState<BagInventory>({});
  const [mdaInventory, setMdaInventory] = useState<BagInventory>({});
  const [hatzBlsInventory, setHatzBlsInventory] = useState<BagInventory>({});
  const [hatzAlsInventory, setHatzAlsInventory] = useState<BagInventory>({});
  const [hatzVariant, setHatzVariant] = useState<'bls' | 'als'>('bls');
  const [activeStandard, setActiveStandard] = useState<Standard>('moh');

  const hatzKey = hatzVariant === 'bls' ? 'hatzalah-bls-kit-checklist' : 'hatzalah-als-kit-checklist';
  const hatzInventory = hatzVariant === 'bls' ? hatzBlsInventory : hatzAlsInventory;
  const setHatzInventory = hatzVariant === 'bls' ? setHatzBlsInventory : setHatzAlsInventory;
  const hatzCategories = hatzVariant === 'bls' ? HATZALAH_BLS_CATEGORIES : HATZALAH_ALS_CATEGORIES;

  // Check expiry notifications once on mount
  useEffect(() => { checkExpiryNotifications(); }, []);

  // Load MOH bag inventory when a bag is selected
  useEffect(() => {
    if (!selectedBag) return;
    setMohInventory(loadInventory(`bag-checklist-${selectedBag.id}`));
  }, [selectedBag]);

  // Load MDA & Hatzalah inventories on mount
  useEffect(() => {
    setMdaInventory(loadInventory('mda-kit-checklist'));
    setHatzBlsInventory(loadInventory('hatzalah-bls-kit-checklist'));
    setHatzAlsInventory(loadInventory('hatzalah-als-kit-checklist'));
  }, []);

  // ── MOH bag handlers ───────────────────────────────────────────────────────

  const toggleMohItem = (key: string) => {
    setMohInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, status: cycleStatus(cur.status) } };
      saveInventory(`bag-checklist-${selectedBag!.id}`, next);
      return next;
    });
  };

  const setMohExpiry = (key: string, date: string | undefined) => {
    setMohInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, expiryDate: date } };
      saveInventory(`bag-checklist-${selectedBag!.id}`, next);
      return next;
    });
  };

  const clearMohChecklist = () => {
    const cleared = clearStatusOnly(mohInventory);
    saveInventory(`bag-checklist-${selectedBag!.id}`, cleared);
    setMohInventory(cleared);
  };

  // ── MDA handlers ───────────────────────────────────────────────────────────

  const toggleMdaItem = (key: string) => {
    setMdaInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, status: cycleStatus(cur.status) } };
      saveInventory('mda-kit-checklist', next);
      return next;
    });
  };

  const setMdaExpiry = (key: string, date: string | undefined) => {
    setMdaInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, expiryDate: date } };
      saveInventory('mda-kit-checklist', next);
      return next;
    });
  };

  const clearMdaChecklist = () => {
    const cleared = clearStatusOnly(mdaInventory);
    saveInventory('mda-kit-checklist', cleared);
    setMdaInventory(cleared);
  };

  // ── Hatzalah handlers (operate on the active BLS/ALS variant) ───────────────

  const toggleHatzalahItem = (key: string) => {
    setHatzInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, status: cycleStatus(cur.status) } };
      saveInventory(hatzKey, next);
      return next;
    });
  };

  const setHatzalahExpiry = (key: string, date: string | undefined) => {
    setHatzInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, expiryDate: date } };
      saveInventory(hatzKey, next);
      return next;
    });
  };

  const clearHatzalahChecklist = () => {
    const cleared = clearStatusOnly(hatzInventory);
    saveInventory(hatzKey, cleared);
    setHatzInventory(cleared);
  };

  useModalBackHandler(isOpen, selectedBag ? () => setSelectedBag(null) : onClose);

  if (!isOpen) return null;

  // ── Selected bag detail view ───────────────────────────────────────────────

  if (selectedBag) {
    const haveCount = selectedBag.items.filter(item => mohInventory[itemLabel(item, 'he')]?.status === 'have').length;
    const missingCount = selectedBag.items.filter(item => mohInventory[itemLabel(item, 'he')]?.status === 'missing').length;

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-page">
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-surface-2 border border-line
                       flex items-center justify-center active:scale-90 transition-transform
                       text-fg-muted hover:text-fg"
            aria-label={t('back')}
          >
            <ChevronRight size={20} className="ltr:rotate-180" />
          </button>
          <h2 className="text-fg font-bold text-xl">{t(selectedBag.title)}</h2>
          <button
            onClick={clearMohChecklist}
            className="flex items-center gap-1 text-red-700 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 text-sm transition-colors active:scale-90"
            aria-label={t('clearMarkings')}
          >
            <RotateCcw size={15} />
            <span>{t('clearMarkings')}</span>
          </button>
        </div>

        {/* Status summary */}
        <div className="shrink-0 px-4 py-2 border-b border-line flex items-center gap-3">
          <span className="text-sm text-fg-muted">{selectedBag.items.length} {t('items')}</span>
          {haveCount > 0 && (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> {haveCount} {t('bagHave')}
            </span>
          )}
          {missingCount > 0 && (
            <span className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
              <XCircle size={12} /> {missingCount} {t('bagMissing')}
            </span>
          )}
        </div>

        {/* Legend */}
        <Legend />

        <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-line/60">
          {selectedBag.items.map((item) => {
            const key = itemLabel(item, 'he'); // saved under the Hebrew label, as before
            return (
              <ItemRow
                key={key}
                item={item}
                itemKey={key}
                status={mohInventory[key] ?? { status: null }}
                accentColor={selectedBag.color}
                accentBg={selectedBag.bg}
                accentBorder={selectedBag.border}
                onToggle={() => toggleMohItem(key)}
                onExpiryChange={(date) => setMohExpiry(key, date)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ── Standard selector tabs ─────────────────────────────────────────────────

  const STANDARDS: { id: Standard; label: TranslationKey }[] = [
    { id: 'moh', label: 'bagStdMoe' },
    { id: 'mda', label: 'bagStdMda' },
    { id: 'hatzalah', label: 'bagStdHatzalah' },
  ];

  // ── List view ──────────────────────────────────────────────────────────────

  const renderCategoryChecklist = (
    categories: MDACategory[],
    inventory: BagInventory,
    onToggle: (key: string) => void,
    onExpiry: (key: string, date: string | undefined) => void,
  ) => (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const haveCount = cat.items.filter((_, i) => inventory[`${cat.id}-${i}`]?.status === 'have').length;
        const catWarnings = cat.items.reduce((acc, _, i) => {
          const inv = inventory[`${cat.id}-${i}`];
          if (!inv?.expiryDate) return acc;
          const d = daysUntilExpiry(inv.expiryDate);
          if (d < 0) acc.expired++;
          else if (d <= 7) acc.soon++;
          return acc;
        }, { expired: 0, soon: 0 });

        return (
          <div key={cat.id} className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${cat.border} flex items-center justify-between`}>
              <p className={`font-bold text-sm ${cat.color}`}>{t(cat.title)}</p>
              <div className="flex items-center gap-2">
                {(catWarnings.expired > 0 || catWarnings.soon > 0) && (
                  <AlertTriangle size={14} className={catWarnings.expired > 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'} />
                )}
                <span className={`text-xs font-medium ${cat.color} opacity-70`}>
                  {haveCount}/{cat.items.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-fg/5">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`;
                return (
                  <ItemRow
                    key={i}
                    item={item}
                    itemKey={key}
                    status={inventory[key] ?? { status: null }}
                    accentColor={cat.color}
                    accentBg={cat.bg}
                    accentBorder={cat.border}
                    onToggle={() => onToggle(key)}
                    onExpiryChange={(date) => onExpiry(key, date)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('back')}
        >
          <ChevronRight size={20} className="ltr:rotate-180" />
        </button>
        <h2 className="text-fg font-bold text-xl">{t('bagStandardsTitle')}</h2>
        {activeStandard === 'mda' || activeStandard === 'hatzalah' ? (
          <button
            onClick={activeStandard === 'mda' ? clearMdaChecklist : clearHatzalahChecklist}
            className="flex items-center gap-1 text-red-700 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 text-sm transition-colors active:scale-90"
            aria-label={t('clearMarkings')}
          >
            <RotateCcw size={15} />
            <span>{t('clearMarkings')}</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-4 py-3 border-b border-line">
        <div className="flex rounded-2xl p-1 gap-1 bg-surface-2">
          {STANDARDS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setActiveStandard(id); trackEvent('bag_standards_tab', { standard: id }); }}
              className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95 leading-tight ${
                activeStandard === id
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted'
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend for MDA / Hatzalah */}
      {(activeStandard === 'mda' || activeStandard === 'hatzalah') && <Legend />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeStandard === 'moh' && (
          <div className="flex flex-col gap-3">
            {BAGS.map((bag) => {
              const bagInv = loadInventory(`bag-checklist-${bag.id}`);
              const { expired, soon } = countWarnings(bagInv);
              const hasAnyWarning = expired > 0 || soon > 0;

              return (
                <button
                  key={bag.id}
                  onClick={() => {
                    setSelectedBag(bag);
                    trackEvent('bag_standards_view', { bag_id: bag.id, bag_title: translate(bag.title, undefined, 'he') });
                    window.history.pushState({ bagDetail: true }, '');
                  }}
                  className={`w-full rounded-2xl border ${bag.border} ${bag.bg} p-5
                              flex items-center gap-4 active:scale-[0.98] transition-transform`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bag.bg} border ${bag.border}`}>
                    <Backpack size={24} className={bag.iconColor} />
                  </div>
                  <div className="flex-1 text-start">
                    <p className={`text-lg font-bold ${bag.color}`}>{t(bag.title)}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{bag.items.length} {t('items')}</p>
                  </div>
                  {hasAnyWarning && (
                    <AlertTriangle size={18} className={expired > 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeStandard === 'mda' && renderCategoryChecklist(
          MDA_CATEGORIES, mdaInventory, toggleMdaItem, setMdaExpiry,
        )}

        {activeStandard === 'hatzalah' && (
          <>
            <div className="flex rounded-2xl p-1 gap-1 mb-4 bg-surface-2">
              {([
                { id: 'bls', label: 'bagHatzBls' },
                { id: 'als', label: 'bagHatzAls' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setHatzVariant(id); trackEvent('bag_standards_hatzalah_variant', { variant: id }); }}
                  className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                    hatzVariant === id
                      ? 'bg-surface text-fg shadow-sm'
                      : 'text-fg-muted'
                  }`}
                >
                  {t(label)}
                </button>
              ))}
            </div>
            {renderCategoryChecklist(hatzCategories, hatzInventory, toggleHatzalahItem, setHatzalahExpiry)}
          </>
        )}
      </div>
    </div>
  );
}
