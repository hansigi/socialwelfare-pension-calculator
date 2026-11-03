import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBasicPension,
  calculateDisabilityPension,
  calculateDisabilityAllowance,
  calculateIntegratedDiagnosis,
} from './calculation.ts';
import { SimulationInput } from '../types/pension.ts';

const baseMockInput: SimulationInput = {
  region: 'large',
  facilityLiving: false,
  applicantAge: 68,
  applicantDisability: 'none',
  applicantOccupationalPension: 'none',
  applicantWelfareStatus: 'general',
  applicantIsStudent18to20: false,
  hasSpouse: false,
  spouseAge: 0,
  spouseDisability: 'none',
  spouseOccupationalPension: 'none',
  isSeparatedOrDivorcedDeFacto: false,
  applicantNationalPension: 0,
  applicantNationalPensionA: 0,
  spouseNationalPension: 0,
  spouseNationalPensionA: 0,
  applicantEarnedIncome: 0,
  spouseEarnedIncome: 0,
  businessIncome: 0,
  interestIncome: 0,
  privatePensionIncome: 0,
  publicTransferIncome: 0,
  childLuxuryHouseValue: 0,
  childOwnershipShare: 1,
  realEstateValue: 0,
  rentalDeposit: 0,
  financialAssets: 0,
  financialDebt: 0,
  rentDepositDebt: 0,
  luxuryCarValue: 0,
  hasDisabledCarExemption: false,
  membershipValue: 0,
};

test('기초연금: 68세 단독가구 무연금 및 저소득 시 기준연금액 전액(349,700원) 지급', () => {
  const result = calculateBasicPension({
    ...baseMockInput,
    applicantAge: 68,
    hasSpouse: false,
    realEstateValue: 100_000_000, // 1억원 (대도시 기본공제 1억3500만원 이하 -> 재산환산액 0원)
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.householdType, 'single');
  assert.equal(result.threshold, 2_470_000);
  assert.equal(result.recognizedIncome, 0);
  assert.equal(result.applicantFinalAmount, 349_700);
  assert.equal(result.coupleReductionApplied, false);
});

test('기초연금: 부부 2인 모두 만 65세 이상 수급 시 부부감액(20%) 적용 (각 279,760원, 합산 559,520원)', () => {
  const result = calculateBasicPension({
    ...baseMockInput,
    applicantAge: 70,
    hasSpouse: true,
    spouseAge: 68,
    realEstateValue: 100_000_000,
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.householdType, 'couple_2person');
  assert.equal(result.coupleReductionApplied, true);
  assert.equal(result.applicantFinalAmount, 279_760);
  assert.equal(result.spouseFinalAmount, 279_760);
  assert.equal(result.totalHouseholdAmount, 559_520);
});

test('기초연금: 국민연금 급여액 60만원(A급여액 30만원) 수급자 연계 감액 계산 (지침 p.119 예시: 324,550원)', () => {
  // A급여액 적용산식: {349,700 - (2/3 * 300,000)} + 174,850 = 324,550원
  // 국민연금 급여액등 산식: 874,250 - 600,000 = 274,250원
  // 큰 금액인 324,550원으로 기초연금 산정
  const result = calculateBasicPension({
    ...baseMockInput,
    applicantAge: 66,
    hasSpouse: false,
    applicantNationalPension: 600_000,
    applicantNationalPensionA: 300_000,
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.applicantBaseAmount, 324_550);
});

test('기초연금: 소득역전방지 감액 적용 (소득인정액 + 기초연금액 > 선정기준액)', () => {
  // 단독가구 선정기준액 2,470,000원, 소득인정액 2,300,000원인 경우
  // 차액 170,000원이 기초연금액(349,700원)보다 작으므로 170,000원으로 감액 지급
  const result = calculateBasicPension({
    ...baseMockInput,
    applicantAge: 67,
    hasSpouse: false,
    businessIncome: 2_300_000,
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.incomeInversionDeductionApplied, true);
  assert.equal(result.applicantFinalAmount, 170_000);
});

test('장애인연금: 만 45세 중증장애인 단독가구 차상위계층 (상시근로 95만원 공제 + 부가급여 8만원)', () => {
  const result = calculateDisabilityPension({
    ...baseMockInput,
    applicantAge: 45,
    applicantDisability: 'severe',
    applicantWelfareStatus: 'near_poverty',
    applicantEarnedIncome: 1_500_000, // (150만 - 95만) * 0.7 = 385,000원
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.earnedIncomeEvaluation, 385_000);
  // 소득인정액 385,000원 <= 1,400,000원 - 340,000원(1,060,000원) 이하이므로 기초급여 349,700원 전액
  assert.equal(result.applicantBasicBenefit, 349_700);
  assert.equal(result.applicantAdditionalBenefit, 80_000); // 65세 미만 차상위 부가급여
  assert.equal(result.applicantTotalBenefit, 349_700 + 80_000);
});

test('장애인연금: 만 70세 중증장애인 기초수급자 (기초급여 0원, 부가급여 439,700원 전액 보전)', () => {
  const result = calculateDisabilityPension({
    ...baseMockInput,
    applicantAge: 70,
    applicantDisability: 'severe',
    applicantWelfareStatus: 'basic_livelihood_living_medical',
  });

  assert.equal(result.isEligible, true);
  assert.equal(result.applicantBasicBenefit, 0); // 65세 이상 기초급여 미지급
  assert.equal(result.applicantAdditionalBenefit, 439_700); // 2026년 개정 부가급여 439,700원!
  assert.equal(result.applicantTotalBenefit, 439_700);
});

test('경증 장애수당: 만 55세 경증장애인 차상위계층 -> 월 6만원', () => {
  const result = calculateDisabilityAllowance({
    ...baseMockInput,
    applicantAge: 55,
    applicantDisability: 'mild',
    applicantWelfareStatus: 'near_poverty',
  });

  assert.equal(result.isApplicable, true);
  assert.equal(result.monthlyAmount, 60_000);
});

test('장애아동수당: 만 10세 중증장애아동 기초수급자(재가) -> 월 22만원', () => {
  const result = calculateDisabilityAllowance({
    ...baseMockInput,
    applicantAge: 10,
    applicantDisability: 'severe',
    applicantWelfareStatus: 'basic_livelihood_living_medical',
  });

  assert.equal(result.isApplicable, true);
  assert.equal(result.monthlyAmount, 220_000);
});

test('통합 진단: 70세 중증장애인 기초수급자의 기초연금 + 장애인연금 부가급여 동시 수혜 진단', () => {
  const result = calculateIntegratedDiagnosis({
    ...baseMockInput,
    applicantAge: 70,
    applicantDisability: 'severe',
    applicantWelfareStatus: 'basic_livelihood_living_medical',
  });

  assert.equal(result.basicPension.isEligible, true);
  assert.equal(result.disabilityPension.isEligible, true);
  assert.ok(result.optimalRecommendation.includes('중복 수혜 가능'));
});
