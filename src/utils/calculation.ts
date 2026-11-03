/**
 * 2026년도 기초연금 · 장애인연금 · 장애(아동)수당 핵심 산정 로직
 */

import {
  SimulationInput,
  BasicPensionResult,
  DisabilityPensionResult,
  DisabilityAllowanceResult,
  IntegratedDiagnosisResult,
  REGION_CONFIGS,
  BASIC_PENSION_2026,
  DISABILITY_PENSION_2026,
  DISABILITY_ALLOWANCE_2026,
} from '../types/pension';

/**
 * 10원 미만 절사 (법 제24조 및 지침 준수)
 */
export function floorTo10(num: number): number {
  return Math.floor(num / 10) * 10;
}

/**
 * 기초연금 소득인정액 및 수급액 계산
 */
export function calculateBasicPension(input: SimulationInput): BasicPensionResult {
  const isDeFactoDivorced = input.isSeparatedOrDivorcedDeFacto;
  const isCouple = input.hasSpouse && !isDeFactoDivorced;
  const threshold = isCouple
    ? BASIC_PENSION_2026.THRESHOLD_COUPLE
    : BASIC_PENSION_2026.THRESHOLD_SINGLE;

  // 1. 신청 자격 체크
  let isEligible = true;
  const disqualifications: string[] = [];

  // 연령 요건 (만 65세 이상, 생일 1개월 전 사전신청 포함)
  const isAgeValid = input.applicantAge >= 65;
  if (!isAgeValid) {
    disqualifications.push(`신청인 연령(만 ${input.applicantAge}세)이 만 65세 미만입니다. (만 65세 도래 1개월 전 초일부터 신청 가능)`);
    isEligible = false;
  }

  // 직역연금 수급권자 제외 요건 (본인 또는 배우자가 직역연금 수급권자인 경우 원칙적 제외)
  const isApplicantExcluded =
    input.applicantOccupationalPension === 'recipient';
  const isSpouseExcluded =
    isCouple && input.spouseOccupationalPension === 'recipient';

  if (isApplicantExcluded || isSpouseExcluded) {
    disqualifications.push(
      '공무원·사학·군인·별정우체국 등 직역연금 수급권자 및 그 배우자는 법률상 기초연금 지급 대상에서 제외됩니다. (단, 재직 10년 미만 연계퇴직연금 또는 일시금 수령 5년 경과자 예외)'
    );
    isEligible = false;
  }

  // 2. 소득평가액 계산
  // 상시근로소득 공제: 1인당 116만원 기본공제 후 30% 추가공제
  const applicantEarnedEval = Math.max(
    0,
    Math.round(
      (Math.max(0, input.applicantEarnedIncome - BASIC_PENSION_2026.EARNED_INCOME_DEDUCTION)) *
        (1 - BASIC_PENSION_2026.EARNED_INCOME_ADDITIONAL_RATE)
    )
  );

  const spouseEarnedEval = isCouple
    ? Math.max(
        0,
        Math.round(
          (Math.max(0, input.spouseEarnedIncome - BASIC_PENSION_2026.EARNED_INCOME_DEDUCTION)) *
            (1 - BASIC_PENSION_2026.EARNED_INCOME_ADDITIONAL_RATE)
        )
      )
    : 0;

  const earnedIncomeEvaluation = applicantEarnedEval + spouseEarnedEval;

  // 이자소득 공제: 월 40,000원 공제
  const interestEval = Math.max(0, input.interestIncome - 40_000);

  // 무료임차소득: 자녀 명의 6억원 이상 주택 동거 시 (시가표준액 * 지분율 * 0.0078 / 12)
  let freeRentIncome = 0;
  if (input.childLuxuryHouseValue >= BASIC_PENSION_2026.LUXURY_HOUSE_FREE_RENT_THRESHOLD) {
    const share = Math.min(1, Math.max(0, input.childOwnershipShare || 1));
    freeRentIncome = Math.round(
      (input.childLuxuryHouseValue * share * BASIC_PENSION_2026.FREE_RENT_ANNUAL_RATE) / 12
    );
  }

  // 기타소득 합계 (사업 + 이자 + 사적연금 + 공적이전 + 무료임차)
  // *참고: 국민연금 급여액은 기초연금 소득인정액의 공적이전소득에 포함됨
  const totalNationalPension =
    (input.applicantNationalPension || 0) + (isCouple ? input.spouseNationalPension || 0 : 0);

  const otherIncomeEvaluation =
    (input.businessIncome || 0) +
    interestEval +
    (input.privatePensionIncome || 0) +
    (input.publicTransferIncome || 0) +
    totalNationalPension +
    freeRentIncome;

  const totalIncomeEvaluation = earnedIncomeEvaluation + otherIncomeEvaluation;

  // 3. 재산의 소득환산액 계산
  const regionConfig = REGION_CONFIGS[input.region] || REGION_CONFIGS.large;
  const basicPropertyDeduction = regionConfig.basicDeduction;

  // 임차보증금(전월세)은 95% 반영
  const evaluatedRentDeposit = Math.round(
    (input.rentalDeposit || 0) * BASIC_PENSION_2026.HOUSING_RENT_DEPOSIT_RATE
  );
  const generalProperty = (input.realEstateValue || 0) + evaluatedRentDeposit;
  const netGeneralProperty = Math.max(0, generalProperty - basicPropertyDeduction);

  // 금융재산: 가구당 2,000만원 기본공제
  const financialProperty = input.financialAssets || 0;
  const financialDeduction = BASIC_PENSION_2026.FINANCIAL_DEDUCTION;
  const netFinancialProperty = Math.max(0, financialProperty - financialDeduction);

  // 부채: 금융기관 대출 + 임대보증금 부채 (시가표준액의 50% 한도)
  const maxRentDebt = (input.realEstateValue || 0) * BASIC_PENSION_2026.MAX_RENT_DEBT_RATIO;
  const evaluatedRentDebt = Math.min(input.rentDepositDebt || 0, maxRentDebt);
  const totalDebt = (input.financialDebt || 0) + evaluatedRentDebt;

  // 환산 전 순재산 = (일반재산 - 기본재산액) + (금융재산 - 2000만원) - 부채
  const netPropertyBeforeRate = Math.max(
    0,
    netGeneralProperty + netFinancialProperty - totalDebt
  );

  // 일반재산 월 환산액 (연 4% / 12개월)
  const propertyMonthlyConversion = Math.round(
    (netPropertyBeforeRate * BASIC_PENSION_2026.PROPERTY_CONVERSION_ANNUAL_RATE) / 12
  );

  // P값: 고급자동차(4천만원 이상 10년 미만, 생업/장애인 제외) 및 회원권 가액 100%
  let pValue = input.membershipValue || 0;
  if (input.luxuryCarValue >= 40_000_000 && !input.hasDisabledCarExemption) {
    pValue += input.luxuryCarValue;
  }

  const totalPropertyConversion = propertyMonthlyConversion + pValue;
  const recognizedIncome = totalIncomeEvaluation + totalPropertyConversion;
  const marginToThreshold = threshold - recognizedIncome;

  if (recognizedIncome > threshold) {
    disqualifications.push(
      `소득인정액(${recognizedIncome.toLocaleString()}원)이 2026년 가구 선정기준액(${threshold.toLocaleString()}원)을 초과하였습니다. (초과액: ${(recognizedIncome - threshold).toLocaleString()}원)`
    );
    isEligible = false;
  }

  // 4. 가구 수급 유형 확정
  let householdType: 'single' | 'couple_1person' | 'couple_2person' = 'single';
  if (isCouple) {
    const isSpouse65OrMore = input.spouseAge >= 65;
    if (isSpouse65OrMore && !isSpouseExcluded) {
      householdType = 'couple_2person';
    } else {
      householdType = 'couple_1person';
    }
  }

  // 5. 개인별 기초연금액 산정 (국민연금 A급여액 및 급여액 반영)
  const standardAmount = BASIC_PENSION_2026.STANDARD_AMOUNT; // 349,700
  const additionalAmount = BASIC_PENSION_2026.ADDITIONAL_AMOUNT; // 174,850
  const formula250 = Math.round(standardAmount * BASIC_PENSION_2026.NATIONAL_PENSION_FORMULA_MAX_RATE); // 874,250
  const threshold150 = Math.round(standardAmount * BASIC_PENSION_2026.NATIONAL_PENSION_LOWER_RATE); // 524,550
  const threshold200 = Math.round(standardAmount * BASIC_PENSION_2026.NATIONAL_PENSION_UPPER_RATE); // 699,400

  // 개인별 연금액 산정 헬퍼
  function calculateIndividualBasePension(
    pensionType: OccupationalPensionType,
    nationalPension: number,
    nationalPensionA: number,
    welfareStatus: WelfareStatus,
    disability: DisabilityDegree
  ): number {
    // 직역연금 특례자
    if (pensionType === 'special_old_age') {
      return additionalAmount; // 174,850
    }

    // 무연금자, 기초생활수급자, 장애인연금 수급자, 국민연금 150% 이하
    const isSpecialDirectFull =
      nationalPension <= 0 ||
      nationalPension <= threshold150 ||
      welfareStatus === 'basic_livelihood_living_medical' ||
      disability === 'severe';

    if (isSpecialDirectFull) {
      return standardAmount; // 349,700
    }

    // 국민연금 150% 초과 ~ 200% 이하
    // A급여액 적용산식 = (기준연금액 - 2/3 * A) + 부가연금액
    const formulaA = Math.max(0, standardAmount - Math.round((2 / 3) * nationalPensionA)) + additionalAmount;
    const formulaNP = Math.max(0, formula250 - nationalPension);

    if (nationalPension <= threshold200) {
      const calculated = Math.max(formulaA, formulaNP);
      return Math.min(standardAmount, Math.max(additionalAmount, calculated));
    }

    // 국민연금 200% 초과
    return Math.min(standardAmount, Math.max(additionalAmount, formulaA));
  }

  const applicantBaseAmount = isEligible && input.applicantAge >= 65 && !isApplicantExcluded
    ? calculateIndividualBasePension(
        input.applicantOccupationalPension,
        input.applicantNationalPension || 0,
        input.applicantNationalPensionA || 0,
        input.applicantWelfareStatus,
        input.applicantDisability
      )
    : 0;

  const spouseBaseAmount = isEligible && householdType === 'couple_2person'
    ? calculateIndividualBasePension(
        input.spouseOccupationalPension,
        input.spouseNationalPension || 0,
        input.spouseNationalPensionA || 0,
        input.applicantWelfareStatus,
        input.spouseDisability
      )
    : 0;

  // 6. 감액 적용
  // (1) 부부감액 (부부2인 수급 가구는 각각 20% 감액)
  const coupleReductionApplied = householdType === 'couple_2person';
  const applicantAfterCoupleReduction = coupleReductionApplied
    ? floorTo10(applicantBaseAmount * 0.8)
    : applicantBaseAmount;
  const spouseAfterCoupleReduction = coupleReductionApplied
    ? floorTo10(spouseBaseAmount * 0.8)
    : 0;

  // (2) 소득역전방지 감액
  // 단독가구 및 부부 1인 수급: Min(기초연금액, 선정기준액 - 소득인정액)
  // 부부 2인 수급: Min(부부합산액, 선정기준액 - 소득인정액) 후 비례 배분
  let incomeInversionDeductionApplied = false;
  let applicantFinalAmount = 0;
  let spouseFinalAmount = 0;

  if (isEligible) {
    const minSingleAmount = BASIC_PENSION_2026.MINIMUM_AMOUNT; // 34,970원
    const diff = Math.max(0, threshold - recognizedIncome);

    if (householdType === 'single' || householdType === 'couple_1person') {
      if (recognizedIncome + applicantAfterCoupleReduction > threshold) {
        incomeInversionDeductionApplied = true;
        applicantFinalAmount = floorTo10(
          Math.max(minSingleAmount, Math.min(applicantAfterCoupleReduction, diff))
        );
      } else {
        applicantFinalAmount = applicantAfterCoupleReduction;
      }
      spouseFinalAmount = 0;
    } else {
      // 부부 2인 수급가구
      const coupleSum = applicantAfterCoupleReduction + spouseAfterCoupleReduction;
      if (recognizedIncome + coupleSum > threshold) {
        incomeInversionDeductionApplied = true;
        const householdSum = Math.max(minSingleAmount * 2, Math.min(coupleSum, diff));
        // 부부 산정비율 배분
        const ratio1 = coupleSum > 0 ? applicantAfterCoupleReduction / coupleSum : 0.5;
        applicantFinalAmount = floorTo10(
          Math.max(minSingleAmount, Math.round(householdSum * ratio1))
        );
        spouseFinalAmount = floorTo10(
          Math.max(minSingleAmount, householdSum - applicantFinalAmount)
        );
      } else {
        applicantFinalAmount = applicantAfterCoupleReduction;
        spouseFinalAmount = spouseAfterCoupleReduction;
      }
    }
  }

  return {
    isEligible,
    reason: isEligible
      ? '2026년 기초연금 수급 자격 기준을 모두 충족합니다.'
      : disqualifications.join(' | '),
    householdType,
    threshold,
    earnedIncomeEvaluation,
    otherIncomeEvaluation,
    totalIncomeEvaluation,
    generalProperty,
    basicPropertyDeduction,
    netGeneralProperty,
    financialProperty,
    financialDeduction,
    netFinancialProperty,
    totalDebt,
    netPropertyBeforeRate,
    propertyMonthlyConversion,
    pValue,
    totalPropertyConversion,
    recognizedIncome,
    marginToThreshold,
    applicantBaseAmount,
    spouseBaseAmount,
    coupleReductionApplied,
    applicantAfterCoupleReduction,
    spouseAfterCoupleReduction,
    incomeInversionDeductionApplied,
    applicantFinalAmount,
    spouseFinalAmount,
    totalHouseholdAmount: applicantFinalAmount + spouseFinalAmount,
  };
}

