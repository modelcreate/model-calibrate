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
import Switch from "@material-ui/core/Switch";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";

import FormControlLabel from "@material-ui/core/FormControlLabel";

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

type CalibrationActionThvProps = {
  updateCalibration: (updatedCal: Calibration) => void;
  deleteCalibration: (id: number) => void;
  calibrationAction: Calibration;
  expand: boolean;
  handleChange: (
    panel: string
  ) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => void;
};

const CalibrationActionThv: FunctionComponent<CalibrationActionThvProps> = ({
  updateCalibration,
  deleteCalibration,
  calibrationAction,
  expand,
  handleChange
}) => {
  const data = calibrationAction.actions[0];

  const classes = useStyles();
  const [isClosed, setIsClosed] = React.useState(false);
  const [tempNewValue, setTempNewValue] = React.useState(data.action.opening);

  const handleUpdateCalibration = (opening: number) => {
    updateCalibration({
      id: calibrationAction.id,
      type: "THV",
      multi: false,
      actions: [{ id: data.id, action: { opening } }]
    });
  };

  const handleCloseValve = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsClosed(event.target.checked);
    const value = event.target.checked ? 0 : 100;
    handleUpdateCalibration(value);
    setTempNewValue(value);
  };

  const handleExpansion = handleChange(calibrationAction.id.toString());

  const handleSliderChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    event.stopPropagation();
    const newValue = value instanceof Array ? value[0] : value;
    setTempNewValue(Math.pow(10, newValue));
    updateCalibration({
      id: calibrationAction.id,
      type: "THV",
      multi: false,
      actions: [{ id: data.id, action: { opening: Math.pow(10, newValue) } }]
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempNewValue(Number(event.target.value));

    const num = Number(event.target.value);
    const newValue = num < 1 ? 1 : num > 100 ? 100 : num;

    updateCalibration({
      id: calibrationAction.id,
      type: "THV",
      multi: false,
      actions: [{ id: data.id, action: { opening: newValue } }]
    });
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const num = tempNewValue;
    const newValue = num < 1 ? 1 : num > 100 ? 100 : num;

    updateCalibration({
      id: calibrationAction.id,
      type: "THV",
      multi: false,
      actions: [{ id: data.id, action: { opening: newValue } }]
    });
  };

  return (
    <ExpansionPanel
      expanded={expand}
      //onChange={handleChange(calibrationAction.id.toString())}
    >
      <ExpansionPanelSummary
        aria-controls="panel1bh-content"
        id="panel1bh-header"
      >
        <div className={classes.columnId}>
          <Typography className={classes.heading} noWrap>
            Valve ID: {data.id}
          </Typography>
        </div>
        <div className={classes.column}>
          <Slider
            //classes={{ container: classes.slider }}
            value={Math.log10(data.action.opening)}
            aria-labelledby="label"
            min={0}
            max={2}
            step={0.01}
            onChange={handleSliderChange}
            disabled={isClosed}
          />
        </div>
        <div className={classes.columnValue}>
          <Input
            className={classes.secondaryHeading}
            value={tempNewValue}
            margin="dense"
            fullWidth={true}
            disabled={isClosed}
            disableUnderline={true}
            onChange={handleInputChange}
            onBlur={handleBlur}
            endAdornment={
              <InputAdornment
                disableTypography={true}
                className={classes.adorment}
                position="end"
              >
                % open
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
        <FormControlLabel
          control={
            <Switch
              checked={isClosed}
              onChange={handleCloseValve}
              value="checkedA"
            />
          }
          label="Shut Valve"
        />
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

export default CalibrationActionThv;
