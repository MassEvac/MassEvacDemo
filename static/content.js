var markers = [];

var mbAttr = 'Simulations &copy; <a href="http://www.bristol.ac.uk/engineering/people/bharat-b-kunwar/index.html">Bharat Kunwar</a>, ' + 
        'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>';
    
var mbUrl = 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png'

var streets  = L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr}),
    grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr});

var cities = L.layerGroup();      

var map = L.map('map', {
    layers: [cities,grayscale]
});

function score(D90,T90){
    T90f = D90/1.34/60
    return Math.round(T90f/T90*10) 
}

function onEachFeature(feature, layer) {
    keys = ['D10%','T10%','D50%','T50%','D90%','T90%']
    s = score(feature.properties['D90%'],feature.properties['T90%'])

    if (feature.geometry.type == 'Polygon'){
        var popupContent = "<h2>" + feature.properties['name'] + ": Overview</h2>";
    } else {
        var popupContent = "<h2>" + feature.properties['name'] + ": Exit Detail</h2>";
    }

    popupContent += "<span id='number'>" + s + "/10</span> evacuation score (higher is better)<br/>";

    popupContent += "<span id='number'>" + feature.properties['pop'] + "</span> assumed evacuees.</br>";
    
    if (feature.geometry.type == 'Polygon'){
        popupContent += "<span id='number'>" + feature.properties['no_of_destins'] + "</span> identifiable exits.<br/>";
        // popupContent += "<a href='"+feature.properties['video']+"' class='html5lightbox' data-group='"+feature.properties['name']+"' title='Evacuation Simulation Video ("+feature.properties['name']+")'>Video</a><br/>";
        popupContent += "<video width='320' height='240' controls><source src='"+feature.properties['video']+"' type='video/mp4'>Your browser does not support the video tag.</video>";
    }
    
    popupContent += "<p><table>"
    popupContent += "<tr><th>% of evacuees</th><th>Distance to nearest exit</th><th>Minimum time required to evacuate</th></tr>";
    popupContent += "<tr><td>10%</td><td>"+Math.round(feature.properties[keys[0]])+" metres</td><td>"+Math.round(feature.properties[keys[1]])+" minutes</td></tr><tr><td>50%</td><td>"+Math.round(feature.properties[keys[2]])+" metres</td><td>"+Math.round(feature.properties[keys[3]])+" minutes</td></tr><tr><td>90%</td><td>"+Math.round(feature.properties[keys[4]])+" metres</td><td>"+Math.round(feature.properties[keys[5]])+" minutes</td></tr>";
    popupContent += "</table></p>";

    if (feature.geometry.type == 'Polygon'){
        layer.bindPopup(popupContent)
        .on({
            click: zoomToFeature
        });
    } else {
        layer.bindPopup(popupContent);                
    }
}

function zoomToFeature(e) {
    console.log(e)
    map.setView(e.latlng,10)
    .panBy([0,-250]);    
    // map.fitBounds(e.target.getBounds(),{padding:[50,50]});                  
}

var colourscore = ['#ff6347', '#f57a44', '#ea8d41', '#de9e3e', '#d1af3a', '#c1bd36', '#b0cc31', '#9cd82a', '#82e622', '#5ff217', '#00ff00']

var overview;

// GeoJSON overview layer with polygon boundaries
$.getJSON('./overview.json', function(data) {
    
    console.log(data)

    overview = L.geoJson(data, {

        style: function (feature) {
            s = score(feature.properties['D90%'],feature.properties['T90%'])
            console.log(s)                    
            return feature.properties && {
                weight: 0,
                color: "#FFF",
                opacity: 1,
                fillColor: colourscore[s],
                fillOpacity: 0.5
            };
        },

        onEachFeature: onEachFeature

    }).addTo(map)
    .on('click', onClick);;

    map.fitBounds(overview.getBounds());
});

function onClick(e) {
    $(".html5lightbox").html5lightbox();            
}        

