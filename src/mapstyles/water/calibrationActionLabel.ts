import WaterIcons from './waterIcons'
import { fromJS } from 'immutable';

const layout = {
  'visibility': 'visible',
  //'symbol-placement': 'line-center',
  'icon-image': 'ca-point',
  'icon-size': {
    'base': 1.75,
    'stops': [[1, 0.4], [22, 1]]
  },
  //////'icon-rotate': ["*", ['get', 'geom_orien'], -1],
  'text-field': 'V{id}',
  //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  'text-offset': [0.5, 0],
  'text-anchor': 'left',
  'text-max-width': 3,
  'text-size': {
    'base': 1,
    'stops': [
      [8, 8], [12, 8],
      [12, 8], [13, 12],
    ]
  },
  'text-rotate': 0,
  'icon-allow-overlap': true,
  'text-allow-overlap': true,
  'text-ignore-placement': false,
  'icon-ignore-placement': false
};



const paint = {
  "icon-opacity": {
    stops: [[13.5, 1], [14, 0]]
  },
  "text-color": "black",
  "text-halo-color": "white",
  "text-halo-width": 2
};


const icons = {
  'defaultValve': WaterIcons.circleSolidOrange
};

let images = [];
for (const key in icons) {
  const iconImage = new Image();
  iconImage.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(WaterIcons.circleSolidOrange);
  images.push([key, iconImage])
}

const CalibrationActionLabelStyle = fromJS({
  id: 'calibration_action_centregeojson',
  source: 'calibration_action_centre',
  type: 'symbol',
  images,
  layout,
  paint,
  minZoom: 10
});

export default CalibrationActionLabelStyle