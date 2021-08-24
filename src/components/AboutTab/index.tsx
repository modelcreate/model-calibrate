import React, { FunctionComponent } from "react";
import Typography from "@material-ui/core/Typography";

const AboutTab: FunctionComponent<{}> = () => {
  return (
    <>
      <Typography
        variant="h6"
        style={{ padding: "24px 24px 0px" }}
        gutterBottom
      >
        Calibrating The Model
      </Typography>

      <Typography variant="body2" style={{ padding: "0px 24px" }} gutterBottom>
        Current you can calibrate your model in two ways, either by using
        throttle valves or changing the roughness of pipes.
      </Typography>

      <Typography variant="body2" style={{ padding: "0px 24px" }} gutterBottom>
        To throttle a valve, zoom in on the map until you find a valve you wish
        to restrict. Clicking on the valve will add it to the list calibration
        actions on the left hand side, use the slider to change the restriction
        at this valve.
      </Typography>

      <Typography variant="body2" style={{ padding: "0px 24px" }} gutterBottom>
        To change the roughness on pipes, click 'Add Roughness Change
        Calibration' to expand the panel and find a table of all pipes within
        the model. Filter the table by material, year and size to the selection
        of pipes you would like to modifiy the roughness and then press create
        to make a new calibration action for these pipes.
      </Typography>

      <Typography
        variant="h6"
        style={{ padding: "24px 24px 0px" }}
        gutterBottom
      >
        Contact Me
      </Typography>

      <Typography variant="body2" style={{ padding: "0px 24px" }} gutterBottom>
        Model Calibrate was created by Luke Butler of Matrado, a startup based
        in Toronto.
      </Typography>
      <Typography variant="body2" style={{ padding: "0px 24px" }} gutterBottom>
        Luke is a civil engineer, software developer and the co-founder of
        Matrado; he can be contacted on{" "}
        <a href="https://www.linkedin.com/in/lukepbutler/">LinkedIn</a> or by
        email at luke@matrado.ca
      </Typography>
    </>
  );
};

export default AboutTab;