var detail;

// GeoJSON detail layer with polygon boundaries
$.getJSON('./detail.json', function(data) {
    
    console.log(data)

    detail = L.geoJson(data, {

        pointToLayer: function (feature, latlng) {
            s = score(feature.properties['D90%'],feature.properties['T90%'])
            console.log(s)
            return L.circleMarker(latlng, {
                radius: 10,
                fillColor: colourscore[s],
                color: "#FFF",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.5
            });
        },

        onEachFeature: onEachFeature

    });
});

// control that shows state info on hover
var info = L.control();

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = "<h3>MassEvac . "+
                          "<a href='http://brtknr.github.io/' target='_blank'>Blog</a> . "+
                          "<a href='https://scholar.google.co.uk/citations?user=1j1MYeoAAAAJ' target='_blank'>Scholar</a>";
    return this._div;
};

info.addTo(map);

var help = L.control();            
help.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this.help = false;                
    this.update();
    return this._div;
};
help.update = function () {
    if (this.helpToggle == true) {
        this._div.innerHTML = "<p><a href='#' onclick='myhelp()'>Close</a></p>"+

        "<h3>Zoom in and click on a city to begin.</h3>"+  
        "Imagine your entire city has been ordered to evacuate. All the major roads are strained beyond their capacity. All the roads are completely packed with people and there seems to be little movement. We have all experienced this in a dense crowd at one point or another. This is neatly captured by this <a href='fd-figure.png' class='html5lightbox' title='Pedestrian Fundamental Diagram: The best flow here is around 3 agents per meter per second.'>'fundamental diagram'</a> which is an approximation of walking behaviour from observation of real people. We demonstrated this effect using our bespoke <a href='photos/BBK_9132.png' data-group='FON' class='html5lightbox' title='Sarah and Nick demonstrating our 'lentil-o-meter' at Festival of Nature 2014!'></a><a href='photos/BBK_9121.png' data-group='FON' class='html5lightbox' title='Neil and Bharat demonstrating our 'lentil-o-meter' at Festival of Nature 2014!'>'lentil-o-meter'</a> using lentil evacuees. Wouldn't it have been nice to know in advance what routes are more likely to be underused is such emergencies so that evacuees can make a more informed decision? As such, this website showcases total evacuation for some UK cities which Bharat is investigating as a part of his PhD. Feedback, feature and location requests are welcome. All information provided is intended to be consumed with a pinch of salt.<br/>"+                

        "<h3>Evacuation score</h3>"+  
        "The score is simply the ratio between 90% free flow time Tff90% (from free flow velocity 1.34 m/s and 90% distance to exit D90%) and 90% evacuation time estimate T90% (from the simulation). So, <p>score = Tff90%/T90% = (D90%/1.34/60)/T90%</p><br/>"+

        "<h3> Assumptions:</h3><ol>"+
        "<li> Evacuation type is a total evacuation scenario, for which exit nodes lie at intersection between major roads and city administrative boundary. <br/>"+
        "<li> Evacuation mode is by walking only. <br/>"+
        "<li> No dynamic routing due to bottlenecks.</ol><br/>"+

        "<p>Website last updated: 20 May 2018</p>";
        $(".html5lightbox").html5lightbox();
    } else this._div.innerHTML = "<p><a href='#' onclick='myhelp()'>Help!</a></p>";
};
window.myhelp = function (){
    help.helpToggle = !help.helpToggle;    
    help.update()
    map.fitBounds(group.getBounds());                
}
help.addTo(map);

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent(e.latlng.toString())
        .openOn(map);
}

map
    // Show latlng on right click
    .on('contextmenu', onMapClick)
    // When the zoom level is changes,
    // decide whether to show different part of the map
    .on('zoomend', function (e) {
        var currentZoom = map.getZoom();
        console.log(currentZoom)
        if (currentZoom < 10){
            map.removeLayer(detail)
        } else {
            map.addLayer(detail)
        }
    });
