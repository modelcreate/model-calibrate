import React, {
  FunctionComponent,
  ChangeEvent,
  useState,
  useContext
} from "react";
import { makeStyles } from "@material-ui/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

import { ResultsContext } from "../ResultsProvider";
import CalibrationAction from "../CalibrationAction";

const useStyles = makeStyles(theme => ({
  button: {
    margin: 16
  },
  input: {
    display: "none"
  },
  root: {
    width: 300
  },
  slider: {
    padding: "22px 0px"
  }
}));

interface ThrottleValve {
  id: number;
  thvSetting: number;
}

interface CalibrationActionProperties {}

const CalibrationActions: FunctionComponent<
  CalibrationActionProperties
> = () => {
  const classes = useStyles();
  const [setting, setSetting] = useState(100);

  const handleChange = (event: ChangeEvent<{}>, value: number) => {
    //updateCalibration({ id: 0, thvSetting: value })
    setSetting(value);
  };

  return (
    <ResultsContext.Consumer>
      {//
      //@ts-ignore
      results => (
        <Grid container spacing={0}>
          {//
          //@ts-ignore
          results.calibrationActions.map(ca => {
            return (
              <Grid key={ca.id} item xs={6}>
                <CalibrationAction
                  data={ca}
                  deleteCalibration={results.deleteCalibration}
                  updateCalibration={results.updateCalibration}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </ResultsContext.Consumer>
  );
};

export default CalibrationActions;
