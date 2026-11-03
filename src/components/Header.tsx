import React from 'react';
import { Calculator, Printer, BookOpen, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calculator' | 'breakdown' | 'official_form' | 'guideline';
  setActiveTab: (tab: 'calculator' | 'breakdown' | 'official_form' | 'guideline') => void;
  onReset: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onReset,
  onPrint,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('calculator');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
            >
              기초연금 · 장애인연금 통합 모의계산기
            </a>
          </div>

          {/* Zone 2: 4 nav links with clean single-line text and hover states */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              모의계산 입력
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeTab === 'breakdown'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              소득인정액 상세산출표
            </button>
            <button
              onClick={() => setActiveTab('official_form')}
              className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeTab === 'official_form'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              모의결정통지서 (공식서식)
            </button>
            <button
              onClick={() => setActiveTab('guideline')}
              className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                activeTab === 'guideline'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                  : 'hover:text-slate-900'
              }`}
            >
              2026 지침 및 구비서류
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 cursor-pointer whitespace-nowrap"
              title="입력값 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">초기화</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>결과 통지서 인쇄</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
