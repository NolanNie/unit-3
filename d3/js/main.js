//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){


    //map frame dimensions
    var width = 960,
        height = 500;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

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
    function callback(data)
    {    
        
        var csvData = data[0];    
        var states = data[1]; 

        var stateBorders = topojson.feature(states, states.objects.states_borders);   

        var states_ = map.append("path")
            .datum(stateBorders)
            .attr("class", "states")
            .attr("d", path);

          
    };
};

