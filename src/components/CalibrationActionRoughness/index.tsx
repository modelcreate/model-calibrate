import React, { ChangeEvent, FunctionComponent } from "react";
import { Theme, createStyles } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Slider from "@material-ui/core/Slider";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";

import { Calibration, ThrottleValve } from "../ResultsProvider";

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
    columnId: {
      flexBasis: "20%",
      maxWidth: "20%"
    },
    columnValue: {
      flexBasis: "20%",
      maxWidth: "20%",
      padding: "0px 9px"
    },
    column: {
      flexBasis: "60%"
    },
    adorment: {
      whiteSpace: "nowrap",
      fontSize: "0.8rem",
      paddingBottom: "4px"
    },
    secondaryHeading: {
      fontSize: "0.9375rem",
      color: "rgba(0, 0, 0, 0.54)"
    }
  })
);

type CalibrationActionRoughnessProps = {
  updateCalibration: (updatedCal: Calibration) => void;
  deleteCalibration: (id: number) => void;
  calibrationAction: Calibration;
  expand: boolean;
  handleChange: (
    panel: string
  ) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => void;
};

const CalibrationActionRoughness: FunctionComponent<
  CalibrationActionRoughnessProps
> = ({
  updateCalibration,
  deleteCalibration,
  calibrationAction,
  expand,
  handleChange
}) => {
  const data = calibrationAction.actions[0];

  const classes = useStyles();
  const [tempNewValue, setTempNewValue] = React.useState(data.action.k);

  const handleExpansion = handleChange(calibrationAction.id.toString());

  const handleSliderChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    event.stopPropagation();
    const newValue = value instanceof Array ? value[0] : value;
    const actions = calibrationAction.actions.map(ca => {
      return { id: ca.id, action: { k: Math.pow(10, newValue) } };
    });

    setTempNewValue(Math.pow(10, newValue));

    updateCalibration({
      id: calibrationAction.id,
      type: "k",
      multi: true,
      actions
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempNewValue(Number(event.target.value));

    const num = Number(event.target.value);
    const newValue = num < 1 ? 1 : num > 100 ? 100 : num;

    const actions = calibrationAction.actions.map(ca => {
      return { id: ca.id, action: { k: newValue } };
    });

    updateCalibration({
      id: calibrationAction.id,
      type: "k",
      multi: true,
      actions
    });
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const num = tempNewValue;
    const newValue = num < 1 ? 1 : num > 100 ? 100 : num;

    const actions = calibrationAction.actions.map(ca => {
      return { id: ca.id, action: { k: newValue } };
    });

    updateCalibration({
      id: calibrationAction.id,
      type: "k",
      multi: true,
      actions: actions
    });
  };

  return (
    <ExpansionPanel
      expanded={expand}
      //onChange={handleChange(calibrationAction.id.toString())}
    >
      <ExpansionPanelSummary id="panel1bh-header">
        <div className={classes.columnId}>
          <Typography className={classes.heading} noWrap>
            {calibrationAction.actions.length} Pipes
          </Typography>
        </div>
        <div className={classes.column}>
          <Slider
            //classes={{ container: classes.slider }}
            value={Math.log10(data.action.k)}
            aria-labelledby="label"
            min={-1}
            max={2}
            step={0.01}
            onChange={handleSliderChange}
          />
        </div>
        <div className={classes.columnValue}>
          <Input
            className={classes.secondaryHeading}
            value={tempNewValue}
            margin="dense"
            fullWidth={true}
            disableUnderline={true}
            onChange={handleInputChange}
            onBlur={handleBlur}
            endAdornment={
              <InputAdornment
                disableTypography={true}
                className={classes.adorment}
                position="end"
              >
                mm (k)
              </InputAdornment>
            }
            inputProps={{
              step: 0.1,
              min: 1,
              max: 100,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
        </div>
        <IconButton
          size="small"
          onClick={e => {
            handleExpansion(e, !expand);
          }}
        >
          <ExpandMoreIcon fontSize="inherit" />
        </IconButton>
      </ExpansionPanelSummary>
      <Divider />
      <ExpansionPanelActions>
        <Button
          size="small"
          color="secondary"
          onClick={() => {
            deleteCalibration(calibrationAction.id);
          }}
        >
          Delete
        </Button>
      </ExpansionPanelActions>
    </ExpansionPanel>
  );
};

export default CalibrationActionRoughness;
