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

type CalibrationActionPrvProps = {
  updateCalibration: (updatedCal: Calibration) => void;
  deleteCalibration: (id: number) => void;
  calibrationAction: Calibration;
  expand: boolean;
  handleChange: (
    panel: string
  ) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => void;
};

const CalibrationActionPrv: FunctionComponent<CalibrationActionPrvProps> = ({
  updateCalibration,
  deleteCalibration,
  calibrationAction,
  expand,
  handleChange
}) => {
  const data = calibrationAction.actions[0];

  const classes = useStyles();
  const [tempNewValue, setTempNewValue] = React.useState(data.action.pressure);

  const handleExpansion = handleChange(calibrationAction.id.toString());

  const handleSliderChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    event.stopPropagation();
    const newValue = value instanceof Array ? value[0] : value;
    setTempNewValue(newValue);
    updateCalibration({
      id: calibrationAction.id,
      type: "PRV",
      multi: false,
      actions: [{ id: data.id, action: { pressure: newValue } }]
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempNewValue(Number(event.target.value));

    const num = Number(event.target.value);
    const newValue = num < 1 ? 1 : num > 100 ? 100 : num;

    updateCalibration({
      id: calibrationAction.id,
      type: "PRV",
      multi: false,
      actions: [{ id: data.id, action: { pressure: newValue } }]
    });
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const num = tempNewValue;
    const newValue = num < 1 ? 1 : num > 100 ? 100 : num;

    updateCalibration({
      id: calibrationAction.id,
      type: "PRV",
      multi: false,
      actions: [{ id: data.id, action: { pressure: newValue } }]
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
            PRV ID: {data.id}
          </Typography>
        </div>
        <div className={classes.column}>
          <Slider
            //classes={{ container: classes.slider }}
            value={data.action.pressure}
            aria-labelledby="label"
            min={1}
            max={100}
            step={0.1}
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
                m
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

export default CalibrationActionPrv;
