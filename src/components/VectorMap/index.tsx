import React, { Component } from "react";
import ReactMapGL, {
  PointerEvent,
  ExtraState,
  ViewState,
  FlyToInterpolator
} from "react-map-gl";
import { fromJS } from "immutable";
import {
  BlankStyle,
  HydrantStyle,
  MainStyle,
  MeterStyle,
  ValveStyle,
  LiveDataStyle,
  FixedHeadStyle,
  TransferNodeStyle,
  CalibrationActionStyle,
  CalibrationActionLabelStyle,
  CalibrationActionMainStyle,
  SelectedMainStyle
} from "../../mapstyles";
import { reprojectFeatureCollection } from "../../util/reproject";
import {
  FeatureCollection,
  Feature,
  Geometries,
  Properties,
  featureCollection,
  BBox,
  Geometry,
  GeometryCollection
} from "@turf/helpers";
import bbox from "@turf/bbox";
import center from "@turf/center";
import { AttributionControl, LngLatBoundsLike } from "mapbox-gl";
import { easeCubic } from "d3-ease";
import WebMercatorViewport from "viewport-mercator-project";
import { Calibration, ThrottleValve } from "../ResultsProvider";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

type VectorMapProps = {
  projectionString: string;
  modelGeoJson: FeatureCollection<Geometries, Properties>;
  selectedMainIds: string[];
  onSelectFeature: (value: Feature) => void;
  calibrationActions: Calibration[];
};
interface VectorMapState {
  mapStyle?: any;
  viewport: any;
  x?: number;
  y?: number;
  hoveredFeature?: any;
  interactiveLayerIds: string[];
  usingOsBaseMap: boolean;
}

const extractLiveData = (geoJson: FeatureCollection) => {
  const filteredFeatures = geoJson.features.filter(
    feature =>
      feature.properties !== null &&
      feature.geometry &&
      feature.geometry.type === "Point" &&
      (feature.properties.table === "wn_node" ||
        feature.properties.table === "wn_hydrant") &&
      feature.properties.live_data_point_id
  );
  return featureCollection(filteredFeatures);
};

const extractCalibrationActions = (
  geoJson: FeatureCollection,
  calibrationActions: Calibration[],
  type: string
) => {
  const throttleValves = calibrationActions
    .filter(f => {
      return f.type === type;
    })
    .map(c => {
      return c.actions.map(ca => {
        return ca;
      });
    })
    .flat(Infinity);
  const calibration: string[] = throttleValves.map(tV => {
    return tV.id.toString();
  });
  const filteredFeatures = geoJson.features.filter(
    feature =>
      feature.properties !== null && calibration.includes(feature.properties.id)
  );
  return featureCollection(filteredFeatures);
};

const centreOfFeatures = (geoJson: FeatureCollection) => {
  const centerFeatures = geoJson.features.map(f => {
    const centreFeature = center(f);
    const id = f.properties ? f.properties.id : null;
    centreFeature.properties = {
      id
    };
    return centreFeature;
  });
  return featureCollection(
    centerFeatures.map((f, i) => {
      return {
        ...f,
        properties: {
          ...f.properties,
          ca: `CA${("0" + (i + 1).toString()).slice(-2)}`
        }
      };
    })
  );
};

const extractAssetType = (geoJson: FeatureCollection, types: string[]) => {
  const filteredFeatures = geoJson.features.filter(
    feature =>
      feature.properties !== null && types.includes(feature.properties.table)
  );
  return featureCollection(filteredFeatures);
};

class VectorMap extends Component<VectorMapProps, VectorMapState> {
  _map: mapboxgl.Map | null = null;

  _addImage = () => {
    if (this._map !== null) {
      this._map.addImage("meter", MeterStyle.toJS().images[0][1]);
      this._map.addImage("valve", ValveStyle.toJS().images[0][1]);
      this._map.addImage("prv", ValveStyle.toJS().images[8][1]);
      this._map.addImage("closedvalve", ValveStyle.toJS().images[4][1]);
      this._map.addImage("nrv", ValveStyle.toJS().images[11][1]);
      this._map.addImage("triangleSolid", FixedHeadStyle.toJS().images[0][1]);
      this._map.addImage("squareSolid", TransferNodeStyle.toJS().images[0][1]);
      this._map.addImage(
        "ca-valve",
        CalibrationActionStyle.toJS().images[0][1]
      );
      this._map.addImage("live-data", LiveDataStyle.toJS().images[0][1]);
      this._map.addImage(
        "ca-point",
        CalibrationActionLabelStyle.toJS().images[0][1]
      );

      const json = this.state.mapStyle.toJS();
      const jsonbbox = bbox(json.sources.mains.data);
      this._goToBBox(jsonbbox);
    }
  };

