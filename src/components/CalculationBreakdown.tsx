import React from 'react';
import {
  BasicPensionResult,
  DisabilityPensionResult,
  SimulationInput,
  REGION_CONFIGS,
  BASIC_PENSION_2026,
  DISABILITY_PENSION_2026,
} from '../types/pension';
import { Calculator, ArrowRight, HelpCircle } from 'lucide-react';

interface CalculationBreakdownProps {
  input: SimulationInput;
  basicPension: BasicPensionResult;
  disabilityPension: DisabilityPensionResult;
}

export const CalculationBreakdown: React.FC<CalculationBreakdownProps> = ({
  input,
  basicPension,
  disabilityPension,
}) => {
  const regionConfig = REGION_CONFIGS[input.region] || REGION_CONFIGS.large;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 타이틀 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <span>2026년도 소득인정액 및 급여액 상세 산정 내역서</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          보건복지부 기초연금 및 장애인연금 사업안내 공식 산식에 따라 소득평가액, 재산환산액, 감액 단계를 산출합니다.
        </p>
      </div>

      {/* 1. 소득평가액 산출 단계 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            1단계. 소득평가액 산출 (월 기준)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            소득평가액 = 0.7 × (상시근로소득 - 기본공제) + 기타소득
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                <th className="py-2.5 px-3 font-semibold">구분 항목</th>
                <th className="py-2.5 px-3 font-semibold">신고/조회 월액</th>
                <th className="py-2.5 px-3 font-semibold">2026 공제 기준</th>
                <th className="py-2.5 px-3 font-semibold text-right">기초연금 반영액</th>
                <th className="py-2.5 px-3 font-semibold text-right">장애인연금 반영액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* 본인 근로소득 */}
              <tr>
                <td className="py-3 px-3 font-medium text-slate-800">
                  신청인 본인 상시근로소득
                </td>
                <td className="py-3 px-3 tabular-nums text-slate-700">
                  {input.applicantEarnedIncome.toLocaleString()}원
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  기초연금: 116만원 공제 후 30% 추가공제<br />
                  장애인연금: 95만원 공제 후 30% 추가공제
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {Math.max(
                    0,
                    Math.round(
                      Math.max(0, input.applicantEarnedIncome - BASIC_PENSION_2026.EARNED_INCOME_DEDUCTION) * 0.7
                    )
                  ).toLocaleString()}원
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {Math.max(
                    0,
                    Math.round(
                      Math.max(0, input.applicantEarnedIncome - DISABILITY_PENSION_2026.EARNED_INCOME_DEDUCTION) * 0.7
                    )
                  ).toLocaleString()}원
                </td>
              </tr>

              {/* 배우자 근로소득 */}
              {input.hasSpouse && (
                <tr>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    배우자 상시근로소득
                  </td>
                  <td className="py-3 px-3 tabular-nums text-slate-700">
                    {input.spouseEarnedIncome.toLocaleString()}원
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    본인과 동일 (인별 각각 공제)
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800 tabular-nums">
                    {Math.max(
                      0,
                      Math.round(
                        Math.max(0, input.spouseEarnedIncome - BASIC_PENSION_2026.EARNED_INCOME_DEDUCTION) * 0.7
                      )
                    ).toLocaleString()}원
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800 tabular-nums">
                    {Math.max(
                      0,
                      Math.round(
                        Math.max(0, input.spouseEarnedIncome - DISABILITY_PENSION_2026.EARNED_INCOME_DEDUCTION) * 0.7
                      )
                    ).toLocaleString()}원
                  </td>
                </tr>
              )}

              {/* 기타사업/임대소득 */}
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  사업소득 및 임대소득
                </td>
                <td className="py-2.5 px-3 tabular-nums text-slate-700">
                  {input.businessIncome.toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-slate-500">공제 없음 (전액 반영)</td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {input.businessIncome.toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {input.businessIncome.toLocaleString()}원
                </td>
              </tr>

              {/* 이자소득 */}
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  이자소득 (금융재산 발생 이자)
                </td>
                <td className="py-2.5 px-3 tabular-nums text-slate-700">
                  {input.interestIncome.toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-slate-500">월 40,000원 공제</td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {Math.max(0, input.interestIncome - 40_000).toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {Math.max(0, input.interestIncome - 40_000).toLocaleString()}원
                </td>
              </tr>

              {/* 국민연금 급여액 */}
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  국민연금 수령액 (부양가족연금 제외)
                </td>
                <td className="py-2.5 px-3 tabular-nums text-slate-700">
                  {((input.applicantNationalPension || 0) + (input.hasSpouse ? input.spouseNationalPension || 0 : 0)).toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-slate-500">공적이전소득 산입</td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {((input.applicantNationalPension || 0) + (input.hasSpouse ? input.spouseNationalPension || 0 : 0)).toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                  {((input.applicantNationalPension || 0) + (input.hasSpouse ? input.spouseNationalPension || 0 : 0)).toLocaleString()}원
                </td>
              </tr>

              {/* 무료임차소득 */}
              {input.childLuxuryHouseValue >= 600_000_000 && (
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    무료임차소득 (자녀 6억 이상 주택 거주)
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-700">
                    주택시가: {input.childLuxuryHouseValue.toLocaleString()}원
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    시가표준액 × 지분율 × 0.78% ÷ 12
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                    {Math.round((input.childLuxuryHouseValue * (input.childOwnershipShare || 1) * 0.0078) / 12).toLocaleString()}원
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                    {Math.round((input.childLuxuryHouseValue * (input.childOwnershipShare || 1) * 0.0078) / 12).toLocaleString()}원
                  </td>
                </tr>
              )}

              {/* 소계 행 */}
              <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200">
                <td colSpan={3} className="py-2.5 px-3 text-right">
                  소득평가액 최종 합계:
                </td>
                <td className="py-2.5 px-3 text-right text-blue-700 tabular-nums font-semibold">
                  {basicPension.totalIncomeEvaluation.toLocaleString()}원
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 tabular-nums font-semibold">
                  {disabilityPension.totalIncomeEvaluation.toLocaleString()}원
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 재산의 소득환산액 산출 단계 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            2단계. 재산의 소득환산액 산출 (월 기준)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            [ (순재산액) × 4% ÷ 12개월 ] + P(고급차·회원권)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* 일반재산 */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <div className="font-semibold text-slate-800 flex justify-between">
              <span>일반재산 합계</span>
              <span className="tabular-nums font-bold text-slate-900">
                {basicPension.generalProperty.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between text-slate-600 pl-2">
              <span>• 부동산(주택·토지·건물 등)</span>
              <span className="tabular-nums">{input.realEstateValue.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-slate-600 pl-2">
              <span>• 임차보증금(전월세 × 95% 인정)</span>
              <span className="tabular-nums">{Math.round(input.rentalDeposit * 0.95).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-blue-700 pl-2 pt-1 border-t border-slate-200">
              <span>- 기본재산액 공제 ({regionConfig.name})</span>
              <span className="tabular-nums font-medium">-{basicPension.basicPropertyDeduction.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-medium text-slate-800 pt-1 border-t border-slate-200">
              <span>일반재산 공제 후 잔액</span>
              <span className="tabular-nums font-bold">{basicPension.netGeneralProperty.toLocaleString()}원</span>
            </div>
          </div>

          {/* 금융재산 및 부채 */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
            <div className="font-semibold text-slate-800 flex justify-between">
              <span>금융재산 및 부채</span>
              <span className="tabular-nums font-bold text-slate-900">
                순재산 계산
              </span>
            </div>
            <div className="flex justify-between text-slate-600 pl-2">
              <span>• 금융재산(예적금·주식·보험 등)</span>
              <span className="tabular-nums">{input.financialAssets.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-blue-700 pl-2">
              <span>- 금융재산 기본공제(가구당 2,000만원)</span>
              <span className="tabular-nums font-medium">-{BASIC_PENSION_2026.FINANCIAL_DEDUCTION.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-slate-700 pl-2">
              <span>금융재산 공제 후 잔액</span>
              <span className="tabular-nums font-medium">{basicPension.netFinancialProperty.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-rose-600 pl-2 pt-1 border-t border-slate-200">
              <span>- 총 부채 차감(대출금 + 임대보증금 50%)</span>
              <span className="tabular-nums font-medium">-{basicPension.totalDebt.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-medium text-slate-800 pt-1 border-t border-slate-200">
              <span>환산 대상 순재산액 (음수 시 0원)</span>
              <span className="tabular-nums font-bold">{basicPension.netPropertyBeforeRate.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 환산 결과 */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-slate-600">
              월 소득환산 계산식: ({basicPension.netPropertyBeforeRate.toLocaleString()}원 × 4% ÷ 12) = <strong className="text-slate-900 tabular-nums">{basicPension.propertyMonthlyConversion.toLocaleString()}원/월</strong>
            </div>
            {basicPension.pValue > 0 && (
              <div className="text-amber-700 mt-1">
                + P값(고급자동차 및 회원권 100% 가산): <strong className="tabular-nums">+{basicPension.pValue.toLocaleString()}원</strong>
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-500">재산의 소득환산액: </span>
            <span className="text-base font-extrabold text-slate-900 tabular-nums">
              {basicPension.totalPropertyConversion.toLocaleString()}원 / 월
            </span>
          </div>
        </div>
      </div>

      {/* 3. 소득인정액과 2026년 선정기준액 판정 비교 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          3단계. 소득인정액 합산 및 2026 선정기준액 비교
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* 기초연금 비교 */}
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-900 text-sm">기초연금 판정</span>
              <span className="font-semibold text-blue-700">
                {basicPension.isEligible ? '선정기준액 이하 (수급 적합)' : '선정기준액 초과 (제외)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>2026년 가구 선정기준액:</span>
              <span className="font-bold tabular-nums">{basicPension.threshold.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>최종 소득인정액 (소득평가+재산환산):</span>
              <span className="font-bold text-blue-800 tabular-nums">{basicPension.recognizedIncome.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-blue-200 text-slate-600">
              <span>선정기준액 대비 여유분:</span>
              <span className={`font-semibold tabular-nums ${basicPension.marginToThreshold >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {basicPension.marginToThreshold >= 0 ? `+${basicPension.marginToThreshold.toLocaleString()}원 여유` : `${basicPension.marginToThreshold.toLocaleString()}원 초과`}
              </span>
            </div>
          </div>

          {/* 장애인연금 비교 */}
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-emerald-900 text-sm">장애인연금 판정</span>
              <span className="font-semibold text-emerald-700">
                {disabilityPension.isEligible ? '선정기준액 이하 (수급 적합)' : '선정기준액 초과 (제외)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1">
              <span>2026년 가구 선정기준액:</span>
              <span className="font-bold tabular-nums">{disabilityPension.threshold.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>최종 소득인정액 (근로 95만 공제):</span>
              <span className="font-bold text-emerald-800 tabular-nums">{disabilityPension.recognizedIncome.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-emerald-200 text-slate-600">
              <span>선정기준액 대비 여유분:</span>
              <span className={`font-semibold tabular-nums ${disabilityPension.marginToThreshold >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {disabilityPension.marginToThreshold >= 0 ? `+${disabilityPension.marginToThreshold.toLocaleString()}원 여유` : `${disabilityPension.marginToThreshold.toLocaleString()}원 초과`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
