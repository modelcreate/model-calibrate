import SubnetworkTrace from ".";

const fs = require("fs");
const inModel = fs.readFileSync(__dirname + "/testData/in.json", "utf8");

it("traces a network", () => {
  const output = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "1.2.1",
    "2.3.1",
    "3.4.1",
    "2.5.1",
    "5.4.1",
    "4.6.1",
    "6.7.1",
    "7.8.1",
    "3.9.1",
    "9.10.1"
  ].sort();

  //var modelJson = require("../../data/Example.json");

  const modelJson = JSON.parse(inModel);
  const tracer = new SubnetworkTrace(modelJson);
  const items = tracer.listAllItems();

  //@ts-ignore
  const flatten = a => (Array.isArray(a) ? [].concat(...a.map(flatten)) : a);

  const flattened = flatten(items);

  expect(flattened.sort()).toEqual(output);
});

it("lists subnetworks", () => {
  const modelJson = require("../../data/Example.json");
  const tracer = new SubnetworkTrace(modelJson);
  const subModels = tracer.listSubModels();

  const expectedSubModels = ["Tank01", "Log01", "Log02", "Log04", "Log05"];

  expect(subModels).toEqual(expectedSubModels);
});

it("gets a subnetwork", () => {
  const modelJson = require("../../data/Example.json");
  const modelJson2 = require("./testData/out_test_log4.json");
  const tracer = new SubnetworkTrace(modelJson);
  const subModel = tracer.getSubModel("Log04");

  expect(subModel).toEqual(modelJson2);
});
