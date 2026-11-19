import {
  formatPace,
  titleForRun,
  formatRunTime,
  Activity,
  RunIds,
} from '@/utils/utils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import styles from './style.module.css';

interface IRunRowProperties {
  elementIndex: number;
  locateActivity: (_runIds: RunIds) => void;
  run: Activity;
  runIndex: number;
  setRunIndex: (_ndex: number) => void;
}

const RunRow = ({
  elementIndex,
  locateActivity,
  run,
  runIndex,
  setRunIndex,
}: IRunRowProperties) => {
  const distance = (run.distance / 1000.0).toFixed(2);
  const paceParts = run.average_speed ? formatPace(run.average_speed) : null;
  const heartRate = run.average_heartrate;
  const runTime = formatRunTime(run.moving_time);
  const isSelected = runIndex === elementIndex;
  const handleClick = () => {
    if (isSelected) {
      setRunIndex(-1);
      locateActivity([]);
      return;
    }
    setRunIndex(elementIndex);
    locateActivity([run.run_id]);
  };

  return (
    <>
      <tr
        className={`${styles.runRow} ${isSelected ? styles.selected : ''}`}
        key={run.start_date_local}
        onClick={handleClick}
      >
        <td>{titleForRun(run)}</td>
        <td>{distance}</td>
        {SHOW_ELEVATION_GAIN && (
          <td>{(run.elevation_gain ?? 0.0).toFixed(1)}</td>
        )}
        {paceParts && <td>{paceParts}</td>}
        <td>{heartRate && heartRate.toFixed(0)}</td>
        <td>{runTime}</td>
        <td className={styles.runDate}>{run.start_date_local}</td>
      </tr>

      <div
        className={`${styles.mobileCard} ${isSelected ? styles.mobileCardSelected : ''}`}
        onClick={handleClick}
      >
        <div className={styles.mobileCardHeader}>
          <span className={styles.mobileCardTitle}>{titleForRun(run)}</span>
          <span className={styles.mobileCardDate}>{run.start_date_local}</span>
        </div>
        <div className={styles.mobileCardStats}>
          <div className={styles.mobileCardStat}>
            <span className={styles.mobileCardValue}>{distance}</span>
            <span className={styles.mobileCardLabel}>KM</span>
          </div>
          {paceParts && (
            <div className={styles.mobileCardStat}>
              <span className={styles.mobileCardValue}>{paceParts}</span>
              <span className={styles.mobileCardLabel}>Pace</span>
            </div>
          )}
          <div className={styles.mobileCardStat}>
            <span className={styles.mobileCardValue}>{runTime}</span>
            <span className={styles.mobileCardLabel}>Time</span>
          </div>
          {heartRate && (
            <div className={styles.mobileCardStat}>
              <span className={styles.mobileCardValue}>
                {heartRate.toFixed(0)}
              </span>
              <span className={styles.mobileCardLabel}>BPM</span>
            </div>
          )}
          {SHOW_ELEVATION_GAIN && (
            <div className={styles.mobileCardStat}>
              <span className={styles.mobileCardValue}>
                {(run.elevation_gain ?? 0.0).toFixed(0)}
              </span>
              <span className={styles.mobileCardLabel}>Elev</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RunRow;
