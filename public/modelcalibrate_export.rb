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
      "fields"=>  ["fixed_level","live_data_point_id"],
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
      "fields"=>  ["mode","opening","pipe_closed","pressure","linear_profile"],
      "array_fields" => ["profiles"]
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
    
    extend_selection
    extract_features
  end

  def validate_network

    if @features.length == 0 
      @errors.push("*** No objects selected - Selected part of the model to export")
    end

    fixedHeadCount = @features.select {|f| f.table == "wn_fixed_head" }.length
    unless fixedHeadCount == 1
      @errors.push("*** Model extract must have a single fixed head - #{fixedHeadCount} found")
    end

    tankCount = @features.select {|f| f.table == "wn_reservoir" }.length
    unless tankCount == 0
      @errors.push("*** Model extract cannot contain reservoirs, convert to a fixed head or model inflow as transfer node - #{tankCount} found")
    end

    pumpCount = @features.select {|f| f.table == "wn_pst" }.length
    unless pumpCount == 0
      @errors.push("*** Model extract cannot contain pumping stations - #{pumpCount} found")
    end

    is_interconnected

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

  def is_interconnected

    fixedHead = @features.select {|f| f.table == "wn_fixed_head" }.first
    fixedHead._seen = true
    
    unprocessedLinks = (fixedHead.navigate('us_links') << fixedHead.navigate('ds_links') << fixedHead.navigate('us_node') << fixedHead.navigate('ds_node')).flatten!

    foundObjects = []
    foundObjects.push(fixedHead.id)

    while unprocessedLinks.size>0 
      working = unprocessedLinks.shift
        if working.selected == true && working._seen != true
          foundObjects.push(working.id)
          working._seen = true

          unprocessedLinks = (unprocessedLinks << working.navigate('us_links') << working.navigate('ds_links') << working.navigate('us_node') << working.navigate('ds_node')).flatten!
        end
    end


    selectedObjects = []
    @features.each do |f|
      selectedObjects.push(f.id)
    end

    disconnectedObjects = (selectedObjects - foundObjects)
    if disconnectedObjects.length > 0    
      @errors.push("*** Model extract must be interconnected, check selection - #{disconnectedObjects.length} objects disconnected from fixed head")
      @errors.push("*** The follow objects are not connected to the fixed head -  #{disconnectedObjects}")
    end

  end

  def extend_selection
    #Check all links and ensure US&DS nodes are selected
    @network.row_object_collection_selection("_links").each do |ro|
      if !ro.us_node.nil? && ro.us_node.selected == false
        ro.us_node.selected = true
      end
      if !ro.ds_node.nil? && ro.ds_node.selected == false
        ro.ds_node.selected = true
      end
    end

    #check customer points are selected on nodes
    node_cust_allocation = {}
    @network.row_objects('wn_address_point').each do |cust|
      next if cust.allocated_pipe_id == ""
      us_or_ds = (cust.demand_at_us_node ? 0 : 1)
      node_id = cust.allocated_pipe_id.split(".")[us_or_ds]

      node_cust_allocation[node_id] = [] unless node_cust_allocation.key?(node_id)
      node_cust_allocation[node_id].push(cust)
    end

    @network.row_object_collection_selection("_nodes").each do |ro|
        # check if ro has customer allocations and select them as well
        if node_cust_allocation.key?(ro.id)
            node_cust_allocation[ro.id].each do |cust|
                cust.selected = true
            end
        end
    end

  end

  def extract_features

    @config["tables"].each do |table|
      @network.row_object_collection(table["name"]).each do |ro|
        if ro.selected == true
          @features.push(ro)
        end
      end
    end
  end

end

