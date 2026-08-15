import { useMemo, useCallback } from 'react';
import { Activity } from '@/utils/utils';
import styles from './style.module.css';

interface ActivityHeatmapProps {
  year: string;
  activities: Activity[];
  onDayClick?: (runIds: number[]) => void;
}

interface DayData {
  date: string;
  distance: number;
  runIds: number[];
}

interface YearHeatmapData {
  year: string;
  weeks: (DayData | null)[][];
  maxDistance: number;
  monthLabels: { text: string; col: number }[];
  totalDistance: number;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

function buildYearData(
  targetYear: string,
  activities: Activity[]
): YearHeatmapData {
  const yearNum = parseInt(targetYear, 10);
  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum, 11, 31);

  const dayMap = new Map<string, DayData>();
  let totalDistance = 0;
  activities.forEach((act) => {
    const dateStr = act.start_date_local.slice(0, 10);
    const actYear = dateStr.slice(0, 4);
    if (actYear !== targetYear) return;

    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, { date: dateStr, distance: 0, runIds: [] });
    }
    const day = dayMap.get(dateStr)!;
    day.distance += act.distance / 1000;
    day.runIds.push(act.run_id);
    totalDistance += act.distance / 1000;
  });

  const startDayOfWeek = (startDate.getDay() + 6) % 7;

  const allWeeks: (DayData | null)[][] = [];
  let currentWeek: (DayData | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  let maxDist = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const dayData = dayMap.get(dateStr) || {
      date: dateStr,
      distance: 0,
      runIds: [],
    };
    if (dayData.distance > maxDist) {
      maxDist = dayData.distance;
    }
    currentWeek.push(dayData);

    if (currentWeek.length === 7) {
      allWeeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    allWeeks.push(currentWeek);
  }

  const labels: { text: string; col: number }[] = [];
  let prevMonth = -1;
  allWeeks.forEach((week, weekIdx) => {
    for (const day of week) {
      if (day) {
        const month = parseInt(day.date.slice(5, 7), 10) - 1;
        if (month !== prevMonth) {
          labels.push({ text: MONTHS[month], col: weekIdx });
          prevMonth = month;
        }
        break;
      }
    }
  });

  return {
    year: targetYear,
    weeks: allWeeks,
    maxDistance: maxDist,
    monthLabels: labels,
    totalDistance,
  };
}

const YearGrid = ({
  data,
  onDayClick,
  showYearLabel,
}: {
  data: YearHeatmapData;
  onDayClick?: (runIds: number[]) => void;
  showYearLabel?: boolean;
}) => {
  const getColor = useCallback(
    (distance: number): string => {
      if (distance === 0) return 'var(--heatmap-empty)';
      const ratio = Math.min(distance / Math.max(data.maxDistance, 1), 1);
      if (ratio <= 0.25) return 'var(--heatmap-level-1)';
      if (ratio <= 0.5) return 'var(--heatmap-level-2)';
      if (ratio <= 0.75) return 'var(--heatmap-level-3)';
      return 'var(--heatmap-level-4)';
    },
    [data.maxDistance]
  );

  const handleCellClick = useCallback(
    (dayData: DayData) => {
      if (dayData.runIds.length > 0 && onDayClick) {
        onDayClick(dayData.runIds);
      }
    },
    [onDayClick]
  );

  return (
    <div className={styles.yearSection}>
      {showYearLabel && (
        <div className={styles.yearHeader}>
          <span className={styles.yearLabel}>{data.year}</span>
          <span className={styles.yearDistance}>
            {data.totalDistance.toFixed(0)} km
          </span>
        </div>
      )}
      <div className={styles.heatmapScroll}>
        <div className={styles.heatmap}>
          <div className={styles.dayLabels}>
            {DAYS.map((d, i) => (
              <span key={i} className={styles.dayLabel}>
                {d}
              </span>
            ))}
          </div>
          <div className={styles.gridArea}>
            <div className={styles.monthLabels}>
              {data.monthLabels.map((label, i) => (
                <span
                  key={i}
                  className={styles.monthLabel}
                  style={{ gridColumnStart: label.col + 1 }}
                >
                  {label.text}
                </span>
              ))}
            </div>
            <div className={styles.grid}>
              {data.weeks.map((week, weekIdx) => (
                <div key={weekIdx} className={styles.weekColumn}>
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`${styles.cell} ${day && day.runIds.length > 0 ? styles.cellActive : ''}`}
                      style={{
                        backgroundColor: day
                          ? getColor(day.distance)
                          : 'transparent',
                      }}
                      onClick={() => day && handleCellClick(day)}
                      title={
                        day
                          ? `${day.date}: ${day.distance.toFixed(1)} km`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityHeatmap = ({
  year,
  activities,
  onDayClick,
}: ActivityHeatmapProps) => {
  const yearsData = useMemo(() => {
    if (year === 'Total') {
      const yearSet = new Set<string>();
      activities.forEach((act) => {
        yearSet.add(act.start_date_local.slice(0, 4));
      });
      const sortedYears = [...yearSet].sort().reverse();
      return sortedYears.map((y) => buildYearData(y, activities));
    }
    return [buildYearData(year, activities)];
  }, [year, activities]);

  return (
    <div className={styles.heatmapWrapper}>
      {yearsData.map((data) => (
        <YearGrid
          key={data.year}
          data={data}
          onDayClick={onDayClick}
          showYearLabel={year === 'Total'}
        />
      ))}
      <div className={styles.legend}>
        <span className={styles.legendText}>Less</span>
        <div
          className={styles.legendCell}
          style={{ backgroundColor: 'var(--heatmap-empty)' }}
        />
        <div
          className={styles.legendCell}
          style={{ backgroundColor: 'var(--heatmap-level-1)' }}
        />
        <div
          className={styles.legendCell}
          style={{ backgroundColor: 'var(--heatmap-level-2)' }}
        />
        <div
          className={styles.legendCell}
          style={{ backgroundColor: 'var(--heatmap-level-3)' }}
        />
        <div
          className={styles.legendCell}
          style={{ backgroundColor: 'var(--heatmap-level-4)' }}
        />
        <span className={styles.legendText}>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
