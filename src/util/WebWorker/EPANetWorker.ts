import { readBinary, EpanetResults } from "../../util/EpanetBinary";
import Module from "../../util/EpanetEngine/output.js";
import { LiveDataPoint } from "../../interfaces/ModelFeatureCollection";
//@ts-ignore
declare function postMessage(message: any);

interface SimulationResults {
  [key: string]: number[];
}

const doWork = (work: MessageEvent) => {
  //const valveOpening = work.data
  const epanetInp = work.data.inp;
  const epaNetEngine = Module();
  const FS = epaNetEngine.fs;
  //@ts-ignore
  epaNetEngine.onRuntimeInitialized = _ => {
    //const data = epaNet(valveOpening)

    FS.writeFile("/net1.inp", epanetInp);

    epaNetEngine._epanet_run();

    const resultView = FS.readFile("/net1.bin");

    const results = readBinary(resultView);
    //setEpaNetResults({ ...epaNetResults, timeseriesData: results.results.nodes[272].pressure })
    //console.log(results.results.nodes[272].pressure)

    const liveData: LiveDataPoint[] = work.data.ld;

    const filteredResults = liveData.reduce(
      (prev, curr) => {
        const result = results.results.nodes[curr.epanetId].pressure;
        prev[curr.liveDataId] = result;
        return prev;
      },
      <SimulationResults>{}
    );

    postMessage(filteredResults);

    //postMessage({
    //  Log01: results.results.nodes[307].pressure,
    //  Log02: results.results.nodes[289].pressure,
    //  Log03: results.results.nodes[299].pressure,
    //  Log04: results.results.nodes[280].pressure,
    //  Log05: results.results.nodes[272].pressure
    //  //Log06: results.results.nodes[325].pressure
    //});
  };
};

self.addEventListener("message", message => {
  doWork(message);
});
