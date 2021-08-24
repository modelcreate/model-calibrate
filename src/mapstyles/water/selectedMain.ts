import { fromJS } from "immutable";

const layout = { visibility: "visible" };

const paint = {
  "line-color": "#e31a1c",
  "line-width": 3
};

const SelectedMainStyle = fromJS({
  id: "selected-mains-geojson",
  source: "selected_mains",
  type: "line",
  paint,
  layout
});

export default SelectedMainStyle;
