/**
 * 2026년도 기초연금 · 장애인연금 사업안내 기준 데이터 타입 및 상수 정의
 */

// 거주지 구분 (기본재산액 공제 기준)
export type RegionType = 'large' | 'medium' | 'rural';

export interface RegionConfig {
  id: RegionType;
  name: string;
  description: string;
  basicDeduction: number; // 기본재산액 (원)
}

// 2026년 기준 기본재산액
export const REGION_CONFIGS: Record<RegionType, RegionConfig> = {
  large: {
    id: 'large',
    name: '대도시 / 특례시',
    description: '특별시, 광역시(도농복합군 포함), 특례시(고양, 수원, 용인, 창원, 화성)',
    basicDeduction: 135_000_000, // 1억 3,500만원
  },
  medium: {
    id: 'medium',
    name: '중소도시 / 세종',
    description: '특별자치도･도의 시, 세종특별자치시',
    basicDeduction: 85_000_000, // 8,500만원
  },
  rural: {
    id: 'rural',
    name: '농어촌',
    description: '특별자치도･도의 군(농어촌)',
    basicDeduction: 72_500_000, // 7,250만원
  },
};

// 2026 기초연금 핵심 상수
export const BASIC_PENSION_2026 = {
  // 선정기준액
  THRESHOLD_SINGLE: 2_470_000,
  THRESHOLD_COUPLE: 3_952_000,
  // 기준연금액
  STANDARD_AMOUNT: 349_700,
  // 부가연금액 (50%)
  ADDITIONAL_AMOUNT: 174_850,
  // 최저연금액 (10%)
  MINIMUM_AMOUNT: 34_970,
  // 상시근로소득 기본공제
  EARNED_INCOME_DEDUCTION: 1_160_000,
  // 상시근로소득 추가공제율
  EARNED_INCOME_ADDITIONAL_RATE: 0.3, // 30% 추가공제 (반영률 0.7)
  // 금융재산 기본공제
  FINANCIAL_DEDUCTION: 20_000_000,
  // 재산 소득환산율 (연 4%)
  PROPERTY_CONVERSION_ANNUAL_RATE: 0.04,
  // 주거용 임차보증금 반영률 (5% 공제)
  HOUSING_RENT_DEPOSIT_RATE: 0.95,
  // 임대보증금 부채 인정 한도율 (시가표준액의 50%)
  MAX_RENT_DEBT_RATIO: 0.5,
  // 자녀 고가주택 무료임차소득 기준 (6억원 이상)
  LUXURY_HOUSE_FREE_RENT_THRESHOLD: 600_000_000,
  // 무료임차소득 환산율 (연 0.78% / 12)
  FREE_RENT_ANNUAL_RATE: 0.0078,
  // 국민연금 연계 기준연금액 배수
  NATIONAL_PENSION_LOWER_RATE: 1.5, // 150% = 524,550원
  NATIONAL_PENSION_UPPER_RATE: 2.0, // 200% = 699,400원
  NATIONAL_PENSION_FORMULA_MAX_RATE: 2.5, // 250% = 874,250원
};

// 2026 장애인연금 핵심 상수
export const DISABILITY_PENSION_2026 = {
  // 선정기준액
  THRESHOLD_SINGLE: 1_400_000,
  THRESHOLD_COUPLE: 2_240_000,
  // 기초급여액 (18~64세) 최고액
  BASIC_BENEFIT_MAX: 349_700,
  // 부부감액 시 1인 기초급여액 (20% 감액)
  BASIC_BENEFIT_COUPLE_EACH: 279_760, // 349,700 * 0.8
  BASIC_BENEFIT_COUPLE_SUM: 559_520,
  // 상시근로소득 기본공제 (2026년 개정: 95만원)
  EARNED_INCOME_DEDUCTION: 950_000,
  EARNED_INCOME_ADDITIONAL_RATE: 0.3, // 30%
  // 금융재산 기본공제
  FINANCIAL_DEDUCTION: 20_000_000,
  // 재산 소득환산율 (연 4%)
  PROPERTY_CONVERSION_ANNUAL_RATE: 0.04,
  // 부가급여 단가 (2026년 기준)
  ADDITIONAL_BENEFIT: {
    // 생계･의료급여 수급자 (일반 재가)
    BASIC_LIVELIHOOD_HOME: {
      UNDER_65: 90_000,
      OVER_65: 439_700, // 기초연금 수령으로 생계급여 감액분 전액 보전
    },
    // 생계･의료급여 수급자 (보장시설)
    BASIC_LIVELIHOOD_FACILITY: {
      UNDER_65: 0,
      OVER_65: 0,
      OVER_65_SPECIAL: 80_000,
    },
    // 차상위계층 (주거･교육급여 수급자 및 기준중위소득 50% 이하)
    NEAR_POVERTY: {
      UNDER_65: 80_000,
      OVER_65: 80_000,
      OVER_65_SPECIAL: 150_000,
    },
    // 차상위 초과자 (선정기준액 이하 일반)
    ABOVE_NEAR_POVERTY: {
      UNDER_65: 30_000,
      OVER_65: 50_000,
    },
  },
};

