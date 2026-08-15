import React, {
  lazy,
  useState,
  Suspense,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import activities from '@/static/activities.json';
import styles from './style.module.css';
import { ACTIVITY_TOTAL } from '@/utils/const';
import { yearSummaryStats } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import RoutePreview from '@/components/RoutePreview';
import ExportButton from '@/components/ExportButton';
import Card from '@/components/Card';
import MonthOfLife from '@/components/MonthOfLife';
import { Activity } from '@/utils/utils';
const EXPORT_CARDS_PER_ROW = 6;

// Cache for year summary lazy components to prevent flickering
const yearSummaryCache: Record<
  string,
  React.LazyExoticComponent<React.FC<React.SVGProps<SVGSVGElement>>>
> = {};
const getYearSummarySvg = (year: string) => {
  if (!yearSummaryCache[year]) {
    yearSummaryCache[year] = lazy(() =>
      loadSvgComponent(yearSummaryStats, `./year_summary_${year}.svg`)
    );
  }
  return yearSummaryCache[year];
};

interface ActivitySummary {
  totalDistance: number;
  totalTime: number;
  totalElevationGain: number;
  count: number;
  dailyDistances: number[];
  maxDistance: number;
  maxSpeed: number;
  location: string;
  totalHeartRate: number; // Add heart rate statistics
  heartRateCount: number;
  activities: Activity[]; // Add activities array for day interval
}

interface DisplaySummary {
  totalDistance: number;
  averageSpeed: number;
  totalTime: number;
  count: number;
  maxDistance: number;
  maxSpeed: number;
  location: string;
  totalElevationGain?: number;
  averageHeartRate?: number; // Add heart rate display
}

interface ChartData {
  day: number;
  distance: string;
}

interface ActivityCardProps {
  period: string;
  summary: DisplaySummary;
  dailyDistances: number[];
  interval: string;
  activities?: Activity[]; // Add activities for day interval
}

interface ActivityGroups {
  [key: string]: ActivitySummary;
}

type IntervalType = 'year' | 'month' | 'week' | 'day' | 'life';

// A row group contains multiple activity card data items that will be rendered in one virtualized row
type RowGroup = Array<{ period: string; summary: ActivitySummary }>;

const ActivityCardInner: React.FC<ActivityCardProps> = ({
  period,
  summary,
  dailyDistances,
  interval,
  activities = [],
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const handleCardClick = () => {
    if (interval === 'day' && activities.length > 0) {
      setIsFlipped(!isFlipped);
    }
  };
  const generateLabels = (): number[] => {
    if (interval === 'month') {
      const [year, month] = period.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    } else if (interval === 'week') {
      return Array.from({ length: 7 }, (_, i) => i + 1);
    } else if (interval === 'year') {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return [];
  };

  const data: ChartData[] = generateLabels().map((day) => ({
    day,
    distance: (dailyDistances[day - 1] || 0).toFixed(2),
  }));

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const formatPace = (speed: number): string => {
    if (speed === 0) return '0:00 min/km';
    const pace = 60 / speed;
    const totalSeconds = Math.round(pace * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
  };

  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);

  const yAxisMax = Math.ceil(
    Math.max(...data.map((d) => parseFloat(d.distance))) + 10
  );
  const yAxisTicks = Array.from(
    { length: Math.ceil(yAxisMax / 5) + 1 },
    (_, i) => i * 5
  );

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${styles.activityCard} ${interval === 'day' ? styles.activityCardFlippable : ''}`}
      onClick={handleCardClick}
      style={{
        cursor:
          interval === 'day' && activities.length > 0 ? 'pointer' : 'default',
      }}
    >
      {isHovered && (
        <ExportButton
          targetRef={
            interval === 'day'
              ? isFlipped
                ? cardBackRef
                : cardFrontRef
              : cardRef
          }
          filename={`activity-${period}`}
        />
      )}
      <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
        {/* Front side - Activity details */}
        <div ref={cardFrontRef} className={styles.cardFront}>
          <h2 className={styles.activityName}>{period}</h2>
          <div className={styles.activityDetails}>
            <p>
              <strong>{ACTIVITY_TOTAL.TOTAL_DISTANCE_TITLE}:</strong>{' '}
              {summary.totalDistance.toFixed(2)} km
            </p>
            {SHOW_ELEVATION_GAIN &&
              summary.totalElevationGain !== undefined && (
                <p>
                  <strong>{ACTIVITY_TOTAL.TOTAL_ELEVATION_GAIN_TITLE}:</strong>{' '}
                  {summary.totalElevationGain.toFixed(0)} m
                </p>
              )}
            <p>
              <strong>{ACTIVITY_TOTAL.AVERAGE_SPEED_TITLE}:</strong>{' '}
              {formatPace(summary.averageSpeed)}
            </p>
            <p>
              <strong>{ACTIVITY_TOTAL.TOTAL_TIME_TITLE}:</strong>{' '}
              {formatTime(summary.totalTime)}
            </p>
            {summary.averageHeartRate !== undefined && (
              <p>
                <strong>{ACTIVITY_TOTAL.AVERAGE_HEART_RATE_TITLE}:</strong>{' '}
                {summary.averageHeartRate.toFixed(0)} bpm
              </p>
            )}
            {interval !== 'day' && (
              <>
                <p>
                  <strong>{ACTIVITY_TOTAL.ACTIVITY_COUNT_TITLE}:</strong>{' '}
                  {summary.count}
                </p>
                <p>
                  <strong>{ACTIVITY_TOTAL.MAX_DISTANCE_TITLE}:</strong>{' '}
                  {summary.maxDistance.toFixed(2)} km
                </p>
                <p>
                  <strong>{ACTIVITY_TOTAL.MAX_SPEED_TITLE}:</strong>{' '}
                  {formatPace(summary.maxSpeed)}
                </p>
                <p>
                  <strong>{ACTIVITY_TOTAL.AVERAGE_DISTANCE_TITLE}:</strong>{' '}
                  {(summary.totalDistance / summary.count).toFixed(2)} km
                </p>
              </>
            )}
            {['month', 'week', 'year'].includes(interval) && (
              <div className={styles.chart}>
                <ResponsiveContainer>
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-run-row-hover-background)"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{
                        fill: 'var(--color-run-table-thead)',
                        fontSize: 9,
                      }}
                      tickSize={3}
                    />
                    <YAxis
                      label={{
                        value: 'km',
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'var(--color-run-table-thead)',
                        fontSize: 9,
                      }}
                      domain={[0, yAxisMax]}
                      ticks={yAxisTicks}
                      tick={{
                        fill: 'var(--color-run-table-thead)',
                        fontSize: 9,
                      }}
                      tickSize={3}
                    />
                    <Tooltip
                      formatter={(value) => `${value} km`}
                      contentStyle={{
                        backgroundColor:
                          'var(--color-run-row-hover-background)',
                        border:
                          '1px solid var(--color-run-row-hover-background)',
                        color: 'var(--color-run-table-thead)',
                        fontSize: '10px',
                        padding: '4px 8px',
                      }}
                      labelStyle={{
                        color: 'var(--color-primary)',
                        fontSize: '10px',
                      }}
                    />
                    <Bar dataKey="distance" fill="var(--color-primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Back side - Route preview */}
        {interval === 'day' && activities.length > 0 && (
          <div ref={cardBackRef} className={styles.cardBack}>
            <div className={styles.routeContainer}>
              <RoutePreview activities={activities} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// custom equality for memo: compare key summary fields, dailyDistances values and activities length
const activityCardAreEqual = (
  prev: ActivityCardProps,
  next: ActivityCardProps
) => {
  if (prev.period !== next.period) return false;
  if (prev.interval !== next.interval) return false;
  const s1 = prev.summary;
  const s2 = next.summary;
  if (
    s1.totalDistance !== s2.totalDistance ||
    s1.averageSpeed !== s2.averageSpeed ||
    s1.totalTime !== s2.totalTime ||
    s1.count !== s2.count ||
    s1.maxDistance !== s2.maxDistance ||
    s1.maxSpeed !== s2.maxSpeed ||
    s1.location !== s2.location ||
    (s1.totalElevationGain ?? undefined) !==
      (s2.totalElevationGain ?? undefined) ||
    (s1.averageHeartRate ?? undefined) !== (s2.averageHeartRate ?? undefined)
  ) {
    return false;
  }
  const d1 = prev.dailyDistances || [];
  const d2 = next.dailyDistances || [];
  if (d1.length !== d2.length) return false;
  for (let i = 0; i < d1.length; i++) if (d1[i] !== d2[i]) return false;
  const a1 = prev.activities || [];
  const a2 = next.activities || [];
  if (a1.length !== a2.length) return false;
  return true;
};

const ActivityCard = React.memo(ActivityCardInner, activityCardAreEqual);

const ActivityList: React.FC = () => {
  const [interval, setInterval] = useState<IntervalType>('month');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const exportAllRef = useRef<HTMLDivElement | null>(null);

  // Get available years from activities
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    activities.forEach((activity) => {
      const year = new Date(activity.start_date_local).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, []);

  // Keyboard navigation for year selection in Life view
  useEffect(() => {
    if (interval !== 'life') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      // Prevent default scrolling behavior
      e.preventDefault();

      // Remove focus from current element to avoid visual confusion
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const currentIndex = selectedYear
        ? availableYears.indexOf(selectedYear)
        : -1;

      if (e.key === 'ArrowLeft') {
        // Move to newer year (left in UI, lower index since sorted descending)
        if (currentIndex === -1) {
          // No year selected, select the last (oldest) year
          setSelectedYear(availableYears[availableYears.length - 1]);
        } else if (currentIndex > 0) {
          setSelectedYear(availableYears[currentIndex - 1]);
        } else if (currentIndex === 0) {
          // At the most recent year, deselect to show Life view
          setSelectedYear(null);
        }
      } else if (e.key === 'ArrowRight') {
        // Move to older year (right in UI, higher index since sorted descending)
        if (currentIndex === -1) {
          // No year selected, select the first (most recent) year
          setSelectedYear(availableYears[0]);
        } else if (currentIndex < availableYears.length - 1) {
          setSelectedYear(availableYears[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interval, selectedYear, availableYears]);

  function toggleInterval(newInterval: IntervalType): void {
    setInterval(newInterval);
  }

  function convertTimeToSeconds(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function groupActivitiesFn(
    intervalArg: IntervalType,
    sportTypeArg: string
  ): ActivityGroups {
    return (activities as Activity[])
      .filter((activity) => {
        if (sportTypeArg === 'all') return true;
        if (sportTypeArg === 'running')
          return activity.type === 'running' || activity.type === 'Run';
        if (sportTypeArg === 'walking')
          return activity.type === 'walking' || activity.type === 'Walk';
        if (sportTypeArg === 'cycling')
          return activity.type === 'cycling' || activity.type === 'Ride';
        return activity.type === sportTypeArg;
      })
      .reduce((acc: ActivityGroups, activity) => {
        const date = new Date(activity.start_date_local);
        let key: string;
        let index: number;
        switch (intervalArg) {
          case 'year':
            key = date.getFullYear().toString();
            index = date.getMonth();
            break;
          case 'month':
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            index = date.getDate() - 1;
            break;
          case 'week': {
            const currentDate = new Date(date.valueOf());
            currentDate.setDate(
              currentDate.getDate() + 4 - (currentDate.getDay() || 7)
            );
            const yearStart = new Date(currentDate.getFullYear(), 0, 1);
            const weekNum = Math.ceil(
              ((currentDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
            );
            key = `${currentDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
            index = (date.getDay() + 6) % 7;
            break;
          }
          case 'day':
            key = date.toLocaleDateString('zh').replaceAll('/', '-');
            index = 0;
            break;
          default:
            key = date.getFullYear().toString();
            index = 0;
        }

        if (!acc[key])
          acc[key] = {
            totalDistance: 0,
            totalTime: 0,
            totalElevationGain: 0,
            count: 0,
            dailyDistances: [],
            maxDistance: 0,
            maxSpeed: 0,
            location: '',
            totalHeartRate: 0,
            heartRateCount: 0,
            activities: [],
          };

        const distanceKm = activity.distance / 1000;
        const timeInSeconds = convertTimeToSeconds(activity.moving_time);
        const speedKmh =
          timeInSeconds > 0 ? distanceKm / (timeInSeconds / 3600) : 0;

        acc[key].totalDistance += distanceKm;
        acc[key].totalTime += timeInSeconds;

        if (SHOW_ELEVATION_GAIN && activity.elevation_gain)
          acc[key].totalElevationGain += activity.elevation_gain;

        if (activity.average_heartrate) {
          acc[key].totalHeartRate += activity.average_heartrate;
          acc[key].heartRateCount += 1;
        }

        acc[key].count += 1;
        if (intervalArg === 'day') acc[key].activities.push(activity);
        acc[key].dailyDistances[index] =
          (acc[key].dailyDistances[index] || 0) + distanceKm;
        if (distanceKm > acc[key].maxDistance)
          acc[key].maxDistance = distanceKm;
        if (speedKmh > acc[key].maxSpeed) acc[key].maxSpeed = speedKmh;
        if (intervalArg === 'day')
          acc[key].location = activity.location_country || '';

        return acc;
      }, {} as ActivityGroups);
  }

  const activitiesByInterval = useMemo(
    () => groupActivitiesFn(interval, 'all'),
    [interval]
  );

  const dataList = useMemo(
    () =>
      Object.entries(activitiesByInterval)
        .sort(([a], [b]) => {
          if (interval === 'day') {
            return new Date(b).getTime() - new Date(a).getTime(); // Sort by date
          } else if (interval === 'week') {
            const [yearA, weekA] = a.split('-W').map(Number);
            const [yearB, weekB] = b.split('-W').map(Number);
            return yearB - yearA || weekB - weekA; // Sort by year and week number
          } else {
            const [yearA, monthA = 0] = a.split('-').map(Number);
            const [yearB, monthB = 0] = b.split('-').map(Number);
            return yearB - yearA || monthB - monthA; // Sort by year and month
          }
        })
        .map(([period, summary]) => ({ period, summary })),
    [activitiesByInterval, interval]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const exportRowGroups = useMemo(() => {
    const groupLength = Math.ceil(dataList.length / EXPORT_CARDS_PER_ROW);
    const arr: RowGroup[] = [];
    for (let i = 0; i < groupLength; i++) {
      const start = i * EXPORT_CARDS_PER_ROW;
      arr.push(dataList.slice(start, start + EXPORT_CARDS_PER_ROW));
    }
    return arr;
  }, [dataList]);

  const handleExportAll = useCallback(async () => {
    if (isExportingAll || dataList.length === 0) return;
    setIsExportingAll(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const { domToPng } = await import('modern-screenshot');
      if (!exportAllRef.current) {
        setIsExportingAll(false);
        return;
      }

      const el = exportAllRef.current;
      el.style.opacity = '1';
      el.style.position = 'relative';
      el.style.zIndex = 'auto';

      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await domToPng(el, {
        scale: 2,
      });

      el.style.opacity = '0';
      el.style.position = 'absolute';
      el.style.zIndex = '-9999';

      const link = document.createElement('a');
      link.download = `activities-all-${interval}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export all failed:', error);
    } finally {
      setIsExportingAll(false);
    }
  }, [isExportingAll, dataList.length, interval]);

  const intervalOptions: { value: IntervalType; label: string }[] = [
    { value: 'year', label: ACTIVITY_TOTAL.YEARLY_TITLE },
    { value: 'month', label: ACTIVITY_TOTAL.MONTHLY_TITLE },
    { value: 'week', label: ACTIVITY_TOTAL.WEEKLY_TITLE },
    { value: 'day', label: ACTIVITY_TOTAL.DAILY_TITLE },
    { value: 'life', label: 'Life' },
  ];

  return (
    <div className={styles.activityList}>
      <Card className="p-4 lg:p-6">
        <div className={styles.filterContainer} ref={filterRef}>
          <div className={styles.pillGroup}>
            {intervalOptions.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.pill} ${interval === opt.value ? styles.pillActive : ''}`}
                onClick={() => toggleInterval(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {interval === 'year' && (
            <button
              className={styles.exportAllButton}
              onClick={handleExportAll}
              disabled={isExportingAll || dataList.length === 0}
              title="导出所有卡片为图片"
            >
              {isExportingAll ? (
                <span className={styles.exportAllSpinner} />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
            </button>
          )}
        </div>
      </Card>

      {interval === 'life' && (
        <Card className="p-4 lg:p-6">
          <div className={styles.lifeContainer}>
            <div className={styles.yearSelector}>
              {availableYears.map((year) => (
                <button
                  key={year}
                  className={`${styles.yearButton} ${selectedYear === year ? styles.yearButtonActive : ''}`}
                  onClick={() =>
                    setSelectedYear(selectedYear === year ? null : year)
                  }
                >
                  {year}
                </button>
              ))}
            </div>
            {selectedYear ? (
              <Suspense fallback={<div>Loading SVG...</div>}>
                {(() => {
                  const YearSvg = getYearSummarySvg(selectedYear);
                  return <YearSvg className={styles.yearSummarySvg} />;
                })()}
              </Suspense>
            ) : (
              <MonthOfLife activities={activities as Activity[]} />
            )}
          </div>
        </Card>
      )}

      {interval !== 'life' && (
        <Card className="p-4 lg:p-6">
          <div className={styles.cardGrid} ref={containerRef}>
            {dataList.map((cardData) => (
              <ActivityCard
                key={cardData.period}
                period={cardData.period}
                summary={{
                  totalDistance: cardData.summary.totalDistance,
                  averageSpeed: cardData.summary.totalTime
                    ? cardData.summary.totalDistance /
                      (cardData.summary.totalTime / 3600)
                    : 0,
                  totalTime: cardData.summary.totalTime,
                  count: cardData.summary.count,
                  maxDistance: cardData.summary.maxDistance,
                  maxSpeed: cardData.summary.maxSpeed,
                  location: cardData.summary.location,
                  totalElevationGain: SHOW_ELEVATION_GAIN
                    ? cardData.summary.totalElevationGain
                    : undefined,
                  averageHeartRate:
                    cardData.summary.heartRateCount > 0
                      ? cardData.summary.totalHeartRate /
                        cardData.summary.heartRateCount
                      : undefined,
                }}
                dailyDistances={cardData.summary.dailyDistances}
                interval={interval}
                activities={
                  interval === 'day' ? cardData.summary.activities : undefined
                }
              />
            ))}
          </div>

          {isExportingAll && (
            <div ref={exportAllRef} className={styles.exportAllContainer}>
              {exportRowGroups.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.exportAllRow}>
                  {row.map((cardData) => (
                    <ActivityCard
                      key={cardData.period}
                      period={cardData.period}
                      summary={{
                        totalDistance: cardData.summary.totalDistance,
                        averageSpeed: cardData.summary.totalTime
                          ? cardData.summary.totalDistance /
                            (cardData.summary.totalTime / 3600)
                          : 0,
                        totalTime: cardData.summary.totalTime,
                        count: cardData.summary.count,
                        maxDistance: cardData.summary.maxDistance,
                        maxSpeed: cardData.summary.maxSpeed,
                        location: cardData.summary.location,
                        totalElevationGain: SHOW_ELEVATION_GAIN
                          ? cardData.summary.totalElevationGain
                          : undefined,
                        averageHeartRate:
                          cardData.summary.heartRateCount > 0
                            ? cardData.summary.totalHeartRate /
                              cardData.summary.heartRateCount
                            : undefined,
                      }}
                      dailyDistances={cardData.summary.dailyDistances}
                      interval={interval}
                      activities={
                        interval === 'day'
                          ? cardData.summary.activities
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ActivityList;
