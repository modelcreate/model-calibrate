import React, { FunctionComponent, useState } from "react";
import { VictoryChart, VictoryLine, VictoryLabel } from "victory";
import { ModelInfoSetting } from "../ModelInfo";
import { debug } from "util";

const calcRms = (tsv1: number[], tsv2: number[]): number => {
  const squaredDifference = tsv1.reduce((acc, value, index) => {
    return acc + Math.pow(value - tsv2[index], 2);
  }, 0);

  return Math.sqrt(squaredDifference / 96);
};

type TimeSeriesChartProps = {
  title: string;
  timeseriesData: number[];
  observered: number[];
  timesteps: Date[];
};

const TimeSeriesChart: FunctionComponent<TimeSeriesChartProps> = ({
  title,
  timeseriesData,
  timesteps,
  observered
}) => {
  const avgData =
    timeseriesData.reduce((p, c) => p + c, 0) / timeseriesData.length;
  const multipler = avgData >= 0 ? 1 : -1;

  const data = timesteps.map((timestep, i) => ({
    x: timestep,
    y: timeseriesData[i] * multipler
  }));
  const observeredData = timesteps.map((timestep, i) => ({
    x: timestep,
    y: observered[i]
  }));

  const max = Math.max(...timeseriesData, ...observered);
  const min = Math.min(...timeseriesData, ...observered);
  const domainMax = Math.max(Math.abs(max), Math.abs(min));
  const domainMin = Math.min(Math.abs(max), Math.abs(min));
  const diff = domainMax - domainMin;

  return (
    <div>
      <VictoryChart
        domain={{ y: [domainMin - diff * 0.1, domainMax + diff * 0.1] }}
        width={500}
        height={180}
        scale={{ x: "time" }}
      >
        <VictoryLabel
          text={`${title} | ${calcRms(timeseriesData, observered).toFixed(
            2
          )}m RMS`}
          x={225}
          y={30}
          textAnchor="middle"
        />
        <VictoryLine
          data={data}
          style={{
            data: { stroke: "#1528f7" },
            labels: { fill: "#00000", fontSize: 20, textAnchor: "start" }
          }}
        />
        <VictoryLine
          data={observeredData}
          style={{
            data: { stroke: "green" }
          }}
        />
      </VictoryChart>
    </div>
  );
};

export default TimeSeriesChart;