  _createStyles = () => {
    const geoJson = reprojectFeatureCollection(
      this.props.modelGeoJson,
      this.props.projectionString
    );

    const selectedGeoJson = featureCollection(
      geoJson.features.filter(
        feature =>
          feature.properties !== null &&
          this.props.selectedMainIds.includes(feature.properties.id)
      )
    );

    const wn_fixed_head = extractAssetType(geoJson, ["wn_fixed_head"]);
    const wn_hydrant = extractAssetType(geoJson, ["wn_hydrant"]);
    const wn_pipe = extractAssetType(geoJson, [
      "wn_pipe",
      "wn_meter",
      "wn_valve",
      "wn_non_return_valve"
    ]);
    const wn_meter = extractAssetType(geoJson, ["wn_meter"]);
    const wn_valve = extractAssetType(geoJson, [
      "wn_valve",
      "wn_non_return_valve"
    ]);
    const wn_transfer_node = extractAssetType(geoJson, ["wn_transfer_node"]);

    const live_data = extractLiveData(geoJson);
    const calibration_action = extractCalibrationActions(
      geoJson,
      this.props.calibrationActions,
      "THV"
    );
    const calibration_action_mains = extractCalibrationActions(
      geoJson,
      this.props.calibrationActions,
      "k"
    );

    const immutBase = fromJS(BlankStyle); //)
    const mapStyle = immutBase
      .setIn(
        ["sources", "hydrants"],
        fromJS({ type: "geojson", data: wn_hydrant })
      )
      .setIn(["sources", "mains"], fromJS({ type: "geojson", data: wn_pipe }))
      .setIn(
        ["sources", "selected_mains"],
        fromJS({ type: "geojson", data: selectedGeoJson })
      )
      .setIn(
        ["sources", "transfernode"],
        fromJS({ type: "geojson", data: wn_transfer_node })
      )
      .setIn(
        ["sources", "fixedhead"],
        fromJS({ type: "geojson", data: wn_fixed_head })
      )
      .setIn(["sources", "meters"], fromJS({ type: "geojson", data: wn_meter }))
      .setIn(["sources", "valves"], fromJS({ type: "geojson", data: wn_valve }))
      .setIn(
        ["sources", "live_data"],
        fromJS({ type: "geojson", data: live_data })
      )
      .setIn(
        ["sources", "calibration_action"],
        fromJS({ type: "geojson", data: calibration_action })
      )
      .setIn(
        ["sources", "calibration_action_centre"],
        fromJS({ type: "geojson", data: centreOfFeatures(calibration_action) })
      )
      .setIn(
        ["sources", "calibration_action_mains"],
        fromJS({ type: "geojson", data: calibration_action_mains })
      )
      .set(
        "layers",
        immutBase
          .get("layers")
          .push(MainStyle)
          .push(CalibrationActionMainStyle)
          .push(SelectedMainStyle)
          .push(HydrantStyle)
          .push(MeterStyle)
          .push(ValveStyle)
          .push(FixedHeadStyle)
          .push(TransferNodeStyle)
          .push(CalibrationActionStyle)
          .push(CalibrationActionLabelStyle)
          .push(LiveDataStyle)
      );

    return mapStyle;
  };

  _createSelectedMainStyles = () => {
    const geoJson = reprojectFeatureCollection(
      this.props.modelGeoJson,
      this.props.projectionString
    );

    const selectedGeoJson = featureCollection(
      geoJson.features.filter(
        feature =>
          feature.properties !== null &&
          this.props.selectedMainIds.includes(feature.properties.id)
      )
    );

    if (this._map !== null) {
      //@ts-ignore
      const source = this._map.getSource("selected_mains");
      //@ts-ignore
      source && source.setData(selectedGeoJson);
    }
  };

