import React, { FunctionComponent } from "react";
import {
  WithStyles,
  withStyles,
  createStyles,
  Theme
} from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ModelRunWebWorkerButton from "../ModelRunWebWorkerButton";

import { ResultsContext } from "../ResultsProvider";

import MapView from "../MapView";
import CenteredTabs from "../CenteredTabs";
import UpdateScriptNotification from "../UpdateScriptNotification";

const drawerWidth = 700;

const styles = (theme: Theme) => ({
  root: {
    display: "flex"
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(0)
  }
});

interface AppMaterialUiProperties extends WithStyles<typeof styles> {
  isDemo: boolean;
  version: number;
}

const AppMaterialUi: FunctionComponent<AppMaterialUiProperties> = ({
  isDemo,
  version,
  classes
}) => {
  return (
    <div className={classes.root}>
      {!isDemo && (version < 20191015 || typeof version === "undefined") && (
        <UpdateScriptNotification />
      )}
      <CssBaseline />
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper
        }}
        anchor="left"
      >
        <CenteredTabs isDemo={isDemo} />
      </Drawer>
      <main className={classes.content}>
        <ResultsContext.Consumer>
          {(
            //@ts-ignore
            results
          ) => (
            <MapView
              modelGeoJson={results.modelGeoJson}
              calibrationActions={results.calibrationActions}
              addCalibration={results.addCalibration}
              selectedMainIds={results.selectedMainIds}
            />
          )}
        </ResultsContext.Consumer>
      </main>
    </div>
  );
};

export default withStyles(styles)(AppMaterialUi);
