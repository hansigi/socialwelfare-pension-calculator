import React, { useState, useMemo } from 'react';
import {
  Calculator,
  User,
  Users,
  Building2,
  Briefcase,
  Home,
  Wallet,
  Car,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  Info,
  ShieldCheck,
  TrendingDown,
  Printer,
  X,
  FileText,
  DollarSign,
  Coins,
} from 'lucide-react';

// ==========================================
// 1. 2026년도 공식 지침 기준 상수 및 데이터
// ==========================================

// 거주지별 기본재산액 공제 (2026년 기준)
const REGION_DATA = {
  large: {
    name: '대도시 / 특례시 (대구·서울·부산 등)',
    desc: '특별시, 광역시(도농복합군 포함), 특례시(수원·고양·용인·창원·화성)',
    deduction: 135_000_000, // 1억 3,500만원
    label: '1억 3,500만원',
  },
  medium: {
    name: '중소도시 / 세종',
    desc: '도의 ‘시’, 세종특별자치시',
    deduction: 85_000_000, // 8,500만원
    label: '8,500만원',
  },
  rural: {
    name: '농어촌',
    desc: '도의 ‘군’ (농어촌)',
    deduction: 72_500_000, // 7,250만원
    label: '7,250만원',
  },
};

// 2026년 지침 핵심 공식 상수
const STANDARDS_2026 = {
  // [기초연금]
  BASIC_PENSION_THRESHOLD_SINGLE: 2_470_000, // 2026 선정기준액 (단독)
  BASIC_PENSION_THRESHOLD_COUPLE: 3_952_000, // 2026 선정기준액 (부부)
  BASIC_PENSION_STANDARD: 349_700, // 기준연금액 (100%)
  BASIC_PENSION_ADDITIONAL: 174_850, // 부가연금액 (50%)
  BASIC_PENSION_MIN: 34_970, // 최저연금액 (10%)
  BASIC_EARNED_DEDUCTION: 1_160_000, // 상시근로 기본공제 월 116만원
  BASIC_EARNED_ADDITIONAL_RATE: 0.3, // 30% 추가공제 (반영률 0.7)

  // [장애인연금]
  DISABILITY_PENSION_THRESHOLD_SINGLE: 1_400_000, // 2026 선정기준액 (단독)
  DISABILITY_PENSION_THRESHOLD_COUPLE: 2_240_000, // 2026 선정기준액 (부부)
  DISABILITY_BASIC_MAX: 349_700, // 기초급여 최고액 (18~64세)
  DISABILITY_EARNED_DEDUCTION: 950_000, // 상시근로 기본공제 월 95만원 (2026 인상)
  DISABILITY_EARNED_ADDITIONAL_RATE: 0.3, // 30% 추가공제 (반영률 0.7)

  // [장애인연금 부가급여 단가 (2026년 기준)]
  DISABILITY_ADDITIONAL: {
    LIVING_MEDICAL_HOME: { UNDER_65: 90_000, OVER_65: 439_700 }, // 생계·의료 재가
    LIVING_MEDICAL_FACILITY: { UNDER_65: 0, OVER_65: 0 }, // 보장시설
    NEAR_POVERTY: { UNDER_65: 80_000, OVER_65: 80_000 }, // 차상위계층 (주거·교육급여 포함)
    ABOVE_NEAR_POVERTY: { UNDER_65: 30_000, OVER_65: 50_000 }, // 차상위 초과자
  },

  // [경증 장애수당 (18세 이상)]
  ADULT_MILD_ALLOWANCE: {
    LIVING_MEDICAL_HOME: 60_000,
    LIVING_MEDICAL_FACILITY: 30_000,
    NEAR_POVERTY: 60_000,
  },

  // [공통 재산/소득 환산 상수]
  FINANCIAL_DEDUCTION: 20_000_000, // 금융재산 기본공제 가구당 2,000만원
  PROPERTY_RATE_ANNUAL: 0.04, // 재산 소득환산율 연 4%
  PROPERTY_RATE_MONTHLY: 0.04 / 12, // 월 환산율 (약 0.333%)
  RENT_DEPOSIT_RECOGNITION_RATE: 0.95, // 주거용 임차보증금 95% 반영 (5% 공제)
  INTEREST_DEDUCTION: 40_000, // 이자소득 월 4만원 공제
  LUXURY_CAR_THRESHOLD: 40_000_000, // 고급자동차 가액 4,000만원 이상
  FREE_RENT_THRESHOLD: 600_000_000, // 자녀 고가주택 6억원 이상
  FREE_RENT_ANNUAL_RATE: 0.0078, // 무료임차소득 연 0.78% ÷ 12
};

// 10원 단위 절사 헬퍼 (기초연금법 제24조)
function floorTo10(num: number): number {
  return Math.floor(num / 10) * 10;
}

// 안전한 숫자 변환 (공란인 경우 0으로 계산)
function numVal(v: number | ''): number {
  return typeof v === 'number' && !isNaN(v) ? v : 0;
}

// 한글 금액 변환 포맷터 (공란이거나 0원이면 빈 문자열 반환하여 공란 상태 유지)
function toKoreanCurrency(num: number | ''): string {
  if (num === '' || typeof num !== 'number' || num <= 0) return '';
  const eok = Math.floor(num / 100_000_000);
  const man = Math.floor((num % 100_000_000) / 10_000);
  const won = num % 10_000;

  let str = '';
  if (eok > 0) str += `${eok}억 `;
  if (man > 0) str += `${man.toLocaleString()}만 `;
  if (won > 0 && eok === 0 && man === 0) str += `${won.toLocaleString()}원`;
  else if (str !== '') str += '원';
  return str.trim();
}

