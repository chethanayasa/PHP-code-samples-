// deferred objects for ajax calls
// used in reloadDonutAndPie function
function openNav() {
    document.getElementById("rightbutton").style.display = "none";
    document.getElementById("mySidenav").style.width = "225px";
    document.getElementById("main").style.marginLeft = "225px";
    document.getElementById("hidetext").style.display = "block";
    document.getElementById("sidenavcollapse").style.paddingLeft = "0px";
  
        reloadFaultTrend();
    
}

function closeNav() {
    document.getElementById("hidetext").style.display = "none";
    document.getElementById("rightbutton").style.display = "block";
    document.getElementById("mySidenav").style.width = "0px";
    document.getElementById("main").style.marginLeft = "0px";
    document.getElementById("sidenavcollapse").style.paddingLeft = "0px";
  
        reloadFaultTrend();
    
}
 var d1_piebox, d2_faulttrend, d3_donutchart, d4_link2count;
var occ_autoRefreshMapEnabled = true;
//var map;
var mapRefreshTimer = AutoRefreshTimerLandingPageMap;// 120000;// 2 mins = 120000 = 2 * 60000(1min);
var countDown = mapRefreshTimer/1000;
var timeoutForMapAutoRefresh;
var refreshCounter = 0;

$(document).ready(function () {
    pageTrainingId = 1;
    //  pre-populate with local storage from previous session
    if (occUserSelectionsString) {
        occUserSelections = JSON.parse(occUserSelectionsString);
        if (occUserSelections.selectedDuns !== undefined) {
            selectedDuns = occUserSelections.selectedDuns;
        }

    } else {
        // create new one
        occUserSelections = {};
        occUserSelections.UserID = uid;
        occUserSelections.SessionID = sid;
        occUserSelections.selectedDuns = selectedDuns;
        occUserSelections.CustomerIDList = selectedCustomerIdsList;
        localStorage.setItem("occUserSelectionsTextFor_" + uid, JSON.stringify(occUserSelections));
    }

    if (userCompanies.length < 2) {
        $('#ddlCompany').hide();
    } else {
        for (var i = 0; i < userCompanies.length; i++) {
          if (userCompanies[i].Duns === selectedDuns) {
                 $('#ddlCompany').append('<option value="' + i + '"  selected>' + userCompanies[i].CompanyLegalName + '</option>');
             } else {
                $('#ddlCompany').append('<option value="' + i + '">' + userCompanies[i].CompanyLegalName + '</option>');
            }

        }
    }
  

    selectedCustomerIdsList = getCustomerIdsForSelectedCompany(selectedDuns);

    reloadDonutAndPie();
    reloadMap(false); // call for defaults

    var criteriaForFaultTrend = {};
    criteriaForFaultTrend.FromDate = occ_fromDate4weeks;
    criteriaForFaultTrend.ToDate = ft_today;
    criteriaForFaultTrend.UserID = uid;
    criteriaForFaultTrend.SessionID = sid;
    criteriaForFaultTrend.CustomerIDList = selectedCustomerIdsList;
    getFaultTrend(criteriaForFaultTrend);

    $(".center-txt.percentage").hide();

    $('#ddlCompany').change(function () {
        selectedDuns = userCompanies[$('#ddlCompany').val()].Duns;
        selectedCustomerIdsList = getCustomerIdsForSelectedCompany(selectedDuns);


        $('#CompanyLogo').attr("src", URL_CustomerLogoPath + userCompanies[$('#ddlCompany').val()].LogoImageName);
        reloadDonutAndPie();
        reloadFaultTrend();
        reloadMap(false);
    });


    $('#timechange').change(function () {
        reloadDonutAndPie();
        reloadMap(false);
    });

    $('#ddlFaultTrendPeriod').change(function () {
        reloadFaultTrend();
    });  
});