class IwGeojson
  def initialize(network, config, files)
    @network = network
    @config = config
    @errors = []
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
        "extract_version" => 20191015,
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

  
  def validate_controls

    unsupportedControlValves = @features.select {|f| f["properties"]["table"] == "wn_valve"  && !['THV','PRV', nil].include?(f["properties"]["mode"])  }
    unless unsupportedControlValves.length == 0
      unsupportedControlValves.each do |v|
        @errors.push("*** Valve control #{v["properties"]["mode"]} on valve id #{v["properties"]["id"]} unsupported")
      end
    end

    unless @json["model"]["run_time"]["time_step"] == "15."
      @errors.push("*** Timesteps must be 15 mins - timestep in control is set to #{@json["model"]["run_time"]["time_step"]}0 minutes")
    end

    prvs = @features.select {|f| f["properties"]["table"] == "wn_valve"  && f["properties"]["mode"] == "PRV"  }
    prvs.each do |prv|
      prvObj = @network.row_object('_links',prv["properties"]["id"])
      if prvObj.us_node.table == "wn_fixed_head"
        @errors.push("*** The fixed head cannot be directly connected upstream of a PRV, move fixed head further upstream")
      end
    end

    transferNodes = @features.select {|f| f["properties"]["table"] == "wn_transfer_node"}
    transferNodes.each do |tn|
      if !tn["properties"].key?("flows") 
        @errors.push("*** Transfer nodes must have 96 time-varying flows - there are no rows of data on node ID #{tn["properties"]["id"]}")
      elsif tn["properties"]["flows"].length != 96
        @errors.push("*** Transfer nodes must have 96 time-varying flows - there are #{tn["properties"]["flows"].length} rows of data on node ID #{tn["properties"]["id"]}")
      end
    end

    fixedHead = @features.select {|f| f["properties"]["table"] == "wn_fixed_head"}
    fixedHead.each do |fh|
      if fh["properties"]["levels"] == nil && fh["properties"]["fixed_level"]  == nil
        @errors.push("*** The fixed head is not set with either a fixed level or time-varying levels")
      elsif fh["properties"]["levels"] != nil && fh["properties"]["levels"].length != 96
        @errors.push("*** The fixed head must have 96 time-varying levels - there are #{fh["properties"]["levels"].length} rows of data")
      elsif fh["properties"]["fixed_level"]  != nil && fh["properties"]["levels"] == nil
        fh["properties"]["levels"] = Array.new(96) {|i| [i,fh["properties"]["fixed_level"]] } #Extend fixed level to 96 points
      end
    end

    liveDataNodes = @features.select {|f| f["properties"]["live_data_point_id"] != nil}
    extractedLiveData = @live_data.keys
    liveDataNodes.each do |ld|
      if !extractedLiveData.include?(ld["properties"]["live_data_point_id"])
        puts "*** WARNING: #{ld["properties"]["live_data_point_id"]} was not extracted from the Live Data Configuration so live data for node #{ld["properties"]["id"]} will not show"
        ld["properties"]["live_data_point_id"] = nil
      end
    end

    

    (@demand_profile_names - @demands_profiles.keys ).each do |p|    
      @errors.push("*** Demand catergory #{p} not found in demand diagram")
    end

    @errors

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

          if (dbc.no_of_properties == 0 ||  dbc.no_of_properties == nil) && dbc.average_demand != nil
            spec_consumption = dbc.average_demand * 86400
            no_of_properties = 1
          else
            spec_consumption = dbc.spec_consumption
            no_of_properties = dbc.no_of_properties
          end

          @demand_profile_names |= [dbc.category_id.downcase] 

          @demands[ro.node_id].push({
              "category_id" => dbc.category_id.downcase,
              "spec_consumption" => spec_consumption,
              "no_of_properties" => no_of_properties,
            })
        end
    
      end
    end
    
    @network.row_object_collection("wn_address_point").each do |ro|

      if ro.selected == true

        if (ro.no_of_properties == 0 ||  ro.no_of_properties == nil) && ro.average_demand != nil
          spec_consumption = ro.average_demand * 86400
          no_of_properties = 1
        else
          spec_consumption = ro.spec_consumption
          no_of_properties = ro.no_of_properties
        end
        
        @demand_profile_names |= [ro.category_id.downcase] 
      
        node_index = ro.demand_at_us_node ? 0 : 1
        node_id = ro.allocated_pipe_id.split(".")[node_index]
      
        @demands[node_id] = [] unless @demands.key?(node_id)
        @demands[node_id].push({
                  "category_id" => ro.category_id.downcase,
                  "spec_consumption" => spec_consumption,
                  "no_of_properties" => no_of_properties,
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
        current_profile = row[40..row.length-2].strip.downcase

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
          
          unless data_info_array == nil
            data_array = data_info_array[1..data_info_array.length-2].scan(/{(.+?)}/).collect{|i| i[0].split(",")}
      
            @controls[id][arr_f] =  data_array
          end
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

    live_data_fields = ["live_data_point_id", "source_file","channel_type","sensor_level","pressure_factor","pressure_offset","flow_factor","flow_offset","time_offset"]


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
        if test_hash["data_source"]  == "SLI"
          if File.file?( get_filepath(test_hash["source_file"]) )
            props = test_hash.select {|k,v| live_data_fields.include?(k) }
            @live_data[test_hash["live_data_point_id"]] = props
            @live_data[test_hash["live_data_point_id"]]["live_data"] = read_sli(test_hash["source_file"])
          else
            puts "*** WARNING: Source file for #{test_hash["live_data_point_id"]} in the LDC cannot be found, file path listed as #{get_filepath(test_hash["source_file"])} "
          end
        else
          puts "*** WARNING: #{test_hash["live_data_point_id"]} in the LDC is not a SLI file and cannot be exported"
        end
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

  def get_filepath(file)
    db=WSApplication.current_database 
    file_path = if file[1..1] == ":"
                  file.gsub('\\\\','\\')
                else
                  File.dirname(db.path) + '\\' + file.gsub('\\\\','\\')
                end
    file_path
  end

  def read_sli(file)
    
    file_path = get_filepath(file)
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

def print_errors(errs)
  puts ""
  puts "***********************"
  puts "*                     *"    
  puts "*    ERRORS FOUND     *"    
  puts "*                     *"    
  puts "***********************"    
  puts ""                                             
  puts errs
end

puts "Model Calibrate - InfoWorks to GeoJson Extraction v0.2.0 - 2019-10-15"
puts "Luke Butler (luke@matrado.ca)"
puts  ""

WSApplication.message_box 'Extractions may take up to 1 minute depending on the size of your model. This script has only been tested on WS Pro 3.5, it may not work for older versions',nil,nil,false 
net=WSApplication.current_network


#.model_object only existing on the latest versions of IW
begin
  mo = net.model_object 
  name = mo.name
rescue => exception
 name = "Model Extract"
end


file=WSApplication.file_dialog(false, "json", "GeoJson file",name,false,false) 
if file.nil? 
  puts "Model extraction canceled"
else

  validation = ValidateNetwork.new(net, config, file)
  files = validation.find_csvs()
  errors = validation.validate_network()

  if errors.length == 0

    geoJsonCreator = IwGeojson.new(net, config, files)
    controlErrors = geoJsonCreator.validate_controls
    if controlErrors.length == 0
      geojson = geoJsonCreator.to_geojson
      File.open(file,'w') do |f|
        f.write(geojson)
      end
  
      puts ""
      puts "Model extracted:"
      puts file
      puts ""
      puts "The file can now be loaded online at: "
      puts "https:/calibrate.modelcreate.com"
    else
      print_errors(controlErrors)
    end
    
  else
    print_errors(errors)

  end

end



