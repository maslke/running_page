import { useMemo } from 'react';

interface IYearPillsProps {
  years: string[];
  selectedYear: string;
  onClick: (_year: string) => void;
}

const YearPills = ({ years, selectedYear, onClick }: IYearPillsProps) => {
  const yearsWithTotal = useMemo(() => {
    const items = years.slice();
    if (!items.includes('Total')) {
      items.push('Total');
    }
    return items;
  }, [years]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {yearsWithTotal.map((y) => (
        <button
          key={y}
          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
            y === selectedYear
              ? 'bg-(--color-selected) text-(--color-bg) shadow-sm'
              : 'bg-(--color-activity-card) opacity-65 hover:opacity-90'
          }`}
          onClick={() => onClick(y)}
        >
          {y}
        </button>
      ))}
    </div>
  );
};

export default YearPills;
