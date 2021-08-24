import React, {
  FunctionComponent,
  ChangeEvent,
  useState,
  useContext
} from "react";
import { makeStyles } from "@material-ui/styles";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";

import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import red from "@material-ui/core/colors/red";

import { ThrottleValve } from "../ResultsProvider";

const useStyles = makeStyles(theme => ({
  button: {
    margin: 0
  },

  slider: {
    padding: "22px 0px"
  },
  card: {
    margin: 12
  },
  cardHeaderTitle: {
    fontSize: "0.9rem"
  },
  cardHeaderRoot: {
    padding: "16px 16px 0px"
  },
  cardContent: {
    padding: "0px 16px 0px",
    "&:last-child": {
      paddingBottom: "0px"
    }
  },
  avatar: {
    backgroundColor: red[500]
  }
}));

interface CalibrationActionProperties {
  updateCalibration: (updatedCal: ThrottleValve) => void;
  deleteCalibration: (id: string) => void;
  data: ThrottleValve;
}

const CalibrationAction: FunctionComponent<CalibrationActionProperties> = ({
  updateCalibration,
  deleteCalibration,
  data
}) => {
  const classes = useStyles();
  const [setting, setSetting] = useState(100);

  const handleChange = (event: ChangeEvent<{}>, value: number | number[]) => {
    const newValue = value instanceof Array ? value[0] : value;
    updateCalibration({
      id: data.id,
      action: { opening: Math.pow(10, newValue) }
    });
    setSetting(newValue);
  };

  const handleDelete = () => {};

  return (
    <Card className={classes.card}>
      <CardHeader
        action={
          <IconButton
            onClick={() => {
              deleteCalibration(data.id);
            }}
          >
            <CloseIcon />
          </IconButton>
        }
        classes={{
          title: classes.cardHeaderTitle,
          root: classes.cardHeaderRoot
        }}
        title={`Valve ID: ${data.id}`}
        subheader={`${data.action.opening.toFixed(
          data.action.opening < 10 ? 2 : 1
        )}% open`}
      />
      <CardContent classes={{ root: classes.cardContent }}>
        <Slider
          //classes={{ container: classes.slider }}
          value={Math.log10(data.action.opening)}
          aria-labelledby="label"
          min={0}
          max={2}
          step={0.01}
          onChange={handleChange}
          onDragEnd={e => e.stopPropagation()}
        />
      </CardContent>
    </Card>
  );
};

export default CalibrationAction;
