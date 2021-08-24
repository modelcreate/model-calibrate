import geojsonToEpanet from ".";

import { createControls } from "./controls";

const fs = require("fs");
const inModel = fs.readFileSync(__dirname + "/testData/in.json", "utf8");
const prvModel = fs.readFileSync(__dirname + "/testData/timedPrv.json", "utf8");
const prvModelout = fs.readFileSync(
  __dirname + "/testData/timedPrv.inp",
  "utf8"
);
const prvModelLinear = fs.readFileSync(
  __dirname + "/testData/timedPrv-linear.json",
  "utf8"
);
const prvModelLinearout = fs.readFileSync(
  __dirname + "/testData/timedPrv-linear.inp",
  "utf8"
);
const outInp = fs.readFileSync(__dirname + "/testData/out.inp", "utf8");
const outCalbibrationInp = fs.readFileSync(
  __dirname + "/testData/out-calibration.inp",
  "utf8"
);

it("create network without calibration actions", () => {
  const modelJson = JSON.parse(inModel);
  const calibration = {};
  expect(geojsonToEpanet(modelJson, calibration)).toEqual(outInp);
});

it("creates a network with calibration actions", () => {
  const modelJson = JSON.parse(inModel);
  const calibration = {
    "03714480779558.03714470779557.1": { opening: 10 },
    "03714500779561.03714490779561.1": { opening: 20 },
    "03714510779563.03714530779562.1": { k: 50 }
  };
  expect(geojsonToEpanet(modelJson, calibration)).toEqual(outCalbibrationInp);
});

it("creates a network with a timed PRV", () => {
  const modelJson = JSON.parse(prvModel);
  expect(geojsonToEpanet(modelJson, {})).toEqual(prvModelout);
});
