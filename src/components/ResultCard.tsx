import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingDown,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  BasicPensionResult,
  DisabilityPensionResult,
  DisabilityAllowanceResult,
} from '../types/pension';

interface ResultCardProps {
  basicPension: BasicPensionResult;
  disabilityPension: DisabilityPensionResult;
  disabilityAllowance: DisabilityAllowanceResult;
  onViewOfficialNotice: () => void;
  onViewBreakdown: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  basicPension,
  disabilityPension,
  disabilityAllowance,
  onViewOfficialNotice,
  onViewBreakdown,
}) => {
  // 총 월 수급액 계산 (기초연금 가구합계 + 장애인연금 가구합계 + 장애(아동)수당)
  const totalMonthlyBenefit =
    (basicPension.isEligible ? basicPension.totalHouseholdAmount : 0) +
    (disabilityPension.isEligible ? disabilityPension.totalHouseholdBenefit : 0) +
    (disabilityAllowance.isApplicable ? disabilityAllowance.monthlyAmount : 0);

  return (
    <div className="space-y-6">
      {/* 1. 최상단 종합 수급액 하이라이트 배너 */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              <span>2026년 보건복지부 사업안내 모의계산 종합 결과</span>
              <span aria-hidden="true">·</span>
              <span>매월 정기 지급일(기초연금 25일 / 장애인연금 20일)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-slate-300">예상 월 복지급여 총액:</span>
              <span className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
                {totalMonthlyBenefit.toLocaleString()}
              </span>
              <span className="text-base font-semibold text-slate-300">원 / 월</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {basicPension.isEligible && (
                <span>
                  기초연금: <strong className="text-blue-400 tabular-nums">{basicPension.totalHouseholdAmount.toLocaleString()}원</strong>
                </span>
              )}
              {disabilityPension.isEligible && (
                <span>
                  장애인연금: <strong className="text-emerald-400 tabular-nums">{disabilityPension.totalHouseholdBenefit.toLocaleString()}원</strong>
                </span>
              )}
              {disabilityAllowance.isApplicable && (
                <span>
                  장애(아동)수당: <strong className="text-amber-400 tabular-nums">{disabilityAllowance.monthlyAmount.toLocaleString()}원</strong>
                </span>
              )}
              {totalMonthlyBenefit === 0 && (
                <span className="text-rose-400">선정기준액 초과 또는 신청 자격(연령/장애정도 등) 미달</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onViewBreakdown}
              className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer whitespace-nowrap"
            >
              상세 산출표
            </button>
            <button
              type="button"
              onClick={onViewOfficialNotice}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              결정통지서 보기
            </button>
          </div>
        </div>
      </div>

      {/* 2. 제도별 상세 판정 카드 그리드 (3열) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: 기초연금 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">2026 기초연금</h3>
                <p className="text-xs text-slate-500 mt-0.5">만 65세 이상 노인 소득보장</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  basicPension.isEligible
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {basicPension.isEligible ? '수급 대상' : '지급 제외'}
              </span>
            </div>

            <div className="my-4">
              <div className="text-xs text-slate-500 mb-1">월 예상 지급액 (가구합계)</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {basicPension.isEligible
                  ? `${basicPension.totalHouseholdAmount.toLocaleString()}원`
                  : '0원'}
              </div>
              {basicPension.isEligible && basicPension.householdType === 'couple_2person' && (
                <div className="text-xs text-slate-500 mt-1">
                  본인: <span className="tabular-nums font-medium text-slate-700">{basicPension.applicantFinalAmount.toLocaleString()}원</span> · 배우자: <span className="tabular-nums font-medium text-slate-700">{basicPension.spouseFinalAmount.toLocaleString()}원</span>
                </div>
              )}
            </div>

            {/* 자격 및 감액 내역 */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>2026 선정기준액</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {basicPension.threshold.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>소득인정액</span>
                <span className={`font-semibold tabular-nums ${basicPension.recognizedIncome <= basicPension.threshold ? 'text-slate-800' : 'text-rose-600'}`}>
                  {basicPension.recognizedIncome.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>기준연금액 (100%)</span>
                <span className="text-slate-700 tabular-nums">349,700원</span>
              </div>

              {basicPension.coupleReductionApplied && (
                <div className="flex items-center gap-1 text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>부부 2인 수급으로 각각 20% 감액 적용</span>
                </div>
              )}

              {basicPension.incomeInversionDeductionApplied && (
                <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>소득역전방지 감액 적용 (선정기준액 초과 방지)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {basicPension.reason}
            </p>
          </div>
        </div>

        {/* Card 2: 장애인연금 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">2026 장애인연금</h3>
                <p className="text-xs text-slate-500 mt-0.5">만 18세 이상 중증장애인 연금</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  disabilityPension.isEligible
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {disabilityPension.isEligible ? '수급 대상' : '지급 제외'}
              </span>
            </div>

            <div className="my-4">
              <div className="text-xs text-slate-500 mb-1">월 예상 지급액 (가구합계)</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {disabilityPension.isEligible
                  ? `${disabilityPension.totalHouseholdBenefit.toLocaleString()}원`
                  : '0원'}
              </div>
              {disabilityPension.isEligible && (
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>기초급여: <strong className="text-slate-800 tabular-nums">{disabilityPension.applicantBasicBenefit.toLocaleString()}원</strong></span>
                  <span>·</span>
                  <span>부가급여: <strong className="text-emerald-700 tabular-nums">{disabilityPension.applicantAdditionalBenefit.toLocaleString()}원</strong></span>
                </div>
              )}
            </div>

            {/* 자격 및 부가급여 내역 */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>2026 선정기준액</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {disabilityPension.threshold.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>소득인정액 (근로공제 95만)</span>
                <span className={`font-semibold tabular-nums ${disabilityPension.recognizedIncome <= disabilityPension.threshold ? 'text-slate-800' : 'text-rose-600'}`}>
                  {disabilityPension.recognizedIncome.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>수급자 계층 분류</span>
                <span className="text-slate-700 font-medium">{disabilityPension.classificationName}</span>
              </div>

              {disabilityPension.is65OrOlderNote && (
                <div className="flex items-start gap-1 text-slate-600 text-[11px] pt-1 border-t border-slate-200/60 leading-tight">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{disabilityPension.is65OrOlderNote}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {disabilityPension.reason}
            </p>
          </div>
        </div>

        {/* Card 3: 경증 장애수당 / 장애아동수당 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">2026 장애(아동)수당</h3>
                <p className="text-xs text-slate-500 mt-0.5">경증장애인 및 장애아동 수당</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  disabilityAllowance.isApplicable
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {disabilityAllowance.isApplicable ? '수급 대상' : '비해당'}
              </span>
            </div>

            <div className="my-4">
              <div className="text-xs text-slate-500 mb-1">월 예상 지급액</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {disabilityAllowance.isApplicable
                  ? `${disabilityAllowance.monthlyAmount.toLocaleString()}원`
                  : '0원'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {disabilityAllowance.programName}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
              <div className="text-slate-700 font-medium">제도 기준 안내</div>
              <div className="text-slate-600 leading-relaxed">
                • 성인 경증장애수당: 기초/차상위 월 6만원 (시설 3만원)<br />
                • 중증장애아동수당: 기초 월 22만원, 차상위 17만원, 시설 9만원<br />
                • 경증장애아동수당: 기초/차상위 월 11만원, 시설 3만원
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {disabilityAllowance.qualificationDetail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