function reloadDonutAndPie() {
    d1_piebox = $.Deferred();
    d2_faulttrend = $.Deferred();
    d3_donutchart = $.Deferred();
    d4_link2count = $.Deferred();
    $('#donutAndPieLoadIndicator').html('<div class="medium-indicator" style="margin: auto; display: block"></div>');
    $(".medium-indicator").dxLoadIndicator({
        height: 40,
        width: 40,
        hint: "Loading data ..."
    });

    $.when(d1_piebox, d2_faulttrend, d3_donutchart, d4_link2count).done(
        function (r1_piebox, r2_faulttrend, r3_donutchart, r4_link2count) {
        $('#donutAndPieLoadIndicator').html('');
        console.log(r1_piebox);
        console.log(r2_faulttrend);
        console.log(r3_donutchart);
        console.log(r4_link2count);
    });

    var criteria = buildLandingPageCriteria();

    // these functions will resolve the 4 promises above
    getpieboxdata(criteria);
    getfaulttrendpercentage(criteria);
    getDonutChartData(criteria);
    console.log(JSON.stringify(criteria));
    getLink2DeviceCount(criteria);

    topDTCsInit(criteria);
    $("#spTimeNow").html(moment().format("h:mm A"));
}

function buildLandingPageCriteria() {
    //occUserSelections = {};
    occUserSelections.UserID = uid;
    occUserSelections.SessionID = sid;
    var selectedDate = $('#timechange').val();

    if (selectedDate === "2") {
        occUserSelections.FromDate = occ_date_7daysago;
    }
    else {
        occUserSelections.FromDate = occ_date_yesterday;

    }
    occUserSelections.ToDate = occ_date_today;

    occUserSelections.selectedDuns = selectedDuns;
    occUserSelections.CustomerIDList = selectedCustomerIdsList;

    localStorage.setItem("occUserSelectionsTextFor_" + uid, JSON.stringify(occUserSelections));
    return occUserSelections;
}

function reloadMap() {
$('#mapLoadIndicator').html('<div class="medium-indicator" style="margin: auto; display: block"></div>');
    $(".medium-indicator").dxLoadIndicator({
    height: 40,
    width: 40,
    hint: "Loading data ..."
});
    //alert("in reload Map");
    // TBD future reference of the map data change /# Steve Cross #/     

    $('#refreshMapWarning').html('');
    // $('#InfoboxCustom').addClass('hidden');   
    //document.getElementById('InfoboxCustom').className = "hidden";
    //GetMap();
    clearTimeout(countDown);
    //Enable auto refresh on Map after it is rendered
    autoRefreshMap(true); // is a reload, refresh underlying map zoom etc
}

$(function () {

    var gradients = [
/* purple */  { "start": "#9037eb", "stop": "#bf83fd" },
/* red */  { "start": "#df0606", "stop": "#f86e6e" },
/* orange */{ "start": "#ff4800", "stop": "#fa9645" },
/* yellow */ { "start": "#e8c10d", "stop": "#f8eab0" },
/* aqua blue*/ { "start": "#0aa1d5", "stop": "#60def5" },
/* green */ { "start": "#44d384", "stop": "#0a7d46" }
    ];
    var gradients_str = '';
    var i = 0;
    gradients.forEach(function (g) {
        i += 1;
        gradients_str += "<linearGradient id='gradient_" + i + "'><stop offset='5%' stop-color='" + g.start + "' /><stop offset='95%' stop-color='" + g.stop + "'/></linearGradient>";
    });
    $('#gradients').html(gradients_str);
    var donutData = genData();

    var donuts = new DonutCharts();
    donuts.create(donutData);
   


});


