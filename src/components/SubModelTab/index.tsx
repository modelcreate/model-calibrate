import React, { FunctionComponent } from "react";
import { ResultsContext } from "../ResultsProvider";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

const SubModelTab: FunctionComponent<{}> = () => {
  return (
    <div style={{ padding: "24px 24px 0px" }}>
      <Typography component="div">
        Move the fixed head to downstream log points. This feature is an early
        preview and may occasionally fail to work while it is being tested and
        improved.
      </Typography>

      <ResultsContext.Consumer>
        {//
        //@ts-ignore
        results => (
          <>
            {results.subModels.map((sub: React.ReactNode, i: number) => (
              <Button
                key={i}
                onClick={() => {
                  results.setSubModel(sub);
                }}
              >
                {sub}
              </Button>
            ))}
          </>
        )}
      </ResultsContext.Consumer>
    </div>
  );
};

export default SubModelTab;
