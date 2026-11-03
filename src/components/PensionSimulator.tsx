import React, { useState } from 'react';
import {
  SimulationInput,
  RegionType,
  DisabilityDegree,
  OccupationalPensionType,
  WelfareStatus,
  REGION_CONFIGS,
  BASIC_PENSION_2026,
  DISABILITY_PENSION_2026,
} from '../types/pension';
import {
  User,
  Users,
  Building2,
  DollarSign,
  Car,
  Home,
  Briefcase,
  HelpCircle,
  Coins,
  ShieldAlert,
} from 'lucide-react';

interface PensionSimulatorProps {
  input: SimulationInput;
  onChange: (field: keyof SimulationInput, value: any) => void;
  calculatorFocus: 'all' | 'basic' | 'disability';
  setCalculatorFocus: (focus: 'all' | 'basic' | 'disability') => void;
}

// 금액을 한글 문자열로 예쁘게 변환하는 헬퍼 함수
function formatKoreanCurrency(amount: number): string {
  if (amount <= 0) return '0원';
  const eok = Math.floor(amount / 100_000_000);
  const man = Math.floor((amount % 100_000_000) / 10_000);
  const won = amount % 10_000;

  let result = '';
  if (eok > 0) result += `${eok}억 `;
  if (man > 0) result += `${man.toLocaleString()}만 `;
  if (won > 0 && eok === 0 && man === 0) result += `${won.toLocaleString()}원`;
  else if (result !== '') result += '원';
  return result.trim();
}