// 2026 장애수당 및 장애아동수당 단가
export const DISABILITY_ALLOWANCE_2026 = {
  // 성인(18세 이상) 경증 장애수당 (월)
  ADULT_MILD: {
    BASIC_HOME: 60_000, // 생계/의료 재가
    BASIC_FACILITY: 30_000, // 생계/의료 시설
    NEAR_POVERTY: 60_000, // 주거/교육/차상위
  },
  // 장애아동수당 (18세 미만, 취학 시 20세까지) (월)
  CHILD_SEVERE: {
    BASIC_HOME: 220_000,
    NEAR_POVERTY: 170_000,
    BASIC_FACILITY: 90_000,
  },
  CHILD_MILD: {
    BASIC_HOME: 110_000,
    NEAR_POVERTY: 110_000,
    BASIC_FACILITY: 30_000,
  },
};

// 복지 자격 유형
export type WelfareStatus = 
  | 'basic_livelihood_living_medical' // 국민기초생활수급자 (생계/의료급여)
  | 'basic_livelihood_housing_education' // 국민기초생활수급자 (주거/교육급여 - 차상위 상당)
  | 'near_poverty' // 차상위계층 (중위소득 50% 이하)
  | 'general'; // 일반 (차상위 초과)

// 장애 정도
export type DisabilityDegree = 
  | 'none' // 장애 없음
  | 'severe' // 중증 (종전 1급, 2급, 3급 중복)
  | 'mild'; // 경증 (종전 3급단일 ~ 6급)

// 직역연금 유형
export type OccupationalPensionType = 
  | 'none' // 해당 없음
  | 'recipient' // 공무원/군인/사학/별정우체국 퇴직연금 등 일반 수급권자 (원칙적 제외)
  | 'exception_under_10y' // 연계퇴직연금 직역재직 10년 미만 (예외 인정)
  | 'exception_lump_sum_5y' // 일시금 수령 후 5년 경과 (예외 인정)
  | 'special_old_age' // 특례 대상자 (종전 기초노령/장애인연금 특례자)
;

// 시뮬레이터 입력 데이터 모델
export interface SimulationInput {
  // 거주지
  region: RegionType;
  facilityLiving: boolean; // 보장시설 입소 여부

  // 신청인(본인) 인적사항
  applicantAge: number;
  applicantDisability: DisabilityDegree;
  applicantOccupationalPension: OccupationalPensionType;
  applicantWelfareStatus: WelfareStatus;
  applicantIsStudent18to20: boolean; // 18~20세 초중등교육법 학교 재학 여부

  // 배우자 유무 및 인적사항
  hasSpouse: boolean;
  spouseAge: number;
  spouseDisability: DisabilityDegree;
  spouseOccupationalPension: OccupationalPensionType;
  isSeparatedOrDivorcedDeFacto: boolean; // 사실이혼 인정 여부

  // 국민연금 정보 (기초연금 감액 산정용)
  applicantNationalPension: number; // 월 국민연금 급여액 (부양가족연금 제외)
  applicantNationalPensionA: number; // A급여액 (소득재분배 부분)
  spouseNationalPension: number;
  spouseNationalPensionA: number;

  // 소득 정보 (본인 + 배우자 월액, 원)
  applicantEarnedIncome: number; // 본인 상시근로소득
  spouseEarnedIncome: number; // 배우자 상시근로소득
  businessIncome: number; // 기타사업 및 임대소득
  interestIncome: number; // 금융 이자소득
  privatePensionIncome: number; // 사적 연금소득
  publicTransferIncome: number; // 기타 공적이전소득 (국민연금 제외분)
  
