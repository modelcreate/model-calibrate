import React from "react";
import Button from "@material-ui/core/Button";
import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import ReactGA from "react-ga";

const useStyles = makeStyles({
  root: {
    justifyContent: "center"
  },
  img: {
    width: "100%",
    marginBottom: "30px"
  }
});

export default function ExtractionGuide() {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState<DialogProps["scroll"]>("paper");
  const classes = useStyles();

  const handleClickOpen = (scrollType: DialogProps["scroll"]) => () => {
    setOpen(true);
    setScroll(scrollType);
    ReactGA.modalview("Extraction-Guide");
  };

  function handleClose() {
    setOpen(false);
  }

  return (
    <div>
      <Button
        onClick={handleClickOpen("paper")}
        variant="contained"
        color="primary"
      >
        Model Extract Guide
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
      >
        <DialogContent dividers={scroll === "paper"}>
          <DialogContentText>
            <Typography variant="h6">Minimum Requirements</Typography>
            <Typography variant="body2" paragraph={true}>
              Before you extract your model and use the app, please confirm you
              meet the following minimum requirements:
              <ul>
                <li>Model created in InfoWorks WS Pro 3.5 or greater</li>
                <li>Network data projected in the British National Grid</li>
                <li>Using Chrome or Firefox as your web browser</li>
              </ul>
            </Typography>
            <Typography variant="h6">1. Download the Ruby script</Typography>
            <Typography variant="body2" paragraph={true}>
              Use the ruby script to combine up your network and live data into
              a single file to be loaded into Model Calibrate.
            </Typography>
            <Button
              variant="text"
              size="small"
              color="primary"
              fullWidth
              classes={{
                root: classes.root
              }}
              onClick={() => {
                ReactGA.event({
                  category: "Download Script",
                  action: "From Extract Guide"
                });
              }}
              href="modelcalibrate_export.rb"
            >
              Download Extraction Ruby Script
            </Button>
            <Typography variant="h6">2. Start from a fixed head</Typography>
            <Typography variant="body2" paragraph={true}>
              Your model must start from a fixed head. You can use either a
              level recorded at a tank or pressure recorded within the network,
              e.g. a hydrant or at a PRV.
            </Typography>
            <img
              src="imgs/extractguide/01-FixedHead.png"
              className={classes.img}
            />

            <Typography variant="h6">
              3. Save control, LDC and demand data
            </Typography>
            <Typography variant="body2" paragraph={true}>
              Export your demand diagram, control and live data configuration as
              CSV files into an empty folder. Make sure to use the setting below
              for the CSV export.
            </Typography>
            <img
              src="imgs/extractguide/02-ExportToCSV.png"
              className={classes.img}
            />
            <Typography variant="h6">
              4. Select network objects to export
            </Typography>
            <Typography variant="body2" paragraph={true}>
              Select all nodes, links and customer points to be exported,
              including the fixed head. You can use the Tracing Tool under
              Geoplan to quickly select everything.
            </Typography>
            <img
              src="imgs/extractguide/03-AllSelected.png"
              className={classes.img}
            />
            <Typography variant="h6">5. Run the Ruby script</Typography>
            <Typography variant="body2" paragraph={true}>
              In the toolbar select Network > Run Ruby Script and then locate
              the Ruby script you had previously downloaded. Save the extract to
              the same location where you have placed the control and other
              data.
            </Typography>
            <img
              src="imgs/extractguide/04-RunRubyScript.png"
              className={classes.img}
            />
            <Typography variant="h6">6. Drop into Model Calibrate</Typography>
            <Typography variant="body2" paragraph={true}>
              The Ruby script will create a JSON file that will contain all
              information required to calibrate your network. Drag the file into
              the browser to start calibrating.
            </Typography>
            <img
              src="imgs/extractguide/05-DragAndDrop.png"
              className={classes.img}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
