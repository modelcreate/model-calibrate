import Worker from "worker-loader!./EPANetWorker";
import { Calibration } from "../../components/ResultsProvider";
import ModelFeatureCollection, {
  LiveDataPoint
} from "../../interfaces/ModelFeatureCollection";
import CalibrationActions from "../../interfaces/CalibrationActions";
import geojsonToEpanet from "../../util/GeojsonToEpanet";
import { EpanetResults } from "../../util/EpanetBinary";

const worker = new Worker();

interface LogResults {
  [key: string]: number[];
}

interface WorkerQueue {
  working: boolean;
  queue?: { inp: string; ld: LiveDataPoint[] };
}
const workerQueue: WorkerQueue = {
  working: false
};

let _getResults: (n: LogResults) => void = n => {};

worker.addEventListener("message", message => {
  _getResults(message.data);
  if (workerQueue.queue) {
    const data = workerQueue.queue;
    workerQueue.queue = undefined;
    worker.postMessage(data);
  } else {
    workerQueue.working = false;
  }
});

const epaWebWorker = {
  getResults: (setValue: (n: LogResults) => void) => {
    _getResults = setValue;
  },
  requestWork: (
    model: ModelFeatureCollection,
    data: Calibration[],
    liveDataPoints: LiveDataPoint[]
  ) => {
    const ca = calibrationActions(data);

    const epanetInp = geojsonToEpanet(model, ca);
    if (!workerQueue.working) {
      workerQueue.working = true;
      worker.postMessage({ inp: epanetInp, ld: liveDataPoints });
    } else {
      workerQueue.queue = { inp: epanetInp, ld: liveDataPoints };
    }
  }
};

function calibrationActions(data: Calibration[]): CalibrationActions {
  return data.reduce(
    (prev, curr) => {
      const test = curr.actions.reduce(
        (prev, curr) => {
          return {
            ...prev,
            [curr.id]: { ...curr.action }
          };
        },
        <CalibrationActions>{}
      );

      return {
        ...prev,
        ...test
      };
    },
    <CalibrationActions>{}
  );
}

export default epaWebWorker;
