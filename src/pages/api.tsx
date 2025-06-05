import { useEffect, useState } from 'react';
import useActivities from '@/hooks/useActivities';
import { filterYearRuns } from '@/utils/utils';

import { useParams } from 'react-router-dom';


const Api = () => {
  const [data, setData] = useState({});

  const { "*": wildcard } = useParams();

  const availableApis = new Map<string, (_: string) => any>([
    ['activities',
      (year: string) => {
        if (year) {
          return {
            count: activities.filter(activity => filterYearRuns(activity, year)).length
          }
        }
        return {
          count: activities.length,
        }
      }],
    ['distance',
      (year: string) => {
        const yearActivities = year ? activities.filter(activity => filterYearRuns(activity, year)) : activities;
        return {
          sum: yearActivities.reduce((acc, activity) => acc + activity.distance, 0),
          max: Math.max(...yearActivities.map(activity => activity.distance)),
          min: Math.min(...yearActivities.map(activity => activity.distance)),
          avg: yearActivities.length > 0 ? yearActivities.reduce((acc, activity) => acc + activity.distance, 0) / yearActivities.length : Number.NaN,
        };
      }],
    [
      'average-heartrate',
      (year: string) => {
        const yearActivities = year ? activities.filter(activity => filterYearRuns(activity, year)) : activities;
        return {
          max: Math.max(...yearActivities.map(activity => activity.average_heartrate)),
          min: Math.min(...yearActivities.map(activity => activity.average_heartrate)),
          avg: yearActivities.length > 0 ? yearActivities.reduce((acc, activity) => acc + activity.average_heartrate, 0) / yearActivities.length : Number.NaN,
        };
      }
    ],
    [
      'average-speed',
      (year: string) => {
        const yearActivities = year ? activities.filter(activity => filterYearRuns(activity, year)) : activities;
        return {
          max: Math.max(...yearActivities.map(activity => activity.average_speed)),
          min: Math.min(...yearActivities.map(activity => activity.average_speed)),
          avg: yearActivities.length > 0 ? yearActivities.reduce((acc, activity) => acc + activity.average_speed, 0) / yearActivities.length : Number.NaN,
        };
      }
    ],
    [
      'streak',
      (year: string) => {
        const yearActivities = year ? activities.filter(activity => filterYearRuns(activity, year)) : activities;
        return {
          max: Math.max(...yearActivities.map(activity => activity.streak)),
          avg: yearActivities.length > 0 ? yearActivities.reduce((acc, activity) => acc + activity.streak, 0) / yearActivities.length : Number.NaN,
        };
      }
    ],
    [
      'marathon',
      (year: string) => {
        const yearActivities = year ? activities.filter(activity => filterYearRuns(activity, year)) : activities;
        return {
          full: yearActivities.filter(activity => activity.distance >= 42195).length,
          half: yearActivities.filter(activity => activity.distance >= 21097).length,
        };
      }
    ]
  ]);

  const { activities } = useActivities();

  useEffect(() => {
    console.log(wildcard);
    if (!wildcard) {
      const ret = Object.fromEntries(
        Array.from(availableApis).map(([key, mapper]) => [key, mapper('')])
      );
      setData(ret);
    }
    else {
      const parts = wildcard.split('/');
      const index = parts[0] || '';
      const summary = parts.length >= 2;
      const year = summary && parts[1] || '';
      if (availableApis.has(index)) {
        setData(availableApis.get(index)?.call(null, year));
      }
      else {
        setData({});
      }
    }  
  }, []);

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
};

export default Api;
