import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import useActivities from '@/hooks/useActivities';
import { formatPace, intComma } from '@/utils/utils';
import useHover from '@/hooks/useHover';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';

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

const CompactStat = ({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) => (
  <div className="flex flex-col">
    <span className="text-base font-black tabular-nums tracking-tighter lg:text-lg">
      {intComma(value.toString())}
    </span>
    <span className="text-[9px] font-medium uppercase tracking-widest opacity-45 lg:text-[10px]">
      {label}
    </span>
  </div>
);

const YearStat = ({
  year,
  isActive,
  onClick,
}: {
  year: string;
  isActive?: boolean;
  onClick: (_year: string) => void;
}) => {
  let { activities: runs, years } = useActivities();
  const [hovered, eventHandlers] = useHover();

  if (years.includes(year)) {
    runs = runs.filter((run) => run.start_date_local.slice(0, 4) === year);
  }

  let sumDistance = 0;
  let streak = 0;
  let sumElevationGain = 0;
  let _pace = 0;
  let _paceNullCount = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  let totalMetersAvail = 0;
  let totalSecondsAvail = 0;
  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    sumElevationGain += run.elevation_gain || 0;
    if (run.average_speed) {
      _pace += run.average_speed;
      totalMetersAvail += run.distance || 0;
      totalSecondsAvail += (run.distance || 0) / run.average_speed;
    } else {
      _paceNullCount++;
    }
    if (run.average_heartrate) {
      heartRate += run.average_heartrate;
    } else {
      heartRateNullCount++;
    }
    if (run.streak) {
      streak = Math.max(streak, run.streak);
    }
  });
  sumDistance = parseFloat((sumDistance / 1000.0).toFixed(1));
  const sumElevationGainStr = sumElevationGain.toFixed(0);
  const avgPace = formatPace(totalMetersAvail / totalSecondsAvail);
  const hasHeartRate = !(heartRate === 0);
  const avgHeartRate = (heartRate / (runs.length - heartRateNullCount)).toFixed(
    0
  );

  const monthlyData = useMemo(() => {
    const monthMap: Record<number, number> = {};
    for (let i = 0; i < 12; i++) monthMap[i] = 0;

    runs.forEach((run) => {
      const month = parseInt(run.start_date_local.slice(5, 7), 10) - 1;
      monthMap[month] += (run.distance || 0) / 1000;
    });

    return MONTHS.map((name, i) => ({
      month: name,
      km: parseFloat(monthMap[i].toFixed(1)),
    }));
  }, [runs]);

  const maxKm = useMemo(
    () => Math.max(...monthlyData.map((d) => d.km), 1),
    [monthlyData]
  );

  return (
    <div
      className={`cursor-pointer overflow-hidden rounded-xl transition-all hover:opacity-85 ${
        isActive
          ? 'ring-1 ring-(--color-selected)/30'
          : ''
      }`}
      style={{
        backgroundColor: 'var(--color-run-row-hover-background)',
      }}
      onClick={() => onClick(year)}
      {...eventHandlers}
    >
      <div className={`flex ${isActive ? '' : ''}`}>
        {isActive && (
          <div
            className="w-1 shrink-0 rounded-l-xl"
            style={{ backgroundColor: 'var(--color-selected)' }}
          />
        )}
        <div className={`flex-1 p-2.5 lg:p-3 ${isActive ? 'pl-2 lg:pl-2.5' : ''}`}>
          <div className="flex items-baseline gap-3 lg:mb-1.5 lg:block">
            <span className={`text-sm font-black uppercase tracking-tight lg:text-base ${isActive ? 'opacity-100' : 'opacity-75'}`}>
              {year}
            </span>
            <div className="flex flex-1 gap-3 overflow-hidden lg:hidden">
              <span className="shrink-0 text-xs tabular-nums opacity-60">
                {runs.length} runs
              </span>
              <span className="shrink-0 text-xs tabular-nums opacity-60">
                {sumDistance} km
              </span>
              <span className="shrink-0 text-xs tabular-nums opacity-60">
                {avgPace}
              </span>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid">
            <CompactStat value={runs.length} label="Runs" />
            <CompactStat value={sumDistance} label="KM" />
            <CompactStat value={avgPace} label="Pace" />
            {SHOW_ELEVATION_GAIN && (
              <CompactStat value={sumElevationGainStr} label="Elev" />
            )}
            <CompactStat value={`${streak}d`} label="Streak" />
            {hasHeartRate && <CompactStat value={avgHeartRate} label="BPM" />}
          </div>
          {year !== 'Total' && hovered && (
            <div className="mt-2.5 hidden lg:block" style={{ width: '100%', height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  layout="vertical"
                  margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide domain={[0, maxKm * 1.1]} />
                  <YAxis
                    type="category"
                    dataKey="month"
                    width={28}
                    tick={{ fontSize: 9, fill: 'var(--color-run-date)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'var(--color-activity-card)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.7rem',
                      color: 'var(--color-primary)',
                    }}
                    formatter={(value: number) => [`${value} km`, '']}
                  />
                  <Bar dataKey="km" radius={[0, 3, 3, 0]} barSize={7}>
                    {monthlyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.km > 0
                            ? 'var(--color-selected)'
                            : 'var(--color-activity-card)'
                        }
                        opacity={0.3 + (entry.km / maxKm) * 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YearStat;