function DonutCharts() {

    var charts = d3.select('#donut-charts');

    var chart_m,
        chart_r,
        color = d3.scale.category20();

    var getCatNames = function (dataset) {
        var catNames = new Array();

        for (var i = 0; i < dataset[0].data.length; i++) {
            catNames.push(dataset[0].data[i].cat);
        }
        return catNames;
    };

    var createLegend = function (catNames) {
        var legends = charts.select('.legend')
                        .selectAll('g')
                            .data(catNames)
                        .enter().append('g')
                            .attr('transform', function (d, i) {
                                return 'translate(' + (i * 100 + 50) + ', 10)';
                            });

        legends.append('circle')
            .attr('class', 'legend-icon')
            .attr('r', 6)
            .style('fill', function (d, i) {
                return color(i);
            });
        legends.append('text')
                .attr('dx', '3em')
                .attr('dy', '6em')
                .text(function (d) {
                    return d;
                });

    };

    var createCenter = function (pie) {

        var eventObj = {
            'mouseover': function (d, i) {
                d3.select(this)
                    .transition()
                    .attr("r", chart_r * 0.65);
            },

            'mouseout': function (d, i) {
                d3.select(this)
                    .transition()
                    .duration(500)
                    .ease('bounce')
                    .attr("r", chart_r * 0.006);
            },

            //'click': function (d, i) {
            //    var paths = charts.selectAll('');
            //    pathAnim(paths, 0);
            //    paths.classed('clicked', false);
            //    resetAllCenterText();
            //}
        };

        var donuts = d3.selectAll('.donut');

        // The circle displaying total data.
        donuts.append("svg:circle")
            .attr("r", chart_r * 0.006)
            .style("fill", "#E7E7E7")
            .on(eventObj);

        donuts.append('text')
                .attr('class', 'center-txt type')
                .attr('y', chart_r * -0.16)
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .text(function (d, i) {
                    return d.type;
                });


        donuts.append('text')
                .attr('class', 'center-txt percentage')
                .attr('y', chart_r * 0.16)
                .attr('text-anchor', 'middle')
                .style('fill', '#A2A2A2');
    };
    var setCenterText = function (thisDonut) {
        var sum = d3.sum(thisDonut.selectAll('.clicked').data(), function (d) {
            return d.data.val;
        });

        thisDonut.select('.value')
            .text(function (d) {
                return sum ? sum.toFixed(1) + d.unit
                            : d.total.toFixed(1) + d.unit;
            });
        thisDonut.select('.percentage')
            .text(function (d) {
                return sum ? (sum / d.total * 100).toFixed(2) + '%'
                            : '';
            });
    };


    var resetAllCenterText = function () {
        charts.selectAll('.value')
            .text(function (d) {
                //return d.total.toFixed(1) + d.unit;
            });
        charts.selectAll('.percentage')
            .text('');
    };

    var pathAnim = function (path, dir) {
        switch (dir) {
            case 0:
                path.transition()
                    .duration(500)
                    .ease('bounce')
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r)
                    );
                break;

            case 1:
                path.transition()
                    .attr('d', d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(chart_r * 1.08)
                    );
                break;
        }
    };

    var updateDonut = function () {

        var eventObj = {


            'mouseover': function (d, i, j) {
                pathAnim(d3.select(this), 1);

                var thisDonut = charts.select('.type' + j);
                thisDonut.select('.value').text(function (donut_d) {
                    return d.data.val.toFixed(1) + donut_d.unit;
                });
                thisDonut.select('.percentage').text(function (donut_d) {
                    //return (d.data.val/ donut_d.total* 100).toFixed(2) + '%';
                });
            },

            'mouseout': function (d, i, j) {
                var thisPath = d3.select(this);
                if (!thisPath.classed('clicked')) {
                    pathAnim(thisPath, 0);
                }
                var thisDonut = charts.select('.type' + j);
                setCenterText(thisDonut);
            },

            //'click': function (d, i, j) {
            //    var thisDonut = charts.select('.type' + j);

            //    if (0 === thisDonut.selectAll('')[0].length) {
            //        thisDonut.select('circle').on('')();
            //    }
            //    var thisPath = d3.select(this);
            //    var clicked = thisPath.classed('');
            //    pathAnim(thisPath, ~~ !clicked);
            //    thisPath.classed('clicked', !clicked);
            //    setCenterText(thisDonut);
            //}


        };

        var pie = d3.layout.pie()
                        .sort(null)
                        .value(function (d) {
                            return d.val;
                        });

        var arc = d3.svg.arc()
                        .innerRadius(chart_r * 0.7)
                        .outerRadius(function () {
                            return d3.select(this).classed('clicked') ? chart_r * .0008 : chart_r;
                        });

        // Start joining data with paths
        var paths = charts.selectAll('.donut')
                        .selectAll('path')
                        .data(function (d, i) {
                            return pie(d.data);
                        });

        paths
            .transition()
            .duration(1000)
            .attr('d', arc);

        var Arr = ['#9037eb', '#df0606', '#ff4800', '#e8c10d', '#0aa1d5', '#44d384'];
        paths.enter()
            .append('svg:path')
                .attr('d', arc)
                .style('fill', function (d, i) {
                    return "url(#gradient_" + (i + 1) + ")";
                })
                .style('stroke', '#555')
                //.style('stroke-width', '12px')
                //.style('stroke-alignment', 'inside')
                .on(eventObj);



        paths.exit().remove();

        resetAllCenterText();
    };

    this.create = function (dataset) {
        var $charts = $('#donut-charts');
        chart_m = $charts.innerWidth() / dataset.length / 2 * 0.14 / 2;
        chart_r = $charts.innerWidth() / dataset.length / 2 * 0.85 / 2;

        charts.append('svg')
            .attr('class', 'legend')
            .attr('width', '100%')
            .attr('height', 50)
            .attr('transform', 'translate(0, -100)');
        //charts.append('svg').style('shadow', '#A2A2A2');

        var donut = charts.selectAll('.donut')
                        .data(dataset)
                    .enter().append('svg:svg')
                        .attr('width', (chart_r + chart_m) * 2)
                        .attr('height', (chart_r + chart_m) * 2)
                    .append('svg:g')
                        .attr('class', function (d, i) {
                            return 'donut type' + i;
                        })
                        .attr('transform', 'translate(' + (chart_r + chart_m) + ',' + (chart_r + chart_m) + ')');

        createLegend(getCatNames(dataset));
        createCenter();

        updateDonut();
    };

    this.update = function (dataset) {
        // Assume no new categ of data enter
        var donut = charts.selectAll(".donut").data(dataset);

        updateDonut();
    };
}
/*
 * Returns a json-like object.
 */
