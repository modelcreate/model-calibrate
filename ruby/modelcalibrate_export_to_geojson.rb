# Model Calibrate - Extraction Script for InfoWorks to GeoJson
# https://github.com/modelcreate/model-calibrate
# 
# Copyright (c) 2019 Luke Butler - Matrado (luke@matrado.ca)
# 
require 'date'
require 'json'
require 'CSV'

config = {
  "crs"=>  {
    "type"=>  "name",
    "properties"=>  {
      "name"=>  "urn:ogc:def:crs:EPSG::27700"
    }
  },
  "tables"=>  [{
      "name"=>  "_nodes",
      "type"=>  "point",
      "fields"=>  ["node_id","z"],
      "results"=>  [],
      "result"=>  []
    },{
      "name"=>  "_links",
      "type"=>  "line",
      "fields"=>  ["us_node_id","ds_node_id","link_suffix","length","diameter","k","material","year","asset_id"],
      "results"=>  [],
      "result"=>  []
    }
  ],
  "controls" => [
    { "name" => "wn_ctl_fixed_head",
      "type" => "point",
      "fields"=>  ["live_data_point_id"],
      "array_fields" => ["levels"]
    },
    { "name" => "wn_ctl_hydrant",
      "type" => "point",
      "fields"=>  ["live_data_point_id"],
      "array_fields" => []
    },
    { "name" => "wn_ctl_meter",
      "type" => "line",
      "fields"=>  ["live_data_point_id"],
      "array_fields" => []
    },
    { "name" => "wn_ctl_node",
      "type" => "point",
      "fields"=>  ["live_data_point_id"],
      "array_fields" => []
    },
    { "name" => "wn_ctl_valve",
      "type" => "line",
      "fields"=>  ["mode","opening","pipe_closed","pressure"],
      "array_fields" => []
    },
    { "name" => "wn_ctl_transfer_node",
      "type" => "point",
      "fields"=>  ["live_data_point_id"],
      "array_fields" => ["flows"]
    }
  ]
}

class Float
  def signif(signs)
    Float("%.#{signs}g" % self)
  end
end

class ValidateNetwork
  def initialize(network, config, file)
    @network = network
    @config = config
    @file = file
    @folder = File.dirname(file)
    @features = []
    @errors = []
    @networkFiles = {
      "control" => nil,
      "ldc" => nil,
      "ddg" => nil
    }
    

    extract_features
  end

  def validate_network

    if @features.length == 0 
      @errors.push("*** No objects selected - Selected part of the model to export")
    end

    return @errors

  end

  
  def find_csvs

    
    csvFiles = Dir.entries(@folder).select {|f| File.extname(f) == ".csv" }
    ddgFiles = Dir.entries(@folder).select {|f| File.extname(f) == ".ddg" }
    
    if ddgFiles.length == 1
      @networkFiles["ddg"] = @folder + "/" + ddgFiles[0]
    else
      @errors.push("*** Looking for a single DDG in export folder - Found #{ddgFiles.length} in folder")
    end
    
    if csvFiles.length == 2
      csvFiles.each do |f|
        firstLine = File.open(@folder + "/" + f, &:readline)[0..11]
        if firstLine == "**** wn_zone"
          @networkFiles["ldc"] = @folder + "/" + f
        elsif firstLine == "**** wn_ctl_"
          @networkFiles["control"] = @folder + "/" + f
        end
      end
    else
      @errors.push("*** Looking for two CSVs in export folder - Found #{csvFiles.length} in folder")
    end
    
    @networkFiles.each do |key, value|
      if value == nil
        @errors.push("*** Could not find #{key} file")
      end
    end


    return @networkFiles

  end

  private


  def extract_features

    @config["tables"].each do |table|
      if table["type"] == "point"
        @network.row_object_collection(table["name"]).each do |ro|
          if ro.selected == true
            @features.push(ro)
          end
        end
      end
    end
  end

end

