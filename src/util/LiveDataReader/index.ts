import ModelFeatureCollection, {
  LiveDataRaw,
  ModelLiveData,
  SensorData,
  LiveDataPoint
} from "../../interfaces/ModelFeatureCollection";

export default function liveDataReader(
  orgModel: ModelFeatureCollection,
  timeSteps: number
): ModelLiveData {
  const startTime = getStartDate(orgModel);

  const sensorData = Object.keys(orgModel.model.live_data).reduce(
    (prev, curr) => {
      return {
        ...prev,
        [curr]: processSensorData(
          orgModel.model.live_data[curr],
          startTime,
          timeSteps
        )
      };
    },
    <SensorData>{}
  );

  const nodes = orgModel.features.filter(f => {
    return (
      f.properties &&
      (f.properties.table === "wn_node" ||
        f.properties.table === "wn_hydrant" ||
        f.properties.table === "wn_transfer_node")
    );
  });
  //@ts-ignore
  const liveDataPoints: LiveDataPoint[] = nodes
    .map((n, i) => {
      if (
        n.properties &&
        n.properties.live_data_point_id &&
        n.properties.table !== "wn_transfer_node"
      ) {
        return {
          nodeId: n.properties.id,
          liveDataId: n.properties.live_data_point_id,
          epanetId: i
        };
      }
    })
    .filter(f => f !== undefined)
    .sort((a, b) =>
      //@ts-ignore
      a.liveDataId > b.liveDataId ? 1 : b.liveDataId > a.liveDataId ? -1 : 0
    );

  const liveData = {
    sensorData,
    liveDataPoints
  };

  return liveData;
}

function getStartDate(orgModel: ModelFeatureCollection): Date {
  const [day, month, year] = orgModel.model.run_time.start_date_time
    .split("/")
    .map(s => {
      return parseInt(s);
    });
  const date = new Date(Date.UTC(year, month - 1, day));

  return date;
}

function processSensorData(
  liveData: LiveDataRaw,
  startTime: Date,
  timeSteps: number
): number[] {
  const [day, month, year] = liveData.live_data.date.split("/").map(s => {
    return parseInt(s);
  });
  const [hour, minute] = liveData.live_data.time.split(":").map(s => {
    return parseInt(s);
  });

  //TODO: fixed 15min
  const timeOffset = liveData.time_offset
    ? Math.floor(parseFloat(liveData.time_offset) / 15)
    : 0;

  const dateTime = new Date(
    Date.UTC(2000 + year, month - 1, day, hour, minute)
  );
  const firstTimeStep: number =
    (startTime.getTime() - dateTime.getTime()) / 1000 / 60 / 15 - timeOffset;
  const lastTimeStep = firstTimeStep + 96;

  const liveDataValues = liveData.live_data.values.slice(
    firstTimeStep,
    lastTimeStep
  );

  const offset = parseFloat(liveData.pressure_offset);

  return liveDataValues.map(v => v + offset);
}