export const PensionSimulator: React.FC<PensionSimulatorProps> = ({
  input,
  onChange,
  calculatorFocus,
  setCalculatorFocus,
}) => {
  const [activeSection, setActiveSection] = useState<'person' | 'income' | 'property'>('person');

  // 국민연금 A급여액 추정 버튼 (통상 전체 연금액의 약 50%~60% 수준)
  const handleEstimateA = () => {
    if (input.applicantNationalPension > 0) {
      const estimatedA = Math.round(input.applicantNationalPension * 0.55);
      onChange('applicantNationalPensionA', estimatedA);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 계산기 집중 모드 탭 */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => setCalculatorFocus('all')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
            calculatorFocus === 'all'
              ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          통합 진단 (기초연금 + 장애인연금 일괄)
        </button>
        <button
          type="button"
          onClick={() => setCalculatorFocus('basic')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
            calculatorFocus === 'basic'
              ? 'bg-white text-blue-700 font-bold shadow-xs border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          기초연금 모의계산 (만 65세 이상)
        </button>
        <button
          type="button"
          onClick={() => setCalculatorFocus('disability')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-center cursor-pointer ${
            calculatorFocus === 'disability'
              ? 'bg-white text-emerald-700 font-bold shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          장애인연금 · 장애수당 모의계산
        </button>
      </div>

      {/* 내부 단계 네비게이션 */}
      <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveSection('person')}
          className={`pb-3 cursor-pointer transition-colors flex items-center gap-2 ${
            activeSection === 'person'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. 가구 및 인적사항</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('income')}
          className={`pb-3 cursor-pointer transition-colors flex items-center gap-2 ${
            activeSection === 'income'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>2. 월 소득 정보</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('property')}
          className={`pb-3 cursor-pointer transition-colors flex items-center gap-2 ${
            activeSection === 'property'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>3. 재산 및 부채 정보</span>
        </button>
      </div>

      <div className="p-6">
        {/* SECTION 1: 가구 및 인적사항 */}
        {activeSection === 'person' && (
          <div className="space-y-6">
            {/* 거주지역 및 시설 여부 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>주소지 거주지역 (2026 기본재산액 공제 기준)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['large', 'medium', 'rural'] as RegionType[]).map((r) => {
                  const cfg = REGION_CONFIGS[r];
                  const isSelected = input.region === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChange('region', r)}
                      className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-xs'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{cfg.name}</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-0.5 tabular-nums">
                        기본공제: {(cfg.basicDeduction / 10_000_000).toFixed(1)}억원 ({cfg.basicDeduction.toLocaleString()}원)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {cfg.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={input.facilityLiving}
                    onChange={(e) => onChange('facilityLiving', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>사회복지시설(보장시설) 입소자</span>
                </label>
                <span className="text-[11px] text-slate-500">(보장시설 입소 시 장애인연금/장애수당 부가급여 단가 변경)</span>
              </div>
            </div>

            {/* 본인(신청인) 정보 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>신청인(본인) 인적사항</span>
                </span>
                <span className="text-xs text-slate-500">기초연금은 만 65세 이상, 장애인연금은 만 18세 이상 중증 대상</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 연령 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    신청인 연령 (만 나이)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={input.applicantAge || ''}
                      onChange={(e) => onChange('applicantAge', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="예: 68"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">세</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {input.applicantAge >= 65
                      ? '만 65세 이상 (기초연금 수급연령 도래)'
                      : input.applicantAge >= 18
                      ? '만 18~64세 (장애인연금 수급연령)'
                      : '만 18세 미만 (장애아동수당 대상)'}
                  </p>
                </div>

                {/* 장애 여부 및 정도 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    장애 등록 여부 및 정도
                  </label>
                  <select
                    value={input.applicantDisability}
                    onChange={(e) => onChange('applicantDisability', e.target.value as DisabilityDegree)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="none">비장애 (장애 없음)</option>
                    <option value="severe">등록 중증장애인 (종전 1·2급, 3급 중복)</option>
                    <option value="mild">등록 경증장애인 (종전 3급단일~6급)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {input.applicantDisability === 'severe'
                      ? '장애인연금 수급 자격 해당'
                      : input.applicantDisability === 'mild'
                      ? '장애수당 대상 해당'
                      : '비장애인 (기초연금만 해당)'}
                  </p>
                </div>

                {/* 기초생활보장/차상위 자격 여부 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    국민기초생활 및 차상위 자격
                  </label>
                  <select
                    value={input.applicantWelfareStatus}
                    onChange={(e) => onChange('applicantWelfareStatus', e.target.value as WelfareStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="general">일반 (차상위 초과)</option>
                    <option value="basic_livelihood_living_medical">기초수급 (생계 또는 의료급여)</option>
                    <option value="basic_livelihood_housing_education">기초수급 (주거 또는 교육급여)</option>
                    <option value="near_poverty">차상위계층 (중위 50% 이하)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    장애인연금 부가급여 및 감액면제 기준에 반영
                  </p>
                </div>

                {/* 직역연금 수급 여부 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    직역연금(공무원·군인·사학 등) 수급 여부
                  </label>
                  <select
                    value={input.applicantOccupationalPension}
                    onChange={(e) => onChange('applicantOccupationalPension', e.target.value as OccupationalPensionType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="none">해당 없음 (비수급자)</option>
                    <option value="recipient">직역연금 수급권자 (지급 제외)</option>
                    <option value="exception_under_10y">예외: 재직 10년 미만 연계퇴직연금</option>
                    <option value="exception_lump_sum_5y">예외: 일시금 수령 후 5년 경과</option>
                    <option value="special_old_age">특례: 종전 기초노령/장애인연금 특례자</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {input.applicantOccupationalPension === 'recipient'
                      ? '기초·장애인연금 법률상 제외 대상'
                      : '신청 가능'}
                  </p>
                </div>
              </div>

              {/* 18~20세 학생 여부 (아동수당 연장) */}
              {input.applicantAge >= 18 && input.applicantAge <= 20 && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={input.applicantIsStudent18to20}
                      onChange={(e) => onChange('applicantIsStudent18to20', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span>초·중등교육법 제2조에 따른 학교(고등학교 등) 재학 중</span>
                  </label>
                  <span className="text-[11px] text-slate-500">(재학 시 20세까지 장애아동수당과 장애인연금 선택 수급 가능)</span>
                </div>
              )}
            </div>

            {/* 배우자 정보 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>배우자 정보 (부부가구 산정)</span>
                </span>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={input.hasSpouse}
                    onChange={(e) => onChange('hasSpouse', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>배우자 있음 (법률혼 / 사실혼 포함)</span>
                </label>
              </div>

              {input.hasSpouse ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 배우자 연령 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        배우자 연령 (만 나이)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={input.spouseAge || ''}
                          onChange={(e) => onChange('spouseAge', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                          placeholder="예: 66"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400">세</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {input.spouseAge >= 65 ? '만 65세 이상 (부부 2인 동시 수급 대상)' : '만 65세 미만 (부부 1인 수급 가구)'}
                      </p>
                    </div>

                    {/* 배우자 장애 여부 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        배우자 장애 등록 여부
                      </label>
                      <select
                        value={input.spouseDisability}
                        onChange={(e) => onChange('spouseDisability', e.target.value as DisabilityDegree)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                      >
                        <option value="none">비장애 (장애 없음)</option>
                        <option value="severe">등록 중증장애인 (1·2급, 3급중복)</option>
                        <option value="mild">등록 경증장애인 (3~6급)</option>
                      </select>
                    </div>

                    {/* 배우자 직역연금 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        배우자 직역연금 수급 여부
                      </label>
                      <select
                        value={input.spouseOccupationalPension}
                        onChange={(e) => onChange('spouseOccupationalPension', e.target.value as OccupationalPensionType)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                      >
                        <option value="none">해당 없음</option>
                        <option value="recipient">직역연금 수급권자 (가구 전체 제외)</option>
                        <option value="exception_under_10y">예외: 재직 10년 미만 연계퇴직</option>
                        <option value="exception_lump_sum_5y">예외: 일시금 수령 5년 경과</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={input.isSeparatedOrDivorcedDeFacto}
                        onChange={(e) => onChange('isSeparatedOrDivorcedDeFacto', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span>사실상 이혼 상태 (서식 19호 확인서 징구로 단독가구 인정 신청)</span>
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  단독가구로 판정됩니다. (2026 기초연금 선정기준액 247만원 / 장애인연금 140만원)
                </p>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: 소득 내역 */}
        {activeSection === 'income' && (
          <div className="space-y-6">
            {/* 상시근로소득 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>상시근로소득 (월 급여액, 세전)</span>
                </span>
                <span className="text-xs text-slate-500">
                  2026 기본공제: 기초연금 116만원 / 장애인연금 95만원 (30% 추가공제)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">신청인 본인 상시근로소득</label>
                    <span className="text-[11px] text-blue-600 font-medium tabular-nums">
                      {formatKoreanCurrency(input.applicantEarnedIncome)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={input.applicantEarnedIncome || ''}
                      onChange={(e) => onChange('applicantEarnedIncome', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">원/월</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">일용근로, 공공일자리(노인일자리 등), 자활소득은 전액 제외</p>
                </div>

                {input.hasSpouse && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">배우자 상시근로소득</label>
                      <span className="text-[11px] text-blue-600 font-medium tabular-nums">
                        {formatKoreanCurrency(input.spouseEarnedIncome)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={input.spouseEarnedIncome || ''}
                        onChange={(e) => onChange('spouseEarnedIncome', Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400">원/월</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">배우자도 1인당 기본공제 동일하게 별도 적용</p>
                  </div>
                )}
              </div>
            </div>

            {/* 국민연금 및 공적연금 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span>국민연금 수령 정보 (기초연금 감액 연계용)</span>
                </span>
                <button
                  type="button"
                  onClick={handleEstimateA}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  국민연금 A급여액 자동 추정 (55%)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">신청인 월 국민연금 급여액</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.applicantNationalPension)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={input.applicantNationalPension || ''}
                      onChange={(e) => onChange('applicantNationalPension', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">원/월</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">부양가족연금액 제외한 월 수령액</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">국민연금 A급여액 (소득재분배 부분)</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.applicantNationalPensionA)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={input.applicantNationalPensionA || ''}
                      onChange={(e) => onChange('applicantNationalPensionA', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">원/월</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">공단 지급내역서 상 A급여액 기재 (모를 시 자동 추정 클릭)</p>
                </div>
              </div>

              {input.hasSpouse && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">배우자 월 국민연금 급여액</label>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={input.spouseNationalPension || ''}
                      onChange={(e) => onChange('spouseNationalPension', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">배우자 국민연금 A급여액</label>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={input.spouseNationalPensionA || ''}
                      onChange={(e) => onChange('spouseNationalPensionA', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 기타 사업·이자·사적연금 소득 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>기타소득 (사업, 재산, 이전소득)</span>
                </span>
                <span className="text-xs text-slate-500">가구원 합산 월 평균액</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 사업소득 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">사업소득 및 임대소득</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.businessIncome)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={10000}
                    min={0}
                    value={input.businessIncome || ''}
                    onChange={(e) => onChange('businessIncome', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">국세청 종합소득 금액 또는 단순경비율 공제 후</p>
                </div>

                {/* 이자소득 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">이자 및 배당소득</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.interestIncome)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={10000}
                    min={0}
                    value={input.interestIncome || ''}
                    onChange={(e) => onChange('interestIncome', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">월 4만원 자동 공제 적용</p>
                </div>

                {/* 사적연금 소득 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">사적연금 소득</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.privatePensionIncome)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={10000}
                    min={0}
                    value={input.privatePensionIncome || ''}
                    onChange={(e) => onChange('privatePensionIncome', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">개인연금저축, 퇴직연금 월 수령액</p>
                </div>

                {/* 기타 공적이전소득 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">기타 공적이전소득</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.publicTransferIncome)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={10000}
                    min={0}
                    value={input.publicTransferIncome || ''}
                    onChange={(e) => onChange('publicTransferIncome', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">산재급여, 보훈급여 등 (기초생활보장 급여 제외)</p>
                </div>

                {/* 자녀 고가주택 무료임차소득 */}
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      자녀 명의 고가주택(6억 이상) 무료임차 거주
                    </label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {input.childLuxuryHouseValue >= 600_000_000
                        ? `월 산정액: ${Math.round((input.childLuxuryHouseValue * (input.childOwnershipShare || 1) * 0.0078) / 12).toLocaleString()}원`
                        : '미부과'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step={10000000}
                      min={0}
                      value={input.childLuxuryHouseValue || ''}
                      onChange={(e) => onChange('childLuxuryHouseValue', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="주택 시가표준액(원)"
                    />
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={1}
                      value={input.childOwnershipShare || 1}
                      onChange={(e) => onChange('childOwnershipShare', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                      placeholder="자녀 지분율 (예: 1)"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">1촌 직계비속(자녀) 소유 6억원 이상 주택에 무료 거주 시 연 0.78% 부과</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: 재산 및 부채 정보 */}
        {activeSection === 'property' && (
          <div className="space-y-6">
            {/* 일반재산 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-blue-600" />
                  <span>일반재산 (부동산 및 임차보증금)</span>
                </span>
                <span className="text-xs text-slate-500">
                  거주지 기본공제: {REGION_CONFIGS[input.region]?.name} ({(REGION_CONFIGS[input.region]?.basicDeduction / 10_000_000).toFixed(1)}억원)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">부동산 시가표준액 (토지, 건축물, 자가주택)</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.realEstateValue)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.realEstateValue || ''}
                    onChange={(e) => onChange('realEstateValue', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">공동주택공시가격 또는 개별공시지가 기준</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">주거용 임차보증금 (전세금, 월세보증금)</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.rentalDeposit)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.rentalDeposit || ''}
                    onChange={(e) => onChange('rentalDeposit', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">계약서 상 보증금 입력 시 95% 자동 반영 (5% 자동 공제)</p>
                </div>
              </div>
            </div>

            {/* 금융재산 및 부채 */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span>금융재산 및 부채</span>
                </span>
                <span className="text-xs text-slate-500">
                  금융재산 기본공제: 가구당 2,000만원
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">금융재산 (예·적금, 주식, 보험환급금)</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.financialAssets)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.financialAssets || ''}
                    onChange={(e) => onChange('financialAssets', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">2,000만원 공제 후 잔액만 재산 반영</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">금융기관 대출금 등 인정 부채</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.financialDebt)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.financialDebt || ''}
                    onChange={(e) => onChange('financialDebt', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">은행 대출, 주택연금/농지연금 누계액 (마이너스통장 제외)</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">임대보증금 부채 (전세 준 경우)</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.rentDepositDebt)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.rentDepositDebt || ''}
                    onChange={(e) => onChange('rentDepositDebt', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">부동산 시가표준액의 50% 한도 내 인정</p>
                </div>
              </div>
            </div>

            {/* 자동차 및 회원권 (P값 100% 산정) */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>자동차 및 회원권 (고급재산 월 100% 소득환산)</span>
                </span>
                <span className="text-xs text-amber-700 font-medium">
                  고급차 기준: 가액 4,000만원 이상 & 차령 10년 미만
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">보유 자동차 가액</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.luxuryCarValue)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.luxuryCarValue || ''}
                    onChange={(e) => onChange('luxuryCarValue', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={input.hasDisabledCarExemption}
                        onChange={(e) => onChange('hasDisabledCarExemption', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span>등록장애인 소유 자동차 (1대 전액 재산산정 제외 특례)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">골프·콘도·승마 등 각종 회원권 가액</label>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {formatKoreanCurrency(input.membershipValue)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={1000000}
                    min={0}
                    value={input.membershipValue || ''}
                    onChange={(e) => onChange('membershipValue', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tabular-nums"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">시가표준액 기준 전액 월 100% 소득환산액 가산</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
