import React, { ChangeEvent, FunctionComponent } from "react";
import { makeStyles } from "@material-ui/styles";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";

import CalibrateTab from "../CalibrateTab";
import SubModelTab from "../SubModelTab";
import AboutTab from "../AboutTab";
import ExportTab from "../ExportTab";
import ReactGA from "react-ga";

const TabContainer: FunctionComponent<{}> = ({ children }) => {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {children}
    </Typography>
  );
};

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
    //backgroundColor: theme.palette.background.paper,
  }
}));

interface CenteredTabsProperties {
  isDemo: boolean;
}

const CenteredTabs: FunctionComponent<CenteredTabsProperties> = ({
  isDemo
}) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  function handleChange(vent: ChangeEvent<{}>, newValue: number) {
    setValue(newValue);
    const tabNames = ["Calibrate", "Sub Models", "About", "Export"];
    ReactGA.event({
      category: "Selected Tab",
      action: tabNames[newValue]
    });
  }

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap>
            Model Calibrate
          </Typography>
        </Toolbar>
        <Tabs value={value} onChange={handleChange}>
          <Tab value={0} label="Calibrate" />
          <Tab value={1} label="Sub Models" />
          <Tab value={2} label="About" />
          {!isDemo && <Tab value={3} label="Export" />}
        </Tabs>
      </AppBar>
      {value === 0 && <CalibrateTab />}
      {value === 1 && <SubModelTab />}
      {value === 2 && <AboutTab />}
      {value === 3 && <ExportTab />}
    </div>
  );
};

export default CenteredTabs;
