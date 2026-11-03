import React from 'react';
import { Sparkles, User, Users, HeartHandshake, Baby } from 'lucide-react';
import { SimulationInput } from '../types/pension';

interface PresetBarProps {
  onSelectPreset: (preset: Partial<SimulationInput>, label: string) => void;
  activePresetLabel: string;
}

interface PresetOption {
  id: string;
  label: string;
  description: string;
  badge: string;
  data: Partial<SimulationInput>;
}

export const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'elderly_single',
    label: '독거 어르신 (무연금)',
    description: '만 68세, 단독가구, 무연금, 대도시 전세 8,000만원',
    badge: '기초연금 전액',
    data: {
      region: 'large',
      facilityLiving: false,
      applicantAge: 68,
      applicantDisability: 'none',
      applicantOccupationalPension: 'none',
      applicantWelfareStatus: 'general',
      hasSpouse: false,
      spouseAge: 0,
      applicantNationalPension: 0,
      applicantNationalPensionA: 0,
      applicantEarnedIncome: 0,
      businessIncome: 0,
      interestIncome: 0,
      realEstateValue: 0,
      rentalDeposit: 80_000_000,
      financialAssets: 15_000_000,
      financialDebt: 0,
      luxuryCarValue: 0,
    },
  },
  {
    id: 'elderly_couple',
    label: '부부 어르신 (국민연금)',
    description: '만 70세/68세 부부, 중소도시 자가 1.5억, 국민연금 55만원',
    badge: '기초연금 부부수급',
    data: {
      region: 'medium',
      facilityLiving: false,
      applicantAge: 70,
      applicantDisability: 'none',
      applicantOccupationalPension: 'none',
      applicantWelfareStatus: 'general',
      hasSpouse: true,
      spouseAge: 68,
      spouseDisability: 'none',
      spouseOccupationalPension: 'none',
      applicantNationalPension: 550_000,
      applicantNationalPensionA: 180_000,
      spouseNationalPension: 0,
      spouseNationalPensionA: 0,
      applicantEarnedIncome: 0,
      spouseEarnedIncome: 0,
      businessIncome: 0,
      interestIncome: 0,
      realEstateValue: 150_000_000,
      rentalDeposit: 0,
      financialAssets: 25_000_000,
      financialDebt: 20_000_000,
      luxuryCarValue: 0,
    },
  },
  {
    id: 'disabled_adult_severe',
    label: '중증장애인 (65세 미만, 차상위)',
    description: '만 45세, 중증장애, 근로소득 140만원(기본공제 95만원 적용)',
    badge: '장애인연금 기초+부가',
    data: {
      region: 'large',
      facilityLiving: false,
      applicantAge: 45,
      applicantDisability: 'severe',
      applicantOccupationalPension: 'none',
      applicantWelfareStatus: 'near_poverty',
      hasSpouse: false,
      applicantNationalPension: 0,
      applicantEarnedIncome: 1_400_000,
      businessIncome: 0,
      interestIncome: 0,
      realEstateValue: 0,
      rentalDeposit: 50_000_000,
      financialAssets: 10_000_000,
      financialDebt: 0,
      hasDisabledCarExemption: true,
    },
  },
  {
    id: 'disabled_senior_basic',
    label: '중증장애 어르신 (기초수급자)',
    description: '만 72세, 독거, 생계·의료급여 수급 (기초연금+부가급여 439,700원)',
    badge: '동시 중복수혜',
    data: {
      region: 'large',
      facilityLiving: false,
      applicantAge: 72,
      applicantDisability: 'severe',
      applicantOccupationalPension: 'none',
      applicantWelfareStatus: 'basic_livelihood_living_medical',
      hasSpouse: false,
      applicantNationalPension: 0,
      applicantEarnedIncome: 0,
      businessIncome: 0,
      realEstateValue: 0,
      rentalDeposit: 30_000_000,
      financialAssets: 5_000_000,
      financialDebt: 0,
      hasDisabledCarExemption: true,
    },
  },
  {
    id: 'disabled_mild_adult',
    label: '경증 장애인 (장애수당)',
    description: '만 52세, 경증장애, 주거급여 수급자, 월 6만원 지원',
    badge: '경증 장애수당',
    data: {
      region: 'medium',
      facilityLiving: false,
      applicantAge: 52,
      applicantDisability: 'mild',
      applicantOccupationalPension: 'none',
      applicantWelfareStatus: 'basic_livelihood_housing_education',
      hasSpouse: false,
      applicantNationalPension: 0,
      applicantEarnedIncome: 800_000,
      realEstateValue: 0,
      rentalDeposit: 40_000_000,
      financialAssets: 5_000_000,
      financialDebt: 0,
    },
  },
  {
    id: 'disabled_child_severe',
    label: '중증 장애아동 (기초수급)',
    description: '만 12세, 등록 중증장애아동, 생계급여 수급가구, 월 22만원',
    badge: '장애아동수당',
    data: {
      region: 'large',
      facilityLiving: false,
      applicantAge: 12,
      applicantDisability: 'severe',
      applicantOccupationalPension: 'none',
      applicantWelfareStatus: 'basic_livelihood_living_medical',
      hasSpouse: false,
      applicantEarnedIncome: 0,
      realEstateValue: 0,
      rentalDeposit: 30_000_000,
      financialAssets: 5_000_000,
      financialDebt: 0,
    },
  },
];

export const PresetBar: React.FC<PresetBarProps> = ({
  onSelectPreset,
  activePresetLabel,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>지침 대표 시나리오 빠른 적용:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {PRESET_OPTIONS.map((preset) => {
            const isActive = activePresetLabel === preset.label;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.data, preset.label)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap border shrink-0 ${
                  isActive
                    ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title={preset.description}
              >
                <span>{preset.label}</span>
                <span className="text-[10px] text-slate-400">·</span>
                <span
                  className={`text-[11px] ${
                    isActive ? 'text-blue-600 font-medium' : 'text-slate-500'
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
