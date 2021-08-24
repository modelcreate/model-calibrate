import ModelFeatureCollection, {
  NodeDemand,
  ModelLiveData
} from "../../interfaces/ModelFeatureCollection";
import liveDataReader from "../LiveDataReader";
import { Geometries, Properties, Feature, Geometry } from "@turf/helpers";

//export default function subnetworkTrace(
//  model: ModelFeatureCollection
//): string[] {
//  return ["test"];
//}
//
//
//import { FeatureCollection, Geometries, Properties, Feature, Geometry } from '@turf/helpers';

interface FeatureLookup {
  [id: string]: Feature<Geometries, Properties>;
}

interface ConnectedLinks {
  [id: string]: string[];
}

type FeatureId = string | FeatureIdArray;
interface FeatureIdArray extends Array<FeatureId> {}

class SubnetworkTrace {
  lookup: FeatureLookup;
  connectedLinks: ConnectedLinks;
  model: ModelFeatureCollection;
  constructor(model: ModelFeatureCollection) {
    this.model = model;

    this.connectedLinks = model.features.reduce(
      (obj, item) => {
        if (
          item.geometry &&
          item.geometry.type === "LineString" &&
          item.properties
        ) {
          obj[item.properties.us_node_id] = obj[item.properties.us_node_id]
            ? obj[item.properties.us_node_id].concat(item.properties.id)
            : [item.properties.id];
          obj[item.properties.ds_node_id] = obj[item.properties.ds_node_id]
            ? obj[item.properties.ds_node_id].concat(item.properties.id)
            : [item.properties.id];
        }

        return obj;
      },
      {} as ConnectedLinks
    );

    this.lookup = model.features.reduce(
      (obj, item) => {
        item.properties && (obj[item.properties.id] = item);
        return obj;
      },
      {} as FeatureLookup
    );
  }

  listAllItems(): FeatureIdArray {
    const feat = this.model.features.filter(
      item => item.properties && item.properties.table === "wn_fixed_head"
    );
    if (feat.length === 1) {
      return this.trace(feat[0].properties && feat[0].properties.id);
    }
    throw "There should be one fixed head";
  }

  listSubModels(): string[] {
    const networkTree = this.listAllItems();
    //@ts-ignore
    const sub = this.findSubModels(networkTree, [networkTree[0]]);
    return sub;
  }

  getSubModel(id: string): ModelFeatureCollection {
    const networkTree = this.listAllItems();
    const subModelIds = this.findSubNetwork(networkTree, id).filter(
      feat => feat !== id
    );

    const fixedHead = this.model.features.filter(
      f => f.properties && f.properties.id === id
    )[0];

    const updatedFixedHead = {
      ...fixedHead,
      properties: {
        ...fixedHead.properties,
        table: "wn_fixed_head",
        levels: this.findHead(fixedHead, id)
      }
    };

    const feat = this.model.features.filter(
      f => f.properties && subModelIds.includes(f.properties.id)
    );

    const demands = Object.keys(this.model.model.demands)
      .filter(key => subModelIds.includes(key))
      .reduce(
        (obj, key) => {
          obj[key] = this.model.model.demands[key];
          return obj;
        },
        {} as NodeDemand
      );

    const updatedModel = {
      ...this.model,
      //@ts-ignore
      features: [].concat(feat, updatedFixedHead),
      model: {
        ...this.model.model,
        demands
      }
    };

    return updatedModel;
  }

  trace(
    startId: string,
    existingFoundItems: FeatureIdArray = []
  ): FeatureIdArray {
    const path = [startId];
    const seenPath = [] as string[];
    let looking = true;
    let foundItems: FeatureIdArray = [];

    let liveData: string[] = [];
    while (looking) {
      const topItem = path.pop();
      if (
        (topItem && foundItems.includes(topItem)) ||
        (topItem && existingFoundItems.includes(topItem)) ||
        (topItem && seenPath.includes(topItem))
      ) {
        // We've already seen this before, lets not do anything
      } else if (topItem) {
        // New item so lets add to the found list and add its children to the path

        const feat = this.lookup[topItem];

        if (
          feat.properties &&
          feat.properties.pipe_closed === "0" &&
          feat.properties.mode === "THV"
        ) {
          console.log("Shut valve");
        } else if (
          topItem === startId ||
          (feat.properties && !feat.properties.live_data_point_id)
        ) {
          foundItems.push(topItem);
          const children = this.findChildren(topItem);
          children.forEach(child => {
            path.push(child);
            seenPath.push(child);
          });
        } else {
          if (liveData.includes(topItem) && !foundItems.includes(topItem)) {
            foundItems.push(topItem);
            liveData = liveData.filter(item => item !== topItem);
          } else {
            liveData.push(topItem);
          }
        }
      }
      if (path.length === 0) {
        looking = false;
      }
    }
    liveData.forEach(ld => {
      foundItems.push(this.trace(ld, foundItems));
    });
    return foundItems;
  }

  findSubModels(
    networkTree: FeatureIdArray,
    subNetworks: string[] = []
  ): string[] {
    //@ts-ignore
    networkTree.forEach(netElem => {
      if (Array.isArray(netElem)) {
        if (netElem.length > 1) {
          //@ts-ignore
          subNetworks.push(netElem[0]);
        }
        this.findSubModels(netElem, subNetworks);
      }
    });

    return subNetworks;
  }

  //flatten(a: FeatureIdArray): string[] {
  //  //@ts-ignore
  //  return Array.isArray(a) ? [].concat(...a.map(this.flatten)) : a;
  //}

  findHead(fixedHead: Feature<Geometries, Properties>, id: string): number[][] {
    if (fixedHead.properties && fixedHead.properties.levels) {
      return fixedHead.properties.levels;
    } else {
      const z = fixedHead.properties ? parseFloat(fixedHead.properties.z) : 0;
      const ld = liveDataReader(this.model, 96).sensorData[id];
      return ld.map((l, i) => {
        return [i, z + l];
      });
    }
  }

  findSubNetwork(
    networkTree: FeatureIdArray,
    target: string,
    subNetworks: string[] = []
  ): string[] {
    if (subNetworks.length === 0 && networkTree[0] === target) {
      //@ts-ignore
      const flatten = a =>
        Array.isArray(a) ? [].concat(...a.map(flatten)) : a;
      const flattened = flatten(networkTree);
      subNetworks = flattened;
    } else if (Array.isArray(networkTree)) {
      networkTree.forEach(netElem => {
        if (Array.isArray(netElem)) {
          subNetworks = this.findSubNetwork(netElem, target, subNetworks);
        }
      });
    }

    return subNetworks;
  }

  findChildren(id: string): string[] {
    const feat = this.lookup[id];

    if (feat.geometry && feat.geometry.type === "Point") {
      return this.connectedLinks[id];
    } else if (feat.properties) {
      const us = feat.properties.us_node_id;
      const ds = feat.properties.ds_node_id;
      return [us, ds];
    }
    return [];
  }
}

export default SubnetworkTrace;
