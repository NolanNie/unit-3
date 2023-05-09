(function(){
    var chartWidth = window.innerWidth * 0.99,
            chartHeight = 200;

    //pseudo-global variables
    var attrArray = ["# of Pros","# Active","# of HOF","Games Played","TDs",
                        "Most TDs","Games"];; //list of attributes
    var expressed = attrArray[0]; //initial attribute

    var exp_String = ["Total Number of Pros All Time from each state",
                        "Number of Active Players from each state",
                        "Number of Hall of Famers from each state",
                        "Number of Games Played by Players from each state",
                        "Number of Touchdowns Scored by Players from each state",
                        "Most Touchdowns Scored by a Player from each state",
                        "Most Games Played by a Player from each state"]

    function titleChange() {
        for (var i = 0; i < attrArray.length; i++) {
            if (expressed == attrArray[i]) {
                return exp_String[i];
            }
        }
    }
    
    //begin script when window loads
    window.onload = setMap();
    
    //set up choropleth map
    function setMap(){


        //map frame dimensions
        var width = window.innerWidth * 0.99,
            height = 700;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height)
            

        //create Albers equal area conic projection centered on France
        var projection = d3.geoConicEqualArea()
            .center([-18.18, 52.32])
            .rotate([110.09, 6.36, 0])
            .parallels([45.00, 69.17])
            .scale(469.73)
            .translate([width / 2, height / 2]);
            
        var path = d3.geoPath()
            .projection(projection);



        //use Promise.all to parallelize asynchronous data loading
        var promises = [d3.csv("data/Football.csv"),                    
                        d3.json("data/states_borders.topojson"),                                      
                        ];

        Promise.all(promises).then(callback);
        function callback(data){    
            
            var csvData = data[0];    
            var states = data[1]; 

            var States = topojson.feature(states, states.objects.states_borders);
    
            var stateBorders = States.features;   
            
            //join csv data to GeoJSON enumeration units
            stateBorders = joinData(stateBorders, csvData);
            
            //create the color scale
            var colorScale = makeColorScale(csvData);

            setChart(csvData, colorScale);                                                                                              

            var states_ = map.append("path")
                .datum(States)
                .attr("class", "states_borders" )
                .attr("d", path)
    
            setEnumerationUnits(stateBorders, map, path, colorScale);

            

            createDropdown(csvData);


        };

        //function to create a dropdown menu for attribute selection
        function createDropdown(csvData){
            //add select element
            var dropdown = d3.select("body")
                .append("select")
                .attr("class", "dropdown")
                .on("change", function(){
                    changeAttribute(this.value, csvData)
                });

            //add initial option
            var titleOption = dropdown.append("option")
                .attr("class", "titleOption")
                .attr("disabled", "true")
                .text("Select Attribute");

            //add attribute name options
            var attrOptions = dropdown.selectAll("attrOptions")
                .data(attrArray)
                .enter()
                .append("option")
                .attr("value", function(d){ return d })
                .text(function(d){ return d });
        };

        

        //dropdown change event handler
        function changeAttribute(attribute, csvData) {

            

            //change the expressed attribute
            expressed = attribute;

            

            var max_range = d3.max(csvData, function(d) {
                console.log(d[expressed])
                return parseFloat(d[expressed])}); 
            //console.log(max_range);

            function scale(val) {
                var per = (val / max_range * chartHeight) * 0.75;
                console.log(max_range)
                console.log(per)
                return per;
            }

            //recreate the color scale
            var colorScale = makeColorScale(csvData);

            //recolor enumeration units
            var state_style = d3.selectAll(".states")
                .transition()
                .duration(1000)
                .style("fill", function (d) {
                    
                    var value = d.properties[expressed];
                    if (value) {
                        return colorScale(d.properties[expressed]);
                    } else {
                        return "#ccc";
                    }
                });

            //Sort, resize, and recolor bars
            var bars = d3.selectAll(".bars")

                //Sort bars
                .sort(function(a, b){
                   //console.log(a[expressed])
                    return a[expressed] - b[expressed];
                })
                .transition() //add animation
                .attr("x", function(d, i){
                    return i * (chartWidth / csvData.length);
                })
                //resize bars
                .attr("height", function(d, i){
                    return scale(parseFloat(d[expressed]));
                })
                .attr("y", function(d, i){
                    return chartHeight - scale(parseFloat(d[expressed]));
                })
                //recolor bars
                .style("fill", function(d){            
                    var value = d[expressed];            
                    if(value) {                
                        return colorScale(value);            
                    } else {                
                        return "#ccc";            
                    }    
                })
                
                .delay(function(d, i){
                    return i * 20
                })
                .duration(500);

            var numbers = d3.selectAll(".numbers")
                .sort(function(a, b){
                    return a[expressed]-b[expressed]
                })
                .transition() //add animation
                .attr("text-anchor", "middle")
                .attr("x", function(d, i){
                    var fraction = chartWidth / csvData.length;
                    return i * fraction + (fraction - 1) / 2;
                })
                .attr("y", function(d){
                    return chartHeight - scale(parseFloat(d[expressed])) - 5;
                })
                .text(function(d){
                    return d[expressed];
                })
                .delay(function(d, i){
                    return i * 20
                })
                .duration(500);

            var title = d3.select(".chartTitle")
                .text(titleChange());
        }

        

        function setEnumerationUnits(states, map, path, colorScale){

            //function to highlight enumeration units and bars
            function highlight(props){
                //change stroke

                console.log(props)
                var selected = d3.selectAll(props.postal)
                    .style("stroke", "blue")
                    .style("stroke-width", "2");
            };

            var state = map.selectAll(null)
                .data(states)
                .enter()
                .append("path")
                .attr("class", "states")
                .attr("id", function(d){
                    return d.properties.postal;
                })
                .attr("d", path)
                .style("fill", function(d){
                    //console.log(d)
                    return colorScale(d.properties[expressed]);
                    
                })
                .on("mouseover", function(event, d){
                    console.log(d.properties.postal)
                    var selected = d3.selectAll("#" + d.properties.postal)
                        .style("stroke", "blue")
                        .style("stroke-width", "2");
                })
                .on("mouseout", function(event, d){
                    console.log(d.properties.postal)
                    var selected = d3.selectAll("#" + d.properties.postal)
                            .style("stroke", function(d){
                                console.log(d)
                                if (d.State){
                                    return "none";
                                }
                                else{
                                    return "gray";
                                }
                            })
                            .style("stroke-width", "2");
                });
        };

        function joinData(stateBorders, csvData){
            //loop through csv to assign each set of csv attribute values to geojson region
            for (var i=0; i<csvData.length; i++){
                var csvState = csvData[i]; //the current region
                var csvKey = csvState.State; //the CSV primary key
                
                //loop through geojson regions to find correct region
                for (var a=0; a<51; a++){
                    
                    var geojsonProps = stateBorders[a].properties; //the current region geojson properties
                    var geojsonKey = geojsonProps.postal; //the geojson primary key
                    
                    //where primary keys match, transfer csv data to geojson properties object
                    if (geojsonKey == csvKey){

                        //assign all attributes and values
                        attrArray.forEach(function(attr){
                            if (isNaN(csvState[attr])){
                                var val = csvState[attr];
                                geojsonProps[attr] = val;
                            }
                            else{
                                var val = parseFloat(csvState[attr]); //get csv attribute value
                                geojsonProps[attr] = val; //assign attribute and value to geojson properties
                            }
                            
                            
                        });
                    };
                };
            };
            return stateBorders;
        };
    };

    //function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){

            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };
        

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    

    function setChart(csvData, colorScale){

        var max_range = d3.max(csvData, function(d) { return parseFloat(d[expressed])}); 


        function scale(val) {
            var per = (val / max_range * chartHeight) * 0.75;
            //console.log(per)
            return per;
        }

        

        //Example 2.1 line 17...create a second svg element to hold the bar chart
        var chart = d3.select("div")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            //.attr("transform", translate);

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text(titleChange());

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            //.attr("transform", translate);

        
        
        //Example 2.4 line 8...set bars for each state
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "bars" ;
            })
            .attr("id", function(d){
                return d.State;
            })
            .attr("width", chartWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartWidth / csvData.length);
            })
            .attr("height", function(d){
                return scale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                //console.log(parseFloat(d[expressed]));
                //console.log(yScale(parseFloat(d[expressed])));
                return chartHeight - scale(parseFloat(d[expressed]));
            })
            
            .style("fill", function(d){
                return colorScale(d[expressed]);
            })
            .on("mouseover", function(event, d){
                var selected = d3.selectAll("#" + d.State)
                        .style("stroke", "blue")
                        .style("stroke-width", "2");
            })
            .on("mouseout", function(event, d){
                var selected = d3.selectAll("#" + d.State)
                        .style("stroke", function(d){
                            if (d.State){
                                return "none";
                            }
                            else{
                                return "gray";
                            }
                        })
                        .style("stroke-width", "2");
            });

            //annotate bars with attribute value text
            var numbers = chart.selectAll(".numbers")
                .data(csvData)
                .enter()
                .append("text")
                .sort(function(a, b){
                    return a[expressed]-b[expressed]
                })
                .attr("class", function(d){
                    return "numbers";
                })
                .attr("text-anchor", "middle")
                .attr("x", function(d, i){
                    var fraction = chartWidth / csvData.length;
                    return i * fraction + (fraction - 1) / 2;
                })
                .attr("y", function(d){
                    return chartHeight - scale(parseFloat(d[expressed])) - 5;
                })
                .text(function(d){
                    return d[expressed];
                });

            var blank = d3.select("body")
                .append("svg")
                .attr("width", chartWidth)
                .attr("height", chartHeight)
                .attr("class", "blank");

    };

    
    })(); 

