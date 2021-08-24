import React, { useContext, FunctionComponent } from "react";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import TimeSeriesChart from "../TimeSeriesChart";
import CalibrationActions from "../CalibrationActions";
import CalibrationActionsV2 from "../CalibrationActionsV2";
import CalibrationGraphs from "../CalibrationGraphs";
import { ResultsContext } from "../ResultsProvider";

const CalibrateTab: FunctionComponent<{}> = () => {
  console.log("Calibrate Tab Rendered");
  return (
    <>
      {<CalibrationGraphs />}
      <CalibrationActionsV2 />
    </>
  );
};

export default CalibrateTab;
