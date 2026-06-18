import { useMemo } from 'react';
import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import { PLAN_TOTAL_DISTANCE_OF_CURRENT_YEAR } from '@/utils/const';
import styles from './style.module.css';

export const MetallicProgressBar = ({
  labelPrefix,
  displayPercent,
  progressPercent,
}: {
  labelPrefix: string;
  displayPercent: number;
  progressPercent: number;
}) => {
  const clampedPercent = Math.min(Math.max(progressPercent, 0), 100);

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressLabel}>
        <span className={styles.progressLabelText}>{labelPrefix}</span>
        <span className={styles.percentNumber}>
          {displayPercent.toFixed(1)}%
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
};

export const getYearProgress = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const totalMs = endOfYear.getTime() - startOfYear.getTime();
  const elapsedMs = now.getTime() - startOfYear.getTime();
  const percent = (elapsedMs / totalMs) * 100;
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  return { percent, elapsedDays, totalDays };
};

export const useCurrentYearStats = () => {
  const { activities } = useActivities();

  const currentActualYear = useMemo(() => {
    return new Date().getFullYear().toString();
  }, []);

  const currentYearDistance = useMemo(() => {
    const currentYearRuns = activities.filter(
      (run) => run.start_date_local.slice(0, 4) === currentActualYear
    );
    const totalDistance = currentYearRuns.reduce(
      (sum, run) => sum + (run.distance || 0),
      0
    );
    return totalDistance / 1000;
  }, [activities, currentActualYear]);

  const yearProgress = useMemo(() => getYearProgress(), []);

  const runDistancePercent = Math.min(
    (currentYearDistance / PLAN_TOTAL_DISTANCE_OF_CURRENT_YEAR) * 100,
    100
  );

  return {
    currentActualYear,
    currentYearDistance,
    yearProgress,
    runDistancePercent,
  };
};

const YearsStat = ({
  year,
  onClick,
}: {
  year: string;
  onClick: (_year: string) => void;
}) => {
  const { years } = useActivities();

  const yearsArrayUpdate = useMemo(() => {
    let updatedYears = years.slice();
    updatedYears.push('Total');
    updatedYears = updatedYears.filter((x) => x !== year);
    updatedYears.unshift(year);
    return updatedYears;
  }, [years, year]);

  return (
    <div className="flex w-full flex-col gap-2.5">
      {yearsArrayUpdate.map((yearItem) => (
        <YearStat
          key={yearItem}
          year={yearItem}
          isActive={yearItem === year}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default YearsStat;
