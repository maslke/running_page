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
  labelPrefix,
  displayPercent,
  progressPercent,
}: {
  labelPrefix: string;
  displayPercent: number;
  progressPercent: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const percentPerBlock = 100 / TOTAL_BLOCKS;
  const filledBlocks = Math.floor(progressPercent / percentPerBlock);
  const remainder = progressPercent % percentPerBlock;
  const hasPartialBlock = remainder >= 1 && filledBlocks < TOTAL_BLOCKS;

  const getBlockClassName = (index: number) => {
    if (index < filledBlocks) {
      return `${styles.progressBlock} ${styles.filledBlock}`;
    }
    if (index === filledBlocks && hasPartialBlock) {
      return `${styles.progressBlock} ${styles.partialBlock}`;
    }
    return `${styles.progressBlock} ${styles.emptyBlock}`;
  };

  return (
    <div
      className={styles.progressContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.progressLabel}>
        {labelPrefix}
        <span className={styles.percentNumber}>
          {displayPercent.toFixed(1)}
        </span>{' '}
        <span className={styles.percentSymbol}>%</span>
      </div>
      <div className={styles.progressBlocks}>
        {Array.from({ length: TOTAL_BLOCKS }).map((_, index) => (
          <div key={index} className={getBlockClassName(index)} />
        ))}
      </div>
      {isHovered && (
        <div className={styles.tooltip}>{progressPercent.toFixed(1)}%</div>
      )}
    </div>
  );
};

const getYearProgress = () => {
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
        labelPrefix={`${currentActualYear} 跑步进度：`}
        displayPercent={Math.min(
          (currentYearDistance / PLAN_TOTAL_DISTANCE_OF_CURRENT_YEAR) * 100,
          100
        )}
        progressPercent={Math.min(
          (currentYearDistance / PLAN_TOTAL_DISTANCE_OF_CURRENT_YEAR) * 100,
          100
        )}
      />
      <MetallicProgressBar
        labelPrefix={`${currentActualYear} 时间进度：`}
        displayPercent={yearProgress.percent}
        progressPercent={yearProgress.percent}
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
