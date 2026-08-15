import React, { useMemo } from 'react';
import siteMetadata from '@/static/site-metadata';
import { Activity } from '@/utils/utils';
import styles from './style.module.css';

interface MonthOfLifeProps {
  activities: Activity[];
  userName?: string;
}

interface MonthData {
  year: number;
  month: number;
  distance: number;
  age: number;
  isPast: boolean;
}

const TOTAL_MONTHS = 1200;
const COLS = 36;
const ROWS = Math.ceil(TOTAL_MONTHS / COLS);

const MonthOfLife: React.FC<MonthOfLifeProps> = ({
  activities,
  userName = 'Runner',
}) => {
  const { birthYear, birthMonth } = useMemo(() => {
    const parts = siteMetadata.birthDate.split('-');
    return { birthYear: parseInt(parts[0]), birthMonth: parseInt(parts[1]) };
  }, []);

  const { monthData, maxDistance, totalDistance, totalCount } = useMemo(() => {
    const distByMonth = new Map<string, number>();
    let total = 0;
    activities.forEach((a) => {
      const d = new Date(a.start_date_local);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      distByMonth.set(key, (distByMonth.get(key) || 0) + (a.distance || 0));
      total += a.distance || 0;
    });

    const now = new Date();
    let maxDist = 0;
    const data: MonthData[] = [];

    for (let idx = 0; idx < TOTAL_MONTHS; idx++) {
      const y = birthYear + Math.floor((birthMonth - 1 + idx) / 12);
      const m = ((birthMonth - 1 + idx) % 12) + 1;
      const monthDate = new Date(y, m - 1, 1);
      const isPast = monthDate < now;
      const key = `${y}-${m}`;
      const distance = distByMonth.get(key) || 0;
      const age = Math.floor(idx / 12);
      if (distance > maxDist) maxDist = distance;
      data.push({ year: y, month: m, distance, age, isPast });
    }

    return {
      monthData: data,
      maxDistance: maxDist,
      totalDistance: total,
      totalCount: activities.length,
    };
  }, [activities, birthYear, birthMonth]);

  const weeklyAvg = useMemo(() => {
    if (activities.length === 0) return 0;
    const dates = activities.map((a) => new Date(a.start_date_local).getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...dates);
    const weeks = Math.max(1, (latest - earliest) / (7 * 24 * 60 * 60 * 1000));
    return activities.length / weeks;
  }, [activities]);

  const getColor = (data: MonthData): string => {
    if (data.distance === 0) {
      return data.isPast ? 'var(--mol-color-past)' : 'var(--mol-color-future)';
    }
    const distKm = data.distance / 1000;
    if (distKm >= 200) return 'var(--svg-special-color2)';
    if (distKm >= 100) return 'var(--svg-special-color)';
    const ratio = Math.min(data.distance / maxDistance, 1);
    const level = Math.ceil(ratio * 4);
    return `var(--mol-color-level-${level})`;
  };

  const viewBoxWidth = 360;
  const viewBoxHeight = 200;
  const gridOffsetX = 8;
  const gridOffsetY = 18;
  const gridWidth = viewBoxWidth - gridOffsetX * 2;
  const gridHeight = 165;
  const spacingX = gridWidth / COLS;
  const spacingY = gridHeight / ROWS;
  const radius = (Math.min(spacingX, spacingY) / 2) * 0.82;

  const footerY = viewBoxHeight - 10;

  return (
    <div className={styles.container}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className={styles.svg}
        role="img"
        aria-label="Runner Month of Life"
      >
        <text x={gridOffsetX} y="12" className={styles.title}>
          Runner Month of Life
        </text>

        {monthData.map((data, idx) => {
          const xIdx = idx % COLS;
          const yIdx = Math.floor(idx / COLS);
          const cx = gridOffsetX + spacingX * xIdx + spacingX / 2;
          const cy = gridOffsetY + spacingY * yIdx + spacingY / 2;
          const distKm = (data.distance / 1000).toFixed(1);
          const title =
            data.distance > 0
              ? `${data.year}-${String(data.month).padStart(2, '0')} (${data.age} yrs) ${distKm} km`
              : `${data.year}-${String(data.month).padStart(2, '0')} (${data.age} yrs)`;

          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={radius}
              fill={getColor(data)}
              className={styles.circle}
            >
              <title>{title}</title>
            </circle>
          );
        })}

        <text x={gridOffsetX} y={footerY - 4} className={styles.label}>
          Runner
        </text>
        <text x={gridOffsetX} y={footerY + 3} className={styles.userName}>
          {userName}
        </text>

        <text x="200" y={footerY - 4} className={styles.label}>
          STATISTICS
        </text>
        <text x="200" y={footerY + 2} className={styles.stat}>
          Number: {totalCount}
        </text>
        <text x="240" y={footerY + 2} className={styles.stat}>
          Weekly: {weeklyAvg.toFixed(1)}
        </text>
        <text x="280" y={footerY + 2} className={styles.stat}>
          Total: {(totalDistance / 1000).toFixed(1)} km
        </text>
        <text x="325" y={footerY + 2} className={styles.stat}>
          Avg:{' '}
          {totalCount > 0
            ? (totalDistance / 1000 / totalCount).toFixed(1)
            : '0'}{' '}
          km
        </text>
      </svg>
    </div>
  );
};

export default MonthOfLife;