function genData() {
    var type = [''];
    var unit = [''];
    var cat = ['color1', 'color2', 'color3', 'color4', 'color5', 'color6'];
   
    var dataset = new Array();

        var i = 0
        var data = new Array();
        var total = 0;
        var j = 0;
       // for (var j = 0; j < cat.length; j++) {
        cat[j] = derateCount / totalCount *  (6 - i);
        cat[j] = stopnowCount / totalCount *  (6 - i);
        cat[j] = svcimdeCount / totalCount *  (6 - i);
        cat[j] = svcsoonCount / totalCount *  (6 - i);
        cat[j] = derateCount / totalCount *  (6 - i);
        cat[j] = derateCount / totalCount *  (6 - i);
           
           
            var value = i;
            total += value;
            //console.log(total);
            data.push({
                "cat": cat[j],
                "val": value
            });
        

        dataset.push({
            "type": type[i],
            "unit": unit[i],
            "data": data,
          
            "total": total
        });
    
    return dataset;
}

/*Fault trend function*/

function reloadFaultTrend() {
    var selectedFaultTrendPeriod = $('#ddlFaultTrendPeriod').val();
    selectedDuns = userCompanies[$('#ddlCompany').val()].Duns;
    selectedCustomerIdsList = getCustomerIdsForSelectedCompany(selectedDuns);
    var criteriaForFaultTrend = {};
    criteriaForFaultTrend.CustomerIDList = selectedCustomerIdsList;
    if (selectedFaultTrendPeriod === "2") {
        criteriaForFaultTrend.FromDate = occ_fromDate8weeks;
    }
    else if (selectedFaultTrendPeriod === "3") {
        criteriaForFaultTrend.FromDate = occ_fromDate12weeks;
    }
    else {
        criteriaForFaultTrend.FromDate = occ_fromDate4weeks;
    }
    criteriaForFaultTrend.ToDate = occ_date_today;
    criteriaForFaultTrend.UserID = uid;
    criteriaForFaultTrend.SessionID = sid;
    getFaultTrend(criteriaForFaultTrend);
}


