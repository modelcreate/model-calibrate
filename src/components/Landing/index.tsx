import React, { FunctionComponent } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import {
  WithStyles,
  withStyles,
  createStyles,
  Theme
} from "@material-ui/core/styles";
import ExtractionGuide from "../ExtractionGuide";
import "./index.css";

const styles = (theme: Theme) =>
  createStyles({
    button: {
      //margin: theme.spacing()
    },
    input: {
      display: "none"
    }
  });

interface LandingProperties extends WithStyles<typeof styles> {
  isLoading: boolean;
  onLoadDemo: () => void;
}

const Landing: FunctionComponent<LandingProperties> = ({
  isLoading,
  onLoadDemo,
  classes
}) => {
  return (
    <div className="flex-grid">
      <div className="col1">
        <h3>Matrado</h3>
        <h1>Model Calibrate</h1>

        {isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <p className="subtitle">
              Share and calibrate models in the browser
            </p>
            <p className="blurb">
              Model Calibrate is under active development, this version is an
              early preview.
            </p>

            <p className="blurb">
              Feature requests and issues can be logged on{" "}
              <a href="https://github.com/modelcreate/model-calibrate/">
                Github
              </a>
              , contact me on{" "}
              <a href="https://www.linkedin.com/in/lukepbutler/">LinkedIn</a> or
              email - luke@matrado.ca
            </p>

            <div className="droparea">
              <p>Drop model extract here</p>
              <p className="blurb">
                All data is proccessed client side, no model data sent to the
                server.
              </p>
              <Button
                className={classes.button}
                color="secondary"
                onClick={onLoadDemo}
              >
                Load Demo Model
              </Button>
            </div>
            <div className="btns-float-left">
              <ExtractionGuide />
            </div>
          </>
        )}
      </div>
      <div className="col2" />
    </div>
  );
};

export default withStyles(styles)(Landing);
