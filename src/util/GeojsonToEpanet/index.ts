import ModelFeatureCollection, {
  Demand
} from "../../interfaces/ModelFeatureCollection";
import CalibrationActions from "../../interfaces/CalibrationActions";
import { Geometries, Properties, Feature } from "@turf/helpers";

import { createControls } from "./controls";

export default function geojsonToEpanet(
  orgModel: ModelFeatureCollection,
  actions: CalibrationActions
): string {
  const tail = `[TIMES]
Pattern Timestep 0:15
Duration 23:45:00
Hydraulic Timestep 0:15
Quality Timestep 0:15
Pattern Start 0:00
Report Timestep 0:15
Report Start 0:00
Start ClockTime 12:00 AM
Statistic None
[OPTIONS]
Units LPS
Headloss D-W
Trials 500
Accuracy 0.01
UNBALANCED CONTINUE 999
[END]`;

  const model = mergeCalibration(orgModel, actions);

  return `${junctions(model)}\n${reservoirs(model)}\n${pipes(model)}\n${valves(
    model
  )}\n${demands(model)}\n${status(model)}\n${patterns(model)}\n${coordinates(
    model
  )}\n${verticies(model)}\n${createControls(model)}\n${tail}`;
}

function junctions(model: ModelFeatureCollection): string {
  const nodes = model.features.filter(f => {
    return (
      f.properties &&
      (f.properties.table === "wn_node" ||
        f.properties.table === "wn_hydrant" ||
        f.properties.table === "wn_transfer_node")
    );
  });

  const junct = nodes
    .map(f => {
      if (f.properties) {
        const z = f.properties.z !== null ? f.properties.z : 0;
        return `${f.properties.id.replace(/ /g, "_")} ${z.toFixed(12)}`;
      }
    })
    .join("\n");

  return `[JUNCTIONS]\n${junct}`;
}

function reservoirs(model: ModelFeatureCollection): string {
  const modelFilter = model.features.filter(f => {
    return f.properties && f.properties.table === "wn_fixed_head";
  });

  const reservoirsText = modelFilter
    .map(f => {
      if (f.properties) {
        const levels = f.properties.levels;
        return `${f.properties.id.replace(/ /g, "_")} ${parseFloat(
          levels[0][1]
        ).toFixed(6)} ${f.properties.id.replace(/ /g, "_")}`;
      }
    })
    .join("\n");

  return `[RESERVOIRS]\n${reservoirsText}`;
}

function pipes(model: ModelFeatureCollection): string {
  const modelFilter = model.features.filter(f => {
    return (
      f.properties &&
      (f.properties.table === "wn_pipe" ||
        f.properties.table === "wn_meter" ||
        f.properties.table === "wn_non_return_valve")
    );
  });

  const pipes = modelFilter
    .map(f => {
      if (f.properties) {
        const tail = f.properties.table === "wn_non_return_valve" ? " CV" : "";

        return `${f.properties.i} ${f.properties.us_node_id.replace(
          / /g,
          "_"
        )} ${f.properties.ds_node_id.replace(
          / /g,
          "_"
        )} ${f.properties.length.toFixed(6)} ${f.properties.diameter.toFixed(
          6
        )} ${f.properties.k.toFixed(6)} 0.000000 ${tail}`;
      }
    })
    .join("\n");

  return `[PIPES]\n${pipes}`;
}

function valves(model: ModelFeatureCollection): string {
  const modelFilterTcv = model.features.filter(f => {
    return (
      f.properties &&
      f.properties.table === "wn_valve" &&
      f.properties.mode !== "PRV"
    );
  });

  const modelFilterPrv = model.features.filter(f => {
    return (
      f.properties &&
      f.properties.table === "wn_valve" &&
      f.properties.mode === "PRV"
    );
  });

  const tcv = valvesTCV(modelFilterTcv);
  const prv = valvesPRV(modelFilterPrv);

  return `[VALVES]\n${tcv}\n${prv}`;
}