function getLink2DeviceCountWithAllCustomers() {
    // this method is called with all company 
    // locations to pre-populate server cache with the count
    if (callLink2UserService) {
        callLink2UserService = false; // don't call the service more than once
        var criteria = buildLandingPageCriteria();
        criteria.CustomerIDList = allCustomerIdsList;
        $.ajax({
            type: 'post',
            dataType: 'json',
            url: URL_HADOOP_API_SERVICE_ROOT + "/api/vehicle/link2user",
            data: criteria,
            success: function (data) {
                console.log("Link2 device count in all customer locations - " + data);
            },
            error: function (err) {
                console.log("failed to get Link 2 Device count for all customer locations from server" + err);
            }
        });
    }
}

/* End of pieboxdata Function*/

function getfaulttrendpercentage(criteria) {
    $.ajax({
        type: 'post',
        dataType: 'json',
        url: URL_OCC_API_SERVICE_ROOT + "/api/fault/trends/percentage",
        data: criteria,

        success: function (data) {
            if (data.ErrorMessage !== null) {
                console.log("failed to get faulttrend percentage data from URL_OCC_API_SERVICE_ROOT service call ... " + data.ErrorMessage);
            }
            //console.log(data);
            var ftpercent = data.CurrentFaultTrendPercentage.Trend;
            if (ftpercent > 0) {
                ftpercent = ftpercent + '%  <div class="oc-pie-icon2 oc-fr"><img src="' + URL_ImagePath + 'trendup.svg"></div>';
            } else if (ftpercent < 0) {

                ftpercent = ftpercent + '%  <div class="oc-pie-icon2 oc-fr"><img src="' + URL_ImagePath + 'trenddown.svg"></div>';

            }
            else if (ftpercent === 0) {
                // ftpercent = ftpercent + '% ';
            }

            $("#spFaultTrend").html(ftpercent);
            d2_faulttrend.resolve("getfaulttrendpercentage -success");

        },
        error: function (err) {
            console.log("failed to get Fault Trend percentage data from server" + err);
            d2_faulttrend.resolve("getfaulttrendpercentage - error");
        }
    });
}