  _createCalibrationStyles = () => {
    const geoJson = reprojectFeatureCollection(
      this.props.modelGeoJson,
      this.props.projectionString
    );
    const calibration_action = extractCalibrationActions(
      geoJson,
      this.props.calibrationActions,
      "THV"
    );
    const ca_mains = extractCalibrationActions(
      geoJson,
      this.props.calibrationActions,
      "k"
    );
    if (this._map !== null) {
      //@ts-ignore
      this._map.getSource("calibration_action_mains").setData(ca_mains);
      //@ts-ignore
      this._map.getSource("calibration_action").setData(calibration_action);
      //@ts-ignore
      this._map
        .getSource("calibration_action_centre")
        //@ts-ignore
        .setData(centreOfFeatures(calibration_action));
    }
  };

  state: Readonly<VectorMapState> = {
    viewport: {
      latitude: 0, //56.83955911423721,
      longitude: 0, //,//-2.287646619512958,
      zoom: 0
    },
    mapStyle: this._createStyles(),
    interactiveLayerIds: ["valve-geojson"],
    usingOsBaseMap: false
  };

  _getCursor = (event: ExtraState) => {
    return event.isDragging
      ? "grabbing"
      : event.isHovering
      ? "pointer"
      : "default";
  };

  //TODO: This is a mess, I need to clean this up, there is probably an easy oneliner here I'm not thinking of
  _onClick = (event: PointerEvent) => {
    const feature = event.features && event.features[0];

    if (feature) {
      const {
        us_node_id,
        ds_node_id,
        link_suffix,
        node_id
      } = feature.properties;
      const feat = this.props.modelGeoJson.features.find(f => {
        if (f.properties !== null) {
          if (f.properties.us_node_id !== undefined) {
            return (
              f.properties.us_node_id === us_node_id &&
              f.properties.ds_node_id === ds_node_id &&
              f.properties.link_suffix === link_suffix
            );
          } else {
            return f.properties.node_id === node_id;
          }
        } else return false;
      });

      feat && this.props.onSelectFeature(feat);
    }
  };

  _onViewportChange = (viewport: ViewState) => {
    this.setState({ viewport });
  };

  _goToBBox = (jsonbbox: BBox) => {
    const { longitude, latitude, zoom } = new WebMercatorViewport(
      this.state.viewport
    ).fitBounds([[jsonbbox[0], jsonbbox[1]], [jsonbbox[2], jsonbbox[3]]], {
      padding: 20
    });

    const viewport = {
      ...this.state.viewport,
      longitude,
      latitude,
      zoom
      // Temp removing animation
      //transitionDuration: 7000,
      //transitionInterpolator: new FlyToInterpolator(),
      //transitionEasing: easeCubic
    };
    this.setState({ viewport });
  };

  componentDidUpdate(prevProps: VectorMapProps) {
    if (
      this.props.calibrationActions.length !==
      prevProps.calibrationActions.length
    ) {
      this._createCalibrationStyles();
    }
    if (prevProps.selectedMainIds !== this.props.selectedMainIds) {
      this._createSelectedMainStyles();
    }
    if (
      this.props.modelGeoJson.features.length !==
      prevProps.modelGeoJson.features.length
    ) {
      this.setState(
        {
          mapStyle: this._createStyles()
        },
        () => {
          this._addImage();
        }
      );
    }
  }

  render() {
    const { mapStyle } = this.state;

    return (
      <ReactMapGL
        mapboxApiAccessToken={MAPBOX_TOKEN}
        {...this.state.viewport}
        mapStyle={mapStyle}
        ref={ref => {
          if (ref && ref.getMap()) {
            this._map = ref.getMap();
          }
        }}
        onViewportChange={this._onViewportChange}
        onLoad={() => {
          this._addImage();
        }}
        attributionControl={true}
        onClick={this._onClick}
        getCursor={this._getCursor}
        width="100%"
        height="100vh"
        maxZoom={24}
        interactiveLayerIds={this.state.interactiveLayerIds}
        clickRadius={2}
      />
    );
  }
}

export default VectorMap;