/**
 * 2026 장애인연금 소득인정액 및 수급액 계산
 */
export function calculateDisabilityPension(input: SimulationInput): DisabilityPensionResult {
  const isDeFactoDivorced = input.isSeparatedOrDivorcedDeFacto;
  const isCouple = input.hasSpouse && !isDeFactoDivorced;
  const threshold = isCouple
    ? DISABILITY_PENSION_2026.THRESHOLD_COUPLE
    : DISABILITY_PENSION_2026.THRESHOLD_SINGLE;

  // 1. 자격 체크
  let isEligible = true;
  const disqualifications: string[] = [];

  // 장애 정도 체크 (반드시 중증: 종전 1, 2, 3급 중복)
  const isApplicantSevere = input.applicantDisability === 'severe';
  if (!isApplicantSevere) {
    disqualifications.push(
      '장애인연금은 만 18세 이상 등록 중증장애인(종전 1급, 2급, 3급 중복장애)만 신청할 수 있습니다. (경증장애인은 장애수당 대상)'
    );
    isEligible = false;
  }

  // 연령 체크 (만 18세 이상)
  if (input.applicantAge < 18) {
    disqualifications.push(
      `신청인 연령(만 ${input.applicantAge}세)이 만 18세 미만입니다. 만 18세 미만은 장애아동수당 대상입니다.`
    );
    isEligible = false;
  }

  // 직역연금 제외
  const isApplicantExcluded = input.applicantOccupationalPension === 'recipient';
  const isSpouseExcluded = isCouple && input.spouseOccupationalPension === 'recipient';
  if (isApplicantExcluded || isSpouseExcluded) {
    disqualifications.push(
      '직역연금(공무원, 사학, 군인, 별정우체국) 수급권자 및 그 배우자는 법률상 장애인연금 지급 대상에서 제외됩니다.'
    );
    isEligible = false;
  }

  // 2. 소득인정액 계산 (장애인연금 기준: 상시근로 기본공제 95만원 + 30% 추가공제)
  const applicantEarnedEval = Math.max(
    0,
    Math.round(
      Math.max(0, input.applicantEarnedIncome - DISABILITY_PENSION_2026.EARNED_INCOME_DEDUCTION) *
        (1 - DISABILITY_PENSION_2026.EARNED_INCOME_ADDITIONAL_RATE)
    )
  );

  const spouseEarnedEval = isCouple
    ? Math.max(
        0,
        Math.round(
          Math.max(0, input.spouseEarnedIncome - DISABILITY_PENSION_2026.EARNED_INCOME_DEDUCTION) *
            (1 - DISABILITY_PENSION_2026.EARNED_INCOME_ADDITIONAL_RATE)
        )
      )
    : 0;

  const earnedIncomeEvaluation = applicantEarnedEval + spouseEarnedEval;

  // 이자소득 월 4만원 공제
  const interestEval = Math.max(0, input.interestIncome - 40_000);

  // 무료임차소득 (자녀 6억 이상 주택 동거)
  let freeRentIncome = 0;
  if (input.childLuxuryHouseValue >= 600_000_000) {
    const share = Math.min(1, Math.max(0, input.childOwnershipShare || 1));
    freeRentIncome = Math.round((input.childLuxuryHouseValue * share * 0.0078) / 12);
  }

  // 공적이전소득 (장애인연금 자체, 기초생활보장 생계의료급여 등은 비과세/제외)
  const totalIncomeEvaluation =
    earnedIncomeEvaluation +
    (input.businessIncome || 0) +
    interestEval +
    (input.privatePensionIncome || 0) +
    (input.publicTransferIncome || 0) +
    (input.applicantNationalPension || 0) +
    (isCouple ? input.spouseNationalPension || 0 : 0) +
    freeRentIncome;

  // 재산의 소득환산액
  const regionConfig = REGION_CONFIGS[input.region] || REGION_CONFIGS.large;
  const basicPropertyDeduction = regionConfig.basicDeduction;
  const generalProperty =
    (input.realEstateValue || 0) + Math.round((input.rentalDeposit || 0) * 0.95);
  const netGeneralProperty = Math.max(0, generalProperty - basicPropertyDeduction);

  const financialProperty = input.financialAssets || 0;
  const netFinancialProperty = Math.max(0, financialProperty - DISABILITY_PENSION_2026.FINANCIAL_DEDUCTION);

  const maxRentDebt = (input.realEstateValue || 0) * 0.5;
  const evaluatedRentDebt = Math.min(input.rentDepositDebt || 0, maxRentDebt);
  const totalDebt = (input.financialDebt || 0) + evaluatedRentDebt;

  const netPropertyBeforeRate = Math.max(
    0,
    netGeneralProperty + netFinancialProperty - totalDebt
  );

  const propertyMonthlyConversion = Math.round((netPropertyBeforeRate * 0.04) / 12);

  // P값: 등록장애인 소유 자동차 1대는 장애 정도 무관하게 고급자동차라도 100% 비과세 제외!
  let pValue = input.membershipValue || 0;
  // 만약 장애인 비과세 제외가 미적용된 일반 고급차량이라면 P값 가산
  if (input.luxuryCarValue >= 40_000_000 && !input.hasDisabledCarExemption && !isApplicantSevere) {
    pValue += input.luxuryCarValue;
  }

  const totalPropertyConversion = propertyMonthlyConversion + pValue;
  const recognizedIncome = totalIncomeEvaluation + totalPropertyConversion;
  const marginToThreshold = threshold - recognizedIncome;

  // 국민기초생활 생계/의료급여 수급자는 별도 자산조사 없이 수급자격 인정(지침 p.14, p.67)
  const isBasicLivelihoodSpecial =
    input.applicantWelfareStatus === 'basic_livelihood_living_medical';

  if (!isBasicLivelihoodSpecial && recognizedIncome > threshold) {
    disqualifications.push(
      `소득인정액(${recognizedIncome.toLocaleString()}원)이 2026년 장애인연금 선정기준액(${threshold.toLocaleString()}원)을 초과하였습니다.`
    );
    isEligible = false;
  }

  // 3. 급여액 산정
  // (1) 기초급여 (18~64세)
  // 65세 이상 도달 시 기초연금으로 전환되어 기초급여 미지급 (0원), 부가급여만 지급!
  let applicantBasicBenefit = 0;
  let spouseBasicBenefit = 0;

  const isApplicant65OrMore = input.applicantAge >= 65;
  const isSpouse65OrMore = input.spouseAge >= 65;
  const isSpouseSevere = isCouple && input.spouseDisability === 'severe';

  if (isEligible) {
    if (!isApplicant65OrMore) {
      if (isBasicLivelihoodSpecial) {
        // 기초생활수급자: 초과분 감액 없음, 부부감액만 적용
        if (isSpouseSevere && !isSpouse65OrMore) {
          applicantBasicBenefit = DISABILITY_PENSION_2026.BASIC_BENEFIT_COUPLE_EACH; // 279,760
          spouseBasicBenefit = DISABILITY_PENSION_2026.BASIC_BENEFIT_COUPLE_EACH;
        } else {
          applicantBasicBenefit = DISABILITY_PENSION_2026.BASIC_BENEFIT_MAX; // 349,700
        }
      } else {
        // 차상위 및 차상위초과자: 초과분 감액 테이블(지침 p.18-19, p.54-55) 적용!
        if (!isCouple || !isSpouseSevere || isSpouse65OrMore) {
          // 단독 또는 부부 1인 수급 (차액 = 1,400,000 - recognizedIncome 또는 2,240,000 - recognizedIncome)
          const diff = threshold - recognizedIncome;
          if (diff > 340_000) {
            applicantBasicBenefit = DISABILITY_PENSION_2026.BASIC_BENEFIT_MAX; // 349,700
          } else {
            // 2만원 단위 계단식 절삭: diff 32~34만 -> 340,000, 30~32만 -> 320,000, ... 0~2만 -> 20,000
            const step = Math.floor(Math.max(0, diff) / 20_000);
            applicantBasicBenefit = Math.max(20_000, Math.min(340_000, step * 20_000));
          }
        } else {
          // 부부 2인 수급 가구 (threshold 2,240,000, 부부합산 기준)
          const diff = threshold - recognizedIncome;
          let coupleSum = 0;
          if (diff > 520_000) {
            coupleSum = DISABILITY_PENSION_2026.BASIC_BENEFIT_COUPLE_SUM; // 559,520
          } else {
            // 계단식 감액 (지침 p.19, p.55)
            // 48~52만: 52만, 44~48만: 48만, ... 0~4만: 4만
            const step = Math.floor(Math.max(0, diff) / 40_000);
            coupleSum = Math.max(40_000, Math.min(520_000, step * 40_000));
          }
          applicantBasicBenefit = floorTo10(coupleSum / 2);
          spouseBasicBenefit = floorTo10(coupleSum / 2);
        }
      }
    }
  }

  // (2) 부가급여 (18세 이상, 부부감액/초과분감액 적용 없음!)
  let applicantAdditionalBenefit = 0;
  let spouseAdditionalBenefit = 0;
  let classificationName = '차상위 초과자';

  if (isEligible) {
    const isFacility = input.facilityLiving;

    function getAdditionalBenefit(is65Plus: boolean, welfareStatus: WelfareStatus): number {
      if (welfareStatus === 'basic_livelihood_living_medical') {
        if (isFacility) {
          return is65Plus ? 0 : 0;
        }
        return is65Plus
          ? DISABILITY_PENSION_2026.ADDITIONAL_BENEFIT.BASIC_LIVELIHOOD_HOME.OVER_65 // 439,700원
          : DISABILITY_PENSION_2026.ADDITIONAL_BENEFIT.BASIC_LIVELIHOOD_HOME.UNDER_65; // 90,000원
      } else if (
        welfareStatus === 'basic_livelihood_housing_education' ||
        welfareStatus === 'near_poverty'
      ) {
        return is65Plus
          ? DISABILITY_PENSION_2026.ADDITIONAL_BENEFIT.NEAR_POVERTY.OVER_65 // 80,000원
          : DISABILITY_PENSION_2026.ADDITIONAL_BENEFIT.NEAR_POVERTY.UNDER_65; // 80,000원
      } else {
        // 차상위 초과
        return is65Plus
          ? DISABILITY_PENSION_2026.ADDITIONAL_BENEFIT.ABOVE_NEAR_POVERTY.OVER_65 // 50,000원
          : DISABILITY_PENSION_2026.ADDITIONAL_BENEFIT.ABOVE_NEAR_POVERTY.UNDER_65; // 30,000원
      }
    }

    applicantAdditionalBenefit = getAdditionalBenefit(isApplicant65OrMore, input.applicantWelfareStatus);
    if (isSpouseSevere) {
      spouseAdditionalBenefit = getAdditionalBenefit(isSpouse65OrMore, input.applicantWelfareStatus);
    }

    if (input.applicantWelfareStatus === 'basic_livelihood_living_medical') {
      classificationName = isFacility ? '기초생활수급자(시설)' : '기초생활수급자(재가 생계･의료)';
    } else if (
      input.applicantWelfareStatus === 'basic_livelihood_housing_education' ||
      input.applicantWelfareStatus === 'near_poverty'
    ) {
      classificationName = '차상위계층 (주거/교육급여 포함)';
    } else {
      classificationName = '차상위 초과자 (일반 선정기준액 이하)';
    }
  }

  let is65OrOlderNote = '';
  if (isApplicant65OrMore) {
    is65OrOlderNote =
      '만 65세 이상으로 기초급여는 기초연금으로 전환되어 미지급되며, 부가급여만 지급됩니다. (기초연금을 주소지 읍면동에서 별도 신청하여 동시에 수령하세요)';
  }

  const applicantTotalBenefit = applicantBasicBenefit + applicantAdditionalBenefit;
  const spouseTotalBenefit = spouseBasicBenefit + spouseAdditionalBenefit;

  return {
    isEligible,
    reason: isEligible
      ? '2026년 장애인연금 수급 자격 기준을 모두 충족합니다.'
      : disqualifications.join(' | '),
    householdType: isCouple ? 'couple' : 'single',
    threshold,
    earnedIncomeEvaluation,
    totalIncomeEvaluation,
    totalPropertyConversion,
    recognizedIncome,
    marginToThreshold,
    applicantBasicBenefit,
    applicantAdditionalBenefit,
    applicantTotalBenefit,
    spouseBasicBenefit,
    spouseAdditionalBenefit,
    spouseTotalBenefit,
    totalHouseholdBenefit: applicantTotalBenefit + spouseTotalBenefit,
    classificationName,
    is65OrOlderNote,
  };
}