function valvesTCV(features: Feature<Geometries, Properties>[]): string {
  return features
    .map(f => {
      if (f.properties) {
        const opening = f.properties.opening;
        const setting = getLossCoeff(opening);

        return `${f.properties.i} ${f.properties.us_node_id.replace(
          / /g,
          "_"
        )} ${f.properties.ds_node_id.replace(
          / /g,
          "_"
        )} ${f.properties.diameter.toFixed(6)} TCV ${setting.toFixed(
          6
        )} 0.000100`;
      }
    })
    .join("\n");
}

function valvesPRV(features: Feature<Geometries, Properties>[]): string {
  return features
    .map(f => {
      if (f.properties) {
        const setValue = f.properties.profile
          ? f.properties.profile[0][8]
          : f.properties.pressure;
        const setting = parseFloat(setValue);

        return `${f.properties.i} ${f.properties.us_node_id.replace(
          / /g,
          "_"
        )} ${f.properties.ds_node_id.replace(
          / /g,
          "_"
        )} ${f.properties.diameter.toFixed(6)} PRV ${setting.toFixed(
          6
        )} 1.500000`;
      }
    })
    .join("\n");
}

function status(model: ModelFeatureCollection): string {
  const modelFilter = model.features.filter(f => {
    return (
      f.properties &&
      f.properties.table === "wn_valve" &&
      f.properties.opening === "0."
    );
  });

  const closedValves = modelFilter
    .map(f => {
      if (f.properties) {
        return `${f.properties.i} CLOSED`;
      }
    })
    .join("\n");

  return `[STATUS]\n${closedValves}`;
}

function demands(model: ModelFeatureCollection): string {
  const demandText = Object.keys(model.model.demands)
    .map(node => {
      return sumDemands(model.model.demands[node], node);
    })
    .join("\n");

  const modelFilter = model.features.filter(f => {
    return f.properties && f.properties.table === "wn_transfer_node";
  });

  const transferNodes = modelFilter
    .map(f => {
      if (f.properties) {
        return `${f.properties.id.replace(
          / /g,
          "_"
        )} 1.000000 ${f.properties.id.replace(/ /g, "_")}`;
      }
    })
    .join("\n");

  return `[DEMANDS]\n${demandText}\n${transferNodes}`;
}

interface SummedDemand {
  [name: string]: number;
}

function sumDemands(demands: Demand[], nodeId: string): string {
  const summedDemand = demands.reduce(
    (prev, curr) => {
      const demand = curr.category_id in prev ? prev[curr.category_id] : 0;

      prev[curr.category_id] =
        demand + (curr.no_of_properties * curr.spec_consumption) / 86400;
      return prev;
    },
    <SummedDemand>{}
  );

  return Object.keys(summedDemand)
    .map(profile => {
      summedDemand[profile];
      return `${nodeId.replace(/ /g, "_")} ${summedDemand[profile].toFixed(
        6
      )} ${profile.replace(/ /g, "_")}`;
    })
    .join("\n");
}

function patterns(model: ModelFeatureCollection): string {
  const resFilter = model.features.filter(f => {
    return f.properties && f.properties.table === "wn_fixed_head";
  });

  const reservoirsText = resFilter
    .map(f => {
      if (f.properties) {
        const levels = levelPattern(f.properties.levels);
        return `${createPattern(levels, f.properties.id)}`;
      }
    })
    .join("\n");

  const tnFilter = model.features.filter(f => {
    return f.properties && f.properties.table === "wn_transfer_node";
  });

  const transferNodeText = tnFilter
    .map(f => {
      if (f.properties) {
        const flows = flowPattern(f.properties.flows);
        return `${createPattern(flows, f.properties.id)}`;
      }
    })
    .join("\n");

  const demandPatternText = Object.keys(model.model.demand_profiles)
    .map(profile => {
      return createPattern(model.model.demand_profiles[profile], profile);
    })
    .join("\n");

  return `[PATTERNS]\n${reservoirsText}\n${transferNodeText}\n${demandPatternText}`;
}

function flowPattern(flows: [string, string][]): number[] {
  return flows.map(f => {
    return parseFloat(f[1]);
  });
}

