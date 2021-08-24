import React, { FunctionComponent } from "react";
import { ResultsContext, Calibration } from "../ResultsProvider";
import ModelFeatureCollection from "../../interfaces/ModelFeatureCollection";
import geojsonToEpanet from "../../util/GeojsonToEpanet";

import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import ReactGA from "react-ga";

const ExportTab: FunctionComponent<{}> = () => {
  const downloadEpanet = (
    json: ModelFeatureCollection,
    filename: string
  ): void => {
    ReactGA.event({
      category: "Export",
      action: "Download EPANET"
    });

    const epanetInp = geojsonToEpanet(json, {});

    const dataStr =
      "data:text/plain;charset=utf-8," + encodeURIComponent(epanetInp);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename + ".inp");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadModelWithCalibration = (
    json: ModelFeatureCollection,
    ca: Calibration[],
    filename: string
  ): void => {
    ReactGA.event({
      category: "Export",
      action: "Download JSON"
    });

    const modelExport = {
      ...json,
      model: {
        ...json.model,
        ca: ca
      }
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(modelExport));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <ResultsContext.Consumer>
      {//
      //@ts-ignore
      results => (
        <div style={{ padding: "24px 24px 0px" }}>
          <Typography variant="h6" gutterBottom>
            Save Model
          </Typography>

          <Typography variant="body2" gutterBottom>
            Save a copy of your model and calibration.
          </Typography>
          <Button
            color="secondary"
            onClick={() => {
              downloadModelWithCalibration(
                results.modelGeoJson,
                results.calibrationActions,
                results.fileName
              );
            }}
          >
            Download Model
          </Button>

          <Typography variant="h6" gutterBottom style={{ marginTop: "1em" }}>
            Export to EPANET
          </Typography>

          <Typography variant="body2" gutterBottom>
            If you are having problems running the application, such as the
            graphs not showing, then the EPANET model may be incorrect. Errors
            typically occur when an object is missing, e.g. a node or a fixed
            head.
          </Typography>

          <Typography variant="body2" gutterBottom>
            Download a copy of the EPANET model and test it on your desktop to
            debug any issues running the model.
          </Typography>

          <Button
            color="secondary"
            onClick={() => {
              downloadEpanet(results.modelGeoJson, results.fileName);
            }}
          >
            Download EPANET Model
          </Button>
        </div>
      )}
    </ResultsContext.Consumer>
  );
};

export default ExportTab;