/**
 * 2026 경증 장애수당 및 장애아동수당 계산
 */
export function calculateDisabilityAllowance(input: SimulationInput): DisabilityAllowanceResult {
  const isFacility = input.facilityLiving;
  const isBasicLiving = input.applicantWelfareStatus === 'basic_livelihood_living_medical';
  const isNearPoverty =
    input.applicantWelfareStatus === 'basic_livelihood_housing_education' ||
    input.applicantWelfareStatus === 'near_poverty';

  // 아동 여부 (18세 미만, 또는 18~20세 초중등교육법 학교 재학 중인 경우)
  const isChild =
    input.applicantAge < 18 ||
    (input.applicantAge <= 20 && input.applicantIsStudent18to20);

  // 대상자 자격 (기초 또는 차상위 계층만 가능)
  if (!isBasicLiving && !isNearPoverty) {
    return {
      isApplicable: false,
      programName: '해당 없음',
      monthlyAmount: 0,
      qualificationDetail: '장애수당 및 장애아동수당은 기초생활수급자 또는 차상위계층에 한하여 지급됩니다.',
    };
  }

  // 1. 장애아동수당 (18세 미만 또는 20세 이하 학생)
  if (isChild) {
    if (input.applicantDisability === 'none') {
      return {
        isApplicable: false,
        programName: '장애아동수당',
        monthlyAmount: 0,
        qualificationDetail: '등록 장애아동에 해당하지 않습니다.',
      };
    }

    const isSevere = input.applicantDisability === 'severe';
    let amount = 0;
    if (isSevere) {
      if (isFacility) {
        amount = DISABILITY_ALLOWANCE_2026.CHILD_SEVERE.BASIC_FACILITY; // 90,000
      } else if (isBasicLiving) {
        amount = DISABILITY_ALLOWANCE_2026.CHILD_SEVERE.BASIC_HOME; // 220,000
      } else {
        amount = DISABILITY_ALLOWANCE_2026.CHILD_SEVERE.NEAR_POVERTY; // 170,000
      }
    } else {
      // 경증
      if (isFacility) {
        amount = DISABILITY_ALLOWANCE_2026.CHILD_MILD.BASIC_FACILITY; // 30,000
      } else if (isBasicLiving) {
        amount = DISABILITY_ALLOWANCE_2026.CHILD_MILD.BASIC_HOME; // 110,000
      } else {
        amount = DISABILITY_ALLOWANCE_2026.CHILD_MILD.NEAR_POVERTY; // 110,000
      }
    }

    return {
      isApplicable: true,
      programName: `장애아동수당 (${isSevere ? '중증' : '경증'})`,
      monthlyAmount: amount,
      qualificationDetail: `18세 미만(또는 20세 이하 재학생) 등록 ${isSevere ? '중증' : '경증'}장애아동 대상 ${isBasicLiving ? '기초수급자' : '차상위계층'} 급여`,
    };
  }

  // 2. 성인(18세 이상) 경증 장애수당
  if (input.applicantDisability === 'mild') {
    let amount = 0;
    if (isBasicLiving) {
      amount = isFacility
        ? DISABILITY_ALLOWANCE_2026.ADULT_MILD.BASIC_FACILITY // 30,000
        : DISABILITY_ALLOWANCE_2026.ADULT_MILD.BASIC_HOME; // 60,000
    } else {
      amount = DISABILITY_ALLOWANCE_2026.ADULT_MILD.NEAR_POVERTY; // 60,000
    }

    return {
      isApplicable: true,
      programName: '장애수당 (성인 경증)',
      monthlyAmount: amount,
      qualificationDetail: `18세 이상 등록 경증장애인(종전 3~6급) 대상 ${isBasicLiving ? '기초생활수급' : '차상위계층'} 수당`,
    };
  }

  return {
    isApplicable: false,
    programName: '해당 없음',
    monthlyAmount: 0,
    qualificationDetail: '중증장애인은 장애인연금 대상이며, 경증장애인만 장애수당 대상입니다.',
  };
}