// ==========================================
// 2. 메인 앱 컴포넌트
// ==========================================
export default function App() {
  // 모드 선택: 기초연금 / 장애인연금 (단일 수급 원칙)
  const [targetType, setTargetType] = useState<'basic' | 'disability'>('basic');
  const [showBreakdown, setShowBreakdown] = useState<boolean>(true);
  const [showNotice, setShowNotice] = useState<boolean>(false);

  // [1. 기본 가구 정보] - 첫 화면 진입 시 모두 공란('')으로 시작
  const [region, setRegion] = useState<'large' | 'medium' | 'rural'>('large');
  const [facilityLiving, setFacilityLiving] = useState<boolean>(false);
  const [applicantAge, setApplicantAge] = useState<number | ''>(''); // 공란 시작
  const [applicantDisability, setApplicantDisability] = useState<'none' | 'severe' | 'mild'>('none');
  const [applicantWelfare, setApplicantWelfare] = useState<'general' | 'basic_living' | 'near_poverty'>('general');
  const [applicantOccupationalPension, setApplicantOccupationalPension] = useState<'none' | 'recipient' | 'exception'>('none');

  // 배우자 정보
  const [hasSpouse, setHasSpouse] = useState<boolean>(false);
  const [spouseAge, setSpouseAge] = useState<number | ''>(''); // 공란 시작
  const [spouseDisability, setSpouseDisability] = useState<'none' | 'severe' | 'mild'>('none');
  const [spouseOccupationalPension, setSpouseOccupationalPension] = useState<'none' | 'recipient' | 'exception'>('none');
  const [isDeFactoDivorced, setIsDeFactoDivorced] = useState<boolean>(false);

  // [2. 소득 정보 (월액, 원 단위)] - 공란 시작
  const [applicantEarned, setApplicantEarned] = useState<number | ''>(''); 
  const [spouseEarned, setSpouseEarned] = useState<number | ''>(''); 
  const [applicantNationalPension, setApplicantNationalPension] = useState<number | ''>(''); 
  const [applicantNationalPensionA, setApplicantNationalPensionA] = useState<number | ''>(''); 
  const [spouseNationalPension, setSpouseNationalPension] = useState<number | ''>('');
  const [businessIncome, setBusinessIncome] = useState<number | ''>(''); 
  const [interestIncome, setInterestIncome] = useState<number | ''>(''); 
  const [privatePensionIncome, setPrivatePensionIncome] = useState<number | ''>(''); 
  const [publicTransferIncome, setPublicTransferIncome] = useState<number | ''>(''); 
  const [childHouseValue, setChildHouseValue] = useState<number | ''>(''); 

  // [3. 재산 및 부채 정보 (원 단위)] - 부동산, 금융재산 등 모두 공란 시작
  const [realEstateValue, setRealEstateValue] = useState<number | ''>(''); 
  const [rentalDeposit, setRentalDeposit] = useState<number | ''>(''); 
  const [financialAssets, setFinancialAssets] = useState<number | ''>(''); 
  const [financialDebt, setFinancialDebt] = useState<number | ''>(''); 
  const [rentDepositDebt, setRentDepositDebt] = useState<number | ''>(''); 
  const [luxuryCarValue, setLuxuryCarValue] = useState<number | ''>(''); 
  const [hasDisabledCarExemption, setHasDisabledCarExemption] = useState<boolean>(false); 
  const [membershipValue, setMembershipValue] = useState<number | ''>(''); 

  // ==========================================
  // 3. 2026 기초연금 계산 엔진 (지침서 수식 변환)
  // ==========================================
  const basicCalc = useMemo(() => {
    const isCouple = hasSpouse && !isDeFactoDivorced;
    const threshold = isCouple
      ? STANDARDS_2026.BASIC_PENSION_THRESHOLD_COUPLE // 3,952,000원
      : STANDARDS_2026.BASIC_PENSION_THRESHOLD_SINGLE; // 2,470,000원

    const appAge = numVal(applicantAge);
    const spAge = numVal(spouseAge);
    const appEarned = numVal(applicantEarned);
    const spEarned = numVal(spouseEarned);
    const appNp = numVal(applicantNationalPension);
    const appNpA = numVal(applicantNationalPensionA);
    const spNp = numVal(spouseNationalPension);
    const bizInc = numVal(businessIncome);
    const intInc = numVal(interestIncome);
    const privPension = numVal(privatePensionIncome);
    const pubTransfer = numVal(publicTransferIncome);
    const childHouse = numVal(childHouseValue);
    const realEstate = numVal(realEstateValue);
    const rentDep = numVal(rentalDeposit);
    const finAsset = numVal(financialAssets);
    const finDebt = numVal(financialDebt);
    const rentDebt = numVal(rentDepositDebt);
    const luxuryCar = numVal(luxuryCarValue);
    const membership = numVal(membershipValue);

    const hasEnteredAge = applicantAge !== '' && appAge > 0;
    const isPending = !hasEnteredAge;

    // 1) 상시근로소득 평가액: 1인당 116만원 공제 후 30% 추가공제 (0.7 곱함)
    const appEarnedEval = Math.max(
      0,
      Math.round(Math.max(0, appEarned - STANDARDS_2026.BASIC_EARNED_DEDUCTION) * (1 - STANDARDS_2026.BASIC_EARNED_ADDITIONAL_RATE))
    );
    const spEarnedEval = isCouple
      ? Math.max(
          0,
          Math.round(Math.max(0, spEarned - STANDARDS_2026.BASIC_EARNED_DEDUCTION) * (1 - STANDARDS_2026.BASIC_EARNED_ADDITIONAL_RATE))
        )
      : 0;
    const totalEarnedEval = appEarnedEval + spEarnedEval;

    // 2) 이자소득 공제: 월 4만원 공제
    const interestEval = Math.max(0, intInc - STANDARDS_2026.INTEREST_DEDUCTION);

    // 3) 무료임차소득: 자녀 소유 6억원 이상 주택 무료임차 거주 시 (시가 × 0.78% ÷ 12)
    const freeRent = childHouse >= STANDARDS_2026.FREE_RENT_THRESHOLD
      ? Math.round((childHouse * STANDARDS_2026.FREE_RENT_ANNUAL_RATE) / 12)
      : 0;

    // 4) 공적이전소득 (국민연금 포함)
    const totalNp = appNp + (isCouple ? spNp : 0);
    const otherIncomeEval = bizInc + interestEval + privPension + pubTransfer + totalNp + freeRent;
    const totalIncomeEval = totalEarnedEval + otherIncomeEval;

    // 5) 재산의 소득환산액 계산
    const basicDeduction = REGION_DATA[region].deduction; // 대도시 1억 3,500만원
    const rentDepositEval = Math.round(rentDep * STANDARDS_2026.RENT_DEPOSIT_RECOGNITION_RATE); // 95% 반영
    const generalProp = realEstate + rentDepositEval;
    const netGeneral = Math.max(0, generalProp - basicDeduction);

    const netFinancial = Math.max(0, finAsset - STANDARDS_2026.FINANCIAL_DEDUCTION);

    // 부채 공제 (임대보증금은 시가표준액의 50% 한도 인정)
    const maxRentDebtAllowed = realEstate * 0.5;
    const validRentDebt = Math.min(rentDebt, maxRentDebtAllowed);
    const totalDebt = finDebt + validRentDebt;

    // 순재산액 = (일반재산 - 기본재산액) + (금융재산 - 2000만) - 부채
    const netPropertyBeforeRate = Math.max(0, netGeneral + netFinancial - totalDebt);
    // 월 소득환산액 = 순재산액 × 4% ÷ 12개월
    const propertyMonthly = Math.round(netPropertyBeforeRate * STANDARDS_2026.PROPERTY_RATE_MONTHLY);

    // P값 (고급자동차 4,000만원 이상 10년 미만 및 회원권 가액은 월 100% 소득환산)
    let pVal = membership;
    if (luxuryCar >= STANDARDS_2026.LUXURY_CAR_THRESHOLD && !hasDisabledCarExemption) {
      pVal += luxuryCar;
    }

    const totalPropertyConversion = propertyMonthly + pVal;
    const recognizedIncome = totalIncomeEval + totalPropertyConversion;
    const margin = threshold - recognizedIncome;

    // 자격 판정
    const ageValid = appAge >= 65;
    const pensionExcluded =
      applicantOccupationalPension === 'recipient' ||
      (isCouple && spouseOccupationalPension === 'recipient');
    const incomeValid = recognizedIncome <= threshold;
    const isEligible = hasEnteredAge && ageValid && !pensionExcluded && incomeValid;

    // 6) 개인별 기초연금액 산정 (국민연금 연계 감액 산식)
    let baseAmount = STANDARDS_2026.BASIC_PENSION_STANDARD; // 349,700원
    if (appNp > 524_550) {
      // 150% 초과 시 연계산식: (기준연금액 - 2/3 * A) + 부가연금액 vs (250% - 국민연금액)
      const formA = Math.max(0, 349_700 - Math.round((2 / 3) * appNpA)) + STANDARDS_2026.BASIC_PENSION_ADDITIONAL;
      const formNP = Math.max(0, 874_250 - appNp);
      baseAmount = Math.min(349_700, Math.max(STANDARDS_2026.BASIC_PENSION_ADDITIONAL, Math.max(formA, formNP)));
    }

    // 7) 부부감액 (부부 모두 65세 이상 수급 시 각각 20% 감액)
    const coupleBothEligible = isCouple && spAge >= 65 && !spouseOccupationalPension.includes('recipient');
    const afterCoupleReduction = coupleBothEligible ? floorTo10(baseAmount * 0.8) : baseAmount;

    // 8) 소득역전방지 감액
    let finalAmount = afterCoupleReduction;
    let incomeInversionApplied = false;
    if (isEligible) {
      if (!coupleBothEligible) {
        if (recognizedIncome + afterCoupleReduction > threshold) {
          incomeInversionApplied = true;
          finalAmount = Math.max(STANDARDS_2026.BASIC_PENSION_MIN, threshold - recognizedIncome);
          finalAmount = floorTo10(finalAmount);
        }
      } else {
        const coupleSum = afterCoupleReduction * 2;
        if (recognizedIncome + coupleSum > threshold) {
          incomeInversionApplied = true;
          const householdSum = Math.max(STANDARDS_2026.BASIC_PENSION_MIN * 2, threshold - recognizedIncome);
          finalAmount = floorTo10(householdSum / 2);
        }
      }
    }

    const totalHousehold = coupleBothEligible ? finalAmount * 2 : finalAmount;

    return {
      isPending,
      hasEnteredAge,
      threshold,
      appEarnedEval,
      spEarnedEval,
      totalEarnedEval,
      interestEval,
      freeRent,
      otherIncomeEval,
      totalIncomeEval,
      basicDeduction,
      rentDepositEval,
      generalProp,
      netGeneral,
      netFinancial,
      validRentDebt,
      totalDebt,
      netPropertyBeforeRate,
      propertyMonthly,
      pVal,
      totalPropertyConversion,
      recognizedIncome,
      margin,
      isEligible,
      ageValid,
      pensionExcluded,
      incomeValid,
      baseAmount,
      coupleBothEligible,
      afterCoupleReduction,
      incomeInversionApplied,
      finalAmount,
      totalHousehold,
    };
  }, [
    region,
    hasSpouse,
    isDeFactoDivorced,
    applicantAge,
    spouseAge,
    applicantOccupationalPension,
    spouseOccupationalPension,
    applicantEarned,
    spouseEarned,
    applicantNationalPension,
    applicantNationalPensionA,
    spouseNationalPension,
    businessIncome,
    interestIncome,
    privatePensionIncome,
    publicTransferIncome,
    childHouseValue,
    realEstateValue,
    rentalDeposit,
    financialAssets,
    financialDebt,
    rentDepositDebt,
    luxuryCarValue,
    hasDisabledCarExemption,
    membershipValue,
  ]);

  // ==========================================
  // 4. 2026 장애인연금 계산 엔진 (지침서 수식 변환)
  // ==========================================
  const disabilityCalc = useMemo(() => {
    const isCouple = hasSpouse && !isDeFactoDivorced;
    const threshold = isCouple
      ? STANDARDS_2026.DISABILITY_PENSION_THRESHOLD_COUPLE // 2,240,000원
      : STANDARDS_2026.DISABILITY_PENSION_THRESHOLD_SINGLE; // 1,400,000원

    const appAge = numVal(applicantAge);
    const spAge = numVal(spouseAge);
    const appEarned = numVal(applicantEarned);
    const spEarned = numVal(spouseEarned);
    const bizInc = numVal(businessIncome);
    const intInc = numVal(interestIncome);
    const privPension = numVal(privatePensionIncome);
    const pubTransfer = numVal(publicTransferIncome);
    const childHouse = numVal(childHouseValue);
    const realEstate = numVal(realEstateValue);
    const rentDep = numVal(rentalDeposit);
    const finAsset = numVal(financialAssets);
    const finDebt = numVal(financialDebt);
    const rentDebt = numVal(rentDepositDebt);
    const luxuryCar = numVal(luxuryCarValue);
    const membership = numVal(membershipValue);

    const hasEnteredAge = applicantAge !== '' && appAge > 0;
    const hasEnteredDisability = applicantDisability !== 'none';
    const isPending = !hasEnteredAge || !hasEnteredDisability;

    // 1) 상시근로소득 기본공제: 월 95만원 공제 후 30% 추가공제
    const appEarnedEval = Math.max(
      0,
      Math.round(Math.max(0, appEarned - STANDARDS_2026.DISABILITY_EARNED_DEDUCTION) * (1 - STANDARDS_2026.DISABILITY_EARNED_ADDITIONAL_RATE))
    );
    const spEarnedEval = isCouple
      ? Math.max(
          0,
          Math.round(Math.max(0, spEarned - STANDARDS_2026.DISABILITY_EARNED_DEDUCTION) * (1 - STANDARDS_2026.DISABILITY_EARNED_ADDITIONAL_RATE))
        )
      : 0;
    const totalEarnedEval = appEarnedEval + spEarnedEval;

    const interestEval = Math.max(0, intInc - STANDARDS_2026.INTEREST_DEDUCTION);
    const freeRent = childHouse >= STANDARDS_2026.FREE_RENT_THRESHOLD
      ? Math.round((childHouse * STANDARDS_2026.FREE_RENT_ANNUAL_RATE) / 12)
      : 0;

    // 장애인연금 자체 급여 및 생계·의료급여는 소득평가액에서 제외
    const otherIncomeEval = bizInc + interestEval + privPension + pubTransfer + freeRent;
    const totalIncomeEval = totalEarnedEval + otherIncomeEval;

    // 2) 재산 소득환산액 계산
    const basicDeduction = REGION_DATA[region].deduction; // 대도시 1억 3,500만원
    const rentDepositEval = Math.round(rentDep * STANDARDS_2026.RENT_DEPOSIT_RECOGNITION_RATE);
    const generalProp = realEstate + rentDepositEval;
    const netGeneral = Math.max(0, generalProp - basicDeduction);

    const netFinancial = Math.max(0, finAsset - STANDARDS_2026.FINANCIAL_DEDUCTION);
    const maxRentDebtAllowed = realEstate * 0.5;
    const validRentDebt = Math.min(rentDebt, maxRentDebtAllowed);
    const totalDebt = finDebt + validRentDebt;

    const netPropertyBeforeRate = Math.max(0, netGeneral + netFinancial - totalDebt);
    const propertyMonthly = Math.round(netPropertyBeforeRate * STANDARDS_2026.PROPERTY_RATE_MONTHLY);

    // 장애인연금 특례: 등록장애인 소유 자동차 1대는 고급자동차(4천만원 이상)라도 재산산정 전액 제외!
    let pVal = membership;
    if (luxuryCar >= STANDARDS_2026.LUXURY_CAR_THRESHOLD && applicantDisability === 'none' && !hasDisabledCarExemption) {
      pVal += luxuryCar;
    }

    const totalPropertyConversion = propertyMonthly + pVal;
    const recognizedIncome = totalIncomeEval + totalPropertyConversion;
    const margin = threshold - recognizedIncome;

    // 자격 판정
    const isSevere = applicantDisability === 'severe';
    const ageValid = appAge >= 18;
    const isOver65 = appAge >= 65;
    const isBasicLiving = applicantWelfare === 'basic_living';
    const pensionExcluded =
      applicantOccupationalPension === 'recipient' ||
      (isCouple && spouseOccupationalPension === 'recipient');

    // 기초수급자는 별도 자산조사 없이 소득기준 충족 간주 (지침서 규정)
    const incomeValid = isBasicLiving || recognizedIncome <= threshold;
    const isEligible = hasEnteredDisability && isSevere && ageValid && !pensionExcluded && incomeValid;

    // 3) 기초급여 (18~64세 대상, 65세 이상은 기초연금 전환되어 0원)
    let basicBenefit = 0;
    if (isEligible && !isOver65) {
      if (isBasicLiving) {
        basicBenefit = STANDARDS_2026.DISABILITY_BASIC_MAX; // 349,700원
      } else {
        // 초과분 감액 계단식 절삭 (선정기준액 - 소득인정액 차액)
        const diff = threshold - recognizedIncome;
        if (diff > 340_000) {
          basicBenefit = STANDARDS_2026.DISABILITY_BASIC_MAX;
        } else {
          const step = Math.floor(Math.max(0, diff) / 20_000);
          basicBenefit = Math.max(20_000, Math.min(340_000, step * 20_000));
        }
      }
    }

    // 4) 부가급여 (18세 이상 누구나, 65세 이상도 계속 지급!)
    let additionalBenefit = 0;
    if (isEligible) {
      if (applicantWelfare === 'basic_living') {
        additionalBenefit = facilityLiving
          ? 0
          : isOver65
          ? STANDARDS_2026.DISABILITY_ADDITIONAL.LIVING_MEDICAL_HOME.OVER_65 // 439,700원 보전!
          : STANDARDS_2026.DISABILITY_ADDITIONAL.LIVING_MEDICAL_HOME.UNDER_65; // 90,000원
      } else if (applicantWelfare === 'near_poverty') {
        additionalBenefit = STANDARDS_2026.DISABILITY_ADDITIONAL.NEAR_POVERTY.UNDER_65; // 80,000원
      } else {
        additionalBenefit = isOver65
          ? STANDARDS_2026.DISABILITY_ADDITIONAL.ABOVE_NEAR_POVERTY.OVER_65 // 50,000원
          : STANDARDS_2026.DISABILITY_ADDITIONAL.ABOVE_NEAR_POVERTY.UNDER_65; // 30,000원
      }
    }

    return {
      isPending,
      hasEnteredAge,
      hasEnteredDisability,
      threshold,
      appEarnedEval,
      spEarnedEval,
      totalEarnedEval,
      otherIncomeEval,
      totalIncomeEval,
      netGeneral,
      netFinancial,
      totalDebt,
      netPropertyBeforeRate,
      propertyMonthly,
      pVal,
      totalPropertyConversion,
      recognizedIncome,
      margin,
      isEligible,
      isSevere,
      ageValid,
      isOver65,
      pensionExcluded,
      incomeValid,
      basicBenefit,
      additionalBenefit,
      totalMonthly: basicBenefit + additionalBenefit,
    };
  }, [
    region,
    hasSpouse,
    isDeFactoDivorced,
    facilityLiving,
    applicantAge,
    applicantDisability,
    applicantWelfare,
    applicantOccupationalPension,
    spouseOccupationalPension,
    applicantEarned,
    spouseEarned,
    businessIncome,
    interestIncome,
    privatePensionIncome,
    publicTransferIncome,
    childHouseValue,
    realEstateValue,
    rentalDeposit,
    financialAssets,
    financialDebt,
    rentDepositDebt,
    luxuryCarValue,
    hasDisabledCarExemption,
    membershipValue,
  ]);

  // 빠른 시나리오 프리셋 핸들러
  const applyPreset = (preset: 'elderly_single' | 'elderly_couple' | 'disabled_severe' | 'disabled_senior') => {
    if (preset === 'elderly_single') {
      setTargetType('basic');
      setRegion('large');
      setApplicantAge(68);
      setApplicantDisability('none');
      setApplicantWelfare('general');
      setApplicantOccupationalPension('none');
      setHasSpouse(false);
      setApplicantEarned(0);
      setApplicantNationalPension(0);
      setApplicantNationalPensionA(0);
      setRealEstateValue(0);
      setRentalDeposit(80_000_000);
      setFinancialAssets(15_000_000);
      setFinancialDebt(0);
      setRentDepositDebt(0);
      setLuxuryCarValue(0);
    } else if (preset === 'elderly_couple') {
      setTargetType('basic');
      setRegion('large');
      setApplicantAge(70);
      setApplicantDisability('none');
      setApplicantWelfare('general');
      setApplicantOccupationalPension('none');
      setHasSpouse(true);
      setSpouseAge(68);
      setApplicantEarned(0);
      setSpouseEarned(0);
      setApplicantNationalPension(550_000);
      setApplicantNationalPensionA(250_000);
      setRealEstateValue(150_000_000);
      setRentalDeposit(0);
      setFinancialAssets(25_000_000);
      setFinancialDebt(20_000_000);
      setRentDepositDebt(0);
      setLuxuryCarValue(0);
    } else if (preset === 'disabled_severe') {
      setTargetType('disability');
      setRegion('large');
      setApplicantAge(45);
      setApplicantDisability('severe');
      setApplicantWelfare('near_poverty');
      setApplicantOccupationalPension('none');
      setHasSpouse(false);
      setApplicantEarned(1_400_000);
      setApplicantNationalPension(0);
      setRealEstateValue(0);
      setRentalDeposit(40_000_000);
      setFinancialAssets(8_000_000);
      setFinancialDebt(0);
      setHasDisabledCarExemption(true);
    } else if (preset === 'disabled_senior') {
      setTargetType('basic');
      setRegion('large');
      setApplicantAge(72);
      setApplicantDisability('severe');
      setApplicantWelfare('basic_living');
      setApplicantOccupationalPension('none');
      setHasSpouse(false);
      setApplicantEarned(0);
      setApplicantNationalPension(0);
      setRealEstateValue(0);
      setRentalDeposit(30_000_000);
      setFinancialAssets(5_000_000);
      setFinancialDebt(0);
      setHasDisabledCarExemption(true);
    }
  };

  const handleReset = () => {
    setApplicantAge('');
    setSpouseAge('');
    setApplicantDisability('none');
    setApplicantWelfare('general');
    setApplicantOccupationalPension('none');
    setHasSpouse(false);
    setApplicantEarned('');
    setSpouseEarned('');
    setApplicantNationalPension('');
    setApplicantNationalPensionA('');
    setSpouseNationalPension('');
    setBusinessIncome('');
    setInterestIncome('');
    setPrivatePensionIncome('');
    setPublicTransferIncome('');
    setChildHouseValue('');
    setRealEstateValue('');
    setRentalDeposit('');
    setFinancialAssets('');
    setFinancialDebt('');
    setRentDepositDebt('');
    setLuxuryCarValue('');
    setHasDisabledCarExemption(false);
    setFacilityLiving(false);
    setMembershipValue('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* 1. 상단 글로벌 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                기초연금 · 장애인연금 통합 모의계산기
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium">
                보건복지부 사업안내 지침 기준 소득인정액 산식 및 수급액 정밀 시뮬레이터
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>초기화 (공란)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNotice(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>모의 결정통지서</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. 상단 고정 유의사항 배너 (화면 공간을 절약하는 슬림 & 컴팩트 디자인) */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-amber-200/70 py-1.5 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-amber-300 bg-[#FFFDF6] px-3.5 py-1.5 sm:py-2 flex items-center gap-2.5 shadow-xs">
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border border-amber-500 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
              !
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-snug font-normal">
              <strong className="font-bold text-amber-950 mr-1.5 text-xs sm:text-sm shrink-0">[유의사항]</strong>
              본 계산 결과는 신청 전 초기 상담을 통해 민원인이 진술한 정보를 바탕으로 모의 계산된 참고용 자료입니다. 실제 수급자 선정 여부는 급여 신청 후 차세대사회보장정보시스템(행복e음)을 통한 공적자료 조회, 금융재산 조사 및 통합조사관리팀의 실태조사 결과에 따라 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 3. 대표 시나리오 프리셋 바 */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 shrink-0 text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span>대표 사례 바로적용:</span>
          </span>
          <button
            type="button"
            onClick={() => applyPreset('elderly_single')}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors cursor-pointer text-sm"
          >
            독거 어르신 (68세·무연금)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('elderly_couple')}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors cursor-pointer text-sm"
          >
            부부 어르신 (70세/68세·국민연금)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('disabled_severe')}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors cursor-pointer text-sm"
          >
            중증장애인 (45세·차상위)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('disabled_senior')}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors cursor-pointer text-sm"
          >
            중증장애 어르신 (72세·기초연금 전환)
          </button>
        </div>
      </div>

      {/* 4. 메인 콘텐츠 (좌측 폼 + 우측 결과 요약) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* 모드 선택 탭 (단일 수급 원칙: 기초연금 or 장애인연금) */}
        <div className="mb-6 flex border-b border-slate-200 gap-8 text-base sm:text-lg font-bold">
          <button
            type="button"
            onClick={() => setTargetType('basic')}
            className={`pb-3 cursor-pointer transition-colors ${
              targetType === 'basic'
                ? 'text-blue-600 border-b-2 border-blue-600 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            기초연금 모의계산 (만 65세 이상)
          </button>
          <button
            type="button"
            onClick={() => setTargetType('disability')}
            className={`pb-3 cursor-pointer transition-colors ${
              targetType === 'disability'
                ? 'text-blue-600 border-b-2 border-blue-600 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            장애인연금 모의계산 (만 18세 ~ 64세 중증장애인)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===================================== */}
          {/* 좌측 입력 폼 컬럼 (7/12) */}
          {/* ===================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. 거주지 및 가구 기본 정보 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">1. 거주지 및 가구 기본 정보</h2>
              </div>

              {/* 거주지역 선택 */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-2">
                  주민등록상 거주지역 (기본재산액 공제 기준)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['large', 'medium', 'rural'] as const).map((key) => {
                    const item = REGION_DATA[key];
                    const selected = region === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRegion(key)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-600'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-sm sm:text-base font-bold">{item.name}</div>
                        <div className="text-xs sm:text-sm text-blue-700 font-bold mt-1 tabular-nums">
                          공제 {item.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  * 대구·서울·부산 등 특·광역시 및 특례시는 1억 3,500만원 공제 적용
                </p>
              </div>

              {/* 신청인 본인 정보 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                    신청인 연령 (만 나이)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={applicantAge}
                      onChange={(e) => setApplicantAge(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="absolute right-4 top-3.5 text-base text-slate-500 font-semibold">세</span>
                  </div>
                  <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">만 65세 도래 1개월 전 신청가능</span>
                </div>

                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                    장애 등록 여부
                  </label>
                  <select
                    value={applicantDisability}
                    onChange={(e) => setApplicantDisability(e.target.value as any)}
                    className="w-full px-4 py-3 text-base sm:text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    <option value="none">비장애 (장애 없음)</option>
                    <option value="severe">등록 중증장애인 (1·2급, 3급중복)</option>
                    <option value="mild">등록 경증장애인 (3~6급)</option>
                  </select>
                  <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">장애인연금은 중증장애인 대상</span>
                </div>

                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                    직역연금 수급 여부
                  </label>
                  <select
                    value={applicantOccupationalPension}
                    onChange={(e) => setApplicantOccupationalPension(e.target.value as any)}
                    className="w-full px-4 py-3 text-base sm:text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                  >
                    <option value="none">해당 없음 (비수급자)</option>
                    <option value="recipient">직역연금 수급권자 (제외)</option>
                    <option value="exception">예외 (재직10년미만/일시금5년)</option>
                  </select>
                  <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">공무원·군인·사학연금 등</span>
                </div>
              </div>

              {/* 복지 자격 (기초생활, 차상위) */}
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                  국민기초생활 및 차상위 자격 여부
                </label>
                <select
                  value={applicantWelfare}
                  onChange={(e) => setApplicantWelfare(e.target.value as any)}
                  className="w-full px-4 py-3 text-base sm:text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                >
                  <option value="general">일반 (해당 없음 / 차상위 초과)</option>
                  <option value="basic_living">국민기초생활보장 수급자 (생계 또는 의료급여)</option>
                  <option value="near_poverty">차상위계층 (주거·교육급여 또는 중위 50% 이하)</option>
                </select>
                <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">장애인연금 부가급여 및 감면 자격 산정 기준</span>
              </div>

              {/* 배우자 유무 토글 */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-base sm:text-lg font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={hasSpouse}
                    onChange={(e) => setHasSpouse(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>배우자 있음 (법률혼 / 사실혼 포함)</span>
                </label>

                {hasSpouse && (
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                        배우자 연령
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={spouseAge}
                        onChange={(e) => setSpouseAge(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full px-3.5 py-2.5 text-base sm:text-lg border border-slate-300 rounded-lg tabular-nums font-bold bg-white"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        배우자 장애 정도
                      </label>
                      <select
                        value={spouseDisability}
                        onChange={(e) => setSpouseDisability(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
                      >
                        <option value="none">비장애</option>
                        <option value="severe">등록 중증장애인</option>
                        <option value="mild">등록 경증장애인</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        배우자 직역연금
                      </label>
                      <select
                        value={spouseOccupationalPension}
                        onChange={(e) => setSpouseOccupationalPension(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
                      >
                        <option value="none">해당 없음</option>
                        <option value="recipient">직역연금 수급자</option>
                        <option value="exception">예외 인정</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. 소득 입력 폼 */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">2. 월 소득 정보 (세전 금액)</h2>
                </div>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">근로공제: 기초연금 116만원 / 장애인연금 95만원</span>
              </div>

              <div className="space-y-4">
                {/* 상시근로소득 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">신청인 본인 상시근로소득</span>
                      <span className="text-base sm:text-lg text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(applicantEarned)}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={applicantEarned}
                        onChange={(e) => setApplicantEarned(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 tabular-nums font-bold"
                        placeholder=""
                      />
                      <span className="absolute right-4 top-3.5 text-base text-slate-500 font-semibold">원/월</span>
                    </div>
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">일용근로, 공공일자리(노인일자리 등) 전액 제외</span>
                  </div>

                  {hasSpouse && (
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-base sm:text-lg font-bold text-slate-900">배우자 상시근로소득</span>
                        <span className="text-base sm:text-lg text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(spouseEarned)}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step={10000}
                          min={0}
                          value={spouseEarned}
                          onChange={(e) => setSpouseEarned(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                          className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 tabular-nums font-bold"
                          placeholder=""
                        />
                        <span className="absolute right-4 top-3.5 text-base text-slate-500 font-semibold">원/월</span>
                      </div>
                      <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">배우자도 1인당 기본공제 별도 적용</span>
                    </div>
                  )}
                </div>

                {/* 국민연금 수령 정보 */}
                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between text-base sm:text-lg font-bold text-slate-900">
                    <span>국민연금 수령 정보 (기초연금 감액 연계용)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = numVal(applicantNationalPension);
                        if (cur > 0) {
                          setApplicantNationalPensionA(Math.round(cur * 0.55));
                        }
                      }}
                      className="text-sm sm:text-base text-blue-600 hover:text-blue-800 font-bold cursor-pointer underline"
                    >
                      A급여액 자동 계산 (55%)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm sm:text-base font-bold text-slate-800">본인 월 국민연금액</span>
                        <span className="text-sm sm:text-base text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(applicantNationalPension)}</span>
                      </div>
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={applicantNationalPension}
                        onChange={(e) => setApplicantNationalPension(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full px-4 py-2.5 text-base sm:text-lg border border-slate-300 rounded-xl tabular-nums font-bold bg-white"
                        placeholder=""
                      />
                      <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1">부양가족연금액 제외한 월액</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm sm:text-base font-bold text-slate-800">국민연금 A급여액</span>
                        <span className="text-sm sm:text-base text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(applicantNationalPensionA)}</span>
                      </div>
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={applicantNationalPensionA}
                        onChange={(e) => setApplicantNationalPensionA(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full px-4 py-2.5 text-base sm:text-lg border border-slate-300 rounded-xl tabular-nums font-bold bg-white"
                        placeholder=""
                      />
                      <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1">국민연금 지급내역서의 균등부분(A)</span>
                    </div>
                  </div>

                  {hasSpouse && (
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm sm:text-base font-bold text-slate-800">배우자 월 국민연금액</span>
                        <span className="text-sm sm:text-base text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(spouseNationalPension)}</span>
                      </div>
                      <input
                        type="number"
                        step={10000}
                        min={0}
                        value={spouseNationalPension}
                        onChange={(e) => setSpouseNationalPension(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="w-full px-4 py-2.5 text-base sm:text-lg border border-slate-300 rounded-xl tabular-nums font-bold bg-white"
                        placeholder=""
                      />
                    </div>
                  )}
                </div>

                {/* 기타 사업·이자·사적연금 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">사업 및 임대소득</span>
                      <span className="text-base sm:text-lg text-slate-700 font-extrabold tabular-nums">{toKoreanCurrency(businessIncome)}</span>
                    </div>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={businessIncome}
                      onChange={(e) => setBusinessIncome(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">월 필요경비 제외 순소득</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">이자 및 배당소득</span>
                      <span className="text-base sm:text-lg text-slate-700 font-extrabold tabular-nums">{toKoreanCurrency(interestIncome)}</span>
                    </div>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={interestIncome}
                      onChange={(e) => setInterestIncome(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">월 4만원 자동 공제 적용</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">개인 사적연금 소득</span>
                      <span className="text-base sm:text-lg text-slate-700 font-extrabold tabular-nums">{toKoreanCurrency(privatePensionIncome)}</span>
                    </div>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={privatePensionIncome}
                      onChange={(e) => setPrivatePensionIncome(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">연금저축·퇴직연금 수령월액</span>
                  </div>
                </div>

                {/* 자녀 6억 이상 고가주택 무료임차 */}
                <div className="pt-2">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-base sm:text-lg font-bold text-slate-900">자녀 소유 고가주택(시가 6억 이상) 무료임차 거주</span>
                    <span className="text-base sm:text-lg text-slate-700 font-extrabold tabular-nums">{toKoreanCurrency(childHouseValue)}</span>
                  </div>
                  <input
                    type="number"
                    step={10000000}
                    min={0}
                    value={childHouseValue}
                    onChange={(e) => setChildHouseValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                    placeholder=""
                  />
                  <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">자녀 명의 6억원 이상 주택에 무료 거주 시 연 0.78% ÷ 12개월 부과 (6억원 미만 공란)</span>
                </div>
              </div>
            </div>

            {/* 3. 재산 및 부채 입력 폼 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Home className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">3. 재산 및 부채 정보</h2>
                </div>
                <span className="text-sm sm:text-base text-slate-600 font-medium">순재산 월 4%÷12 환산, 고급차·회원권 100%</span>
              </div>

              <div className="space-y-5">
                {/* 부동산 및 임차보증금 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">부동산 시가표준액 (토지, 건물, 자가)</span>
                      <span className="text-base sm:text-lg text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(realEstateValue)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={realEstateValue}
                      onChange={(e) => setRealEstateValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">공시가격 기준 (기본재산액 공제 자동 적용)</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">주거용 전·월세 임차보증금</span>
                      <span className="text-base sm:text-lg text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(rentalDeposit)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={rentalDeposit}
                      onChange={(e) => setRentalDeposit(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">임대차계약서 금액의 95%만 재산 반영 (5% 기본공제)</span>
                  </div>
                </div>

                {/* 금융재산 및 부채 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">금융재산 (예적금·주식·보험)</span>
                      <span className="text-base sm:text-lg text-blue-700 font-extrabold tabular-nums">{toKoreanCurrency(financialAssets)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={financialAssets}
                      onChange={(e) => setFinancialAssets(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">가구당 2,000만원 기본공제 적용</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">금융기관 대출금 (부채)</span>
                      <span className="text-base sm:text-lg text-rose-700 font-extrabold tabular-nums">{toKoreanCurrency(financialDebt)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={financialDebt}
                      onChange={(e) => setFinancialDebt(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">은행 대출, 주택연금 누계액 등</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">임대보증금 부채 (전세 준 경우)</span>
                      <span className="text-base sm:text-lg text-rose-700 font-extrabold tabular-nums">{toKoreanCurrency(rentDepositDebt)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={rentDepositDebt}
                      onChange={(e) => setRentDepositDebt(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">부동산 시가표준액의 50% 한도 인정</span>
                  </div>
                </div>

                {/* 고급자동차 및 회원권 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">고급자동차 (4천만원 이상 10년 미만)</span>
                      <span className="text-base sm:text-lg text-amber-800 font-extrabold tabular-nums">{toKoreanCurrency(luxuryCarValue)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={luxuryCarValue}
                      onChange={(e) => setLuxuryCarValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <label className="flex items-center gap-2 text-sm sm:text-base text-slate-800 mt-2.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={hasDisabledCarExemption}
                        onChange={(e) => setHasDisabledCarExemption(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span>등록장애인 차량 1대 비과세 재산산정 제외 특례</span>
                    </label>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-slate-900">회원권 가액 (골프·콘도·승마 등)</span>
                      <span className="text-base sm:text-lg text-amber-800 font-extrabold tabular-nums">{toKoreanCurrency(membershipValue)}</span>
                    </div>
                    <input
                      type="number"
                      step={1000000}
                      min={0}
                      value={membershipValue}
                      onChange={(e) => setMembershipValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-3 text-lg sm:text-xl border border-slate-300 rounded-xl tabular-nums font-bold"
                      placeholder=""
                    />
                    <span className="text-sm sm:text-base text-slate-600 font-medium block mt-1.5">시가표준액 100% 월 소득환산 반영</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================== */}
          {/* 우측 실시간 결과 요약 패널 컬럼 (5/12) */}
          {/* ===================================== */}
          <div className="lg:col-span-5 space-y-5 sticky top-20">
            {/* 기초연금 결과 카드 */}
            {targetType === 'basic' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">기초연금 모의 판정</h3>
                  </div>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      basicCalc.isPending
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : basicCalc.isEligible
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {basicCalc.isPending
                      ? '정보 입력 대기'
                      : basicCalc.isEligible
                      ? '수급 적합'
                      : '수급 제외'}
                  </span>
                </div>

                <div className="py-4 border-b border-slate-100">
                  <div className="text-sm sm:text-base text-slate-600 font-bold mb-1">
                    예상 월 수급액 (가구 총액)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-blue-700 tabular-nums">
                      {basicCalc.isPending
                        ? '—'
                        : basicCalc.isEligible
                        ? basicCalc.totalHousehold.toLocaleString()
                        : '0'}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-slate-600">원 / 월</span>
                  </div>
                  {basicCalc.isPending ? (
                    <div className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                      신청인 연령(만 65세 이상) 및 소득·재산 정보를 입력하시면 실시간 결과가 계산됩니다.
                    </div>
                  ) : basicCalc.isEligible && basicCalc.coupleBothEligible ? (
                    <div className="text-sm sm:text-base text-slate-700 mt-2 font-semibold">
                      부부 2인 수급: 본인 {basicCalc.finalAmount.toLocaleString()}원 + 배우자 {basicCalc.finalAmount.toLocaleString()}원 (부부감액 20% 적용)
                    </div>
                  ) : null}
                </div>

                {/* 소득인정액 세부 요약 */}
                <div className="pt-4 space-y-3 text-base sm:text-lg">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-bold">선정기준액:</span>
                    <span className="font-extrabold text-slate-950 tabular-nums">
                      {basicCalc.threshold.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">산출 소득평가액:</span>
                    <span className="tabular-nums font-bold text-slate-900">{basicCalc.totalIncomeEval.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">재산 소득환산액:</span>
                    <span className="tabular-nums font-bold text-slate-900">{basicCalc.totalPropertyConversion.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-950 pt-2.5 border-t border-slate-200 text-lg sm:text-xl">
                    <span>최종 소득인정액:</span>
                    <span className={`tabular-nums ${basicCalc.incomeValid ? 'text-blue-700' : 'text-rose-700'}`}>
                      {basicCalc.recognizedIncome.toLocaleString()}원
                    </span>
                  </div>
                  {!basicCalc.isPending && (
                    <div className="flex justify-between text-sm sm:text-base text-slate-600 font-semibold">
                      <span>선정기준액 대비:</span>
                      <span className={`font-extrabold tabular-nums ${basicCalc.margin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {basicCalc.margin >= 0 ? `+${basicCalc.margin.toLocaleString()}원 여유` : `${Math.abs(basicCalc.margin).toLocaleString()}원 초과`}
                      </span>
                    </div>
                  )}
                </div>

                {!basicCalc.isPending && !basicCalc.isEligible && (
                  <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      {!basicCalc.ageValid && <div>• 만 65세 미만으로 수급 연령 미도래</div>}
                      {basicCalc.pensionExcluded && <div>• 직역연금(공무원/군인 등) 수급권자 또는 그 배우자 제외</div>}
                      {!basicCalc.incomeValid && <div>• 소득인정액이 선정기준액({basicCalc.threshold.toLocaleString()}원)을 초과함</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 장애인연금 결과 카드 */}
            {targetType === 'disability' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">장애인연금 모의 판정</h3>
                  </div>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      disabilityCalc.isPending
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : disabilityCalc.isEligible
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {disabilityCalc.isPending
                      ? '정보 입력 대기'
                      : disabilityCalc.isEligible
                      ? '수급 적합'
                      : '수급 제외'}
                  </span>
                </div>

                <div className="py-4 border-b border-slate-100">
                  <div className="text-sm sm:text-base text-slate-600 font-bold mb-1">예상 월 수급액</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-emerald-700 tabular-nums">
                      {disabilityCalc.isPending
                        ? '—'
                        : disabilityCalc.isEligible
                        ? disabilityCalc.totalMonthly.toLocaleString()
                        : '0'}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-slate-600">원 / 월</span>
                  </div>
                  {disabilityCalc.isPending ? (
                    <div className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                      신청인 연령 및 장애 등록 구분을 선택하시면 실시간 판정 결과가 계산됩니다.
                    </div>
                  ) : disabilityCalc.isEligible ? (
                    <div className="text-sm sm:text-base text-slate-700 mt-2 flex flex-wrap items-center gap-2 font-semibold">
                      <span>기초급여: <strong className="tabular-nums font-bold">{disabilityCalc.basicBenefit.toLocaleString()}원</strong></span>
                      <span>·</span>
                      <span>부가급여: <strong className="tabular-nums font-bold text-emerald-700">{disabilityCalc.additionalBenefit.toLocaleString()}원</strong></span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-4 space-y-3 text-base sm:text-lg">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-bold">선정기준액:</span>
                    <span className="font-extrabold text-slate-950 tabular-nums">
                      {disabilityCalc.threshold.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">장애인연금 소득인정액:</span>
                    <span className={`tabular-nums font-bold ${disabilityCalc.incomeValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {disabilityCalc.recognizedIncome.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">상시근로 기본공제액:</span>
                    <span className="tabular-nums font-bold text-slate-900">950,000원 적용</span>
                  </div>
                  {disabilityCalc.isOver65 && (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-slate-800 space-y-2 mt-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 text-sm sm:text-base">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>만 65세 이상: 기초연금 전환 대상</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        장애인연금(기초급여)과 기초연금은 중복 수급이 되지 않으며, 만 65세가 도래하면 기초급여는 기초연금으로 자동 전환됩니다.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTargetType('basic')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        <span>기초연금 모의계산으로 이동 →</span>
                      </button>
                    </div>
                  )}
                </div>

                {!disabilityCalc.isPending && !disabilityCalc.isEligible && (
                  <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      {!disabilityCalc.isSevere && <div>• 중증장애인(종전 1·2급, 3급중복) 미등록 상태</div>}
                      {!disabilityCalc.ageValid && <div>• 만 18세 미만 (장애아동수당 대상)</div>}
                      {disabilityCalc.pensionExcluded && <div>• 직역연금 수급권자 또는 그 배우자 제외</div>}
                      {!disabilityCalc.incomeValid && <div>• 소득인정액이 선정기준액({disabilityCalc.threshold.toLocaleString()}원)을 초과함</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 이동통신요금 감면 안내 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-700 space-y-2 shadow-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>복지대상자 이동통신요금 감면 안내</span>
              </div>
              <p className="leading-relaxed">
                기초연금 또는 장애인연금(장애수당) 수급자는 이동통신요금 월 최대 <strong>11,000원</strong>(청구금액 22,000원 미만 시 50%)을 감면받을 수 있습니다. 신청 시 함께 동의하세요.
              </p>
            </div>

            {/* 공식 결정통지서 및 상세산출표 바로가기 액션 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex-1 py-3 px-4 text-sm font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{showBreakdown ? '산출내역표 접기' : '산출내역표 펼치기'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowNotice(true)}
                className="flex-1 py-3 px-4 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                모의 결정통지서 보기
              </button>
            </div>
          </div>
        </div>

        {/* 하단 상세 산출 내역표 (조건부 토글) */}
        {showBreakdown && (
          <div className="mt-10 pt-8 border-t border-slate-200">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    소득인정액 산출 상세 내역표
                  </h3>
                </div>
                <span className="text-sm font-mono text-slate-500 font-medium">
                  소득평가액 + 재산 소득환산액 = 최종 소득인정액
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm sm:text-base">
                {/* 1. 소득평가액 내역 */}
                <div className="space-y-3.5 p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base">1) 월 소득평가액 산출</h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span>• 신청인 상시근로소득:</span>
                      <span className="tabular-nums font-semibold">{numVal(applicantEarned).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-blue-700 pl-2 font-medium">
                      <span>- 기본공제 ({targetType === 'disability' ? '95만원' : '116만원'}) 후 30% 추가공제</span>
                      <span className="tabular-nums font-bold">
                        = {targetType === 'disability' ? disabilityCalc.totalEarnedEval.toLocaleString() : basicCalc.totalEarnedEval.toLocaleString()}원
                      </span>
                    </div>
                    {hasSpouse && (
                      <div className="flex justify-between pl-2">
                        <span>• 배우자 상시근로 반영액:</span>
                        <span className="tabular-nums font-semibold">{toKoreanCurrency(spouseEarned)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>• 사업 및 임대소득:</span>
                      <span className="tabular-nums font-semibold">{numVal(businessIncome).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 이자소득 (월 4만원 공제 후):</span>
                      <span className="tabular-nums font-semibold">{Math.max(0, numVal(interestIncome) - 40_000).toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 국민연금 및 공적이전소득:</span>
                      <span className="tabular-nums font-semibold">
                        {(numVal(applicantNationalPension) + (hasSpouse ? numVal(spouseNationalPension) : 0) + numVal(publicTransferIncome)).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-200 text-base">
                      <span>월 소득평가액 합계:</span>
                      <span className="tabular-nums text-blue-700 font-black">
                        {targetType === 'disability'
                          ? disabilityCalc.totalIncomeEval.toLocaleString()
                          : basicCalc.totalIncomeEval.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. 재산의 소득환산액 내역 */}
                <div className="space-y-3.5 p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-base">2) 재산의 소득환산액 산출</h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span>• 부동산 + 임차보증금(95%):</span>
                      <span className="tabular-nums font-semibold">
                        {(numVal(realEstateValue) + Math.round(numVal(rentalDeposit) * 0.95)).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between text-blue-700 pl-2 font-medium">
                      <span>- 기본재산액 공제 ({REGION_DATA[region].name}):</span>
                      <span className="tabular-nums font-bold">
                        -{REGION_DATA[region].deduction.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 금융재산 (2,000만원 공제 후):</span>
                      <span className="tabular-nums font-semibold">
                        {Math.max(0, numVal(financialAssets) - 20_000_000).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-medium">
                      <span>- 총 인정 부채 (대출 + 임대보증금 50% 한도):</span>
                      <span className="tabular-nums font-bold">
                        -{(numVal(financialDebt) + Math.min(numVal(rentDepositDebt), numVal(realEstateValue) * 0.5)).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-800 pl-2">
                      <span>= 환산 대상 순재산액:</span>
                      <span className="tabular-nums">
                        {basicCalc.netPropertyBeforeRate.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 pl-2">
                      <span>× 소득환산율 연 4% ÷ 12개월:</span>
                      <span className="tabular-nums font-semibold">
                        {basicCalc.propertyMonthly.toLocaleString()}원 / 월
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-3 border-t border-slate-200 text-base">
                      <span>재산의 소득환산액 합계:</span>
                      <span className="tabular-nums text-blue-700 font-black">
                        {targetType === 'disability'
                          ? disabilityCalc.totalPropertyConversion.toLocaleString()
                          : basicCalc.totalPropertyConversion.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 모의 결정통지서 모달 (서식 6호/5호 표준 양식) */}
        {showNotice && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 print:border-none print:shadow-none print:max-h-none p-6 sm:p-10 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 print:hidden">
                <span className="font-bold text-slate-900 text-base">
                  사회보장급여 결정(적합/대상제외) 통지서 [서식 6호/5호 표준]
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    인쇄하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotice(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>

              {/* 통지서 서식 내용 */}
              <div className="text-center py-3 border-b-2 border-slate-900">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">사회보장급여 결정 통지서</h2>
                <p className="text-sm text-slate-500 mt-1.5 font-medium">기초연금 · 장애인연금 수급자격 모의 결정 내역</p>
              </div>

              <div className="space-y-5 text-sm sm:text-base">
                <table className="w-full border-collapse border border-slate-300 text-left">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <th className="bg-slate-50 p-3 border-r border-slate-200 font-semibold w-28 text-slate-700">신청인</th>
                      <td className="p-3 border-r border-slate-200 font-medium">
                        {applicantAge ? `신청인 본인 (만 ${applicantAge}세)` : '신청인 본인 (연령 미입력)'}
                      </td>
                      <th className="bg-slate-50 p-3 border-r border-slate-200 font-semibold w-28 text-slate-700">가구 구성</th>
                      <td className="p-3 font-medium">{hasSpouse ? `부부가구 (배우자 만 ${spouseAge || '—'}세)` : '단독가구'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <th className="bg-slate-50 p-3 border-r border-slate-200 font-semibold text-slate-700">거주 관할</th>
                      <td className="p-3 border-r border-slate-200">{REGION_DATA[region].name}</td>
                      <th className="bg-slate-50 p-3 border-r border-slate-200 font-semibold text-slate-700">장애 등록</th>
                      <td className="p-3">
                        {applicantDisability === 'severe'
                          ? '등록 중증장애인'
                          : applicantDisability === 'mild'
                          ? '등록 경증장애인'
                          : '비장애'}
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-slate-50 p-3 border-r border-slate-200 font-semibold text-slate-700">소득인정액</th>
                      <td className="p-3 border-r border-slate-200 font-bold text-blue-700 tabular-nums">
                        {basicCalc.recognizedIncome.toLocaleString()}원
                      </td>
                      <th className="bg-slate-50 p-3 border-r border-slate-200 font-semibold text-slate-700">선정기준액</th>
                      <td className="p-3 tabular-nums font-semibold">
                        {basicCalc.threshold.toLocaleString()}원
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 text-base">급여 결정 내역</h4>
                  <table className="w-full border-collapse border border-slate-300 text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                        <th className="p-3 border-r border-slate-300">신청 서비스</th>
                        <th className="p-3 border-r border-slate-300">결정 구분</th>
                        <th className="p-3 border-r border-slate-300">월 지급 예정액</th>
                        <th className="p-3 border-r border-slate-300">정기 지급일</th>
                        <th className="p-3">비고 및 산출 사유</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      <tr>
                        <td className="p-3 font-bold border-r border-slate-200">기초연금</td>
                        <td className="p-3 border-r border-slate-200">
                          <span className={basicCalc.isEligible ? 'font-bold text-blue-700' : 'text-slate-500 font-medium'}>
                            {basicCalc.isPending ? '입력 대기' : basicCalc.isEligible ? '지급 결정(적합)' : '대상제외(부적합)'}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-200 font-black tabular-nums text-base">
                          {basicCalc.isEligible ? `${basicCalc.totalHousehold.toLocaleString()}원` : '0원'}
                        </td>
                        <td className="p-3 border-r border-slate-200">매월 25일</td>
                        <td className="p-3 text-slate-600">
                          {basicCalc.isPending
                            ? '연령 및 소득·재산 입력 필요'
                            : basicCalc.isEligible
                            ? `기준연금액(349,700원)${basicCalc.coupleBothEligible ? ' · 부부감액(20%)' : ''}`
                            : '선정기준액 초과 또는 연령 미달'}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 font-bold border-r border-slate-200">장애인연금</td>
                        <td className="p-3 border-r border-slate-200">
                          <span className={disabilityCalc.isEligible ? 'font-bold text-emerald-700' : 'text-slate-500 font-medium'}>
                            {disabilityCalc.isPending ? '입력 대기' : disabilityCalc.isEligible ? '지급 결정(적합)' : '대상제외(부적합)'}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-200 font-black tabular-nums text-base">
                          {disabilityCalc.isEligible ? `${disabilityCalc.totalMonthly.toLocaleString()}원` : '0원'}
                        </td>
                        <td className="p-3 border-r border-slate-200">매월 20일</td>
                        <td className="p-3 text-slate-600">
                          {disabilityCalc.isPending
                            ? '장애 정보 및 소득·재산 입력 필요'
                            : disabilityCalc.isEligible
                            ? `기초급여 ${disabilityCalc.basicBenefit.toLocaleString()}원 + 부가급여 ${disabilityCalc.additionalBenefit.toLocaleString()}원`
                            : '중증장애인 미등록 또는 기준 초과'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1.5">
                  <div className="font-bold text-slate-900">안내 및 불복(이의신청) 절차:</div>
                  <p>1. 연금은 신청일이 속하는 달부터 지급되며 본인 명의 계좌(압류방지 전용통장)로 입금됩니다.</p>
                  <p>2. 위 결정사항에 이의가 있는 경우 통지를 받은 날로부터 90일 이내에 관할 읍·면·동 또는 국민연금공단 지사에 이의신청할 수 있습니다.</p>
                </div>

                <div className="pt-4 text-center text-sm font-bold tracking-widest text-slate-800">
                  보건복지부 · 관할 시·군·구청장 [직인생략]
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