class IwGeojson
  def initialize(network, config, files)
    @network = network
    @config = config
    @features = []
    @demands = {}
    @demand_profile_names = []
    @demands_profiles = {}
    @controls = {}
    @live_data = {}
    @files = files
    @json = {
      "type" => "FeatureCollection",
      "features" => @features,
      "crs" => @config["crs"],
      "model" => {
        "timesteps" => @network.list_timesteps,
        "demands" => @demands,
        "demand_profiles" => @demands_profiles,
        "live_data" => @live_data
      }
    }

    extract_network
    extract_demands
    extract_demand_profiles
    extract_controls
    extract_live_data
  end

  def to_geojson
    @json.to_json
  end

  private

  def extract_network

    @config["tables"].each do |table|
      if table["type"] == "point"
        @network.row_object_collection(table["name"]).each do |ro|
          if ro.selected == true
            add_point_feature(ro, table)
          end
        end
      elsif table["type"] == "line"
        @network.row_object_collection(table["name"]).each do |ro|
          if ro.selected == true
            add_line_feature(ro, table)
          end
        end
      end
    end
  end

  def extract_demands

    @network.row_object_collection("_nodes").each do |ro|
      unless ro.table == "wn_fixed_head" || ro.table == "wn_transfer_node" || ro.demand_by_category.length == 0 || ro.selected == false
        
        @demands[ro.node_id] = [] unless @demands.key?(ro.node_id)
        
        ro.demand_by_category.each do |dbc|

          @demand_profile_names |= [dbc.category_id] 

          @demands[ro.node_id].push({
              "category_id" => dbc.category_id,
              "spec_consumption" => dbc.spec_consumption,
              "no_of_properties" => dbc.no_of_properties,
            })
        end
    
      end
    end
    
    @network.row_object_collection("wn_address_point").each do |ro|

      if ro.selected == true
        @demand_profile_names |= [ro.category_id] 
      
        node_index = ro.demand_at_us_node ? 0 : 1
        node_id = ro.allocated_pipe_id.split(".")[node_index]
      
        @demands[node_id] = [] unless @demands.key?(node_id)
        @demands[node_id].push({
                  "category_id" => ro.category_id,
                  "spec_consumption" => ro.spec_consumption,
                  "no_of_properties" => ro.no_of_properties,
                })
      end
    end

  end

  def extract_demand_profiles

    current_profile = ""
    last_profile = 1
    next_profile = 1
    File.open(@files["ddg"], "r").each_line.with_index do |row, i|
      if i == next_profile && row[0..2] != "END"
        current_profile = row[40..row.length-2].strip

        if @demand_profile_names.include?(current_profile)
          @demands_profiles[current_profile] = []
        end

        profile_rows = row[8..13].strip!.to_i
        last_profile = next_profile
        next_profile = next_profile + profile_rows + 3
      elsif i != 0 &&  i > last_profile + 2 && @demand_profile_names.include?(current_profile) && row[0..2] != "END"
        @demands_profiles[current_profile].push(row[14..19].to_f)
      end
    end   

  end

  def extract_run_time(control_data)

    rows = CSV.parse(control_data,  headers: true)
    @json["model"]["run_time"] = rows[0].to_h

    

  end

  def extract_controls

    control = {}
    current_table = ""
    File.open(@files["control"], "r").each_line do |row|
      if row[0..3] == "****"
        current_table = row[5..row.length-2]
        control[current_table] =""
      else
        control[current_table] = control[current_table]  + row
      end
    end

    @config["controls"].each do |table|

      arr_of_rows = CSV.parse(control[table["name"]],  headers: true)
      arr_of_rows.each do |row|
        row_hash = row.to_h
        id =  if table["type"] == "point"
                row_hash["node_id"]
              elsif table["type"] == "line"
                row_hash["us_node_id"] + "." +row_hash["ds_node_id"] + "." +row_hash["link_suffix"]
              end
    
        @controls[id] = row_hash.select {|k,v| table["fields"].include?(k) }
    
        table["array_fields"].each do |arr_f|
          data_info_array = row_hash[arr_f]
          data_array = data_info_array[1..data_info_array.length-2].scan(/{(.+?)}/).collect{|i| i[0].split(",")}
    
          @controls[id][arr_f] =  data_array
        end
    
      end
    end

    merge_controls
    extract_run_time(control["wn_ctl_run"])

  end

  def extract_live_data

    to_keep = []

    @features.each do |f|
      if f["properties"].key?("live_data_point_id")
        to_keep.push(f["properties"]["live_data_point_id"])
      end
    end

    live_data_fields = ["live_data_point_id", "source_file","channel_type","sensor_level","pressure_factor","pressure_offset","flow_factor","flow_offset"]


    live_data = {}
    current_table = ""
    File.open(@files["ldc"], "r").each_line do |row|
      if row[0..3] == "****"
        current_table = row[5..row.length-2]
        live_data[current_table] =""
      else
        live_data[current_table] = live_data[current_table]  + row
      end
    end
    
    arr_of_rows = CSV.parse(live_data["wn_live_data_point"],  headers: true)
    arr_of_rows.each do |row|
      test_hash = row.to_h
      if to_keep.include? test_hash["live_data_point_id"]
        props = test_hash.select {|k,v| live_data_fields.include?(k) }
        @live_data[test_hash["live_data_point_id"]] = props
        @live_data[test_hash["live_data_point_id"]]["live_data"] = read_sli(test_hash["source_file"])
      end
      
    end


  end

  def merge_controls

    @features.each do |f|

      if @controls.key?(f["properties"]["id"])

        f["properties"] = @controls[f["properties"]["id"]].merge( f["properties"] )
      end

    end

  end

  def add_line_feature(ro, table)
    @features.push(
      {
        "type" => "Feature",
        "geometry" => {
          "type" => "LineString",
          "coordinates" => ro.bends.collect() { |x| (x <= 1) ? x.signif(2) : x.round(2) }.each_slice(2).to_a
        },
        "properties" => get_properties(ro, table)
      }
    )
  end

  def add_point_feature(ro, table)
    @features.push(

      {
        "type" => "Feature",
        "geometry" => {
          "type" =>  "Point",
          "coordinates" =>  [ro.x.round(2), ro.y.round(2)]
        },
        "properties" =>  get_properties(ro, table)
      }
    )
  end

  def get_properties(ro, table)

    props = {
      "table" => ro.table,
      "id" => ro.id
    }

    table["fields"].each do |field|
      props[field] = ro[field]
    end

    table["results"].each do |field|
      props[field] = ro.results(field).collect { |x| (x <= 1) ? x.signif(2) : x.round(2) }
    end

    table["result"].each do |field|
      props[field] =  (ro.result(field) <= 1) ? ro.result(field).signif(2) : ro.result(field).round(2)
    end

    props

  end

  def read_sli(file)
    db=WSApplication.current_database 
    file_path = if file[0..1] == "C:"
                  file.gsub('\\\\','\\')
                else
                  File.dirname(db.path) + '\\' + file.gsub('\\\\','\\')
                end
  
    live_data = {}
    values = []
    found_values = false
  
    File.open(file_path, "r").each_line.with_index do |row, i|
      if found_values
        values.push(row.to_f)
      else
        if row[1,4] == "time"
          found_values = true
          arr_of_rows = CSV.parse(row, headers: %w[row date time interval time_unit row_count])
          live_data = arr_of_rows.first.to_h
        end
      end
  
    end
    
    live_data["values"] = values
  
    live_data
  end

