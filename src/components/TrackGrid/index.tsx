import { useMemo, useCallback } from 'react';
import { Activity, Coordinate, pathForRun } from '@/utils/utils';
import styles from './style.module.css';

interface TrackGridProps {
  activities: Activity[];
  onTrackClick?: (runIds: number[]) => void;
  selectedRunId?: number | null;
}

interface TrackData {
  runId: number;
  distance: number;
  path: Coordinate[];
  date: string;
}

const SPECIAL_DISTANCE_1 = 10;
const SPECIAL_DISTANCE_2 = 20;
const MAX_POINTS_PER_TRACK = 80;

function simplifyPath(path: Coordinate[], maxPoints: number): Coordinate[] {
  if (path.length <= maxPoints) return path;
  const step = (path.length - 1) / (maxPoints - 1);
  const result: Coordinate[] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    result.push(path[Math.round(i * step)]);
  }
  result.push(path[path.length - 1]);
  return result;
}

function computeGrid(
  count: number,
  width: number,
  height: number
): { cellSize: number; cols: number; rows: number } | null {
  if (count === 0) return null;

  let bestSize = 0;
  let bestCols = 1;
  let bestRows = 1;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const sizeX = width / cols;
    const sizeY = height / rows;
    const size = Math.min(sizeX, sizeY);
    if (size > bestSize) {
      bestSize = size;
      bestCols = cols;
      bestRows = rows;
    }
  }

  return { cellSize: bestSize, cols: bestCols, rows: bestRows };
}

function projectTrack(
  path: Coordinate[],
  cellSize: number,
  offsetX: number,
  offsetY: number
): string {
  if (path.length < 2) return '';

  const lngs = path.map((p) => p[0]);
  const lats = path.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const dLng = maxLng - minLng || 0.001;
  const dLat = maxLat - minLat || 0.001;

  const padding = cellSize * 0.08;
  const drawSize = cellSize - 2 * padding;
  const scale =
    drawSize / dLng > drawSize / dLat ? drawSize / dLat : drawSize / dLng;

  const cx = offsetX + cellSize / 2;
  const cy = offsetY + cellSize / 2;
  const trackWidth = dLng * scale;
  const trackHeight = dLat * scale;
  const startX = cx - trackWidth / 2;
  const startY = cy - trackHeight / 2;

  let d = '';
  for (let i = 0; i < path.length; i++) {
    const x = startX + ((path[i][0] - minLng) / dLng) * trackWidth;
    const y = startY + ((maxLat - path[i][1]) / dLat) * trackHeight;
    d +=
      i === 0
        ? `M${x.toFixed(1)},${y.toFixed(1)}`
        : `L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

function getTrackColor(distance: number): string {
  if (distance >= SPECIAL_DISTANCE_2) return 'var(--svg-special-color2)';
  if (distance >= SPECIAL_DISTANCE_1) return 'var(--svg-special-color)';
  return 'var(--color-primary)';
}

const TrackGrid = ({
  activities,
  onTrackClick,
  selectedRunId,
}: TrackGridProps) => {
  const tracks = useMemo<TrackData[]>(() => {
    const filtered: TrackData[] = [];
    for (const act of activities) {
      const distKm = act.distance / 1000;
      if (distKm < SPECIAL_DISTANCE_1) continue;
      if (!act.summary_polyline) continue;

      const rawPath = pathForRun(act);
      if (rawPath.length < 2) continue;

      filtered.push({
        runId: act.run_id,
        distance: distKm,
        path: simplifyPath(rawPath, MAX_POINTS_PER_TRACK),
        date: act.start_date_local.slice(0, 10),
      });
    }
    filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return filtered;
  }, [activities]);

  const svgWidth = 900;
  const svgHeight = useMemo(() => {
    if (tracks.length === 0) return 200;
    const grid = computeGrid(tracks.length, svgWidth, svgWidth);
    if (!grid) return 200;
    return grid.rows * grid.cellSize;
  }, [tracks]);

  const gridLayout = useMemo(() => {
    return computeGrid(tracks.length, svgWidth, svgHeight);
  }, [tracks, svgHeight]);

  const pathData = useMemo(() => {
    if (!gridLayout) return [];
    const { cellSize, cols } = gridLayout;

    return tracks.map((track, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const offsetX = col * cellSize;
      const offsetY = row * cellSize;

      const d = projectTrack(track.path, cellSize, offsetX, offsetY);
      const color = getTrackColor(track.distance);

      return {
        d,
        color,
        runId: track.runId,
        title: `${track.date} ${track.distance.toFixed(1)} km`,
      };
    });
  }, [tracks, gridLayout]);

  const handleClick = useCallback(
    (runId: number) => {
      if (onTrackClick) {
        onTrackClick([runId]);
      }
    },
    [onTrackClick]
  );

  if (tracks.length === 0) {
    return null;
  }

  const viewBox = `0 0 ${svgWidth} ${svgHeight}`;

  return (
    <div className={styles.trackGrid}>
      <div className={styles.header}>
        <span className={styles.title}>Over {SPECIAL_DISTANCE_1} km Runs</span>
        <span className={styles.count}>{tracks.length} tracks</span>
      </div>
      <svg
        viewBox={viewBox}
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        {pathData.map((item, i) => {
          const isSelected = selectedRunId === item.runId;
          const dimmed = selectedRunId != null && !isSelected;
          return (
            <g
              key={i}
              onClick={() => handleClick(item.runId)}
              className={styles.trackGroup}
            >
              <path
                d={item.d}
                stroke="transparent"
                fill="none"
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'stroke' }}
              />
              <path
                d={item.d}
                stroke={item.color}
                fill="none"
                strokeWidth={isSelected ? 1.6 : 0.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${styles.track} ${dimmed ? styles.trackDimmed : ''} ${isSelected ? styles.trackSelected : ''}`}
                style={{ pointerEvents: 'none' }}
              >
                <title>{item.title}</title>
              </path>
            </g>
          );
        })}
      </svg>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: 'var(--svg-special-color)' }}
          />
          {SPECIAL_DISTANCE_1}–{SPECIAL_DISTANCE_2} km
        </span>
        <span className={styles.legendItem}>
          <span
            className={styles.legendDot}
            style={{ backgroundColor: 'var(--svg-special-color2)' }}
          />
          {SPECIAL_DISTANCE_2}+ km
        </span>
      </div>
    </div>
  );
};

export default TrackGrid;
