import WaterIcons from "./waterIcons";
import { fromJS } from "immutable";

const layout = {
  visibility: "visible",
  //'symbol-placement': 'line-center',
  "icon-image": "live-data",
  "icon-size": {
    base: 1.75,
    stops: [[1, 0.4], [22, 1]]
  },
  ////'icon-rotate': ["*", ['get', 'geom_orien'], -1],
  "text-field": "{live_data_point_id}",
  //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  "text-offset": [0.4, 0],
  "text-anchor": "left",
  "text-max-width": 3,
  "text-size": {
    base: 1,
    stops: [[8, 8], [12, 8], [12, 8], [13, 12]]
  },
  "text-rotate": 0,
  "icon-allow-overlap": true,
  "text-allow-overlap": true,
  "text-ignore-placement": false,
  "icon-ignore-placement": false
};

const paint = {
  "text-color": "black",
  "text-halo-color": "white",
  "text-halo-width": 2
};

const icons = {
  defaultValve: WaterIcons.defaultValve("#b300ff")
};

let images = [];
for (const key in icons) {
  const iconImage = new Image();
  iconImage.src =
    "data:image/svg+xml;charset=utf-8;base64," + btoa(WaterIcons.circleSolid);
  images.push([key, iconImage]);
}

const LiveDataStyle = fromJS({
  id: "livedata-geojson",
  source: "live_data",
  type: "symbol",
  images,
  layout,
  paint,
  minZoom: 10
});

export default LiveDataStyle;