end

puts "Model Calibrate - InfoWorks to GeoJson Extraction v0.1.0"
puts "Luke Butler (luke@matrado.ca)"
puts  ""

WSApplication.message_box 'Extractions may take between 1 minute and 10 minutes depending on the size of your model. This script has only been tested on WS Pro 3.5, it may not work for older versions',nil,nil,false 
net=WSApplication.current_network

begin
  is_sim =  (net.current_timestep > -2) ? true : nil
rescue => exception
  if exception.message == "current_timestep: method cannot be run on a network without loaded results"
    is_sim = false
  else
    raise exception
  end
end

#.model_object only existing on the latest versions of IW
begin
  mo = net.model_object 
  name = mo.name
rescue => exception
 name = "Model Extract"
end

if (is_sim)
  file=WSApplication.file_dialog(false, "json", "GeoJson file",name,false,false) 
  if file.nil? 
    puts "Model extraction canceled"
  else

    validation = ValidateNetwork.new(net, config, file)
    files = validation.find_csvs()
    errors = validation.validate_network()

    if errors.length == 0

      geojson = IwGeojson.new(net, config, files).to_geojson
      File.open(file,'w') do |f|
        f.write(geojson)
      end

      puts "Model extracted:"
      puts file
      puts ""
      puts "The file can now be loaded online at: "
      puts "https:/calibrate.modelcreate.com"

    else
      puts "ERRORS FOUND"
      puts errors

    end

    
  end
else
  puts "This script only works with InfoWorks simulations for now"
  puts "Read the extraction guide at the project GitHub page above, there may also be a new version of this script"
end