function levelPattern(levels: [string, string][]): number[] {
  const firstValue = parseFloat(levels[0][1]);

  return levels.map(l => {
    return parseFloat(l[1]) / firstValue;
  });
}

function createPattern(profile: number[], id: string): string {
  const profileChunks = profile.reduce(
    (resultArray, item, index) => {
      const chunkIndex = Math.floor(index / 6);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // start a new chunk
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    },
    <number[][]>[]
  );

  return profileChunks
    .map(c => {
      return `${id.replace(/ /g, "_")} ${c[0].toFixed(6)} ${c[1].toFixed(
        6
      )} ${c[2].toFixed(6)} ${c[3].toFixed(6)} ${c[4].toFixed(
        6
      )} ${c[5].toFixed(6)}`;
    })
    .join("\n");
}

function coordinates(model: ModelFeatureCollection): string {
  const nodes = model.features.filter(f => {
    return f.geometry && f.geometry.type === "Point";
  });

  const coord = nodes
    .map(f => {
      if (f.properties && f.geometry && f.geometry.type === "Point") {
        return `${f.properties.id.replace(
          / /g,
          "_"
        )} ${f.geometry.coordinates[0].toFixed(
          6
        )} ${f.geometry.coordinates[1].toFixed(6)}`;
      }
    })
    .join("\n");

  return `[COORDINATES]\n${coord}`;
}

function verticies(model: ModelFeatureCollection): string {
  const links = model.features.filter(f => {
    return f.geometry && f.geometry.type === "LineString";
  });

  const coord = links
    .map(f => {
      if (f.properties && f.geometry && f.geometry.type === "LineString") {
        return f.geometry.coordinates
          .map(coor => {
            if (f.properties) {
              return `${f.properties.i} ${coor[0].toFixed(6)} ${coor[1].toFixed(
                6
              )}`;
            }
          })
          .join("\n");
      }
    })
    .join("\n");

  return `[VERTICES]\n${coord}`;
}

function getLossCoeff(opening: number): number {
  if (opening === undefined) return 0.0001;
  if (opening < 0) return 1000000000000;
  if (opening >= 100) return 0.0001;

  const gateValve = [
    [0, 1000000000000],
    [1, 10000],
    [2, 3000],
    [3, 1200],
    [5, 420],
    [10, 150],
    [15, 60],
    [20, 35],
    [25, 19],
    [30, 10],
    [35, 6],
    [40, 4.6],
    [45, 3],
    [50, 2.06],
    [55, 1.4],
    [60, 0.98],
    [65, 0.6],
    [70, 0.44],
    [75, 0.28],
    [80, 0.17],
    [85, 0.11],
    [90, 0.06],
    [95, 0.01],
    [100, 0.0001]
  ];

  const exactMatch = gateValve.find(v => {
    return v[0] === opening;
  });

  if (exactMatch) {
    return exactMatch[1];
  }

  const i = gateValve.findIndex(v => {
    return v[0] > opening;
  });
  const openingBefore = gateValve[i - 1][0];
  const lossCoeffBefore = gateValve[i - 1][1];
  const openingAfter = gateValve[i][0];
  const lossCoeffAfter = gateValve[i][1];

  const a = opening - openingBefore;
  const b = openingAfter - opening;
  const f = a / (a + b);

  const coeff = Math.pow(lossCoeffAfter, f) * Math.pow(lossCoeffBefore, 1 - f);

  return coeff;
}

function mergeCalibration(
  model: ModelFeatureCollection,
  actions: CalibrationActions
): ModelFeatureCollection {
  const updatedFeatures = model.features.map((f, i) => {
    if (f.properties && f.properties.id in actions) {
      const updatedFeature = {
        ...f,
        properties: {
          ...f.properties,
          i,
          ...actions[f.properties.id]
        }
      };

      return updatedFeature;
    } else {
      return {
        ...f,
        properties: {
          ...f.properties,
          i
        }
      };
    }
  });

  const updatedModel = {
    ...model,
    features: updatedFeatures
  };

  return updatedModel;
}