/**
 * 종합 진단 및 최적 혜택 추천
 */
export function calculateIntegratedDiagnosis(input: SimulationInput): IntegratedDiagnosisResult {
  const basicPension = calculateBasicPension(input);
  const disabilityPension = calculateDisabilityPension(input);
  const disabilityAllowance = calculateDisabilityAllowance(input);

  const actions: string[] = [];
  let recommendation = '';

  // 65세 이상 중증장애인인 경우: 기초연금 + 장애인연금 부가급여 동시 수령!
  if (input.applicantAge >= 65 && input.applicantDisability === 'severe') {
    if (basicPension.isEligible && disabilityPension.isEligible) {
      recommendation = `[중복 수혜 가능] 만 65세 이상 중증장애인으로서 기초연금(월 최대 ${basicPension.applicantFinalAmount.toLocaleString()}원)과 장애인연금 부가급여(월 ${disabilityPension.applicantAdditionalBenefit.toLocaleString()}원)를 동시에 수령하실 수 있습니다. 가구 총 합계: 월 ${(basicPension.totalHouseholdAmount + disabilityPension.totalHouseholdBenefit).toLocaleString()}원`;
      actions.push('주소지 관할 읍·면·동 주민센터에 기초연금과 장애인연금(부가급여)을 동시에 신청·유지하세요.');
    } else if (basicPension.isEligible) {
      recommendation = `기초연금 수급 대상입니다. (월 최대 ${basicPension.applicantFinalAmount.toLocaleString()}원)`;
      actions.push('주소지 읍·면·동 주민센터 또는 국민연금공단 지사, 복지로에서 기초연금을 신청하세요.');
    }
  } else if (input.applicantAge >= 65) {
    if (basicPension.isEligible) {
      recommendation = `2026년 기초연금 수급 대상자로 판정되었습니다. (가구 총액: 월 ${basicPension.totalHouseholdAmount.toLocaleString()}원)`;
      actions.push('만 65세 생일 1개월 전 초일부터 신청 가능하므로 가까운 주민센터 또는 복지로에서 신청하세요.');
    } else {
      recommendation = `기초연금 선정기준액을 초과하거나 직역연금 등 제외사유가 있습니다. (${basicPension.reason})`;
      actions.push('소득·재산 변동 시 또는 차기년도 선정기준액 인상 시 재확인을 권장합니다.');
    }
  } else {
    // 65세 미만
    if (input.applicantDisability === 'severe') {
      if (disabilityPension.isEligible) {
        recommendation = `2026년 장애인연금(기초급여 + 부가급여) 수급 대상입니다. (월 ${disabilityPension.applicantTotalBenefit.toLocaleString()}원 수령 예상)`;
        actions.push('장애정도 재심사 대상 여부를 확인하고 필요한 의학적 구비서류를 준비하세요.');
      } else {
        recommendation = `장애인연금 수급 기준 미충족 (${disabilityPension.reason})`;
      }
    } else if (input.applicantDisability === 'mild') {
      if (disabilityAllowance.isApplicable) {
        recommendation = `경증 장애수당 지급 대상입니다. (월 ${disabilityAllowance.monthlyAmount.toLocaleString()}원)`;
        actions.push('주민센터 방문 또는 복지로를 통해 장애수당을 신청하세요.');
      } else {
        recommendation = '경증장애수당은 기초생활수급자 또는 차상위계층에 한하여 지원됩니다.';
      }
    } else {
      recommendation = '65세 미만 비장애 가구원으로 기초연금 및 장애인연금 신청 대상 연령/자격에 미달합니다.';
    }
  }

  // 이동통신요금 감면 안내 (기초연금 또는 장애인연금 수급자 공통)
  if (basicPension.isEligible || disabilityPension.isEligible || disabilityAllowance.isApplicable) {
    actions.push('복지대상자 이동통신요금 감면(월 최대 11,000원 할인)을 신청 시 함께 체크하세요.');
  }

  return {
    basicPension,
    disabilityPension,
    disabilityAllowance,
    optimalRecommendation: recommendation,
    recommendedActions: actions,
  };
}
