## Extract InfoWorks WS Pro Model to GeoJson
The script included in this directory converts a subsection of a model in InfoWorks WS Pro into a GeoJSON file which can be opened in the Model Calibrate application.

The single GeoJSON file will include the network, controls, demand diagrams and live data.

## Using the script
1. [Download the script](https://raw.githubusercontent.com/modelcreate/model-calibrate/master/ruby/modelcalibrate_export_to_geojson.rb)
2. Create an empty folder that you will store files used to create the GeoJson File.
3. Export the control and live data as CSV using the default settings, export the demand diagram as a DDG. Export all these files in the empty folder you just created.
4. Create a fixed head at a known pressure location, either a tank or logged hydrant
5. Run and then open the simulation.
6. Select all assets downstream of the fixed head including customer points.
7. Run the Ruby script and save the GeoJSON file in the folder created earlier.
8. Load the created file in [Model Calibrate](https://calibrate.modelcreate.com)

## Known issues/limitations
* Calibrating tanks is not possible, they can not be included in the export, if you have a DMA outputting to a tank use a transfer node to simulate flow out of the network
* NRV are not included in the output but will be added soon
* Only PRVs are support, other control valves will not work