  // 무료임차소득 (자녀 명의 6억원 이상 주택 동거)
  childLuxuryHouseValue: number; // 자녀 주택 시가표준액
  childOwnershipShare: number; // 자녀 지분율 (0 ~ 1)

  // 일반재산 (토지, 건물, 주택 등 시가표준액, 원)
  realEstateValue: number; // 부동산 시가표준액
  rentalDeposit: number; // 전월세 임차보증금 (자가가 아닌 경우)
  
  // 금융재산 (예적금, 주식, 보험환급금 등, 원)
  financialAssets: number;

  // 부채 (금융기관 대출, 법원 판결 사채 등, 원)
  financialDebt: number;
  rentDepositDebt: number; // 임대한 주택 등의 임대보증금 부채

  // 소득환산율 100% 적용 재산 (P값)
  luxuryCarValue: number; // 4,000만원 이상 10년 미만 승용차 가액
  hasDisabledCarExemption: boolean; // 장애인/국가유공자 차량 1대 비과세 제외 적용 여부
  membershipValue: number; // 골프/콘도 등 회원권 가액
}

// 기초연금 산정 결과
export interface BasicPensionResult {
  isEligible: boolean;
  reason: string;
  householdType: 'single' | 'couple_1person' | 'couple_2person';
  threshold: number; // 선정기준액
  
  // 소득인정액 내역
  earnedIncomeEvaluation: number; // 상시근로소득 평가액
  otherIncomeEvaluation: number; // 기타소득 평가액
  totalIncomeEvaluation: number; // 소득평가액
  
  generalProperty: number; // 일반재산 (임차보증금 95% 반영 포함)
  basicPropertyDeduction: number; // 기본재산액 공제
  netGeneralProperty: number;
  financialProperty: number; // 금융재산
  financialDeduction: number; // 금융공제 (2,000만원)
  netFinancialProperty: number;
  totalDebt: number; // 부채
  netPropertyBeforeRate: number; // 환산 전 순재산
  propertyMonthlyConversion: number; // 일반재산 월 환산액 (연 4% / 12)
  pValue: number; // 월 100% 가산액 (고급차, 회원권)
  totalPropertyConversion: number; // 재산의 소득환산액
  
  recognizedIncome: number; // 최종 소득인정액
  marginToThreshold: number; // 차액 (선정기준액 - 소득인정액)

  // 급여액 계산
  applicantBaseAmount: number; // 국민연금 연계 등 기초연금 산정액
  spouseBaseAmount: number;
  coupleReductionApplied: boolean;
  applicantAfterCoupleReduction: number;
  spouseAfterCoupleReduction: number;
  incomeInversionDeductionApplied: boolean;
  
  applicantFinalAmount: number; // 최종 지급액
  spouseFinalAmount: number;
  totalHouseholdAmount: number; // 가구 총 수령액
}

// 장애인연금 산정 결과
export interface DisabilityPensionResult {
  isEligible: boolean;
  reason: string;
  householdType: 'single' | 'couple';
  threshold: number; // 선정기준액 (140만원 / 224만원)
  
  // 소득인정액 내역
  earnedIncomeEvaluation: number; // 상시근로 (95만원 공제 후 30%)
  totalIncomeEvaluation: number;
  totalPropertyConversion: number;
  recognizedIncome: number;
  marginToThreshold: number;

  // 급여액 내역
  applicantBasicBenefit: number; // 기초급여 (18~64세)
  applicantAdditionalBenefit: number; // 부가급여
  applicantTotalBenefit: number;
  
  spouseBasicBenefit: number;
  spouseAdditionalBenefit: number;
  spouseTotalBenefit: number;

  totalHouseholdBenefit: number;
  classificationName: string; // 예: 기초수급 재가, 차상위계층, 차상위초과자 등
  is65OrOlderNote: string; // 65세 도래 시 기초연금 전환 안내
}

// 경증 장애수당 및 장애아동수당 결과
export interface DisabilityAllowanceResult {
  isApplicable: boolean;
  programName: string; // 장애수당 or 장애아동수당 or 해당없음
  monthlyAmount: number;
  qualificationDetail: string;
}

// 전체 통합 진단 결과
export interface IntegratedDiagnosisResult {
  basicPension: BasicPensionResult;
  disabilityPension: DisabilityPensionResult;
  disabilityAllowance: DisabilityAllowanceResult;
  optimalRecommendation: string;
  recommendedActions: string[];
}