/* Start of Top DTC's Function*/
function topDTCsInit(criteria) {

    $('#dcsiLoadIndicator').html('<div class="medium-indicator" style="margin: auto; display: block"></div>');
    $(".medium-indicator").dxLoadIndicator({
        height: 40,
        width: 40,
        hint: "Loading data ..."
    });

    $.ajax({
        type: 'post',
        dataType: 'json',
        url: URL_OCC_API_SERVICE_ROOT + "/api/fault/topdtcs",
        data: criteria,
        success: function (data) {
            if (data.ErrorMessage !== null) {
                console.log("failed to get topDTC data from URL_OCC_API_SERVICE_ROOT service call ... " + data.ErrorMessage);
            }
            var topdtcData = data.TopDtcCounts;
            drawTopDtcs(topdtcData);
        },
        error: function (err) {
            $('#dcsiLoadIndicator').html('');
            console.log("failed to get Top DTCs data from server" + err);
        }
    });
}
function drawTopDtcs(topDtcs) {

    for (k = 0; k < topDtcs.length; k++) {
        if (topDtcs[k].VehicleWasDerating === true) {
            topDtcs[k].ThrowCount = '<span class="oc-circle purple">' + topDtcs[k].ThrowCount + '</span>';
        } else if (topDtcs[k].VehicleWasDerating === false) {
            topDtcs[k].ThrowCount = '<span class="oc-circle orange">' + topDtcs[k].ThrowCount + '</span>';

        }
    }

    dataGrid = $(".divTopDTCs").dxDataGrid({
        dataSource: topDtcs,
        showColumnHeaders: false,
        allowColumnReordering: false,
        allowColumnResizing: false,
        columnAutoWidth: false,
        cellHintEnabled: true,
        hoverStateEnabled: true,
        searchPanel: { visible: false },
        headerFilter: { visible: true },
        onContentReady: function (info) {
            $('#dcsiLoadIndicator').html('');
        },
        columns: [
            {
                caption: '',
                dataField: 'ThrowCount',
                dataType: "string",
                width: 60,
                visible: true,
                visibleIndex: 0,
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                cellTemplate: function (container, options) {

                    $(options.value).appendTo(container);
                }
            },
               {
                   caption: '',
                   dataField: 'DTC',
                   dataType: "string",
                   width: 100,
                   visible: true,
                   visibleIndex: 1,
                   allowFiltering: false,
                   allowSearch: false,
                   allowSorting: false
               },
               {
                   dataField: 'Description',
                   caption: '',
                   dataType: "string",
                   width: 180,
                   visible: true,
                   visibleIndex: 2,
                   allowFiltering: false,
                   allowSearch: false,
                   allowSorting: false
               }]
    }).dxDataGrid("instance");

}
/* End of Top DTC's Function*/

/////////////////////////////////////////////////////////////


