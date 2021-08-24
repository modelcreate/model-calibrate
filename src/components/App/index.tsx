import React, { createContext, ChangeEvent, useState, useMemo } from "react";
import AppMaterial from "../AppMaterialUi";
import { ResultsProvider } from "../ResultsProvider";
import ModelDropZone from "../ModelDropZone";
import Landing from "../Landing";
import ModelFeatureCollection, {
  ModelLiveData
} from "../../interfaces/ModelFeatureCollection";
import liveDataReader from "../../util/LiveDataReader";
import ReactGA from "react-ga";

ReactGA.initialize("UA-65873036-5");
ReactGA.pageview(window.location.pathname + window.location.search);

var json = require("../../data/Example.json");
const model: ModelFeatureCollection = json as ModelFeatureCollection;

const date = new Date(Date.UTC(2018, 0, 31));
const liveDataTemp = liveDataReader(model, 96);
const blankLiveData: ModelLiveData = { liveDataPoints: [], sensorData: {} };

function App() {
  //const [modelResults, setModelResults] = useState(blankModel.logResults)
  const [modelJson, setModelJson] = useState();
  const [fileName, setFileName] = useState("Demo");
  const [liveData, setLiveData] = useState(blankLiveData);
  const [isDemo, setIsDemo] = useState(false);
  const [dragDropCount, setDragDropCount] = useState(0);

  const testModelJson = (model2: ModelFeatureCollection, filename: string) => {
    //pass along this function to ModelDropZone
    //which will then updae the state on this component
    //we will then pass this as a prop to the results provider
    //We could have a landing page here to load a model in the future

    ReactGA.event({
      category: "Model",
      action: "Loaded User Model"
    });

    setModelJson(model2);
    setFileName(filename);
    setLiveData(liveDataReader(model2, 96));
    setDragDropCount(prevDragDropCount => prevDragDropCount + 1);
  };

  const loadDemo = () => {
    ReactGA.event({
      category: "Model",
      action: "Loaded Demo"
    });

    setIsDemo(true);
    setModelJson(json);
    setLiveData(liveDataReader(json, 96));
    setDragDropCount(prevDragDropCount => prevDragDropCount + 1);
  };

  console.log("App Render");

  return (
    <ModelDropZone onDroppedJson={testModelJson}>
      {modelJson ? (
        <ResultsProvider
          modelJson={modelJson}
          liveData={liveData}
          dragDropCount={dragDropCount}
          fileName={fileName}
        >
          <AppMaterial
            isDemo={isDemo}
            version={modelJson.model.extract_version}
          />
        </ResultsProvider>
      ) : (
        <Landing onLoadDemo={loadDemo} isLoading={false} />
      )}
    </ModelDropZone>
  );
}

export default App;
