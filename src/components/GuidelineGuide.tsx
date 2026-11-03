import React from 'react';
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  Building2,
  Calendar,
} from 'lucide-react';

export const GuidelineGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 타이틀 배너 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">
            2026년도 기초연금 · 장애인연금 사업안내 주요 개정사항 및 신청 가이드
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          보건복지부에서 발간한 2026년도 최신 사업안내 개정 지침을 기반으로 주요 기준 및 신청 서류를 정리하였습니다.
        </p>
      </div>

      {/* 1. 2026년 주요 개정사항 핵심 비교표 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          1. 2026년 주요 변경 사항 비교 (2025년 현행 대비)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs">
                <th className="py-2.5 px-3 font-semibold">구분</th>
                <th className="py-2.5 px-3 font-semibold">2025년 (종전)</th>
                <th className="py-2.5 px-3 font-semibold text-blue-700">2026년 (개정 확정)</th>
                <th className="py-2.5 px-3 font-semibold text-slate-500">비고 및 해설</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* 기초연금 선정기준액 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">기초연금 선정기준액</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">
                  단독 2,280,000원<br />
                  부부 3,648,000원
                </td>
                <td className="py-3 px-3 font-semibold text-blue-700 tabular-nums">
                  단독 2,470,000원<br />
                  부부 3,952,000원
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  단독가구 +19만원 인상, 부부가구 +30.4만원 인상
                </td>
              </tr>

              {/* 기초연금 근로소득 공제 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">기초연금 근로소득 공제</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">
                  월 112만원 기본공제 후 30% 추가공제
                </td>
                <td className="py-3 px-3 font-semibold text-blue-700 tabular-nums">
                  월 116만원 기본공제 후 30% 추가공제
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  2026 최저임금(10,320원) 반영: 1인당 4만원 추가 공제 확대
                </td>
              </tr>

              {/* 기초연금 기준연금액 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">기초연금 기준연금액</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">
                  월 342,510원 (기준)
                </td>
                <td className="py-3 px-3 font-semibold text-blue-700 tabular-nums">
                  월 349,700원 (기준)
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  전국 소비자물가변동률(2.1%) 반영 (부가연금액: 174,850원, 최저연금액: 34,970원)
                </td>
              </tr>

              {/* 장애인연금 선정기준액 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">장애인연금 선정기준액</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">
                  단독 1,380,000원<br />
                  부부 2,208,000원
                </td>
                <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">
                  단독 1,400,000원<br />
                  부부 2,240,000원
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  단독 +2만원, 부부 +3.2만원 인상 (중증장애인 본인+배우자 대상)
                </td>
              </tr>

              {/* 장애인연금 근로소득 공제 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">장애인연금 근로소득 공제</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">
                  월 92만원 기본공제 후 30% 추가공제
                </td>
                <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">
                  월 95만원 기본공제 후 30% 추가공제
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  근로유인 확대를 위해 기본공제 95만원으로 인상
                </td>
              </tr>

              {/* 장애인연금 부가급여 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">
                  장애인연금 65세 이상 기초수급 부가급여
                </td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">
                  월 432,510원 (생계·의료 재가)
                </td>
                <td className="py-3 px-3 font-semibold text-emerald-700 tabular-nums">
                  월 439,700원 (생계·의료 재가)
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  기초연금 수령으로 생계급여 감액분 전액 보전
                </td>
              </tr>

              {/* 장애인연금 자동차 특례 */}
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">장애인 자동차 재산 제외</td>
                <td className="py-3 px-3 text-slate-600">
                  등록장애인 소유 자동차 1대 재산 제외
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800">
                  등록장애인 1인당 1대(고급차 포함) 재산산정 제외
                </td>
                <td className="py-3 px-3 text-slate-500 leading-tight">
                  장애인부부 각각 소유 시 각각 1대씩 총 2대까지 제외 가능
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 신청 방법 및 필수/추가 구비서류 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          2. 신청 자격 및 필수 구비서류 목록
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* 필수 서류 */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>기초/장애인연금 필수 제출서류</span>
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">1. 신분증:</span>
                <span>주민등록증, 운전면허증, 장애인복지카드, 여권 중 1개 제시 (대리 신청 시 위임장 + 대리인 신분증)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">2. 사회보장급여 신청서:</span>
                <span>[서식 1호] 읍·면·동 주민센터 비치, 또는 복지로 온라인 신청 시 전자 서명</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">3. 소득·재산 신고서:</span>
                <span>[서식 2호] 본인 및 배우자의 소득, 부동산, 금융재산, 부채 등 기재</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">4. 금융정보제공 동의서:</span>
                <span>[서식 3호] 본인 및 배우자 자필 서명 필수 (부부 중 1인이라도 미제출 시 접수 불가)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">5. 급여 수급 통장사본:</span>
                <span>본인 명의 계좌 (압류방지 전용 '행복지킴이 통장' 권장)</span>
              </li>
            </ul>
          </div>

          {/* 추가 해당자 서류 */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>상황별 추가 증빙서류 (해당자)</span>
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">• 전·월세 거주:</span>
                <span>확정일자 또는 전세권 설정된 임대차계약서 사본 (주택 전월세보증금의 5% 공제 혜택)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">• 자녀 주택 거주:</span>
                <span>[서식 20호] 사용대차 확인서 (자녀명의 6억 이상 주택인 경우 무료임차소득 계산용)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">• 금융기관 외 부채:</span>
                <span>법원 판결문, 화해·조정조서에 의한 사채 또는 공공기관 대출 증빙서</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">• 사실(이)혼 관계:</span>
                <span>[서식 19호] 사실(이)혼 관계 확인서 및 자녀·지인 등 인우보증 확인</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-800 shrink-0">• 대리수령 신청:</span>
                <span>[서식 11호/25호] 성년후견 심판문, 채무불이행 압류 통지서, 치매 진단서 등</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. 직역연금 및 이의신청 안내 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>직역연금 수급권자 제외 및 예외 규정</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            공무원연금, 사학연금, 군인연금, 별정우체국연금 수급권자와 그 배우자는 기초연금 및 장애인연금 수급 대상에서 <strong>원칙적으로 제외</strong>됩니다.<br />
            <strong>예외 인정:</strong><br />
            1) 연계퇴직연금 수급권자 중 직역재직기간 10년 미만인 경우<br />
            2) 퇴직유족일시금, 장해일시금 등을 받은 후 5년이 경과된 경우<br />
            3) 1949.6.30 이전 출생 종전 기초노령연금 특례자 (기준연금액의 50% 지급)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>이의신청 및 권리구제 (불복 절차)</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            기초연금 또는 장애인연금 결정 처분(제외, 감액, 환수 등)에 이의가 있는 경우, 처분이 있음을 안 날로부터 <strong>90일 이내</strong>에 주소지 관할 읍·면·동 주민센터 또는 국민연금공단 지사로 서면 이의신청(서식 8호/9호)을 제출할 수 있습니다.<br />
            접수일로부터 30일(장애인연금 15일) 이내에 심사 결과가 서면 통지됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
