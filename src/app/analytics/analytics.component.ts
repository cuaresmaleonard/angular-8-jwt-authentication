import { Component, OnInit  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '../_services';
import { User } from '../_models';
import * as moment from 'moment';
import * as jquery from 'jquery';

declare function test_f(): any;
declare var AmCharts: any;
declare var $:any;

@Component({
	selector: 'app-analytics',
	templateUrl: './analytics.component.html',
	styleUrls: ['./analytics.component.less']
})

export class AnalyticsComponent implements OnInit {
	loader = true;
	result;
	cpeChannels_result;
	cm_info_result;
	cm_info;
	cm_id;
	cm_parameters;
	cpeChannels;

	// account
	recent_searches;

	// plant
	upstream;
	
	// others
	port_active = 0;

	// options
 
	spanSelectForm = new FormGroup({
		spanSelect: new FormControl(''),
  	});

	span_options = [
			{val:"d", text_val: "3 Days"}, 
			{val:"live", text_val: "Live"}, 
			{val:"24h", text_val: "24 Hours"}, 
			{val:"w", text_val: "1 Week"},
			{val:"m", text_val: "1 Month"},
		];	

	// chart
	chart_hist = false;
	chart_live = false;

	// user 
	public currentUserInfo;
	currentUser: User;

	constructor(private http: HttpClient, private authenticationService: AuthenticationService) { 
		this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
		this.currentUserInfo = this.authenticationService.currentUser.source['_value'];
	}
  
	ngOnInit() {
		this.loader = false;
		this.recentSearchInit();

		/// popover for tx rx snr fec
		$('[data-toggle="popover"]').popover();

		/// toast for account not found on search
		$('.toast').toast({animation: true, delay: 3000});

	}

	accountSearchForm = new FormGroup({
		account_number: new FormControl(''),
  	});

	recentSearchInit() {

		this.http.post<any>('http://182.18.194.188/nms/authbasic/view_search_analytics', []).subscribe(data => {
			this.recent_searches = data;
			this.loader = false;
		});

	}

	accountSearch() {
		this.loader = true;

		if ( this.accountSearchForm.value.account_number.trim() != "" && this.accountSearchForm.value.account_number.trim().length == 9 ) 
		{
			
			const body = {acct_no: this.accountSearchForm.value.account_number, type: true}; 
			
			this.http.post<any>('http://182.18.194.188/nms/authbasic/get_associated_accounts', body).subscribe(data => {
			    this.result = data;
			    this.loader = false;

			    if (this.result.length == 1) 
			    {
			    	this.loader = true;
			    	this.cm_id = this.result[0].cm_id;
			    	$('#acctinfo-tab').click();

			    	const body = {cm_id: this.cm_id, user_id: this.currentUserInfo.id, duration: 0, type: true};

			    	this.http.post<any>('http://182.18.194.188/nms/authbasic/cm_info', body).subscribe(data => {
			    		this.cm_info_result = data;
			    		this.loader = false;
			    		this.cm_info = this.cm_info_result[0][0];
			    		this.cm_parameters = this.cm_info_result[1];
		
			    		// drop graph
			    		this.getHistoricGraph('d', 'view', '');	    	
		    		});

		    		const cpeChannels_body = {cm_id: this.cm_id};

		    		this.http.post<any>('http://182.18.194.188/nms/authbasic/cpeChannels', cpeChannels_body).subscribe(data => {
			    		this.cpeChannels_result = data;
			    		this.loader = false;
			    		this.cpeChannels = this.cpeChannels_result;
		    		});

		    		// this.http.get<any>('http://182.18.194.188/nms/authbasic/summaryupstream/'+this.cm_id).subscribe(data => {
		    		// 	console.log(data);
		    		// });	    		

		    		const upstream_body = {postData:[]}

		    		this.http.post<any>('http://182.18.194.188/nms/authbasic/upstream/'+this.cm_id+'.3', upstream_body).subscribe(data => {
		    			this.loader = false;  
		    			this.upstream = data.stream_data;
		    		});
		    		
			    }
			    else {
			    	$('.toast').toast('show');
			    }

			    this.recentSearchInit();

			});

		}
		else {
			this.loader = false;
			$('.toast').toast('show');
		}

	}

	selectAccountSearch(account_number)
	{
        this.accountSearchForm.patchValue({
        	account_number: account_number
    	});

    	this.accountSearch();
	}

	portRow(key)
	{
		this.port_active = key; 
	}

	resetCM()
	{
		const resetCm_body = {ip: this.cm_info.ip_add, cmts: this.cm_info.cmts };

		this.http.post<any>('http://182.18.194.188/nms/authbasic/reset_cm', resetCm_body).subscribe(data => {
			console.log(data);
		});
	}

	stringToDate(str) {
	    var date = moment(str).format("MMMM DD, YYYY HH:mm:00");
	    var new_date = new Date(date);
	    return new_date;
	}

	cmhistoric_visible = false;
	hsf_value;
	hsf_time_value;
	hef_value;
	hef_time_value;

	getHistoricGraph(type, display, level){
		var cm_id = this.cm_id;
 		this.getLiveGraph('pause');

		if(cm_id){
			if(display == "change"){

				if (type == "live")
				{
					
					this.chart_live = true;
					this.chart_hist = false;
					this.getLiveGraph('run');
				}
				else if (type == "d")
				{
					this.chart_live = false;
					this.chart_hist = true;
					const cpeChannels_body = {cm_id: this.cm_id, type: type, start: "", end:"" };

		    		this.http.post<any>('http://182.18.194.188/nms/authbasic/graph_data', cpeChannels_body).subscribe(data => {
		    			this.cmHistoricGraph(data);  
		    		});
				}
				// var start_time = this.stringToDate($scope.hsf_value + " " + $scope.hsf_time_value),
				// 	end_time = this.stringToDate($scope.hef_value + " " + $scope.hef_time_value);

				// if(level == "no"){ start_time = ""; end_time = ""; }

				// analytics.cmHistoricGraph(cm_id, type, start_time, end_time).then(cmHistoricGraph);
				// $scope.loader = true;

			}

			// else if(display == "cmts_change"){
			// 	// -- EDITED

			// 	$scope.selectedCMTSHistoricOption = "";
			// 	var start_date = $scope.cmts_date_srange.split("/").join('-');
			// 	var end_date = $scope.cmts_date_erange.split("/").join('-');

			// 	var start_time = start_date + " " + $scope.cmts_time_srange,
			// 		end_time = end_date + " " + $scope.cmts_time_erange;

			// 	var postdata = {
			// 		"start_time" : start_time,
			// 		"end_time" : end_time
			// 	}

			// 	type = 0;

			// 	analytics.cmtsUSGraph(cm_id, 'us', type, postdata).then(cmtsUSGraph);
			// }

			// else if(display == "cmts_days"){
			// 	var postdata = [];
			// 	analytics.cmtsUSGraph(cm_id, 'us', type, postdata).then(cmtsUSGraph);
			// }

			// else if(display == "cmts_ds_change"){

			// 	$scope.selectedCMTSHistoricOption = "";
			// 	var start_date = $scope.cmts_ds_date_srange.split("/").join('-');
			// 	var end_date = $scope.cmts_ds_date_erange.split("/").join('-');

			// 	var start_time = start_date + " " + $scope.cmts_ds_time_srange,
			// 		end_time = end_date + " " + $scope.cmts_ds_time_erange;

			// 	var postdata = {
			// 		"start_time" : start_time,
			// 		"end_time" : end_time
			// 	}

			// 	analytics.cmtsDSGraph(cm_id, 'ds', '', postdata).then(cmtsDSGraph);

			// }

			// else if(display == "cmts_ds_days"){
			// 	var postdata = [];
			// 	analytics.cmtsDSGraph(cm_id, 'ds', $scope.selectedCMTSHistoricOption).then(cmtsDSGraph);
			// }

			// else if(display == "cmts_usn_change"){
			// 	$scope.selectedCMTSNHistoricOption = "";

			// 	var start_date = $scope.cmts_usn_date_srange.split("/").join('-');
			// 	var end_date = $scope.cmts_usn_date_erange.split("/").join('-');

			// 	var start_time = start_date + " " + $scope.cmts_usn_time_srange,
			// 		end_time = end_date + " " + $scope.cmts_usn_time_erange;

			// 	var postdata = {
			// 		"start_time" : start_time,
			// 		"end_time" : end_time
			// 	}

			// 	analytics.cmtsNUSGraph(cm_id, '', postdata).then(cmtsNUSGraph);
			// }
			// else if(display == "cmts_n_days"){
			// 	var postdata = [];

			// 	analytics.cmtsNUSGraph(cm_id, $scope.selectedCMTSNHistoricOption).then(cmtsNUSGraph);
			// }

			// else if(display == "cmts_dsn_change"){

			// 	$scope.selectedCMTSNHistoricOption = "";
				
			// 	var start_date = $scope.cmts_dsn_date_srange.split("/").join('-');
			// 	var end_date = $scope.cmts_dsn_date_erange.split("/").join('-');

			// 	var start_time = start_date + " " + $scope.cmts_dsn_time_srange,
			// 		end_time = end_date + " " + $scope.cmts_dsn_time_erange;

			// 	var postdata = {
			// 		"start_time" : start_time,
			// 		"end_time" : end_time
			// 	}

			// 	type = "list";

			// 	analytics.cmtsNDSGraph(cm_id, 'list', '3', postdata).then(cmtsNDSGraph);

			// 	analytics.cmtsNDSGraph(cm_id, 'summary', '3', postdata).then(function(data){
					
			// 		cmtsSummaryMaxAverage(0, data, data.length - 1);
			// 		var valueAxes = [{ "id":"v1","maximum": 580 ,"guides": [{"value": 422.4,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#FF9900", "above": true},{"value": 528,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#FF0000", "above": true}] , "position": "left"}]; 
					
			// 		createGraph("cmts_downstream_summary", data, "mm", valueAxes, $scope.summary_neighbor, "date");
				
			// 	});

			// }

			// else if(display == "cmts_d_days"){


			// 	analytics.cmtsNDSGraph(cm_id, 'list', $scope.selectedCMTSNHistoricOption).then(cmtsNDSGraph);

			// 	analytics.cmtsNDSGraph(cm_id, 'summary', $scope.selectedCMTSNHistoricOption).then(function(data){
			// 		cmtsSummaryMaxAverage(0, data, data.length - 1);
			// 		var threshold_warning  = 422.4;
			// 		var threshold_critical = 528;
			// 		var max_view = 580;

			// 		if(data){
			// 			var checker = ((Object.keys(data[0]).length - 1) /2);

			// 			// console.log("max_view checker :"+ checker);
			// 			if(checker >= 24 && checker <= 31){
			// 				threshold_warning = threshold_warning * 1.5;
			// 				threshold_critical = threshold_critical * 1.5;
			// 				max_view = max_view * 1.5;
			// 			}
			// 			else if(checker > 31){
			// 				threshold_warning = threshold_warning * 2;
			// 				threshold_critical = threshold_critical * 2;
			// 				max_view = max_view * 2;
			// 			}
			// 		}
			// 		var valueAxes = [{ "id":"v1","maximum": max_view ,"guides": [{"value": threshold_warning,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#FF9900", "above": true},{"value": threshold_critical,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#FF0000", "above": true}] , "position": "left"}]; 
			// 		createGraph("cmts_downstream_summary", data, "mm", valueAxes, $scope.summary_neighbor, "date");
			// 	});
			// }

			else if(this.cmhistoric_visible == false){

				this.chart_hist = true;
				this.chart_live = false;

				const cpeChannels_body = {cm_id: this.cm_id, type: type, start: "", end:"" };

	    		this.http.post<any>('http://182.18.194.188/nms/authbasic/graph_data', cpeChannels_body).subscribe(data => {
	    			this.cmHistoricGraph(data);  
	    		});

				// $("#cm_history").removeClass('in out');
				// $scope.cmhistoric_visible = true;
				// $scope.loader = true;
			}
			else{ this.cmhistoric_visible = false; }
		}

	}

	cmHistoricGraph(data){

		if(data.length > 0){
			var average_duration = data.length - 1 , length = data.length - 1, c = data.length - 1, temp_snr = 0, temp_rx = 0, temp_tx = 0,
				max_snr = 0, max_rx = 0, max_tx = 0, total_ping = 0, total_dl = 0, total_ul = 0, max_ping = 0, max_dl = 0, max_ul = 0;

			var prev_snr = 0, prev_rx = 0, prev_tx = 0; var snr_dev = [], rx_dev = [], tx_dev = [], snr_dev_count = 0, rx_dev_count = 0, tx_dev_count = 0;

			if(average_duration > length){ average_duration = length; }

			for(var counter = 0; counter < average_duration ; counter++){
				length--;
				temp_rx += data[counter].rx;
				temp_snr += data[counter].snr;
				temp_tx += data[counter].tx;

				total_ping += parseFloat(data[counter].ping);
				total_dl += data[counter].uhsbDL;
				total_ul += data[counter].uhsbUL;

				if(max_snr < data[counter].snr){ max_snr = data[counter].snr; }
				if(max_rx  < data[counter].rx){ max_rx = data[counter].rx; }
				if(max_tx < data[counter].rx){ max_tx = data[counter].tx; }
				if(max_ping < parseFloat(data[counter].ping)){ max_ping = parseFloat(data[length].ping); }
				if(max_dl < data[counter].uhsbDL){ max_dl = data[counter].uhsbDL; }
				if(max_ul < data[counter].uhsbUL){ max_ul = data[counter].uhsbUL; }

				if(prev_snr != 0 && data[counter].snr != 0){
					var check_snr = (data[counter].snr - prev_snr);
					if(check_snr >= 5 || check_snr <= -5){ 
						snr_dev.push(check_snr);
						snr_dev_count++; 
					}
				}

				if(prev_rx != 0 && data[counter].rx != 0){
					var check_rx= (data[counter].rx - prev_rx);
					if(check_rx >= 5 || check_rx <= -5){ 
						rx_dev.push(check_rx);
						rx_dev_count++; 
					}
				}

				if(prev_tx != 0 && data[counter].tx != 0){
					var check_tx = (data[counter].tx - prev_tx);
					if(check_tx >= 5 || check_tx <= -5){ 
						tx_dev.push(check_tx);
						tx_dev_count++; 
					}
				}

				prev_snr = data[counter].snr;
				prev_rx = data[counter].rx;
				prev_tx = data[counter].tx;
			}

			var rxcurrent = data[c].rx;
			var rxaverage = (temp_rx / average_duration).toFixed(2);
			var rxmaximum = max_rx;
			var txcurrent = data[c].tx;
			var txaverage = (temp_tx / average_duration).toFixed(2);
			var txmaximum = max_tx;
			var snrcurrent = data[c].snr;
			var snraverage = (temp_snr / average_duration).toFixed(2);
			var snrmaximum = max_snr;

			snr_dev_count = (snr_dev_count > 0) ? snr_dev_count : undefined; 
			rx_dev_count = (rx_dev_count > 0) ? rx_dev_count : undefined;
			tx_dev_count = (tx_dev_count > 0) ? tx_dev_count : undefined;

			var snr_max_dev = (snr_dev.length > 0) ? (Math.max.apply(Math, snr_dev)).toFixed(2) : "None";
			var snr_min_dev = (snr_dev.length > 0) ? (Math.min.apply(Math, snr_dev)).toFixed(2) : "None";
			var rx_max_dev = (rx_dev.length > 0) ? (Math.max.apply(Math, rx_dev)).toFixed(2) : "None";
			var rx_min_dev = (rx_dev.length > 0) ? (Math.min.apply(Math, rx_dev)).toFixed(2) : "None";
			var tx_max_dev = (tx_dev.length > 0) ? (Math.max.apply(Math, tx_dev)).toFixed(2) : "None";
			var tx_min_dev = (tx_dev.length > 0) ? (Math.min.apply(Math, tx_dev)).toFixed(2) : "None";

			var ping_current = data[c].ping;
			var ping_average = (total_ping / average_duration).toFixed(2);
			var ping_maximum = max_ping;
			
			var byte_divider = 1000000;

			var dl_current =	this.formatBytes(data[c].uhsbDL * byte_divider);
			var dl_average =	this.formatBytes((total_dl / average_duration) * byte_divider);
			var dl_maximum =	this.formatBytes(max_dl * byte_divider);
			var ul_current =	this.formatBytes(data[c].uhsbUL * byte_divider);
			var ul_average =	this.formatBytes((total_ul / average_duration) * byte_divider);
			var ul_maximum =	this.formatBytes(max_ul * byte_divider);

			var total_in = this.formatBytes(total_dl * byte_divider);
			var total_out = this.formatBytes(total_ul * byte_divider);
	
			this.historicValueAxes({"rf": "rf_chart", "freq" : "freq_chart", "bw" : "bw_chart"} , "historic", data);


			if(data[0]){
				this.hsf_value = moment(data[0].time).format('L');
				this.hsf_time_value = moment(data[0].time).format('HH:mm');
			}

			if(data[data.length - 1]){
				this.hef_value = moment(data[data.length - 1].time).format('L');
				this.hef_time_value = moment(data[data.length - 1].time).format('HH:mm');
			}
		}
		else{
			this.loader = false;
			alert("No data available");
		}

	}

	formatBytes(bytes) {
	   if(bytes == 0) return '0 bps';
	   var k = 1000; // or 1024 for binary
	   var dm = 1 || 3;
	   var sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];
	   var i = Math.floor(Math.log(bytes) / Math.log(k));
	   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	}
	
	formatTraffic(value, formattedValue, valueAxis){
		if(value < 1){ value = (value * 1000) + " kbps"; }
		if(value <= 1000 && value >= 1){ value = value + " mbps"; }
		if(value > 1000){ value = (value / 1000) + " gb"; }
		return value;
	}

	formatBalloonTraffic(graphDataItem, graph){
		var value = graphDataItem.values.value;
		if(value < 1){ value = (value * 1000) + " kbps"; }
		if(value <= 1000 && value >= 1){ value = value + " mbps"; }
		if(value > 1000){ value = (value / 1000) + " gb"; }
		return value;
	}

	rf_live_chart;
	freq_live_chart;
	bw_live_chart;

	historicValueAxes(axes, type, data){
		var rf_valueAxes =   [{ "id":"v1", "bullet" : "round", "position": "left","guides": [{"value": 50,"lineAlpha": 1,"lineThickness" : 2,"lineColor" : "#FF0000", "above": true}], "maximum" : 70}];
		var freq_valueAxes = [{ "id":"v1", "bullet" : "round", "axisColor": "#FF6600", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "left"},
							  { "id":"v2", "bullet" : "round", "axisColor": "#4B0082", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "right"}];
		

		if(!this.cm_info.threshold){ 
			if(this.cm_info.qos != 0 && this.cm_info.qos != null){
				var temp = this.cm_info.qos;
				temp = temp.split("/");
				threshold = temp[1] / 1024; 
			}
			else{
				threshold = this.cm_info.qos;
			}		
		}

		if(this.cm_info.threshold){

			if(this.cm_info.threshold >= 7){
				var threshold = (this.cm_info.threshold / 1024) / 1024;
			}
			else{
				var threshold = this.cm_info.threshold / 1024;
			}

			if(threshold == 0){ 
				if(this.cm_info.qos != 0  && this.cm_info.qos != null){
					var temp = this.cm_info.qos;
					temp = temp.split("/");
					threshold = temp[1] / 1024; 
				}
				else{
					threshold = this.cm_info.qos;
				}	
			}

			var bw_valueAxes = [{ "id":"v1", "maximum": threshold + 2, "labelFunction" : this.formatTraffic, "bullet" : "round", "axisColor": "#00CF00", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "left", "guides": [{"value": threshold,"lineAlpha": 1,"lineThickness" : 2,"lineColor" : "#FF0000", "above": true}]},
							   {"id":"v2", "bullet" : "square", "axisColor": "#FF6600", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "right"},
							   {"id":"v3", "labelFunction" : this.formatTraffic, "bullet" : "square", "axisColor": "#002A97", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "right"}];
		}
		else{
			var bw_valueAxes = [{ "id":"v1", "maximum": threshold + 2, "labelFunction" : this.formatTraffic, "bullet" : "round", "axisColor": "#00CF00", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "left", "guides": [{"value": threshold,"lineAlpha": 1,"lineThickness" : 2,"lineColor" : "#FF0000", "above": true}]},
							  	{ "id":"v2", "bullet" : "square", "axisColor": "#FF6600", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "right"},
							    {"id":"v3", "labelFunction" : this.formatTraffic, "bullet" : "square", "axisColor": "#002A97", "axisThickness": 2, "gridAlpha": 0, "axisAlpha": 1, "position": "right"}];
		}

		var rf_graphs = [{ "valueAxis": "v1", "lineThickness" : 1, "lineColor": "#86831B", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Receive Power", "balloonText": "RX = [[value]]", "valueField": "rx", "fillAlphas": 0 }, 
					  	 { "valueAxis": "v1", "lineThickness" : 1, "lineColor": "#1E71A7", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Signal to Noise", "balloonText": "SNR = [[value]]", "valueField": "snr", "fillAlphas": 0 }, 
					 	 { "valueAxis": "v1", "lineThickness" : 1, "lineColor": "#0F0", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Transmit Power", "balloonText": "TX = [[value]]", "valueField": "tx", "fillAlphas": 0 }];
		
		var freq_graphs = [{ "valueAxis": "v1", "balloonFunction" : this.getModProfile1, "lineThickness" : 2, "lineColor": "#FCD202", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upstream Bandwidth", "balloonText": "usBw = [[value]]", "valueField": "usBw", "fillAlphas": 0 }, 
						 { "valueAxis": "v1", "balloonFunction" : this.getModProfile2, "lineThickness" : 2, "lineColor": "#0ad5f3", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Downstream Bandwidth", "balloonText": "dsBw = [[value]]", "valueField": "dsBw", "fillAlphas": 0 }, 
						 { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#0ad8f3", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upstream Speed", "balloonText": "usSpeed = [[value]]", "valueField": "usSpeed", "fillAlphas": 0 }, 
						 { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#FF0000", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upstream Frequency", "balloonText": "usFreq = [[value]]", "valueField": "usFreq", "fillAlphas": 0 }, 
						 { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#0FEB0E", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Downstream Frequency", "balloonText": "dsFreq = [[value]]", "valueField": "dsFreq", "fillAlphas": 0 },
						 { "valueAxis": "v2", "balloonFunction" : this.getModProfile3, "lineThickness" : 2, "lineColor": "#4B0082", "bullet": "rount", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Modulation", "balloonText": "mod = [[value]]", "valueField": "mod", "fillAlphas": 0 }];
			
		var bw_graphs = [{ "valueAxis": "v2", "lineThickness" : 2, "lineColor": "#FF6600", "hidden": "true", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Ping", "balloonText": "Ping = [[value]] ms", "valueField": "ping", "fillAlphas": 0}, 
						 { "valueAxis": "v1", "balloonFunction" : this.formatBalloonTraffic, "lineThickness" : 2, "lineColor": "#00CF00", "type": "step" , "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Download", "balloonText": "Download = [[value]]", "valueField": "uhsbDL", "fillAlphas": 0.9, "fillColors": "#00CF00"}, 
						 { "valueAxis": "v1", "balloonFunction" : this.formatBalloonTraffic, "lineThickness" : 2, "lineColor": "#002A97", "type": "step" , "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upload", "balloonText": "Upload = [[value]]", "valueField": "uhsbUL", "fillAlphas": 0}];
						 // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#FCD202", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "SKY BB DL", "balloonText": "bbDL = [[value]]", "valueField": "bbDL", "fillAlphas": 0 }, 
						 // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#0000FF", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "SKY BB UL", "balloonText": "bbUL = [[value]]", "valueField": "bbUL", "fillAlphas": 0 }, 
		if(type == "historic"){
			this.createGraph(axes["rf"], data, "mm", rf_valueAxes, rf_graphs, "time");
			this.createGraph(axes["freq"], data, "mm", freq_valueAxes, freq_graphs, "time");
			this.createGraph(axes["bw"], data, "mm", bw_valueAxes, bw_graphs, "time");
		}
		else if(type == "live"){
			this.rf_live_chart = this.createGraph(axes["rf"], [data], "ss", rf_valueAxes, rf_graphs, "time");
			this.freq_live_chart = this.createGraph(axes["freq"], [data], "ss", freq_valueAxes, freq_graphs, "time");
			this.bw_live_chart = this.createGraph(axes["bw"], [data], "ss", bw_valueAxes, bw_graphs, "time");
		}

	}

	getModProfile1(gdi, graph){
		var value = gdi.values.value;
		// var mod = getModProfile("us", gdi.dataContext.usBw, gdi.dataContext.usFreq, gdi.dataContext.usModProfile);
		return "US Bandwidth = " + gdi.dataContext.usBw + " / us_port = " + gdi.dataContext.us_port;
	}

	getModProfile2(gdi, graph){
		var value = gdi.values.value;
		// var mod = getModProfile("ds", gdi.dataContext.dsBw, gdi.dataContext.dsFreq, gdi.dataContext.dsModulation);
		return "DS Mod = " + gdi.dataContext.dsModulation + " / ds_port = " + gdi.dataContext.ds_port;
	}

	getModProfile3(gdi, graph){
		var value = gdi.values.value;
		// var mod = getModProfile("ds", gdi.dataContext.dsBw, gdi.dataContext.dsFreq, gdi.dataContext.dsModulation);
		return "Modulation " + gdi.dataContext.usModProfile;
	}

	// Graph Creation Function
	activecmts = {};
	charts = {};
	byte_divider = 1000000;
	live_state;

	createGraph(chart, data, period, valueAxes, graphs, catField){

		
		this.charts[chart] =  AmCharts.makeChart(chart, 
			jquery.extend(true, {}, {
			    "type": "serial",
			    "dataDateFormat": "YYYY-MM-DD HH:NN:SS",
			    "legend": {
			    	"enabled" : true,
			    	"align": "center",
			        "useGraphSettings": true,
			    },
			    "guides": [],
			    "trendLines": [],
			    "chartScrollbar": {"resizeEnabled":true},
			    "dataProvider": data,
			    "areasSettings": { autoZoom: true },
			    "valueAxes": valueAxes,
			    "graphs": graphs,
				"chartCursor": {
				    "cursorPosition": "mouse",
				    "categoryBalloonDateFormat": "MMM DD YYYY  JJ:NN:SS"
				},
			    "categoryField": catField,
			    "categoryAxis": {
			        "parseDates": true,
			        "axisColor": "#DADADA",
			        "minPeriod": period,
			    },
			    "export": {
			    	"enabled": true,
			        "libs": {
				      "path": "http://www.amcharts.com/lib/3/plugins/export/libs/"
				    }
			    },
			    "listeners": [ {
				    "event": "init",
				    "method": function(e){  

				    	e.chart.chartDiv.addEventListener("dblclick", function(){
							if ( e.chart.lastCursorPosition !== undefined ) {
								// get date of the last known cursor position
								var date = e.chart.dataProvider[ e.chart.lastCursorPosition ][ e.chart.categoryField ];
								var guide_data = e.chart.dataProvider[e.chart.lastCursorPosition];
								var check = 0;

								if(chart == 'bw_chart'){
									var guide_uhsbDL = this.formatTraffic(guide_data.uhsbDL, '','');
									var guide_uhsbUL = this.formatTraffic(guide_data.uhsbUL, '','');
									var guide_ping = guide_data.ping;
									var text = "DL = "+guide_uhsbDL+" UL = "+guide_uhsbUL+" ping = "+guide_ping;
									check = 1;
								}
								else if(chart == "rf_chart"){
									var guide_snr = guide_data.snr;
									var guide_tx = guide_data.tx;
									var guide_rx = guide_data.rx;
									var text = "TX ="+guide_tx+" RX = "+guide_rx+" SNR ="+guide_snr;
									check = 1;
								}
								else if(chart == "freq_chart"){
									var guide_mod = guide_data.usModProfile;
									var text = "Modulation = "+guide_mod;
									check = 1;
								}


								if(check == 1){
									// create a new guide
									var guide = new AmCharts.Guide();
									guide.date = date;
									guide.lineAlpha = 1;
									guide.lineColor = "#c44";
									guide.label = text;
									guide.balloonText = "testing",
									guide.above = true;
									guide.position = "top";
									guide.inside = true;
									guide.labelRotation = 90;
									e.chart.categoryAxis.addGuide( guide );
									e.chart.validateData();
								}
							}
				    	})
				    }
				}, {
					"event": "changed",
					"method": function( e ) {
						/**
						* Log cursor's last known position
						*/
						e.chart.lastCursorPosition = e.index;
					}
				}],
			    "dataSets": [{
				    "dataLoader": {
				        "showCurtain": true,
				        "async": true,
				        "reverse": true,
			      	}
		      	}]
			})
		);
		
		var len = 0;
		for( var key in this.charts ) {
	        if( this.charts.hasOwnProperty(key) ) {
	            len++;
	        }
	    }

		for(var i = 0; i <= len; i++){
			this.activecmts["" + i] = i + ".traffic";
		}



		this.charts[chart].addListener("zoomed", handleZoom);
	
		function handleZoom(event){

			if(chart == "rf_chart" || chart == "bw_chart"){
				this.hsf_value = moment(event.startDate).format('L'); 
				this.hsf_time_value = moment(event.startDate).format('HH:mm');
				this.hef_value = moment(event.endDate).format('L');
				this.hef_time_value = moment(event.endDate).format('HH:mm');
			}

			if(chart == "cmts_dschart"){
				this.cmts_ds_date_srange = moment(event.startDate).format('L'); 
				this.cmts_ds_time_srange = moment(event.startDate).format('HH:mm');
				this.cmts_ds_date_erange = moment(event.endDate).format('L');
				this.cmts_ds_time_erange = moment(event.endDate).format('HH:mm');
			}

			if(chart == "cmts_uschart_count" || chart == "cmts_uschart_snr" || chart == "cmts_uschart_fec" || chart == "cmts_uschart_traffic"){
				this.cmts_date_srange = moment(event.startDate).format('L'); 
				this.cmts_time_srange = moment(event.startDate).format('HH:mm');
				this.cmts_date_erange = moment(event.endDate).format('L');
				this.cmts_time_erange = moment(event.endtDate).format('HH:mm');
			}

			if(chart.match(/neighbor_chart.*/) || chart.match(/neighbor_tchart.*/)){
				this.cs_date_value = moment(event.startDate).format('L'); 
				this.cs_time_value = moment(event.startDate).format('HH:mm');
				this.ce_date_value = moment(event.endDate).format('L');
				this.ce_time_value = moment(event.endDate).format('HH:mm');
			}

			if(chart.match(/usn_chart.*/)){
				this.cmts_usn_date_srange = moment(event.startDate).format('L');
				this.cmts_usn_time_srange = moment(event.startDate).format('HH:mm');
				this.cmts_usn_date_erange = moment(event.endDate).format('L');
				this.cmts_usn_time_erange = moment(event.endDate).format('HH:mm');
			}

			if(chart.match(/dsn_chart.*/) || chart == "cmts_downstream_summary"){
				this.cmts_dsn_date_srange = moment(event.startDate).format('L');
				this.cmts_dsn_time_srange = moment(event.startDate).format('HH:mm');
				this.cmts_dsn_date_erange = moment(event.endDate).format('L');
				this.cmts_dsn_time_erange = moment(event.endDate).format('HH:mm');
			}

			if(chart == "cmts_uschart_count"){ this.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'count', "", event.startDate, event.endDate); }
			else if(chart == "cmts_uschart_snr"){ this.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'snr', "", event.startDate, event.endDate); }	
			else if(chart == "cmts_uschart_fec"){ this.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'fec', "", event.startDate, event.endDate); }
			else if(chart == "cmts_uschart_traffic"){ this.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'traffic', "", event.startDate, event.endDate); }
			else if(chart == "rf_chart"){ cableMaxAverage(event.startIndex, event.endIndex, data, 'rf', event.startDate, event.endDate) }
			else if(chart == "freq_chart"){ }//adjustableBandwidthChart(event.startIndex, event.endIndex, data, 'bw', event.startDate, event.endDate) }
			else if(chart == "bw_chart"){ adjustableBandwidthChart(event.startIndex, event.endIndex, data, 'bw', event.startDate, event.endDate) }
			else if(chart == "rf_live") { cableMaxAverage(event.startIndex, event.endIndex, event.chart.chartData, 'live', event.startDate, event.endDate) }
			else if(chart == "freq_live"){ }
			else if(chart.match(/neighbor_chart.*/)){ compareNeighborsChart(event.startIndex, event.endIndex, data, chart, event.startDate, event.endDate); }
			else if(chart.match(/neighbor_tchart.*/)){ compareNeighborsTrafficChart(event.startIndex, event.endIndex, data, chart, event.startDate, event.endDate); }
			else if(chart == "bw_live") { adjustableBandwidthChart(event.startIndex, event.endIndex, event.chart.chartData, 'live', event.startDate, event.endDate) }
			else if(chart == "cmts_dschart"){ this.cmtsDownMaxAverage(event.startIndex, event.endIndex, data, 'downstream'); }
			else if (chart.match(/dsn_chart.*/)) { this.cmtsDownMaxAverage(event.startIndex, event.endIndex, data, 'ndownstream', this.test); }
			else if(chart == "cmts_downstream_summary"){ this.cmtsSummaryMaxAverage(event.startIndex, data, event.endIndex) }
			else{ this.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'nupstream', this.test, event.startDate, event.endDate); }
			
		}


		function cmtsDownMaxAverage(start, end, data, stream,key){
			var temp = 0, max = 0, length = end - start;

			for(i = start; i <= end;i++){
				temp += parseFloat(data[i].traffic);
				if(max < parseFloat(data[i].traffic)) { max = data[i].traffic }
			}

			if(stream == "downstream"){
				this.$apply(function(){ 
					this.traoutaverage = (temp / length).toFixed(2);
					this.traoutmaximum = (max).toFixed(2);
				})
			}else if(stream == "ndownstream"){
				var new_max = this.getMaxDS(data);

				this.ds_ports.forEach(function(value, keyval) {
			       	if(value.name == key){
			       		this.$apply(function(){
			       			value.traoutaverage = (temp / length).toFixed(2);
							value.traoutmaximum = (max).toFixed(2) + " (" + (new_max).toFixed(2) + ")";
			       		});
			       	}
				});
			}
		}

		function cableMaxAverage(start, end, data, stream, s_date, e_date){
			var total_rx = 0, total_tx = 0, total_snr = 0, max_rx = 0, max_tx = 0, max_snr = 0 , length = end - start;
			var prev_snr = 0, prev_rx = 0, prev_tx = 0, snr_dev = [], rx_dev = [], tx_dev = [], snr_dev_count = 0, rx_dev_count = 0, tx_dev_count = 0;

			if(stream == "rf"){
				for(var i=start; i <= end;i++){
					total_rx += parseFloat(data[i].rx);
					total_tx += parseFloat(data[i].tx);
					total_snr += parseFloat(data[i].snr);

					if(max_rx < parseFloat(data[i].rx)){max_rx = data[i].rx};
					if(max_tx < parseFloat(data[i].tx)){max_tx = data[i].tx};
					if(max_snr < parseFloat(data[i].snr)){max_snr = data[i].snr};

					if(prev_snr != 0 && data[i].snr != 0){
						var check_snr = (data[i].snr - prev_snr);
						if(check_snr >= 5 || check_snr <= -5){ 
							snr_dev.push(check_snr);
							snr_dev_count++; 
						}
					}

					if(prev_rx != 0 && data[i].rx != 0){
						var check_rx= (data[i].rx - prev_rx);
						if(check_rx >= 5 || check_rx <= -5){ 
							rx_dev.push(check_rx);
							rx_dev_count++; 
						}
					}

					if(prev_tx != 0 && data[i].tx != 0){
						var check_tx = (data[i].tx - prev_tx);
						if(check_tx >= 5 || check_tx <= -5){ 
							tx_dev.push(check_tx);
							tx_dev_count++; 
						}
					}

					prev_snr = data[i].snr;
					prev_rx = data[i].rx;
					prev_tx = data[i].tx;
				}

				this.$apply(function(){
					this.rxaverage = (total_rx / length).toFixed(2);
					this.rxmaximum = max_rx;
					this.txaverage = (total_tx / length).toFixed(2);
					this.txmaximum = max_tx;
					this.snraverage = (total_snr / length).toFixed(2); 
					this.snrmaximum = max_snr;

					this.snr_dev_count = (snr_dev_count > 0) ? snr_dev_count : "None"; 
					this.rx_dev_count = (rx_dev_count > 0) ? rx_dev_count : "None";
					this.tx_dev_count = (tx_dev_count > 0) ? tx_dev_count : "None";
					this.snr_max_dev = (snr_dev.length > 0) ? (Math.max.apply(Math, snr_dev)).toFixed(2) : "None";
					this.snr_min_dev = (snr_dev.length > 0) ? (Math.min.apply(Math, snr_dev)).toFixed(2) : "None";
					this.rx_max_dev = (rx_dev.length > 0) ? (Math.max.apply(Math, rx_dev)).toFixed(2) : "None";
					this.rx_min_dev = (rx_dev.length > 0) ? (Math.min.apply(Math, rx_dev)).toFixed(2) : "None";
					this.tx_max_dev = (tx_dev.length > 0) ? (Math.max.apply(Math, tx_dev)).toFixed(2) : "None";
					this.tx_min_dev = (tx_dev.length > 0) ? (Math.min.apply(Math, tx_dev)).toFixed(2) : "None";
				});

				this.charts["bw_chart"].zoomToDates(s_date, e_date);
			}
			else if(stream == "live"){

				for(var i = start; i <= end; i++){
					total_rx += parseFloat(data[i].dataContext.rx);
					total_tx += parseFloat(data[i].dataContext.tx);
					total_snr += parseFloat(data[i].dataContext.snr);

					if(max_rx < parseFloat(data[i].dataContext.rx)){ max_rx = parseFloat(data[i].dataContext.rx); }
					if(max_tx < parseFloat(data[i].dataContext.tx)){ max_tx = parseFloat(data[i].dataContext.tx); }
					if(max_snr < parseFloat(data[i].dataContext.snr)){ max_snr = parseFloat(data[i].dataContext.snr); }
				}

				// if(this.live_state == "pause"){ this.$apply(function(){});}

				// this.live_rxcurrent = data[length].dataContext.rx;
				// this.live_rxaverage = (total_rx / length).toFixed(2);
				// this.live_rxmaximum = max_rx;
				// this.live_txcurrent = data[length].dataContext.tx;
				// this.live_txaverage = (total_tx / length).toFixed(2);
				// this.live_txmaximum = max_tx;
				// this.live_snrcurrent = data[length].dataContext.snr;
				// this.live_snraverage = (total_snr / length).toFixed(2);
				// this.live_snrmaximum = max_snr;
			}
		}

		function compareNeighborsChart(start, end, data, key, s_date, e_date){
			var total_rx = 0, total_tx = 0, total_snr = 0, max_rx = 0, max_tx = 0, max_snr = 0 , length = end - start,
				key = key.replace("_neighbor_chart", "");

			var prev_snr = 0, prev_rx = 0, prev_tx = 0; var snr_dev = [], rx_dev = [], tx_dev = [], snr_dev_count = 0, rx_dev_count = 0, tx_dev_count = 0;

			for(var i=start; i <= end;i++){
				total_rx += parseFloat(data[i].rx);
				total_tx += parseFloat(data[i].tx);
				total_snr += parseFloat(data[i].snr);

				if(max_rx < parseFloat(data[i].rx)){max_rx = data[i].rx};
				if(max_tx < parseFloat(data[i].tx)){max_tx = data[i].tx};
				if(max_snr < parseFloat(data[i].snr)){max_snr = data[i].snr};


				if(prev_snr != 0 && data[i].snr != 0){
					var check_snr = (data[i].snr - prev_snr);
					if(check_snr >= 5 || check_snr <= -5){ 
						snr_dev.push(check_snr);
						snr_dev_count++; 
					}
				}

				if(prev_rx != 0 && data[i].rx != 0){
					var check_rx= (data[i].rx - prev_rx);
					if(check_rx >= 5 || check_rx <= -5){ 
						rx_dev.push(check_rx);
						rx_dev_count++; 
					}
				}

				if(prev_tx != 0 && data[i].tx != 0){
					var check_tx = (data[i].tx - prev_tx);
					if(check_tx >= 5 || check_tx <= -5){ 
						tx_dev.push(check_tx);
						tx_dev_count++; 
					}
				}

				prev_snr = data[i].snr;
				prev_rx = data[i].rx;
				prev_tx = data[i].tx;
			}

		this.$apply(function(){
			this.n_rxaverage[key] = (total_rx / length).toFixed(2);
			this.n_rxmaximum[key] = max_rx;
			this.n_txaverage[key] = (total_tx / length).toFixed(2);
			this.n_txmaximum[key] = max_tx;
			this.n_snraverage[key] = (total_snr / length).toFixed(2);
			this.n_snrmaximum[key] = max_snr;

			this.n_snr_dev_count[key] = (this.snr_dev_count > 0) ? this.snr_dev_count : "None"; 
			this.n_rx_dev_count[key] = (this.rx_dev_count > 0) ? this.rx_dev_count : "None";
			this.n_tx_dev_count[key] = (this.tx_dev_count > 0) ? this.tx_dev_count : "None";
			this.n_snr_max_dev[key] = (this.snr_dev.length > 0) ? (Math.max.apply(Math, this.snr_dev)).toFixed(2) : "None";
			this.n_snr_min_dev[key] = (this.snr_dev.length > 0) ? (Math.min.apply(Math, this.snr_dev)).toFixed(2) : "None";
			this.n_rx_max_dev[key] = (this.rx_dev.length > 0) ? (Math.max.apply(Math, this.rx_dev)).toFixed(2) : "None";
			this.n_rx_min_dev[key] = (this.rx_dev.length > 0) ? (Math.min.apply(Math, this.rx_dev)).toFixed(2) : "None";
			this.n_tx_max_dev[key] = (this.tx_dev.length > 0) ? (Math.max.apply(Math, this.tx_dev)).toFixed(2) : "None";
			this.n_tx_min_dev[key] = (this.tx_dev.length > 0) ? (Math.min.apply(Math, this.tx_dev)).toFixed(2) : "None";
			});

			this.compared_neighbors.forEach(function(value, keyval) {
				this.charts[keyval + "_neighbor_chart"].zoomToDates(s_date, e_date);
			});

		}

		function compareNeighborsTrafficChart(start, end, data, key, s_date, e_date){
			var total_ping = 0, total_dl = 0, total_ul = 0, max_ping = 0, max_dl = 0, max_ul = 0 , length = end - start,
				key = key.replace("_neighbor_tchart", "");

			for(var i = start; i <= end; i++){
				total_ping += parseFloat(data[i].ping);
				total_dl += parseFloat(data[i].uhsbDL);
				total_ul += parseFloat(data[i].uhsbUL);

				if(max_ping < parseFloat(data[i].ping)){ max_ping = parseFloat(data[i].ping); }
				if(max_dl < parseFloat(data[i].uhsbDL)){ max_dl = parseFloat(data[i].uhsbDL); }
				if(max_ul < parseFloat(data[i].uhsbUL)){ max_ul = parseFloat(data[i].uhsbUL); }
			}

			this.$apply(function(){

				this.n_ping_average[key] =  (total_ping / length).toFixed(2);
				this.n_ping_maximum[key] = max_ping;
				this.n_dl_average[key] =	this.formatBytes((total_dl / length) * this.byte_divider);
				this.n_dl_maximum[key] =	this.formatBytes(max_dl * this.byte_divider);
				this.n_ul_average[key] =	this.formatBytes((total_ul / length) * this.byte_divider);
				this.n_ul_maximum[key] =	this.formatBytes(max_ul * this.byte_divider);

				this.n_total_in[key] = this.formatBytes(total_dl * this.byte_divider);
				this.n_total_out[key] = this.formatBytes(total_ul * this.byte_divider);

			});

			this.compared_traffic_neighbors.forEach(function(value, keyval) {
				this.charts[keyval + "_neighbor_tchart"].zoomToDates(s_date, e_date);
			});

		}

		function adjustableBandwidthChart(start, end, data, stream, s_date, e_date){
			var total_ping = 0, total_dl = 0, total_ul = 0, max_ping = 0, max_dl = 0, max_ul = 0 , length = end - start;

			if(stream == "bw"){
				length = 0;

				for(var i = start; i <= end; i++){
					total_ping += parseFloat(data[i].ping);
					total_dl += parseFloat(data[i].uhsbDL);
					total_ul += parseFloat(data[i].uhsbUL);

					if(max_ping < parseFloat(data[i].ping)){ max_ping = parseFloat(data[i].ping); }
					if(max_dl < parseFloat(data[i].uhsbDL)){ max_dl = parseFloat(data[i].uhsbDL); }
					if(max_ul < parseFloat(data[i].uhsbUL)){ max_ul = parseFloat(data[i].uhsbUL); }
					length++;
				}

				this.$apply(function(){

					this.ping_average =  (total_ping / length).toFixed(2);
					this.ping_maximum = max_ping;
					this.dl_average =	this.formatBytes((total_dl / length) * this.byte_divider);
					this.dl_maximum =	this.formatBytes(max_dl * this.byte_divider);
					this.ul_average =	this.formatBytes((total_ul / length) * this.byte_divider);
					this.ul_maximum =	this.formatBytes(max_ul * this.byte_divider);

					this.total_in = this.formatBytes(total_dl * this.byte_divider);
					this.total_out = this.formatBytes(total_ul * this.byte_divider);

				});

				this.charts["rf_chart"].zoomToDates(s_date, e_date);
			}
			else if(stream == "live"){

				for(var i = start; i <= end; i++){
					total_ping += parseFloat(data[i].dataContext.ping);
					total_dl += parseFloat(data[i].dataContext.uhsbDL);
					total_ul += parseFloat(data[i].dataContext.uhsbUL);

					if(max_ping < parseFloat(data[i].dataContext.ping)){ max_ping = parseFloat(data[i].dataContext.ping); }
					if(max_dl < parseFloat(data[i].dataContext.uhsbDL)){ max_dl = parseFloat(data[i].dataContext.uhsbDL); }
					if(max_ul < parseFloat(data[i].dataContext.uhsbUL)){ max_ul = parseFloat(data[i].dataContext.uhsbUL); }
				}

				// if(this.live_state == "pause"){ this.$apply(function(){});}

				// this.live_ping_current = data[length].dataContext.ping;
				// this.live_ping_average = (total_ping / length).toFixed(2);
				// this.live_ping_maximum = max_ping;
				// this.live_dl_current = this.formatBytes(data[length].dataContext.uhsbDL * this.byte_divider);
				// this.live_dl_average = this.formatBytes((total_dl / length) * this.byte_divider);
				// this.live_dl_maximum = this.formatBytes(max_dl * this.byte_divider);
				// this.live_ul_current = this.formatBytes(data[length].dataContext.uhsbUL * this.byte_divider);
				// this.live_ul_average = this.formatBytes((total_ul / length) * this.byte_divider);
				// this.live_ul_maximum = this.formatBytes(max_ul * this.byte_divider);

				// this.lti = this.formatBytes(total_dl * this.byte_divider);
				// this.lto = this.formatBytes(total_ul * this.byte_divider);

			}
		}


 
		this.loader = false;

		return this.charts[chart];
	}

	cmts_date_srange;
	cmts_time_srange;
	cmts_date_erange;
	cmts_time_erange;
	cmts_ds_date_srange;
	cmts_ds_time_srange;
	cmts_ds_date_erange;
	cmts_ds_time_erange;
				
	cmts_usn_date_srange;
	cmts_usn_time_srange;
	cmts_usn_date_erange;
	cmts_usn_time_erange;
	cmts_dsn_date_srange;
	cmts_dsn_time_srange;
	cmts_dsn_date_erange;
	cmts_dsn_time_erange;
	ds_ports;
	us_ports;

	cs_date_value;
	cs_time_value;
	ce_date_Value;
	ce_time_value;

	compared_neighbors;
	compared_traffic_neighbors;

	gs_date_value;
	gs_time_value;
	ge_date_value;
	ge_time_value;
 

	zoomToDates(type){
		
		if(type == 'cm'){
			var start_time = this.stringToDate(this.hsf_value + " " + this.hsf_time_value),
				end_time = this.stringToDate(this.hef_value + " " + this.hef_time_value);

			this.charts["rf_chart"].zoomToDates(start_time, end_time);
			this.charts["freq_chart"].zoomToDates(start_time, end_time);
			this.charts["bw_chart"].zoomToDates(start_time, end_time);
		}
		else if(type == "cmts"){
			var start_time = this.stringToDate(this.cmts_date_srange + " " + this.cmts_time_srange),
				end_time = this.stringToDate(this.cmts_date_erange + " " + this.cmts_time_erange);

			this.charts["cmts_uschart_count"].zoomToDates(start_time, end_time);
			this.charts["cmts_uschart_snr"].zoomToDates(start_time, end_time);
			this.charts["cmts_uschart_fec"].zoomToDates(start_time, end_time);
			this.charts["cmts_uschart_traffic"].zoomToDates(start_time, end_time);
		}
		else if(type == "cmts_ds"){
			var start_time = this.stringToDate(this.cmts_ds_date_srange + " " + this.cmts_ds_time_srange),
				end_time = this.stringToDate(this.cmts_ds_date_erange + " " + this.cmts_ds_time_erange);
			
			this.charts["cmts_dschart"].zoomToDates(start_time, end_time);
		}
		else if(type == "cmts_us_neighbors"){


			var start_time = this.stringToDate(this.cmts_usn_date_srange + " " + this.cmts_usn_time_srange),
				end_time = this.stringToDate(this.cmts_usn_date_erange + " " + this.cmts_usn_time_erange);
			
			this.us_ports.forEach(function(value, keyval) {
				this.charts["usn_chart" + keyval].zoomToDates(start_time, end_time);
			});
		}
		else if(type == "cmts_ds_neighbors"){
			var start_time = this.stringToDate(this.cmts_dsn_date_srange + " " + this.cmts_dsn_time_srange),
				end_time = this.stringToDate(this.cmts_dsn_date_erange + " " + this.cmts_dsn_time_erange);
			
			this.ds_ports.forEach(function(value, keyval) {
				this.charts["dsn_chart" + keyval].zoomToDates(start_time, end_time);
			});

			this.charts["cmts_downstream_summary"].zoomToDates(start_time, end_time);
		}
		else if(type == "neighbors"){
			var start_time = this.stringToDate(this.cs_date_value + " " + this.cs_time_value),
				end_time = this.stringToDate(this.ce_date_Value + " " + this.ce_time_value);

			if(this.compared_neighbors){
				this.compared_neighbors.forEach(function(value, keyval) {
					this.charts[keyval + "_neighbor_chart"].zoomToDates(start_time, end_time);
				});
			}
			else if(this.compared_traffic_neighbors){
				this.compared_traffic_neighbors.forEach(function(value, keyval) {
					this.charts[keyval + "_neighbor_tchart"].zoomToDates(start_time, end_time);
				});
			}
		}
		else if(type == "all"){
			if(this.gs_date_value && this.gs_time_value && this.ge_date_value && this.ge_time_value){
				var start_time = this.stringToDate(this.gs_date_value + " " + this.gs_time_value),
					end_time = this.stringToDate(this.ge_date_value + " " + this.ge_time_value);
				
				if(this.charts["rf_chart"]){ this.charts["rf_chart"].zoomToDates(start_time, end_time); }
				if(this.charts["bw_chart"]){ this.charts["bw_chart"].zoomToDates(start_time, end_time); }
				if(this.charts["cmts_uschart_count"]){ this.charts["cmts_uschart_count"].zoomToDates(start_time, end_time); }
				if(this.charts["cmts_uschart_snr"]){ this.charts["cmts_uschart_snr"].zoomToDates(start_time, end_time); }
				if(this.charts["cmts_uschart_fec"]){ this.charts["cmts_uschart_fec"].zoomToDates(start_time, end_time); }
				if(this.charts["cmts_uschart_traffic"]){ this.charts["cmts_uschart_traffic"].zoomToDates(start_time, end_time); }
				if(this.charts["cmts_dschart"]){ this.charts["cmts_dschart"].zoomToDates(start_time, end_time); }
				if(this.charts["cmts_downstream_summary"]){ this.charts["cmts_downstream_summary"].zoomToDates(start_time, end_time); }


				if(this.us_ports){
					this.us_ports.forEach(function(value, keyval) {
						this.charts["usn_chart" + keyval].zoomToDates(start_time, end_time);
					});
				}

				if(this.ds_ports){
					this.ds_ports.forEach(function(value, keyval) {
						this.charts["dsn_chart" + keyval].zoomToDates(start_time, end_time);
					});
				}

				if(this.compared_neighbors){
					this.compared_neighbors.forEach(function(value, keyval) {
						this.charts[keyval + "_neighbor_chart"].zoomToDates(start_time, end_time);
					});
				}
				
				if(this.compared_traffic_neighbors){
					this.compared_traffic_neighbors.forEach(function(value, keyval) {
						this.charts[keyval + "_neighbor_tchart"].zoomToDates(start_time, end_time);
					});
				}

				alert("Date range applied!");
				$("#global_date_sync").modal("toggle");
			}
			else{
				alert("Please make sure you have selected date and time");
			}
		}
	}

	live_interval;
	cmlive_visible = false;
	bbdl;
	bbul;
	uhsbdl;
	uhsbul;
	interval;

	getLiveGraph(type){

		var cm_id = this.cm_id;

		this.live_state = type;

		if(type == "pause"){
 
			clearInterval(this.interval);
 
		}
		else if(type == "start"){
			this.live_state = "run";
			this.runLiveGraph();
		}
		else if(type == "run") {
			// $interval.cancel(this.live_interval);	
			if(this.cm_id){
				if(this.chart_live == true){
					this.bbdl = 0;
					this.bbul = 0;
					this.uhsbdl = 0;
					this.uhsbul = 0;
					
					this.runLiveGraph();

					jquery("#cm_live").removeClass('in out');
					// this.chart_live = true;
				}
				else{
					this.live_state = "";
					// this.chart_live = false;
					this.rf_live_chart = [];
					this.freq_live_chart = [];
					this.bw_live_chart = [];
					this.rf_live_chart = null;
					this.freq_live_chart = null;
					this.bw_live_chart = null;
				}
			}
		}

	}

	runLiveGraph(){
		var live_counter = 0;
		this.rf_live_chart = false;
		this.interval = null;
		this.interval = setInterval(() => {
			const body = {"cm_id": this.cm_id, "bbdl" : this.bbdl, "bbul" : this.bbul, "uhsbdl" : this.uhsbdl, "uhsbul" : this.uhsbul}; 
    		this.http.post<any>('http://182.18.194.188/nms/authbasic/live_graph', body).subscribe(data => {
    			this.cmLiveGraph(data);
    		});
		}, 6000);
	}

	cmLiveGraph(data){
		this.bbdl = data.last_bbDL;
		this.bbul = data.last_bbUL;
		this.uhsbdl = data.last_uhsbDL;
		this.uhsbul = data.last_uhsbUL;
		
		if(this.rf_live_chart){
			// console.log(1);
			if(!jquery("#rf_live_historic").is(":hidden")){ 
				this.rf_live_chart.dataProvider.push(data); 
				this.rf_live_chart.validateData();
			}

			if(!jquery("#mod_live_historic").is(":hidden")){ 
				this.freq_live_chart.dataProvider.push(data);
				this.freq_live_chart.validateData();
			}

			if(!jquery("#bw_live_historic").is(":hidden")){ 
				this.bw_live_chart.dataProvider.push(data);
				this.bw_live_chart.validateData();
			}
		}
		else{
			// console.log(2);
			this.historicValueAxes({"rf": "rf_live", "freq" : "freq_live", "bw" : "bw_live"} , "live", data);
		}
	}
}
