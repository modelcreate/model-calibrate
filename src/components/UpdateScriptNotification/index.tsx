import React from "react";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";
import IconButton from "@material-ui/core/IconButton";
import WarningIcon from "@material-ui/icons/Warning";
import CloseIcon from "@material-ui/icons/Close";
import GetAppIcon from "@material-ui/icons/GetApp";

import Dialog, { DialogProps } from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import ReactGA from "react-ga";

import clsx from "clsx";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    scriptDownload: {
      justifyContent: "center",
      margin: "25px 0px"
    },
    close: {
      padding: theme.spacing(0.5)
    },
    icon: {
      fontSize: 20
    },
    iconVariant: {
      opacity: 0.9,
      marginRight: theme.spacing(1)
    },
    divider: {
      marginBottom: "15px"
    },
    listItems: {
      marginTop: "0px"
    },
    message: {
      display: "flex",
      alignItems: "center"
    }
  })
);

export default function SimpleSnackbar() {
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);

  const [openDialog, setOpenDialog] = React.useState(false);
  const [scroll, setScroll] = React.useState<DialogProps["scroll"]>("paper");

  ReactGA.event({
    category: "Notification",
    action: "Outdated Script Loaded"
  });

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (
    event: React.SyntheticEvent | React.MouseEvent,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const handleClickOpen = (scrollType: DialogProps["scroll"]) => () => {
    ReactGA.modalview("Update-Script");
    setOpen(false);
    setOpenDialog(true);
    setScroll(scrollType);
  };

  function handleCloseDialog() {
    setOpenDialog(false);
  }

  return (
    <div>
      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        open={open}
        autoHideDuration={20000}
        onClose={handleClose}
        ContentProps={{
          "aria-describedby": "message-id"
        }}
        message={
          <span id="message-id" className={classes.message}>
            <WarningIcon className={clsx(classes.icon, classes.iconVariant)} />
            JSON file created from old extract script
          </span>
        }
        action={[
          <Button
            key="undo"
            color="secondary"
            size="small"
            onClick={handleClickOpen("paper")}
          >
            View Updates
          </Button>,
          <IconButton
            key="close"
            aria-label="close"
            color="inherit"
            className={classes.close}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        ]}
      />
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
      >
        <DialogContent dividers={scroll === "paper"}>
          <Button
            variant="text"
            size="small"
            color="primary"
            fullWidth
            classes={{
              root: classes.scriptDownload
            }}
            onClick={() => {
              ReactGA.event({
                category: "Download Script",
                action: "From Update Notification"
              });
            }}
            href="modelcalibrate_export.rb"
          >
            <GetAppIcon className={clsx(classes.icon, classes.iconVariant)} />
            Download Latest Extraction Ruby Script
          </Button>

          <Divider className={classes.divider} />
          <Typography variant="subtitle2" gutterBottom={true}>
            Version 0.2.0 - 2019-10-15
          </Typography>
          <Typography variant="body2">Enhancements</Typography>
          <ul className={classes.listItems}>
            <li>Fixed heads can now be set up with a single fixed level.</li>
            <li>
              Selections with InfoWorks will auto expand to include nodes or
              customer points that may not have been selected by the user.
            </li>
          </ul>
          <Typography variant="body2">New Validations</Typography>
          <ul className={classes.listItems}>
            <li>
              Interconnection validation - the script now checks if the
              selection is fully connected and will list any objects that are
              not connected directly to the fixed head.
            </li>
            <li>
              New network validations: Only one fixed head selected, no tanks
              selected, no TWPs selected, fixed head not connected directly
              upstream of PRV, demand categories are within demand diagram.
            </li>
            <li>
              New control validations: Only control valve types THV or PRV
              selected, timestep is 15 minutes, transfer node has 96 rows of
              flow data, fixed head either single level or 96 rows of level
              data.
            </li>
            <li>
              New live data validations as part of extraction: live data file
              exists, live data file is of type SLI.
            </li>
          </ul>
          <Typography variant="body2">Bug Fixes</Typography>
          <ul className={classes.listItems}>
            <li>
              Live data files were only exported if they were located in the C:
              drive, this has been fixed to work with all drives.
            </li>
            <li>
              Live data links in control that didn't exist in live data
              configuration crashed the application, this has been fixed and a
              warning is now displayed.
            </li>
          </ul>
          <Divider className={classes.divider} />
          <Typography variant="subtitle2" gutterBottom={true}>
            Version 0.1.1 - 2019-10-14
          </Typography>
          <Typography variant="body2">Enhancements</Typography>
          <ul className={classes.listItems}>
            <li>Extractions no longer need to be run on simulations.</li>
            <li>Added support for time offset with pressure data.</li>
          </ul>
          <Typography variant="body2">Bug Fixes</Typography>
          <ul className={classes.listItems}>
            <li>
              Demand diagrams were case sensitive and could fail to export if
              cases didn't match, this has been fixed.
            </li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
