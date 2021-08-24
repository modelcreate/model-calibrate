import React, { Component, createContext } from "react";
import Worker from "../../util/WebWorker";
import SubnetworkTrace from "../../util/SubnetworkTrace";
import liveDataReader from "../../util/LiveDataReader";
import ModelFeatureCollection, {
  SensorData,
  LiveDataPoint,
  ModelLiveData
} from "../../interfaces/ModelFeatureCollection";

export interface ThrottleValve {
  id: string;
  action: {
    [key: string]: number;
  };
}

export interface Calibration {
  id: number;
  type: string;
  multi: boolean;
  actions: ThrottleValve[];
}

interface LogResults {
  [key: string]: number[];
}

const worker = Worker;

type ResultsProviderProps = {
  modelJson: ModelFeatureCollection;
  liveData: ModelLiveData;
  dragDropCount: number;
  fileName: string;
};
interface ResultsProviderState {
  modelGeoJson: ModelFeatureCollection;
  sensorData: SensorData;
  liveDataPoints: LiveDataPoint[];
  subModels: string[];
  logResults: LogResults;
  fileName: string;
  selectedMainIds: string[];
  setSelectedMainIds: (ids: string[]) => void;
  calibrationActions: Calibration[];
  calibrationCount: number;
  setSubModel: (id: string) => void;
  updateCalibration: (updatedCal: Calibration) => void;
  deleteCalibration: (id: number) => void;
  addCalibration: (
    actions: ThrottleValve[],
    type: string,
    isMulti: boolean
  ) => void;
  handleModelRerun: (network: number) => void;
}

//@ts-ignore
export const ResultsContext = React.createContext<ResultsProviderState>();

export class ResultsProvider extends Component<
  ResultsProviderProps,
  ResultsProviderState
> {
  state: Readonly<ResultsProviderState> = {
    modelGeoJson: this.props.modelJson,
    sensorData: this.props.liveData.sensorData,
    liveDataPoints: this.props.liveData.liveDataPoints,
    subModels: new SubnetworkTrace(this.props.modelJson).listSubModels(),
    logResults: {},
    fileName: this.props.fileName,
    selectedMainIds: [],
    setSelectedMainIds: selectedMainIds => {
      this.setState({
        selectedMainIds
      });
    },
    calibrationActions: this.props.modelJson.model.ca
      ? this.props.modelJson.model.ca
      : [],
    calibrationCount: this.props.modelJson.model.ca
      ? this.props.modelJson.model.ca.length
      : 0,
    setSubModel: id => {
      const modelJson = new SubnetworkTrace(this.props.modelJson).getSubModel(
        id
      );

      const ld = liveDataReader(modelJson, 96);

      this.setState(
        {
          modelGeoJson: modelJson,
          sensorData: ld.sensorData,
          liveDataPoints: ld.liveDataPoints,
          logResults: {}
        },
        () => {
          worker.requestWork(
            this.state.modelGeoJson,
            this.state.calibrationActions,
            this.state.liveDataPoints
          );
        }
      );
    },
    updateCalibration: updatedCal => {
      const calibrationActions = this.state.calibrationActions.map(cali =>
        cali.id === updatedCal.id ? updatedCal : cali
      );
      worker.requestWork(
        this.state.modelGeoJson,
        calibrationActions,
        this.state.liveDataPoints
      );
      this.setState({
        calibrationActions
      });
    },
    deleteCalibration: id => {
      const calibrationActions = this.state.calibrationActions.filter(
        cali => cali.id !== id
      );
      worker.requestWork(
        this.state.modelGeoJson,
        calibrationActions,
        this.state.liveDataPoints
      );
      this.setState({
        calibrationActions
      });
    },
    addCalibration: (actions, type, isMulti) => {
      const calibrationCount = this.state.calibrationCount + 1;
      const calibrationActions = [
        ...this.state.calibrationActions,
        { id: calibrationCount, type: type, multi: isMulti, actions: actions }
      ];
      this.setState({
        calibrationActions,
        calibrationCount
      });
    },
    handleModelRerun: (network: number): void => {
      //@ts-ignore
      worker.requestWork(network);
    }
  };

  setModelResults = (logResults: LogResults) => {
    this.setState({
      logResults
    });
  };

  componentDidUpdate(prevProps: ResultsProviderProps) {
    if (this.props.dragDropCount !== prevProps.dragDropCount) {
      const ca = this.props.modelJson.model.ca
        ? this.props.modelJson.model.ca
        : [];
      const tracer = new SubnetworkTrace(this.props.modelJson);
      const subModels = tracer.listSubModels();
      this.setState(
        {
          modelGeoJson: this.props.modelJson,
          subModels: subModels,
          sensorData: this.props.liveData.sensorData,
          liveDataPoints: this.props.liveData.liveDataPoints,
          fileName: this.props.fileName,
          logResults: {},
          calibrationActions: ca,
          calibrationCount: ca.length
        },
        () => {
          worker.requestWork(
            this.props.modelJson,
            this.state.calibrationActions,
            this.state.liveDataPoints
          );
        }
      );
    }
  }

  componentDidMount() {
    worker.getResults(this.setModelResults);
    worker.requestWork(
      this.props.modelJson,
      this.state.calibrationActions,
      this.state.liveDataPoints
    );
  }

  render() {
    return (
      <ResultsContext.Provider value={this.state}>
        {this.props.children}
      </ResultsContext.Provider>
    );
  }
}
