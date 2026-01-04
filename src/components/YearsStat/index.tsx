import { useMemo, useState } from 'react';
import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import {
  INFO_MESSAGE,
  PLAN_TOTAL_DISTANCE_OF_CURRENT_YEAR,
} from '@/utils/const';
import styles from './style.module.css';

const TOTAL_BLOCKS = 50;

const MetallicProgressBar = ({
  currentDistance,
  targetDistance,
  latestYear,
}: {
  currentDistance: number;
  targetDistance: number;
  latestYear: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const progressPercent = Math.min(
    (currentDistance / targetDistance) * 100,
    100
  );
  const filledBlocks = Math.floor((progressPercent / 100) * TOTAL_BLOCKS);

  return (
    <div
      className={styles.progressContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.progressLabel}>
        {latestYear} 计划完成距离：{targetDistance} km，当前已完成：{currentDistance.toFixed(1)} km。
      </div>
      <div className={styles.progressBlocks}>
        {Array.from({ length: TOTAL_BLOCKS }).map((_, index) => {
          const isFilled = index < filledBlocks;
          return (
            <div
              key={index}
              className={`${styles.progressBlock} ${isFilled ? styles.filledBlock : styles.emptyBlock}`}
            />
          );
        })}
      </div>
      {isHovered && (
        <div className={styles.tooltip}>{progressPercent.toFixed(1)}%</div>
      )}
    </div>
  );
};

const YearsStat = ({
  year,
  onClick,
}: {
  year: string;
  onClick: (_year: string) => void;
}) => {
  const { years, thisYear, activities } = useActivities();

  const yearsArrayUpdate = useMemo(() => {
    let updatedYears = years.slice();
    updatedYears.push('Total');
    updatedYears = updatedYears.filter((x) => x !== year);
    updatedYears.unshift(year);
    return updatedYears;
  }, [years, year]);

  const infoMessage = useMemo(() => {
    return INFO_MESSAGE(years.length, year);
  }, [years.length, year]);

  const currentYearDistance = useMemo(() => {
    const thisYearRuns = activities.filter(
      (run) => run.start_date_local.slice(0, 4) === thisYear
    );
    const totalDistance = thisYearRuns.reduce(
      (sum, run) => sum + (run.distance || 0),
      0
    );
    return totalDistance / 1000;
  }, [activities, thisYear]);

  return (
    <div className="w-full pb-16 pr-16 lg:w-full lg:pr-16">
      <section className="pb-0">
        <p className="leading-relaxed">
          {infoMessage}
          <br />
        </p>
      </section>
      <hr />
      <MetallicProgressBar
        currentDistance={currentYearDistance}
        targetDistance={PLAN_TOTAL_DISTANCE_OF_CURRENT_YEAR}
        latestYear={thisYear}
      />
      {yearsArrayUpdate.map((yearItem) => (
        <div key={yearItem}>
          <hr />
          <YearStat year={yearItem} onClick={onClick} />
        </div>
      ))}
    </div>
  );
};

export default YearsStat;
