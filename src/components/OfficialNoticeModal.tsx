import React, { useRef } from 'react';
import {
  BasicPensionResult,
  DisabilityPensionResult,
  DisabilityAllowanceResult,
  SimulationInput,
  REGION_CONFIGS,
} from '../types/pension';
import { Printer, X, FileCheck2, ShieldAlert } from 'lucide-react';

interface OfficialNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: SimulationInput;
  basicPension: BasicPensionResult;
  disabilityPension: DisabilityPensionResult;
  disabilityAllowance: DisabilityAllowanceResult;
}

export const OfficialNoticeModal: React.FC<OfficialNoticeModalProps> = ({
  isOpen,
  onClose,
  input,
  basicPension,
  disabilityPension,
  disabilityAllowance,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = '2026년 11월 03일';
  const regionConfig = REGION_CONFIGS[input.region] || REGION_CONFIGS.large;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 print:border-none print:shadow-none print:max-h-none">
        {/* 모달 상단 툴바 (인쇄 시 숨김) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-3 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900 text-sm">
              사회보장급여 모의 결정 통지서 [공통서식 별지 제6호서식 / 제5호서식 기반]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄하기 / PDF 저장</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 공식 통지서 본문 (행복이음 서식 6호/5호 양식 재현) */}
        <div ref={printRef} className="p-8 sm:p-12 text-slate-900 text-xs sm:text-sm font-sans space-y-6">
          {/* 서식 번호 및 타이틀 */}
          <div className="text-right text-[11px] text-slate-500 font-mono">
            [서식 6호/5호] [공통서식 별지 제6호서식] &lt;개정 2026.1.1.&gt;
          </div>

          <div className="text-center py-4 border-b-2 border-slate-900">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              사회보장급여 결정 통지서
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              (기초연금 · 장애인연금 · 장애수당 모의 산정 결과서)
            </p>
          </div>

          {/* 1. 신청인 및 세대 정보 */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">1. 신청인 및 가구 정보</h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <th className="bg-slate-50 border-r border-slate-200 p-2 text-left w-28 font-medium text-slate-700">
                    신청인 성명
                  </th>
                  <td className="p-2 border-r border-slate-200">
                    홍길동 (가명 신청인)
                  </td>
                  <th className="bg-slate-50 border-r border-slate-200 p-2 text-left w-28 font-medium text-slate-700">
                    연령 / 자격
                  </th>
                  <td className="p-2">
                    만 {input.applicantAge}세 /{' '}
                    {input.applicantDisability === 'severe'
                      ? '등록 중증장애인'
                      : input.applicantDisability === 'mild'
                      ? '등록 경증장애인'
                      : '일반(비장애)'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <th className="bg-slate-50 border-r border-slate-200 p-2 text-left font-medium text-slate-700">
                    주소지 / 급지
                  </th>
                  <td className="p-2 border-r border-slate-200">
                    {regionConfig.name} ({regionConfig.description})
                  </td>
                  <th className="bg-slate-50 border-r border-slate-200 p-2 text-left font-medium text-slate-700">
                    가구 구성
                  </th>
                  <td className="p-2">
                    {input.hasSpouse ? `부부가구 (배우자 만 ${input.spouseAge}세)` : '단독가구'}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-50 border-r border-slate-200 p-2 text-left font-medium text-slate-700">
                    소득인정액
                  </th>
                  <td className="p-2 border-r border-slate-200 font-bold tabular-nums text-slate-900">
                    기초연금: {basicPension.recognizedIncome.toLocaleString()}원 / 장애인연금: {disabilityPension.recognizedIncome.toLocaleString()}원
                  </td>
                  <th className="bg-slate-50 border-r border-slate-200 p-2 text-left font-medium text-slate-700">
                    2026 선정기준액
                  </th>
                  <td className="p-2 tabular-nums">
                    기초연금: {basicPension.threshold.toLocaleString()}원 / 장애인연금: {disabilityPension.threshold.toLocaleString()}원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. 사회보장급여 결정 사항 */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-2">2. 사회보장급여 결정 내역</h3>
            <table className="w-full border-collapse border border-slate-300 text-xs text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                  <th className="p-2 font-semibold border-r border-slate-300">신청 급여</th>
                  <th className="p-2 font-semibold border-r border-slate-300">결정 구분</th>
                  <th className="p-2 font-semibold border-r border-slate-300">월 지급 예정액</th>
                  <th className="p-2 font-semibold border-r border-slate-300">정기 지급일</th>
                  <th className="p-2 font-semibold">산출 및 감액 사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* 기초연금 행 */}
                <tr>
                  <td className="p-2 font-medium border-r border-slate-200">기초연금</td>
                  <td className="p-2 border-r border-slate-200">
                    <span className={`font-semibold ${basicPension.isEligible ? 'text-blue-700' : 'text-slate-500'}`}>
                      {basicPension.isEligible ? '지급 결정 (적합)' : '대상 제외 (미해당)'}
                    </span>
                  </td>
                  <td className="p-2 border-r border-slate-200 font-bold tabular-nums text-slate-900">
                    {basicPension.isEligible ? `${basicPension.totalHouseholdAmount.toLocaleString()}원` : '0원'}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-slate-600">
                    매월 25일 (토·공휴일 전일)
                  </td>
                  <td className="p-2 text-slate-600 leading-tight">
                    {basicPension.isEligible ? (
                      <>
                        기준연금액(349,700원) 기준
                        {basicPension.coupleReductionApplied && ' · 부부감액(20%) 반영'}
                        {basicPension.incomeInversionDeductionApplied && ' · 소득역전방지 감액 반영'}
                      </>
                    ) : (
                      basicPension.reason
                    )}
                  </td>
                </tr>

                {/* 장애인연금 행 */}
                <tr>
                  <td className="p-2 font-medium border-r border-slate-200">장애인연금</td>
                  <td className="p-2 border-r border-slate-200">
                    <span className={`font-semibold ${disabilityPension.isEligible ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {disabilityPension.isEligible ? '지급 결정 (적합)' : '대상 제외 (미해당)'}
                    </span>
                  </td>
                  <td className="p-2 border-r border-slate-200 font-bold tabular-nums text-slate-900">
                    {disabilityPension.isEligible ? `${disabilityPension.totalHouseholdBenefit.toLocaleString()}원` : '0원'}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-slate-600">
                    매월 20일 (토·공휴일 전일)
                  </td>
                  <td className="p-2 text-slate-600 leading-tight">
                    {disabilityPension.isEligible ? (
                      <>
                        기초급여: {disabilityPension.applicantBasicBenefit.toLocaleString()}원 · 부가급여: {disabilityPension.applicantAdditionalBenefit.toLocaleString()}원 ({disabilityPension.classificationName})
                      </>
                    ) : (
                      disabilityPension.reason
                    )}
                  </td>
                </tr>

                {/* 장애수당 / 장애아동수당 행 */}
                <tr>
                  <td className="p-2 font-medium border-r border-slate-200">장애(아동)수당</td>
                  <td className="p-2 border-r border-slate-200">
                    <span className={`font-semibold ${disabilityAllowance.isApplicable ? 'text-amber-700' : 'text-slate-500'}`}>
                      {disabilityAllowance.isApplicable ? '지급 결정 (적합)' : '비해당'}
                    </span>
                  </td>
                  <td className="p-2 border-r border-slate-200 font-bold tabular-nums text-slate-900">
                    {disabilityAllowance.isApplicable ? `${disabilityAllowance.monthlyAmount.toLocaleString()}원` : '0원'}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-slate-600">
                    매월 20일 / 25일
                  </td>
                  <td className="p-2 text-slate-600 leading-tight">
                    {disabilityAllowance.qualificationDetail}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. 유의사항 및 권리구제 안내 (공식 서식 문구 재현) */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2 text-[11px] text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-800 text-xs">안내사항 및 유의사항</h4>
            <p>
              1. <strong>급여 지급 계좌:</strong> 본인 명의의 금융계좌(압류방지 전용 '행복지킴이 통장' 권장)로 입금됩니다. 채무불이행 압류나 중증 질환으로 통장 개설이 불가한 경우 대리수령인(배우자, 직계혈족, 3촌 이내 방계혈족) 계좌로 수령 가능합니다.
            </p>
            <p>
              2. <strong>변동신고 의무:</strong> 소득·재산 변동, 혼인·이혼, 사망, 국외체류(60일 이상 연속), 교정시설 입소 등 변동사유가 발생한 날부터 30일 이내에 주소지 관할 읍·면·동 주민센터 또는 국민연금공단 지사에 반드시 신고하여야 합니다.
            </p>
            <p>
              3. <strong>이의신청 및 행정심판 안내:</strong> 위 결정사항에 대하여 이의가 있는 경우, 결정을 안 날로부터 <strong>90일 이내</strong>에 서면으로 특별자치시장·특별자치도지사·시장·군수·구청장 또는 국민연금공단 지사에 이의신청을 하거나 온라인 행정심판(www.simpan.go.kr)을 청구할 수 있습니다.
            </p>
          </div>

          {/* 발송 기관 및 직인 */}
          <div className="pt-6 text-center space-y-3">
            <p className="text-xs text-slate-500 font-medium">{todayStr}</p>
            <div className="text-base font-bold tracking-widest text-slate-900">
              보건복지부 · 관할 특별자치시장 · 특별자치도지사 · 시장 · 군수 · 구청장 [직인생략]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
