import React from "react";
import { Theme, createStyles } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/styles";
import CalibrationActionThv from "../CalibrationActionThv";
import CalibrationActionPrv from "../CalibrationActionPrv";
import CalibrationActionRoughness from "../CalibrationActionRoughness";
import AddCalibrationAction from "../AddCalibrationAction";
import { ResultsContext } from "../ResultsProvider";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    slider: {
      padding: "12px 0px"
    },
    root: {
      width: "100%",
      padding: "24px 16px"
    },
    heading: {
      fontSize: "0.9375rem"
    },
    column: {
      flexBasis: "33.33%"
    },
    secondaryHeading: {
      fontSize: "0.9375rem",
      color: "rgba(0, 0, 0, 0.54)"
    }
  })
);

export default function CalibrationActionsV2() {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState<string>();

  const handleChange = (panel: string) => (
    e: React.ChangeEvent<{}>,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : undefined);
  };

  return (
    <div className={classes.root}>
      <ResultsContext.Consumer>
        {//
        //@ts-ignore
        results => (
          <>
            {//
            //@ts-ignore
            results.calibrationActions.map(ca => {
              const el = ca.multi ? (
                <CalibrationActionRoughness
                  key={ca.id}
                  calibrationAction={ca}
                  deleteCalibration={results.deleteCalibration}
                  updateCalibration={results.updateCalibration}
                  expand={expanded === ca.id.toString()}
                  handleChange={handleChange}
                />
              ) : ca.type === "PRV" ? (
                <CalibrationActionPrv
                  key={ca.id}
                  calibrationAction={ca}
                  deleteCalibration={results.deleteCalibration}
                  updateCalibration={results.updateCalibration}
                  expand={expanded === ca.id.toString()}
                  handleChange={handleChange}
                />
              ) : (
                <CalibrationActionThv
                  key={ca.id}
                  calibrationAction={ca}
                  deleteCalibration={results.deleteCalibration}
                  updateCalibration={results.updateCalibration}
                  expand={expanded === ca.id.toString()}
                  handleChange={handleChange}
                />
              );

              return el;
            })}
            <AddCalibrationAction
              model={results.modelGeoJson}
              expand={expanded === "ADDCALIBRATION"}
              addCalibration={results.addCalibration}
              updateSelection={results.setSelectedMainIds}
              handleChange={handleChange}
            />
          </>
        )}
      </ResultsContext.Consumer>
    </div>
  );
}