/* Get Donut data */
   function getDonutChartData(criteria) {
    $.ajax({
        type: 'post',
        dataType: 'json',
        url: URL_OCC_API_SERVICE_ROOT + "/api/fault/severity/heatmap",
        data: criteria,

        success: function (data) {
            if (data.ErrorMessage !== null) {
                console.log("failed to get Donutchart data from URL_OCC_API_SERVICE_ROOT service call ... " + data.ErrorMessage);
            }
            var donutData = genData();

            var donuts = new DonutCharts();
            donuts.create(donutData);
            derateCount = 0;
            maintenanceCount = 0;
            svcsoonCount = 0;
            stopnowCount = 0;
            svcimdeCount = 0;
            healthyCount = 0;
            notHealthyCount = 0;
            totalCount = 0;
            for (var i = 0; i < data.SeverityHeatmap.length; i++) {
                var x = data.SeverityHeatmap[i];
                switch (x.Id) {
                    case "D":
                        derateCount = x.VinCount;
                        break;
                    case "H":
                        healthyCount = x.VinCount;
                        break;
                    case "M":
                        maintenanceCount = x.VinCount;
                        break;
                    case "NH":
                        notHealthyCount = x.VinCount;
                        break;
                    case "4":
                        svcimdeCount = x.VinCount;
                        break;
                    case "2":
                        svcsoonCount = x.VinCount;
                        break;
                    case "10":
                        stopnowCount = x.VinCount;
                        break;
                    case "T":
                        totalCount = x.VinCount;
                        break;


                }
            }

            $("#spderateCount").html(ThousandSeparatorNumberFormat(new Number(derateCount)));
            $("#spstopnowCount").html(ThousandSeparatorNumberFormat(new Number(stopnowCount)));
            $("#spsvcimdeCount").html(ThousandSeparatorNumberFormat(new Number(svcimdeCount)));
            $("#spsvcsoonCount").html(ThousandSeparatorNumberFormat(new Number(svcsoonCount)));
            $("#spmaintenanceCount").html(ThousandSeparatorNumberFormat(new Number(maintenanceCount)));
            $("#sphealthyCount").html(ThousandSeparatorNumberFormat(new Number(healthyCount)));


            //totalCount = derateCount + maintenanceCount + svcimdeCount + healthyCount + svcsoonCount + stopnowCount;

            $(".for-text").html("Vehicles with Scans</br>" + ThousandSeparatorNumberFormat(new Number(totalCount)));

            $(".donut path:first").hover(function () {
                $(".for-text").html("Derate Condition</br>" + ThousandSeparatorNumberFormat(new Number(derateCount)));
                window.clearTimeout(timeoutIDforDonut);
            }, function() {
                timeoutIDforDonut = window.setTimeout(showTotalVehiclesCount(ThousandSeparatorNumberFormat(new Number(totalCount), 2000)));
            });


            $(".donut path:nth(1)").hover(function () {
                $(".for-text").html("Stop Now</br>" + ThousandSeparatorNumberFormat(new Number(stopnowCount)));
                window.clearTimeout(timeoutIDforDonut);
            }, function () {
                timeoutIDforDonut = window.setTimeout(showTotalVehiclesCount(ThousandSeparatorNumberFormat(new Number(totalCount), 2000)));
            });
            $(".donut path:nth(2)").hover(function () {
                $(".for-text").html("Service Immediately</br>" + ThousandSeparatorNumberFormat(new Number(svcimdeCount)));
                window.clearTimeout(timeoutIDforDonut);
            }, function () {
                timeoutIDforDonut = window.setTimeout(showTotalVehiclesCount(ThousandSeparatorNumberFormat(new Number(totalCount), 2000)));
            });
            $(".donut path:nth(3)").hover(function () {
                $(".for-text").html("Service Soon</br>" + ThousandSeparatorNumberFormat(new Number(svcsoonCount)));
                window.clearTimeout(timeoutIDforDonut);
            }, function () {
                timeoutIDforDonut = window.setTimeout(showTotalVehiclesCount(ThousandSeparatorNumberFormat(new Number(totalCount), 2000)));
            });

            $(".donut path:nth(4)").hover(function () {
                $(".for-text").html("Maintenance Related</br>" + ThousandSeparatorNumberFormat(new Number(maintenanceCount)));
                window.clearTimeout(timeoutIDforDonut);
            }, function () {
                timeoutIDforDonut = window.setTimeout(showTotalVehiclesCount(ThousandSeparatorNumberFormat(new Number(totalCount), 2000)));
            });
            $(".donut path:nth(5)").hover(function () {
                $(".for-text").html("Healthy Vehicles</br>" + ThousandSeparatorNumberFormat(new Number(healthyCount)));
                window.clearTimeout(timeoutIDforDonut);
            }, function () {
                timeoutIDforDonut = window.setTimeout(showTotalVehiclesCount(ThousandSeparatorNumberFormat(new Number(totalCount), 2000)));
            });

            d3_donutchart.resolve("getDonutChartData - success");

        },
        error: function (err) {
            console.log("failed to get Donut data from server" + err);
            d3_donutchart.resolve("getDonutChartData - error");
        }
    });
}

var timeoutIDforDonut;
function showTotalVehiclesCount(totalCount) {
    $(".for-text").html("Vehicles with Scans</br>" + totalCount);
}

$('#fullScreenMapLink').on('click', function (e) {
   // console.log('Full screen mode clicked');
    toggleFullScreen('mapContainer');
    //autoRefreshMap();
});

$('#closeExpandMap').on('click', function () {
   // console.log('Full screen mode closed');
    toggleFullScreen('mapContainer');
});

var refreshCounter = 0;

function autoRefreshMap(isReload)
{
    if (occ_autoRefreshMapEnabled) { // && isFullScreen()) {   
        refreshCounter++;
        if (window.console)
            console.log("Refreshed: " + refreshCounter + ' times');
        clearTimeout(timeoutForMapAutoRefresh);
        countDown = mapRefreshTimer / 1000;
        countdownDisplay($('#refreshMapWarning'));
        GetMap(isReload);

        timeoutForMapAutoRefresh = setTimeout(autoRefreshMap, mapRefreshTimer);
    }
    else {
        clearTimeout(timeoutForMapAutoRefresh);
    }
}



