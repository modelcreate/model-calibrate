import React, { ChangeEvent, FunctionComponent } from "react";
import { Theme, createStyles } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import DropDownSelect from "../DropDownSelect";
import TablePipes from "../TablePipes";
import ModelFeatureCollection from "../../interfaces/ModelFeatureCollection";
import { ThrottleValve, Calibration } from "../ResultsProvider";
import { Geometries, Properties, Feature } from "@turf/helpers";
import ReactGA from "react-ga";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    slider: {
      padding: "12px 0px"
    },
    root: {
      width: "100%",
      padding: "24px 16px"
    },
    tablePanel: {
      padding: 0
    },
    heading: {
      fontSize: "0.9375rem"
    },
    secondaryHeading: {
      fontSize: "0.9375rem",
      color: "rgba(0, 0, 0, 0.54)"
    }
  })
);

type AddCalibrationActionProps = {
  expand: boolean;
  model: ModelFeatureCollection;
  handleChange: (
    panel: string
  ) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => void;
  addCalibration: (
    actions: ThrottleValve[],
    type: string,
    isMulti: boolean
  ) => void;
  updateSelection: (selectedMainIds: String[]) => void;
};

const AddCalibrationAction: FunctionComponent<AddCalibrationActionProps> = ({
  expand,
  model,
  handleChange,
  addCalibration,
  updateSelection
}) => {
  const classes = useStyles();

  const [features, setFeatures] = React.useState<
    Feature<Geometries, Properties>[]
  >([]);

  const togglePanel = handleChange("ADDCALIBRATION");

  const getSelectedIds = (features: Feature<Geometries, Properties>[]) => {
    return features.map(f => {
      return f.properties ? (f.properties.id as string) : "";
    });
  };
  const clickTogglePanel = (
    event: React.ChangeEvent<{}>,
    isExpanded: boolean
  ) => {
    togglePanel(event, isExpanded);

    const selection = isExpanded ? getSelectedIds(features) : [];
    updateSelection(selection);
  };

  const runUpdateSelection = (features: Feature<Geometries, Properties>[]) => {
    const selectionId = getSelectedIds(features);

    updateSelection(expand ? selectionId : []);
    setFeatures(features);
  };

  const createCalibrationAction = () => {
    ReactGA.event({
      category: "Create Calibration",
      action: "Roughness Change"
    });

    const maxK = features.reduce((prev, curr) => {
      if (curr.properties !== null) {
        return curr.properties.k > prev ? curr.properties.k : prev;
      }
    }, 0.01);
    const calibrationAction = features.reduce(
      (prev, curr) => {
        if (curr.properties !== null) {
          const newAction = { id: curr.properties.id, action: { k: maxK } };
          return prev.concat(newAction);
        } else {
          return prev;
        }
      },
      [] as ThrottleValve[]
    );

    addCalibration(calibrationAction, "k", true);
  };

  return (
    <ExpansionPanel expanded={expand} onChange={clickTogglePanel}>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1bh-content"
        id="panel1bh-header"
      >
        <Typography className={classes.heading} noWrap>
          Add Roughness Change Calibration
        </Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={classes.tablePanel}>
        <TablePipes model={model} setFeatures={runUpdateSelection} />
      </ExpansionPanelDetails>
      <Divider />
      <ExpansionPanelActions>
        <Button size="small" color="primary" onClick={createCalibrationAction}>
          Create
        </Button>
      </ExpansionPanelActions>
    </ExpansionPanel>
  );
};

export default AddCalibrationAction;
