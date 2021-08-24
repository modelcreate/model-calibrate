import WaterIcons from './waterIcons'
import { fromJS } from 'immutable';


const layout = {
  'visibility': 'visible',
  'symbol-placement': 'line-center',
  'icon-image': 'ca-valve',
  'icon-size': {
    'base': 1.75,
    'stops': [[10, 0.4], [22, 1]]
  },
  'icon-rotate': ["*", ['get', 'geom_orien'], -1],
  'text-field': '{description}',
  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  'text-offset': [0, 0.6],
  'text-anchor': 'top',
  'text-size': 8,
  'icon-allow-overlap': true,
  'icon-ignore-placement': true
};




const paint = {
  "text-color": "black",
  "text-halo-color": "white",
  "text-halo-width": 2
};


const icons = {
  'defaultValve': WaterIcons.defaultValve("#b300ff")
};

let images = [];
for (const key in icons) {
  const iconImage = new Image();
  iconImage.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(WaterIcons.defaultValve("#ff7f00"));
  images.push([key, iconImage])
}

const CalibrationActionStyle = fromJS({
  id: 'ca-geojson',
  source: 'calibration_action',
  type: 'symbol',
  images,
  layout,
  paint,
  minZoom: 10
});

export default CalibrationActionStyle