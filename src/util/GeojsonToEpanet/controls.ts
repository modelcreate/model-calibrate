import ModelFeatureCollection from "../../interfaces/ModelFeatureCollection";

export function createControls(model: ModelFeatureCollection): string {
  const modelFilterPrv = model.features.filter(f => {
    return (
      f.properties &&
      f.properties.profiles &&
      f.properties.table === "wn_valve" &&
      f.properties.mode === "PRV"
    );
  });

  const controls = modelFilterPrv
    .map(f => {
      if (f.properties) {
        const id = f.properties.i;
        const linear = f.properties.linear_profile === "1" ? true : false;
        return timePrvControls(f.properties.profiles, id, linear);
      }
    })
    .join("\n");

  return `[CONTROLS]\n${controls}`;
}

function timePrvControls(
  settings: string[][],
  id: string,
  linearProfile: boolean
): string {
  const reduceSettings = settings.reduce((settingString, prof, i, arr) => {
    const setting = parseFloat(prof[8]);
    const time = i === 0 ? "00:00" : prof[0].slice(-8, -3);
    return `${settingString}VALVE ${id} ${setting.toFixed(
      2
    )} AT CLOCKTIME ${time}\n`;
  }, "");

  return reduceSettings;
}
