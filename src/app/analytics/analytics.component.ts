import { Component, OnInit, Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '../_services';
import { AnalyticsService } from '../_services/analytics.service';
import { User } from '../_models';
import * as moment from 'moment';
import * as jquery from 'jquery';
import { ActivatedRoute } from '@angular/router';
// import { EMPTY, Observable, throwError } from 'rxjs';
// import { map, catchError, retry, shareReplay } from 'rxjs/operators';

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
	error;
	result;
	cpeChannels_result;
	cm_info_result;
	cm_info;
	cm_id;
	cm_parameters;
	cpeChannels;

	//drop plant core status indicator
	drop_status = "";
	plant_status = "";
	core_status = "";

	// account
	recent_searches;
	pinned_search_length = 0;
	pinned_searches = [];

	// plant
	upstream;
	upstream_raw;
	port_array = [];

	// core
	summaryupstream;
	port_sample;
	downstream;
	downstream_summary;
	downstream_raw;
	upstream_summary;
	
	// others
	port_active = 0;
	portds_active = 0;
	status_info;
	incident_nhm_length = 0;
	incident_nhm = [];
	incident_nar_length = 0;
	incident_nar = [];
	incident_ntr;
	open_fault_length = 0;
	open_fault = [];
	previous_fault_length = 0;
	previous_fault = [];
	fnpr_ctr;
	ndc_ctr;

	// options
 
	spanSelectForm = new FormGroup({
		spanSelect: new FormControl(''),
  	});

	span_options_drop = [
			{val:"d", text_val: "3 Days"}, 
			{val:"live", text_val: "Live"}, 
			{val:"1", text_val: "24 Hours"}, 
			{val:"w", text_val: "1 Week"},
			{val:"m", text_val: "1 Month"},
		];	

	span_options_plant = [
			{val:"d", text_val: "3 Days"}, 
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

	constructor(
		private http: HttpClient, 
		private authenticationService: AuthenticationService, 
		private activatedRoute: ActivatedRoute,
		private analyticsService: AnalyticsService,
		) { 
		this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
		this.currentUserInfo = this.authenticationService.currentUser.source['_value'];
	}

	init1;
	init2;
  
	ngOnInit() {

		this.recentSearchInit();
		this.pinnedSearchInit();

		/// popover for tx rx snr fec
		$('[data-toggle="popover"]').popover();

		/// toast for account not found on search
		$('.toast').toast({animation: true, delay: 3000});

	}

	accountSearchForm = new FormGroup({
		account_number: new FormControl(''),
  	});

	recentSearchInit() {

		return this.analyticsService.initRecentSearch()
		.subscribe((data : any)  => {
			if ( data.length > 0 ) 
			{
				this.recent_searches = data;
			}
			this.init1 = true;
			this.oninitLoader();
		});

	}

	pinnedSearchInit() {

		return this.analyticsService.initPinnedSearch()
		.subscribe((data : any)  => {
	    	if ( data.raw != undefined ) 
	    	{
	    		this.pinned_search_length = data.raw.length;
	    		this.pinned_searches = data.raw;
	    	}
			this.init2 = true;
			this.oninitLoader();
		});

	}

	

	account_search_request1;
	account_search_request2;
	account_search_request3; 
	account_search_request4;
	account_search_request5;
	account_search_request6;

	accountSearch() {
		this.loader = true;
		this.account_search_request1 = false;
		this.account_search_request2 = false;
		this.account_search_request3 = false; 
		this.account_search_request4 = false;
		this.account_search_request5 = false;
		this.account_search_request6 = false;
		this.drop_status = "";
		this.plant_status = "";
		this.core_status = "";

		if ( this.accountSearchForm.value.account_number.trim() != "" && this.accountSearchForm.value.account_number.trim().length == 9 ) 
		{
			
			const body = {acct_no: this.accountSearchForm.value.account_number, type: true}; 

			return this.analyticsService.accountSearch(body)
			.subscribe((data : any)  => {

			    this.result = data;

			    if (this.result.length == 1) 
			    {
			    	this.loader = true;
			    	this.cm_id = this.result[0].cm_id;
			    	$('#acctinfo-tab').click();

			    	// account_search_request1 | cm info
			    	const cm_body = {cm_id: this.cm_id, user_id: this.currentUserInfo.id, duration: 0, type: true};
			    	this.dropCmInfo(cm_body);

			    	// account_search_request2 | cpe channels
		    		const cpeChannels_body = {cm_id: this.cm_id};
		    		this.dropCpeChannels(cpeChannels_body);

		    		// account_search_request3 | upstream
		    		const upstream_body = {postData:[]};
		    		this.plantUpstream(this.cm_id, 3, upstream_body)

		    		// account_search_request4 | summaryupstream
		    		this.plantSummaryUpstream(this.cm_id);
 		
		    		// account_search_request5 | core downstream data
		    		const downstream_body = {postData:[]};
		    		this.coreDownstream(this.cm_id, 3, downstream_body);

		    		// account_search_request6 | summaryupstream
		    		this.coreSummaryUpstream(this.cm_id, 3);

		    		// network activity
		    		const nims = {cm_id: this.cm_id};
		    		this.faultNims(nims);
		    		
		    		// open fault
		    		const fault = {account_number: this.accountSearchForm.value.account_number};
		    		this.faultGet(fault);
		    		
			    }
			    else 
			    {
			    	this.loader = false;
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

	// Preserve original property order
  	unsorted() { }

  	dropCmInfo(data)
  	{
    	this.analyticsService.dropCmInfo(data)
    	.subscribe((data : any)  => {
    		this.cm_info_result = data;
    		this.cm_info = this.cm_info_result[0][0];
    		this.cm_parameters = this.cm_info_result[1];

			this.account_search_request1 = true;
			this.accountSearchLoader();
    		// drop status indicator
    		this.drop_status = this.cm_parameters.drop_status;
		}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  	}

  	dropCpeChannels(data)
  	{
		this.analyticsService.dropCpeChannels(data)
		.subscribe((data : any)  => {
    		this.cpeChannels_result = data;
    		this.cpeChannels = this.cpeChannels_result;

    		this.account_search_request2 = true;
    		this.accountSearchLoader();
		}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  	}

  	plantSummaryUpstream(cm_id)
  	{
  		this.analyticsService.plantSummaryUpstream(cm_id)
  		.subscribe((data : any)  => {
  			this.summaryupstream = data;
  			this.port_sample = this.summaryupstream.ports[0];

  			this.account_search_request4 = true;
  			this.accountSearchLoader();
  		}, error => { this.error = error; this.loader = false; alert("an error has occured") });   
  	}

  	plantUpstream(cm_id, days, data)
  	{
  		this.analyticsService.plantUpstream(cm_id, days, data)
  		.subscribe((data : any)  => {
  			this.upstream = data.stream_data;
  			this.upstream_raw = data;

  			this.createPortArray(this.upstream);
  			this.account_search_request3 = true;
  			this.accountSearchLoader();

  			// plant status indicator
  			this.plant_status = this.upstream_raw.plant_status;
  		}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  	}

  	coreDownstream(cm_id, days, data)
  	{
  		this.analyticsService.coreDownstream(cm_id, days, data)
  		.subscribe((data : any)  => {
  			this.downstream = data.stream_data;
  			this.downstream_summary = data.ds_summary;
  			this.downstream_raw = data;
  			this.upstream_summary = data.us_summary;

  			this.core_status = data.core_status;
  			this.account_search_request5 = true;
  			this.accountSearchLoader();
  		}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  	}

  	coreSummaryUpstream(cm_id, days)
  	{
  		this.analyticsService.coreSummaryUpstream(cm_id, days)
  		.subscribe((data : any)  => {
  			this.status_info = data;
  			this.account_search_request6 = true;
  			this.accountSearchLoader();
  		}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  	}

  	faultGet(data)
  	{
  		this.analyticsService.faultGet(data)
  		.subscribe((data : any)  => {
  			this.open_fault_length = data.open_fault.length;
  			if ( this.open_fault_length > 0 ) {
  				// console.log(data.open_fault);
  				this.open_fault = data.open_fault;
  			}
  		

  			this.previous_fault_length = data.previous_fault.length;
  			if ( this.previous_fault_length > 0 ) {
  				this.previous_fault = data.previous_fault[0];
  			}

  			if (data) {
  				this.fnpr_ctr = data.fnpr_ctr;
  			}

  			if (data) {
  				this.ndc_ctr = data.ndc_ctr;
  			}

  		});
  	}

  	faultNims(data)
  	{
  		this.analyticsService.faultNims(data)
  		.subscribe((data : any)  => {
			this.incident_nhm_length = data.nhm_activity.length;

			if (this.incident_nhm_length > 0) 
			{
				this.incident_nhm = data.nhm_activity[0];
			}

			this.incident_nar_length = data.nar_activity.length;
			if (this.incident_nar_length > 0) 
			{
				this.incident_nar = data.nar_activity[0];
			}

			if (data.ntr_notification) {
				this.incident_ntr = data.ntr_notification;
			}
		});
  	}

	createPortArray(upstream_raw)
	{
		var self = this;
		this.port_array = [];
		for (var key in upstream_raw) 
		{
			self.port_array.push(key.trim());
		}
	}

	oninitLoader()
	{
		var init1 = this.init1;
		var init2 = this.init2;

		if (init1 && init2) 
		{
			this.loader = false;
		}
		else 
		{
			this.loader = true;
		}
	}

	// checks if all requests are finished then close the loader if all requests are done
	accountSearchLoader()
	{
		var search1 = this.account_search_request1;
		var search2 = this.account_search_request2;
		var search3 = this.account_search_request3;
		var search4 = this.account_search_request4;
		var search5 = this.account_search_request5;
		var search6 = this.account_search_request6;

		if (search1 && search2 && search3 && search4 && search5 && search6) 
		{
			this.loader = false;
		}
		else 
		{
			this.loader = true;
		}
	}

	selectAccountSearch(account_number)
	{
        this.accountSearchForm.patchValue({
        	account_number: account_number
    	});

    	this.accountSearch();
	}

	portDS(key, category)
	{
		this.portds_active = key;

		this.getCMTSStream('downstream_neighbor', category, key);
	}

	selectedSpanCore;
	selectedSpanDSCore = 3;
	portRow_ctr = 0;

	portRow(key, category)
	{
		// console.log('portrow');
		this.loader = true;
		this.port_active = key;

		new Promise<any>((res, rej) => {
			// graph creation
			if (category == 'plant' && this.portRow_ctr == 0) {
				// console.log(20);
				this.getCMTSStream('upstream_neighbor', category, '');
				this.getImpairedCm();
			}

			res(true);
		})
		.then(res => {
			setTimeout(()=>{    //<<<---    using ()=> syntax
				if (category == 'plant') {

					if (Object.keys(this.charts).length === 0)
					{
						// console.log(0);
						this.portRow_ctr = this.portRow_ctr + 1;
						this.portRow(key, category);
					}
					else
					{
						// console.log(1);
						this.portRow_ctr = 0;
						this.upstreamView(category, key);
					}

					
				} else if (category == 'core') {
					var postdata = [];
					this.selectedSpanCore = "3";
					this.getCMTSGraphData(this.cm_id, "us", 3, postdata, 'port_change');
					this.portDS(0, 'core');
					
					// this.getCMTSGraphData(this.cm_id, "us", undefined, undefined);
				}
			      
		 	}, 3000); 
		})
		  .then(res => {  
			setTimeout(()=>{    //<<<---    using ()=> syntax
				  // console.log(key);
			      this.loader = false;
		 	}, 3000);
		})
		  .catch(error => {
			console.log('ERROR:', error.message);
			this.loader = false;
		});
    	// this.activatedRoute.url.subscribe(url => console.log('The URL changed to: ' + url));

	}

	resetCM()
	{
		const resetCm_body = {ip: this.cm_info.ip_add, cmts: this.cm_info.cmts };

		this.analyticsService.resetCm(resetCm_body)
		.subscribe((data : any)  => {
			this.checkCM();
		});
	}

	testinterval;
	ping_reset = [];
	ping_visibility = false;

	checkCM()
	{
    	const body = {cm_id: this.cm_id, user_id: this.currentUserInfo.id, duration: 0, type: true};

    	this.analyticsService.dropCmInfo(body)
    	.subscribe((data : any)  => {
     		this.cm_info_result = data;
     		this.cm_info = this.cm_info_result[0][0];
     		this.cm_parameters = this.cm_info_result[1];

     		this.ping_reset.push(this.cm_parameters.ping);
     		if(data[1].ping == 0 || data[1].tx == 0) {
     			this.ping_visibility = true;
     			this.checkCM();
     		}
     		else
     		{
     			this.ping_visibility = false;
     			this.ping_reset = [];
     		}

 		});
 

	}

	impaired_cm;
	impaired_cm_length;

	getImpairedCm()
	{
		const body = {cm_id: this.cm_id};

		this.analyticsService.impairedCm(body)
		.subscribe((data : any)  => {
    		
    		if (data) 
    		{
    			this.impaired_cm_length = data.length;
    			if (this.impaired_cm_length > 0) 
    			{
    			 	this.impaired_cm = data[0];
			 	} 
    			
    		}

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
	drop_graph_data;

	getHistoricGraph(type, display, level, category){
		// console.log('getHistoricGraph');
		var cm_id = this.cm_id;
 		this.getLiveGraph('pause');
 		this.loader = true;

		if(cm_id){
			if(display == "change"){

				if (type == "live")
				{
					
					this.chart_live = true;
					this.chart_hist = false;
					this.getLiveGraph('run');
					this.loader = false;
				}
				else if (type == "d" || type == "w" || type == "m" || type == "1")
				{
					this.chart_live = false;
					this.chart_hist = true;
					const cpeChannels_body = {cm_id: this.cm_id, type: type, start: "", end:"" };

		    		this.http.post<any>('http://182.18.194.188/nms/authbasic/graph_data', cpeChannels_body).subscribe(data => {
		    			this.cmHistoricGraph(data, category);
		    			this.loader = false;  
		    		});
				}

			}
			else if(display == "cmts_days"){
 
				var postdata = [];

				this.getCMTSGraphData(this.cm_id, "us", type, postdata, 'span_change');

				var typex = type == "1" ? "1" : type == "7" ? "w" : type == "31" ? "m" : "3" ;

    			const upstream_body = {postData:[]}
 		
	    		this.http.post<any>('http://182.18.194.188/nms/authbasic/upstream/'+this.cm_id+'.'+type, upstream_body).subscribe(data => {
	    			this.upstream = data.stream_data;
	    		});

				const cpeChannels_body = {cm_id: this.cm_id, type: typex, start: "", end:"" };

	    		this.http.post<any>('http://182.18.194.188/nms/authbasic/graph_data', cpeChannels_body).subscribe(data => {
	    			this.cmHistoricGraph(data, category);
	    			this.loader = false;  
	    		});
			}
			else if(display == "cmts_n_days"){
				
				var typex = type == "d" ? "3" : type == "24h" ? "1" : type == "w" ? "7" : type == "m" ? "31" : "3" ;
				var key = this.port_active;
				var self = this;
				new Promise<any>((res, rej) => {
					// graph creation
					self.getUSGraphData(typex, category);
					res(true);
				})
				.then(res => {
					setTimeout(()=>{    //<<<---    using ()=> syntax
						// console.log('test');
						self.upstreamView(category, key);
				 	}, 3000); 
				})
				  .then(res => {  
					setTimeout(()=>{    //<<<---    using ()=> syntax
					  	self.portRow(key, category);
				      	// self.loader = false;
				 	}, 3000);
				})
				  .catch(error => {
					console.log('ERROR:', error.message);
					self.loader = false;
				});

 
			}
			else if(this.cmhistoric_visible == false){

				this.chart_hist = true;
				this.chart_live = false;

				const cpeChannels_body = {cm_id: this.cm_id, type: type, start: "", end:"" };

	    		this.http.post<any>('http://182.18.194.188/nms/authbasic/graph_data', cpeChannels_body).subscribe(data => {
	    			this.cmHistoricGraph(data, category); 
	    			this.loader = false; 
	    		});
	    		
				// $("#cm_history").removeClass('in out');
				// $scope.cmhistoric_visible = true;
				// $scope.loader = true;
			}
			else{ this.cmhistoric_visible = false; this.loader = false; }
		}

	}

	rxcurrent;
	rxaverage;
	rxmaximum;
	txcurrent;
	txaverage;
	txmaximum;
	snrcurrent;
	snraverage;
	snrmaximum;
	snr_max_dev;
	snr_min_dev;
	rx_max_dev;
	rx_min_dev;
	tx_max_dev;
	tx_min_dev;

	feccocurrent;
	feccoaverage;
	feccomaximum;
	fecuncocurrent;
	fecuncoaverage;
	fecuncomaximum;
	snrcurrent_p;
	snraverage_p;
	snrmaximum_p;

	drop_graph_start;
	drop_graph_end;

	cmHistoricGraph(data, category){
		// console.log(data);
		// console.log(category);

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

			this.rxcurrent = data[c].rx;
			this.rxaverage = (temp_rx / average_duration).toFixed(2);
			this.rxmaximum = max_rx;
			this.txcurrent = data[c].tx;
			this.txaverage = (temp_tx / average_duration).toFixed(2);
			this.txmaximum = max_tx;
			this.snrcurrent = data[c].snr;
			this.snraverage = (temp_snr / average_duration).toFixed(2);
			this.snrmaximum = max_snr;

			snr_dev_count = (snr_dev_count > 0) ? snr_dev_count : undefined; 
			rx_dev_count = (rx_dev_count > 0) ? rx_dev_count : undefined;
			tx_dev_count = (tx_dev_count > 0) ? tx_dev_count : undefined;

			this.snr_max_dev = (snr_dev.length > 0) ? (Math.max.apply(Math, snr_dev)).toFixed(2) : "None";
			this.snr_min_dev = (snr_dev.length > 0) ? (Math.min.apply(Math, snr_dev)).toFixed(2) : "None";
			this.rx_max_dev = (rx_dev.length > 0) ? (Math.max.apply(Math, rx_dev)).toFixed(2) : "None";
			this.rx_min_dev = (rx_dev.length > 0) ? (Math.min.apply(Math, rx_dev)).toFixed(2) : "None";
			this.tx_max_dev = (tx_dev.length > 0) ? (Math.max.apply(Math, tx_dev)).toFixed(2) : "None";
			this.tx_min_dev = (tx_dev.length > 0) ? (Math.min.apply(Math, tx_dev)).toFixed(2) : "None";

			this.ping_current = data[c].ping;
			this.ping_average = (total_ping / average_duration).toFixed(2);
			this.ping_maximum = max_ping;
			
			var byte_divider = 1000000;

			this.dl_current =	this.formatBytes(data[c].uhsbDL * byte_divider);
			this.dl_average =	this.formatBytes((total_dl / average_duration) * byte_divider);
			this.dl_maximum =	this.formatBytes(max_dl * byte_divider);
			this.ul_current =	this.formatBytes(data[c].uhsbUL * byte_divider);
			this.ul_average =	this.formatBytes((total_ul / average_duration) * byte_divider);
			this.ul_maximum =	this.formatBytes(max_ul * byte_divider);

			this.total_in = this.formatBytes(total_dl * byte_divider);
			this.total_out = this.formatBytes(total_ul * byte_divider);
			
			if (category == 'drop') {
				this.historicValueAxes({"rf": "rf_chart", "bw" : "bw_chart"} , "historic", data);
			} else if (category == 'core') {
				this.historicValueAxes({"freq" : "freq_chart"} , "historic", data);
			}
			
 
			if(data[0]){
				this.hsf_value = moment(data[0].time).format('L');
				this.hsf_time_value = moment(data[0].time).format('HH:mm');
				this.drop_graph_start = this.reformatData(this.hsf_value + " " + this.hsf_time_value);
			}

			if(data[data.length - 1]){ 
				this.hef_value = moment(data[data.length - 1].time).format('L');
				this.hef_time_value = moment(data[data.length - 1].time).format('HH:mm');
				this.drop_graph_end = this.reformatData(this.hef_value + " " + this.hef_time_value);

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
		
		var freq_graphs = [
						 { "valueAxis": "v1", "balloonFunction" : this.getModProfile1, "lineThickness" : 2, "lineColor": "#FCD202", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upstream Bandwidth", "balloonText": "usBw = [[value]]", "valueField": "usBw", "fillAlphas": 0 }, 
						 { "valueAxis": "v1", "balloonFunction" : this.getModProfile2, "lineThickness" : 2, "lineColor": "#0ad5f3", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Downstream Bandwidth", "balloonText": "dsBw = [[value]]", "valueField": "dsBw", "fillAlphas": 0 }, 
						 // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#0ad8f3", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upstream Speed", "balloonText": "usSpeed = [[value]]", "valueField": "usSpeed", "fillAlphas": 0 }, 
						 // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#FF0000", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Upstream Frequency", "balloonText": "usFreq = [[value]]", "valueField": "usFreq", "fillAlphas": 0 }, 
						 // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#0FEB0E", "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Downstream Frequency", "balloonText": "dsFreq = [[value]]", "valueField": "dsFreq", "fillAlphas": 0 },
						 { "valueAxis": "v2", "balloonFunction" : this.getModProfile3, "lineThickness" : 2, "lineColor": "#4B0082", "bullet": "rount", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Modulation", "balloonText": "mod = [[value]]", "valueField": "mod", "fillAlphas": 0 }
						 ];
			
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

	snr_dev_count;
	rx_dev_count;
	tx_dev_count;

	ping_average;
	ping_maximum;
	ping_current;
	dl_average;
	dl_maximum;
	ul_average;
	ul_maximum;
	dl_current;
	ul_current;
	total_in;
	total_out;

	plant_graph_start;
	plant_graph_end;

	createGraph(chart, data, period, valueAxes, graphs, catField){
		var self = this;
		// console.log(chart);
		// this.loader = true;
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
								// console.log(chart);
								// get date of the last known cursor position
								var date = e.chart.dataProvider[ e.chart.lastCursorPosition ][ e.chart.categoryField ];
								var guide_data = e.chart.dataProvider[e.chart.lastCursorPosition];
								var check = 0;

								if(chart == 'bw_chart'){
									var guide_uhsbDL = self.formatTraffic(guide_data.uhsbDL, '','');
									var guide_uhsbUL = self.formatTraffic(guide_data.uhsbUL, '','');
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
								else if(chart.search("usn_chart") == 0){
									if ( chart.search("snr") > 0 ) 
									{
										var snr = guide_data.snr;
										var text = "SNR = "+snr;
										check = 1;
									}
									else
									{
										var guide_corr = guide_data.fec_correctables;
										var guide_uncorr = guide_data.fec_uncorrectables;
										var text = "Correctables = "+guide_corr+" Uncorrectables = "+guide_uncorr;
										check = 1;
									}

								}
								else if(chart =="cmts_uschart_traffic")
								{
									var guide_traffic = guide_data.traffic;
									var text = "Traffic = "+guide_traffic;
									check = 1;								
								}
								else if(chart.search("dsn_chart") == 0)
								{
									var guide_traffic = guide_data.traffic;
									var text = "Traffic = "+guide_traffic;
									check = 1;		
								}



								if(check == 1){
									// create a new guide
									var guide = new AmCharts.Guide();
									guide.date = date;
									guide.lineAlpha = 1;
									guide.lineColor = "#c44";
									guide.label = text;
									// guide.balloonText = "testing",
									guide.above = true;
									guide.position = "bottom";
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

		// this.loader = false;

		this.charts[chart].addListener("zoomed", handleZoom);
		
		var self = this;
		function handleZoom(event){ 
			if(chart == "rf_chart" || chart == "bw_chart"){
				self.hsf_value = moment(event.startDate).format('L'); 
				self.hsf_time_value = moment(event.startDate).format('HH:mm');
				self.hef_value = moment(event.endDate).format('L');
				self.hef_time_value = moment(event.endDate).format('HH:mm');
				self.drop_graph_start = self.reformatData(self.hsf_value + " " + self.hsf_time_value);
				self.drop_graph_end = self.reformatData(self.hef_value + " " + self.hef_time_value);
			}

			if(chart == "cmts_dschart"){
				this.cmts_ds_date_srange = moment(event.startDate).format('L'); 
				this.cmts_ds_time_srange = moment(event.startDate).format('HH:mm');
				this.cmts_ds_date_erange = moment(event.endDate).format('L');
				this.cmts_ds_time_erange = moment(event.endDate).format('HH:mm');
			}

			if(chart == "cmts_uschart_count" || chart == "cmts_uschart_snr" || chart == "cmts_uschart_fec" || chart == "cmts_uschart_traffic"){
				self.cmts_date_srange = moment(event.startDate).format('L'); 
				self.cmts_time_srange = moment(event.startDate).format('HH:mm');
				self.cmts_date_erange = moment(event.endDate).format('L');
				self.cmts_time_erange = moment(event.endtDate).format('HH:mm');
				// self.drop_graph_start = self.reformatData(self.cmts_date_srange + " " + self.cmts_time_srange);
				// self.drop_graph_end = self.reformatData(self.cmts_date_erange + " " + self.cmts_time_erange);
			}

			if(chart.match(/neighbor_chart.*/) || chart.match(/neighbor_tchart.*/)){
				this.cs_date_value = moment(event.startDate).format('L'); 
				this.cs_time_value = moment(event.startDate).format('HH:mm');
				this.ce_date_value = moment(event.endDate).format('L');
				this.ce_time_value = moment(event.endDate).format('HH:mm');
			}

			if(chart.match(/usn_chart.*/)){
				self.cmts_usn_date_srange = moment(event.startDate).format('L');
				self.cmts_usn_time_srange = moment(event.startDate).format('HH:mm');
				self.cmts_usn_date_erange = moment(event.endDate).format('L');
				self.cmts_usn_time_erange = moment(event.endDate).format('HH:mm');
 
				self.plant_graph_start = self.reformatData(self.cmts_usn_date_srange + " " + self.cmts_usn_time_srange);
				self.plant_graph_end = self.reformatData(self.cmts_usn_date_erange + " " + self.cmts_usn_time_erange);
				self.charts["usn_chart"+self.port_active].zoomToDates(event.startDate, event.endDate);
				self.charts["usn_chart"+self.port_active+"snr"].zoomToDates(event.startDate, event.endDate);
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
			else if(chart == "cmts_uschart_traffic"){ self.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'traffic', "", event.startDate, event.endDate); }
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
			else{ self.cmtsMaxAverage(event.startIndex, event.endIndex, data, 'nupstream', null, event.startDate, event.endDate); }
			
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

				// this.$apply(function(){
					self.rxaverage = (total_rx / length).toFixed(2);
					self.rxmaximum = max_rx;
					self.txaverage = (total_tx / length).toFixed(2);
					self.txmaximum = max_tx;
					self.snraverage = (total_snr / length).toFixed(2); 
					self.snrmaximum = max_snr;

					self.snr_dev_count = (snr_dev_count > 0) ? snr_dev_count : "None"; 
					self.rx_dev_count = (rx_dev_count > 0) ? rx_dev_count : "None";
					self.tx_dev_count = (tx_dev_count > 0) ? tx_dev_count : "None";
					self.snr_max_dev = (snr_dev.length > 0) ? (Math.max.apply(Math, snr_dev)).toFixed(2) : "None";
					self.snr_min_dev = (snr_dev.length > 0) ? (Math.min.apply(Math, snr_dev)).toFixed(2) : "None";
					self.rx_max_dev = (rx_dev.length > 0) ? (Math.max.apply(Math, rx_dev)).toFixed(2) : "None";
					self.rx_min_dev = (rx_dev.length > 0) ? (Math.min.apply(Math, rx_dev)).toFixed(2) : "None";
					self.tx_max_dev = (tx_dev.length > 0) ? (Math.max.apply(Math, tx_dev)).toFixed(2) : "None";
					self.tx_min_dev = (tx_dev.length > 0) ? (Math.min.apply(Math, tx_dev)).toFixed(2) : "None";
				// });

				self.charts["bw_chart"].zoomToDates(s_date, e_date);
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

		var self = this;
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

				// this.$apply(function(){

					self.ping_average =  (total_ping / length).toFixed(2);
					self.ping_maximum = max_ping;
					self.dl_average =	self.formatBytes((total_dl / length) * self.byte_divider);
					self.dl_maximum =	self.formatBytes(max_dl * self.byte_divider);
					self.ul_average =	self.formatBytes((total_ul / length) * self.byte_divider);
					self.ul_maximum =	self.formatBytes(max_ul * self.byte_divider);

					self.total_in = self.formatBytes(total_dl * self.byte_divider);
					self.total_out = self.formatBytes(total_ul * self.byte_divider);

				// });

				self.charts["rf_chart"].zoomToDates(s_date, e_date);
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


 
		// this.loader = false;

		return this.charts[chart];
	}

	onlineaverage;
	offlineaverage;
	onlinemaximum;
	offlinemaximum;
	traaverage;
	tramaximum;
	tracurrent;

	cmtsMaxAverage(start, end, data, stream, key, s_date, e_date){
		var self = this;
		var temp_online = 0,temp_offline = 0,temp_snr = 0,temp_feccor = 0,temp_fecuncor = 0,temp_traffic = 0,length = end - start, max_online = 0,
		 max_offline = 0,max_snr = 0,max_feccor = 0,max_fecuncor = 0,max_traffic = 0;

		for(var i = start; i <= end; i++){
			
			if(max_online < data[i].online){ max_online =  data[i].online }
			if(max_offline < data[i].offline){ max_offline =  data[i].offline }
			if(max_snr < data[i].snr){ max_snr =  data[i].snr }
			if(max_feccor < data[i].fec_correctables) { max_feccor =  data[i].fec_correctables }
			if(max_fecuncor < data[i].fec_uncorrectables){ max_fecuncor =  data[i].fec_uncorrectables }
			if(max_traffic < data[i].traffic){ max_traffic =  data[i].traffic }

			temp_online += (data[i].online != null) ? parseFloat(data[i].online) : 0;
			temp_offline += (data[i].offline != null) ? parseFloat(data[i].offline) : 0;
			temp_snr += (data[i].snr != null) ? parseFloat(data[i].snr) : 0;
			temp_feccor += (data[i].fec_correctables != null) ? parseFloat(data[i].fec_correctables) : 0;
			temp_fecuncor += (data[i].fec_uncorrectables != null) ? parseFloat(data[i].fec_uncorrectables) : 0;
			temp_traffic += (data[i].traffic != null) ? parseFloat(data[i].traffic) : 0;
		
		}

		if(stream == 'nupstream'){
			var self = this;
			this.us_ports.forEach(function(value, keyval) {
		       	if(value.name == self.port_active){
		       		// $timeout(function(){
		       			self.onlineaverage = (temp_online / length).toFixed(0);
						self.offlineaverage = (temp_offline / length).toFixed(0);
						self.snraverage = (temp_snr / length).toFixed(0);
						self.feccoaverage = (temp_feccor / length).toFixed(4);
						self.fecuncoaverage = (temp_fecuncor / length).toFixed(4);
						self.traaverage = (temp_traffic / length).toFixed(2);
						self.snrmaximum = max_snr;
						self.onlinemaximum = max_online;
						self.offlinemaximum = max_offline;
						self.feccomaximum = max_feccor;
						self.fecuncomaximum = max_fecuncor;
						self.tramaximum = max_traffic;
	       			// });
		       	}
         	});
		}else if(stream == 'traffic'){
			// self.$apply(function(){
				self.traaverage = (temp_traffic / length).toFixed(2);
				self.tramaximum = max_traffic;
			// });
		}else if(stream == 'snr'){
			// self.$apply(function(){
				self.snraverage = (temp_snr / length).toFixed(0);
				self.snrmaximum = max_snr;
			// });
		}else if(stream == 'fec'){
			// self.$apply(function(){
				self.feccoaverage = (temp_feccor / length).toFixed(4);
				self.feccomaximum = max_feccor;
				self.fecuncoaverage = (temp_fecuncor / length).toFixed(4);
				self.fecuncomaximum = max_fecuncor;
			// });
		}else if(stream == 'count'){
			// self.$apply(function(){
				self.onlineaverage = (temp_online / length ).toFixed(0);
				self.onlinemaximum = (temp_offline / length ).toFixed(0);
				self.onlinemaximum = max_online;
				self.offlinemaximum = max_offline;
			// });
		}

		if(stream != "nupstream"){
			self.charts["usn_chart"+self.port_active+"traffic"].zoomToDates(s_date, e_date);
			// self.charts["cmts_uschart_snr"].zoomToDates(s_date, e_date);
			// self.charts["cmts_uschart_fec"].zoomToDates(s_date, e_date);
			// self.charts["cmts_uschart_traffic"].zoomToDates(s_date, e_date);
		}
		
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
 	
 	reformatData(time){
		var date = moment(time).format("MMMM DD, YYYY HH:mm");

		if(date){ return date; }
		else { return date; }
	}

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

	// plant graph
	threshold;
	upstreamNeighbor;
	snr;
	cor;
	unc;
	tra;


	cmtsNUSGraph(upstream, category){ 
		// this.loader = true;
		this.http.get<any>('http://182.18.194.188/nms/authbasic/api/threshold').subscribe(data => {
			this.threshold = data;
			// this.loader = false;		

			if(this.upstream_raw.status == "failed"){
				setTimeout(function(){
					this.us_ports = [];
				})
				// this.loader = false;
				// toaster.pop('error', "Error", this.upstream_raw.message);
			}else{

				var date_count = parseInt(this.threshold.days.days),
					day_threshold = (12 * 24) * date_count,			
					values = {},
					selectOptions = [],
					snrresultaverage = "",
					corresultaverage = "",
					uncorresultaverage = "",
					traresultaverage = "",
					corsummaryresultaverage = "";

				this.upstreamNeighbor = (upstream.neigborresult) ? upstream.neigborresult : "";
				var self = this;
				// console.log(upstream.stream_data);
				// console.log(Object.values(upstream.stream_data));
		 		var threshold = this.threshold;
				Object.values(upstream.stream_data).forEach(function(value, key) {

					// upstream.stream_data[key]["name"] = key;

					var length = value['us_data'].length - 1, 
						temp_snr = 0, 
						max_snr = 0,
						temp_online = 0, 
						temp_offline = 0, 
						max_online = 0, 
						max_offline = 0, 
						temp_cor = 0, 
						temp_unc = 0, 
						max_unc = 0,
						max_cur = 0, 
						max_tra = 0, 
						temp_tra = 0,
						traffic_counter = 0,
        				consistent_traffic = false,
        				persistent_uncor = false,
        				persistent_uncor_counter = 0,
						uncor_value = threshold.uncor.value / 100,
    				 	persistent_percentage = length * uncor_value,
			 			start = length - day_threshold;

					if(start < 0){
						var start = 0;
					}

					var average_counter = 0,
				 		snr = 0,cor = 0,unc =0 , tra = 0;
					
					for(var counter = 0; counter <= length; counter++){

						if(counter >= start){
							
							if(value['us_data'][counter].fec_uncorrectables > 1){
								persistent_uncor_counter++;
								if(persistent_uncor_counter > persistent_percentage){
									persistent_uncor = true;
								}
							}

							average_counter++;

							if(value['us_data'][counter].traffic > value['us_data'][counter].traffic_warning){
	                            traffic_counter++;
	                            if(traffic_counter == 24){
	                                consistent_traffic = true;
	                            }
	                        }else{
	                            traffic_counter = 0;
	                        }
	                        
							var cursnr = parseFloat(value['us_data'][counter].snr),
								curonline = parseFloat(value['us_data'][counter].online),
								curoffline = parseFloat(value['us_data'][counter].offline),
								curcor = parseFloat(value['us_data'][counter].fec_correctables),
								curunc = parseFloat(value['us_data'][counter].fec_uncorrectables),
								curtra = parseFloat(value['us_data'][counter].traffic);

							temp_snr += cursnr;
							temp_online += curonline;
							temp_offline += curoffline;

							temp_cor += curcor;
							temp_unc += curunc;
							temp_tra += curtra; 

							if(cursnr > max_snr){max_snr = cursnr;}
							if(curonline > max_online){max_online = curonline;}
							if(curoffline > max_offline){max_offline = curoffline;}

							if(curcor > max_cur){max_cur = curcor;}
							if(curunc > max_unc){max_unc = curunc;}
							if(curtra > max_tra){max_tra = curtra;}
						}
					}

					if(value['us_data'].length > 0){

						self.snr = (temp_snr > 0) ? (temp_snr / average_counter).toFixed(2) : 0;
						self.cor = (temp_cor > 0) ? (temp_cor / average_counter).toFixed(2) : 0;
						self.unc = (temp_unc > 0) ? (temp_unc / average_counter).toFixed(2) : 0;
						self.tra = (temp_unc > 0) ? (temp_tra / average_counter).toFixed(2) : 0;

						if(self.snr > threshold.info.SNR.Alarming.max){snrresultaverage = "good";}
						else if(self.snr >= threshold.info.SNR.Alarming.min && self.snr <= threshold.info.SNR.Alarming.max){snrresultaverage = "alarming";}
						else if(self.snr < threshold.info.SNR.Critical.max){snrresultaverage = "critical";}
						if(self.snr === "0.00"){ snrresultaverage = ""; }

						// cor
						var cor_alert_min = parseInt(threshold.info.Correctable.Alarming.min);
						var cor_alert_max = parseInt(threshold.info.Correctable.Alarming.max);
						var cor_critical_min = parseInt(threshold.info.Correctable.Critical.min);
						var unc_alert_max = parseInt(threshold.info.Uncorrectable.Critical.min);
						
						if(cor > cor_alert_min && cor < cor_alert_max && unc < unc_alert_max){corresultaverage = "alarming";}
						else if(cor > cor_critical_min || unc > unc_alert_max){ corresultaverage = "critical"; }
			            else{corresultaverage = 'good';}

			        	if(unc > unc_alert_max){ uncorresultaverage = 'critcal';
			      		}else{ uncorresultaverage = 'good'; }

			      		if(cor > cor_alert_min && cor < cor_alert_max){corsummaryresultaverage = "alarming";}
			      		else if(cor > cor_critical_min){ corsummaryresultaverage = "critical"; }
			            else{corsummaryresultaverage = 'good';}


						if(corresultaverage == "good"){
							if(persistent_uncor){
								corresultaverage = 'alarming';
							}
						}

						if(uncorresultaverage == 'good'){
							if(persistent_uncor){
								corresultaverage = 'alarming';
								uncorresultaverage = 'alarming';
							}
						}

						// traffic
						if(tra > value['us_data'][length].traffic_alert){ traresultaverage = "critical"; }
						else if( (tra >= value['us_data'][length].traffic_warning && tra <= value['us_data'][length].traffic_alert) || consistent_traffic ){ traresultaverage = "alarming"; }
						else if(tra < value['us_data'][length].traffic_warning){ traresultaverage = "good"; }

						if(self.tra === "0.00"){ 
							traresultaverage = "";
						}

						Object.values(upstream.stream_data)[key]['snrcurrent'] = value['us_data'][length].snr;
						Object.values(upstream.stream_data)[key]['snraverage'] = temp_snr / average_counter;
						Object.values(upstream.stream_data)[key]['snrmaximum'] = max_snr;

						Object.values(upstream.stream_data)[key]['onlinecurrent'] = value['us_data'][length].online;
						Object.values(upstream.stream_data)[key]['onlineaverage'] = Math.round(temp_online / average_counter);
						Object.values(upstream.stream_data)[key]['onlinemaximum'] = max_online;

						Object.values(upstream.stream_data)[key]['offlinecurrent'] = value['us_data'][length].offline;
						Object.values(upstream.stream_data)[key]['offlineaverage'] = Math.round(temp_offline / average_counter);
						Object.values(upstream.stream_data)[key]['offlinemaximum'] = max_offline;

						Object.values(upstream.stream_data)[key]['feccocurrent'] = value['us_data'][length].fec_correctables;
						Object.values(upstream.stream_data)[key]['feccoaverage'] =  (temp_cor / average_counter).toFixed(4);
						Object.values(upstream.stream_data)[key]['feccomaximum'] = max_cur;

						Object.values(upstream.stream_data)[key]['fecuncocurrent'] = value['us_data'][length].fec_uncorrectables;
						Object.values(upstream.stream_data)[key]['fecuncoaverage'] =  (temp_unc  / average_counter).toFixed(4);
						Object.values(upstream.stream_data)[key]['fecuncomaximum'] = max_unc;

						Object.values(upstream.stream_data)[key]['tracurrent'] = value['us_data'][length]['traffic']
						Object.values(upstream.stream_data)[key]['traaverage'] = ( temp_tra / average_counter).toFixed(4)
						Object.values(upstream.stream_data)[key]['tramaximum'] = max_tra;
					
					}else{
						Object.values(upstream.stream_data)[key]['snrcurrent'] = 0;
						Object.values(upstream.stream_data)[key]['snraverage'] = 0;
						Object.values(upstream.stream_data)[key]['snrmaximum'] = 0;
						Object.values(upstream.stream_data)[key]['onlinecurrent'] = 0;
						Object.values(upstream.stream_data)[key]['onlineaverage'] = 0;
						Object.values(upstream.stream_data)[key]['onlinemaximum'] = 0;
						Object.values(upstream.stream_data)[key]['offlinecurrent'] = 0;
						Object.values(upstream.stream_data)[key]['offlineaverage'] = 0;
						Object.values(upstream.stream_data)[key]['offlinemaximum'] = 0;
						Object.values(upstream.stream_data)[key]['feccocurrent'] = 0;
						Object.values(upstream.stream_data)[key]['feccoaverage'] = 0;
						Object.values(upstream.stream_data)[key]['feccomaximum'] = 0;
						Object.values(upstream.stream_data)[key]['fecuncocurrent'] = 0;
						Object.values(upstream.stream_data)[key]['fecuncoaverage'] = 0;
						Object.values(upstream.stream_data)[key]['fecuncomaximum'] = 0;
						Object.values(upstream.stream_data)[key]['tracurrent'] = 0;
						Object.values(upstream.stream_data)[key]['traaverage'] = 0;
						Object.values(upstream.stream_data)[key]['tramaximum'] = 0;

						corresultaverage= "good";
					}

					selectOptions.push({
				        name: key, 
				        data : value['us_data'],
				        nodes : value['nodes'],
				        snrresultstatus : snr,
				        snrresultaverage : snrresultaverage,
				        corresultstatus : cor,
				        corresultaverage : corresultaverage,
				        corsummaryresultaverage : corsummaryresultaverage,
				        uncorresultaverage : uncorresultaverage,
				        uncorresulstatus : unc,
				        traresulstatus : tra,
				        traresultaverage : traresultaverage,
				        snrcurrent : Object.values(upstream.stream_data)[key]['snrcurrent'],
						snraverage : (Object.values(upstream.stream_data)[key]['snraverage']).toFixed(2), 
						snrmaximum : Object.values(upstream.stream_data)[key]['snrmaximum'], 
						onlinecurrent : Object.values(upstream.stream_data)[key]['onlinecurrent'], 
						onlineaverage : Object.values(upstream.stream_data)[key]['onlineaverage'], 
						onlinemaximum : Object.values(upstream.stream_data)[key]['onlinemaximum'], 
						offlinecurrent : Object.values(upstream.stream_data)[key]['offlinecurrent'], 
						offlineaverage : Object.values(upstream.stream_data)[key]['offlineaverage'], 
						offlinemaximum : Object.values(upstream.stream_data)[key]['offlinemaximum'], 
						feccocurrent : Object.values(upstream.stream_data)[key]['feccocurrent'], 
						feccoaverage : Object.values(upstream.stream_data)[key]['feccoaverage'], 
						feccomaximum : Object.values(upstream.stream_data)[key]['feccomaximum'], 
						fecuncocurrent : Object.values(upstream.stream_data)[key]['fecuncocurrent'], 
						fecuncoaverage : Object.values(upstream.stream_data)[key]['fecuncoaverage'], 
						fecuncomaximum : Object.values(upstream.stream_data)[key]['fecuncomaximum'], 
						tracurrent : Object.values(upstream.stream_data)[key]['tracurrent'], 
						traaverage : Object.values(upstream.stream_data)[key]['traaverage'], 
						tramaximum : Object.values(upstream.stream_data)[key]['tramaximum'], 
						tfeccoaverage : Object.values(upstream.stream_data)[key]['feccoaverage'], 
						tfecuncoaverage : Object.values(upstream.stream_data)[key]['fecuncoaverage'], 
						tsnraverage : (Object.values(upstream.stream_data)[key]['snraverage']).toFixed(2)
				    });
				});
				
				this.us_ports = selectOptions;
				// set fec values summary
				this.feccocurrent = selectOptions[this.port_active]['feccocurrent'];
				this.feccoaverage = selectOptions[this.port_active]['feccoaverage'];
				this.feccomaximum = selectOptions[this.port_active]['feccomaximum'];

				this.fecuncocurrent = selectOptions[this.port_active]['fecuncocurrent'];
				this.fecuncoaverage = selectOptions[this.port_active]['fecuncoaverage'];
				this.fecuncomaximum = selectOptions[this.port_active]['fecuncomaximum'];

				this.tracurrent = selectOptions[this.port_active]['tracurrent'];
				this.traaverage = selectOptions[this.port_active]['traaverage'];
				this.tramaximum = selectOptions[this.port_active]['tramaximum'];

				this.snrcurrent_p = selectOptions[this.port_active]['snrcurrent'];
				this.snraverage_p = selectOptions[this.port_active]['snraverage'];
				this.snrmaximum_p = selectOptions[this.port_active]['snrmaximum'];
				
				setTimeout(function(){
					var ctr = 0;
					Object.values(upstream.stream_data).forEach(function(value, key) {

						var len = value['us_data'].length - 1;	

						var alert_threshold = 0;
						var warning_threshold = 0;

						if(value['us_data'].length > 0){
							alert_threshold = value['us_data'][len]['traffic_alert'];
							warning_threshold = value['us_data'][len]['traffic_warning'];
						}

						var valueAxes = [{ "id":"v1", "maximum": alert_threshold , "bullet" : "square","position": "left"}, 
								 { "id":"v2","minimum": 0, "guides": [{"value": 25,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#44F", "above": true},{"value": 20,"lineAlpha": 1,"lineThickness" : 1,"lineColor" : "#F51D30", "above": true}], "bullet" : "square", "axisColor": "#FE8919", "position": "left"}, 
								 { "id":"v3", "maximum": 6, "guides": [{"value": 0.5,"lineAlpha": 1,"lineThickness" : 1,"lineColor" : "#F51D30", "above": true},{"value": 2.5,"lineAlpha": 1,"lineThickness" : 1,"lineColor" : "#157419", "above": true}], "bullet" : "square", "axisColor": "#000", "position": "left", "axisAlpha": 2},
								 { "id":"v4", "bullet" : "square","position": "left" }];
				


						var graphs = [
								  // { "valueAxis": "v4", "lineThickness" : 1.5, "lineColor": "#0F0", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Online", "balloonText": "Online = [[value]]", "valueField": "online", "fillAlphas": 0, "hidden" : true}, 
								  // { "valueAxis": "v4", "lineThickness" : 1.5, "lineColor": "#F00", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Offline", "balloonText": "Offline = [[value]]", "valueField": "offline", "fillAlphas": 0 , "hidden" : true}, 
								  { "valueAxis": "v2", "lineColor": "#FF7D00", "fillColors": "#FF7D00", "fillAlphas": 0.9, "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "SNR", "balloonText": "SNR = [[value]]", "valueField": "snr", "hidden" : true}, 
								  // { "valueAxis": "v1", "lineColor": "#00CF00", "fillColors": "#00CF00", "fillAlphas": 0.9, "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic", "balloonText": "Traffic In = [[value]]", "valueField": "traffic"}, 
								  // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#ff0000", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic Alert", "balloonText": "Traffic Alert = [[value]]", "valueField": "traffic_alert"},
							      // { "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#ff9900", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic Warning", "balloonText": "Traffic Warning = [[value]]", "valueField": "traffic_warning"},
							      { "valueAxis": "v3", "lineThickness" : 1.5, "lineColor": "#aab3b3", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Base", "balloonText": "<p> <div style='margin-top:3px; margin-right:5px; float:left; border-radius: 25px;border: 1px solid white;width: 10px;height: 10px; background-color: #13C455;'></div>Correctables = [[fec_correctables]]</p> <p><div style='margin-top:3px; margin-right:5px; float:left; border-radius: 25px;border: 1px solid white;width: 10px;height: 10px; background-color: #FF4105;'></div>Uncorrectables = [[fec_uncorrectables]] </p>", "valueField": "base", "hidden" : true}, 
								  { "valueAxis": "v3", "lineThickness" : 1.5, "lineColor": "#13C455", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Correctables", "balloonText": "", "valueField": "fec_correctables", "hidden" : true}, 
								  { "valueAxis": "v3", "lineThickness" : 1.5, "lineColor": "#FF4105", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Uncorrectables", "balloonColor":  "gray" ,"balloonText": "", "valueField": "fec_uncorrectables", "fillAlphas": 0, "hidden" : true}];

						if (category == 'plant') {
							self.createGraph("usn_chart"+ctr, value['us_data'], "mm", valueAxes, graphs, "date");
							self.createGraph("usn_chart"+ctr+'snr', value['us_data'], "mm", valueAxes, graphs, "date");
							ctr++;
						} else if(category == 'core') {
							self.createGraph("usn_chart"+ctr+"traffic", value['us_data'], "mm", valueAxes, graphs, "date");
							ctr++;
						}


						if(value['us_data'][0]){
							self.cmts_usn_date_srange = moment(value['us_data'][0].date).format('L');
							self.cmts_usn_time_srange = moment(value['us_data'][0].date).format('HH:mm');
							self.plant_graph_start = self.reformatData(self.cmts_usn_date_srange +" "+self.cmts_usn_time_srange);

						}

						if(value['us_data'][len]){
							self.cmts_usn_date_erange = moment(value['us_data'][len].date).format('L');
							self.cmts_usn_time_erange = moment(value['us_data'][len].date).format('HH:mm');
							self.plant_graph_end = self.reformatData(self.cmts_usn_date_erange +" "+self.cmts_usn_time_erange);

						}
					});
					
				});

				// this.loader = false;
		
			}

		});
	}


	// pang kuha ng plant data and generate ng chart
	getCMTSStream(type, category, portds_active){
		var cm_id = this.cm_id;
		if(cm_id){
			if(type == "upstream"){
				// if(this.cmts_us_visible == false){
				// 	analytics.cmtsUSGraph(cm_id, 'us').then(cmtsUSGraph);
				// 	// $("#us_graph").removeClass('in out');
				// 	// this.loader = true;
				// 	this.cmts_us_visible = true;
				// }
				// else{ this.cmts_us_visible = false; }
			}
			else if(type == "downstream"){
				// if(this.cmts_ds_visible == false){
				// 	analytics.cmtsDSGraph(cm_id, 'ds').then(cmtsDSGraph);
				// 	// $("#ds_graph").removeClass('in out');
				// 	// this.loader = true;	
				// 	this.cmts_ds_visible = true;
				// }
				// else{ this.cmts_ds_visible = false; }
			}
			else if(type == "upstream_neighbor"){
				// if(this.cmts_usn_visible == false){
					this.cmtsNUSGraph(this.upstream_raw, category);
					// $("#us_neighbor").removeClass('in out');
					// this.loader = true;
				// 	this.cmts_usn_visible = true;
				// }
				// else{ this.cmts_usn_visible = false; }
			}
			else if(type == "downstream_neighbor"){
				// if(this.cmts_dsn_visible == false){
				// 	analytics.cmtsNDSGraph(cm_id).then(cmtsNDSGraph);
					this.cmtsNDSGraph(this.downstream_raw, category, portds_active);
				// 	// $("#ds_neighbor").removeClass('in out');
				// 	// this.loader = true;
				// 	this.cmts_dsn_visible = true;
				// }
				// else{ this.cmts_dsn_visible = false; }
			}
		}
	}

	// pag view ng different ports on click
	upstreamView(action , index){
 		var self = this;
 		console.log(this.upstream);
		Object.values(this.upstream).forEach(function(value, key) {

			// console.log(action);
			// console.log(index);
			if (action == "plant") {

				var chart1;
				var chart2;
				if(typeof index == undefined || index == null){
					chart1 = "cmts_uschart";
				}else if(index != null){
					chart1 = "usn_chart" + key + "snr";
					chart2 = "usn_chart" + key;
					// self.activecmts["" + key] = key + "." + action;
				}
				// console.log(self.charts);
				var chart_data_snr;
				chart_data_snr = self.charts[chart1];
				var chart_data_fec;
				chart_data_fec = self.charts[chart2];
				

			} else if(action == "core") {

				var chart;
				if(typeof index == undefined || index == null){
					chart = "cmts_uschart";
				}else if(index != null){
					chart = "usn_chart" + key +"traffic";
					// self.activecmts["" + key] = key + "." + action;
				}


				var chart_data;
				chart_data = self.charts[chart];

			} else {

				var chart;
				if(typeof index == undefined || index == null){
					chart = "cmts_uschart";
				}else if(index != null){
					chart = "usn_chart" + key;
					// self.activecmts["" + key] = key + "." + action;
				}


				var chart_data;
				chart_data = self.charts[chart];

			}



			if(action == "count"){
				// $scope.activecmts = index + ".count";
				for(var i=0;i < chart_data.graphs.length; i++){
					if(i == 0 || i == 1){
						chart_data.showGraph(chart_data.graphs[i]);
					}else{
						chart_data.hideGraph(chart_data.graphs[i]);
					}
				}
				return false;
			}else if(action == "snr"){

				// console.log(chart_data.graphs);
				
				for(var i=0;i < chart_data.graphs.length; i++){
					if(i == 2){
						chart_data.showGraph(chart_data.graphs[i]);
					}else{
						chart_data.hideGraph(chart_data.graphs[i]);
					}
				}
				return false;
			}else if(action == "fec"){
				for(var i=0;i < chart_data.graphs.length; i++){
					if(i == 6 || i == 7){
						chart_data.showGraph(chart_data.graphs[i]);
					}else{
						chart_data.hideGraph(chart_data.graphs[i]);
					}
				}
				return false;
			}else if(action == "traffic"){
				for(var i=0;i < chart_data.graphs.length; i++){
					if(i == 3 || i == 4 || i == 5){
						chart_data.showGraph(chart_data.graphs[i]);
					}else{
						chart_data.hideGraph(chart_data.graphs[i]);
					}
				}
				return false;
			}else if (action == "plant"){

				// for snr
				// console.log(chart_data_snr);
				for(var i=0;i < chart_data_snr.graphs.length; i++){
					if(i == 0){
						chart_data_snr.showGraph(chart_data_snr.graphs[i]);
					}else{
						chart_data_snr.hideGraph(chart_data_snr.graphs[i]);
					}
				}


				// for fec
				for(var i=0;i < chart_data_fec.graphs.length; i++){
					if(i == 1 || i == 2 || i == 3){
						chart_data_fec.showGraph(chart_data_fec.graphs[i]);
					}else{
						chart_data_fec.hideGraph(chart_data_fec.graphs[i]);
					}
				}

				return false;
			}

		});
	}

	core_graph_start;
	core_graph_end;

	// traffic sa core
	cmtsUSGraph(data){

		// console.log(data.us_data.length);

		var nodes_list = data.nodes;
		if(data.status == 'failed'){
			// toaster.pop('error', "Error", data.message);
			// this.loading = false;
			// this.showUpstream = false;

		}else{

			if ( data.us_data.length > 0 ) 
			{
				 

				// this.showUpstream = true;
				var 
				length = data.us_data.length - 1, 
				temp_snr = 0, 
				max_snr = 0,
				temp_online = 0, 
				temp_offline = 0, 
				max_online = 0, 
				max_offline = 0, 
				temp_cor = 0, 
				temp_unc = 0, 
				max_unc = 0,
				max_cur = 0, 
				max_tra = 0, 
				temp_tra = 0;

				for(var counter = length; counter > 0; counter--){
					length--;
					 var cursnr = parseFloat(data.us_data[length].snr),
					 curonline = parseFloat(data.us_data[length].online),
					 curoffline = parseFloat(data.us_data[length].offline),
					 curcor = parseFloat(data.us_data[length].fec_correctables),
					 curunc = parseFloat(data.us_data[length].fec_uncorrectables),
					 curtra = parseFloat(data.us_data[length].traffic);

					temp_snr += cursnr;
					temp_online += curonline;
					temp_offline += curoffline;

					temp_cor += curcor;
					temp_unc += curunc;
					temp_tra += curtra; 

					if(cursnr > max_snr){max_snr = cursnr;}
					if(curonline > max_online){max_online = curonline;}
					if(curoffline > max_offline){max_offline = curoffline;}

					if(curcor > max_cur){max_cur = curcor;}
					if(curunc > max_unc){max_unc = curunc;}
					if(curtra > max_tra){max_tra = curtra;}
				}

				var snrcurrent = data.us_data[length].snr;
				var snraverage = (temp_snr / length).toFixed(0);
				var snrmaximum = max_snr;

				var onlinecurrent = data.us_data[length].online;
				var onlineaverage = (Math.round(temp_online / length)).toFixed(0);
				var onlinemaximum = max_online;

				var offlinecurrent = data.us_data[length].offline;
				var offlineaverage = (Math.round(temp_offline / length)).toFixed(0);
				var offlinemaximum = max_offline;

				this.feccocurrent = data.us_data[length].fec_correctables;
				this.feccoaverage =  (temp_cor / length).toFixed(4);
				this.feccomaximum = max_cur;

				this.fecuncocurrent = data.us_data[length].fec_uncorrectables;
				this.fecuncoaverage =  (temp_unc  / length).toFixed(4);
				this.fecuncomaximum = max_unc;

				var data_length = data.us_data.length - 1;	
				this.tracurrent = data.us_data[data_length].traffic;
				this.traaverage = ( temp_tra / data_length).toFixed(2);
				this.tramaximum = max_tra;

				var len = data['us_data'].length - 1;
				var alert_threshold = data["us_data"][len]['traffic_alert'];
				var warning_threshold = data["us_data"][len]['traffic_warning'];

				var valueAxes = [{ "id":"v1","maximum": alert_threshold, "bullet" : "square","position": "left"}, 
								 { "id":"v2","minimum": 0, "guides": [{"value": 25,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#44F", "above": true},{"value": 20,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#F51D30", "above": true}], "bullet" : "square", "axisColor": "#FE8919", "position": "left"}, 
								 { "id":"v3","maximum": 6,"guides": [{"value": 0.5,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#F51D30", "above": true},{"value": 2.5,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#157419", "above": true}], "bullet" : "square", "axisColor": "#000", "position": "left", "axisAlpha": 2},
								 { "id":"v4", "bullet" : "square","position": "left" }];
				
				var graphCount = [{ "valueAxis": "v4", "lineThickness" : 1.5, "lineColor": "#0F0", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Online", "balloonText": "Online = [[value]]", "valueField": "online", "fillAlphas": 0}, 
							  	  { "valueAxis": "v4", "lineThickness" : 1.5, "lineColor": "#F00", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Offline", "balloonText": "Offline = [[value]]", "valueField": "offline", "fillAlphas": 0}]; 	  
				var graphSnr = [{ "valueAxis": "v2", "lineColor": "#FF7D00", "fillColors": "#FF7D00", "fillAlphas": 0.9, "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "SNR", "balloonText": "SNR = [[value]]", "valueField": "snr"}];	
				
				var graphFec = [{ "valueAxis": "v3", "lineThickness" : 1.5, "lineColor": "#13C455", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Correctables", "balloonText": "", "valueField": "fec_correctables"}, 
							  	{ "valueAxis": "v3", "lineThickness" : 1.5, "lineColor": "#FF4105", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Uncorrectables", "balloonColor":  "gray" ,"balloonText": "<p> <div style='margin-top:3px; margin-right:5px; float:left; border-radius: 25px;border: 1px solid white;width: 10px;height: 10px; background-color: #13C455;'></div>Correctables = [[fec_correctables]]</p> <p><div style='margin-top:3px; margin-right:5px; float:left; border-radius: 25px;border: 1px solid white;width: 10px;height: 10px; background-color: #FF4105;'></div>Uncorrectables = [[value]] </p>", "valueField": "fec_uncorrectables", "fillAlphas": 0}];
				
				var graphTraffic = [{ "valueAxis": "v1", "lineColor": "#00CF00", "fillColors": "#00CF00", "fillAlphas": 0.9, "bullet": "square", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic", "balloonText": "Traffic In = [[value]]", "valueField": "traffic"},
									{ "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#ff0000", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic Alert", "balloonText": "Traffic Alert = [[value]]", "valueField": "traffic_alert"},
									{ "valueAxis": "v1", "lineThickness" : 2, "lineColor": "#ff9900", "bullet": "diamond", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic Warning", "balloonText": "Traffic Warning = [[value]]", "valueField": "traffic_warning"}
									];
				
				// this.createGraph("cmts_uschart_count", data["us_data"], "mm", valueAxes, graphCount, "date");
				// this.createGraph("cmts_uschart_snr", data["us_data"], "mm", valueAxes, graphSnr, "date");
				// this.createGraph("cmts_uschart_fec", data["us_data"], "mm", valueAxes, graphFec, "date");
				// console.log(data["us_data"]);
				this.createGraph("cmts_uschart_traffic", data["us_data"], "mm", valueAxes, graphTraffic, "date" );
				this.createGraph("usn_chart"+this.port_active+"traffic", data["us_data"], "mm", valueAxes, graphTraffic, "date" );
				

				if(data['us_data'][0]){
					this.cmts_date_srange = moment(data['us_data'][0].date).format('L');
					this.cmts_time_srange = moment(data['us_data'][0].date).format('HH:mm');
					this.core_graph_start = this.reformatData(this.cmts_date_srange+" "+this.cmts_time_erange);
				}

				if(data['us_data'][data['us_data'].length - 1]){
					this.cmts_date_erange = moment(data['us_data'][data['us_data'].length-1].date).format('L');
					this.cmts_time_erange = moment(data['us_data'][data['us_data'].length-1].date).format('HH:mm');
					this.core_graph_end = this.reformatData(this.cmts_date_erange+" "+this.cmts_time_erange);
				}
			}
			else 
			{
				this.createGraph("cmts_uschart_traffic", [], "mm", valueAxes, graphTraffic, "date" );
				this.createGraph("usn_chart"+this.port_active+"traffic", [], "mm", valueAxes, graphTraffic, "date" );

				// setTimeout(()=>{     
				// 	this.historicValueAxes({"freq" : "freq_chart"} , "historic", []);
			 // 	}, 1500);

			}
		}
	}

	getUSGraphData(display, category){
		const upstream_body = {postData:[]}
		this.http.post<any>('http://182.18.194.188/nms/authbasic/upstream/'+this.cm_id+'.'+display, upstream_body).subscribe(data => {
			this.upstream = data.stream_data;
			this.upstream_raw = data;


 			if ( Object.keys(data).length === 0 ) {
 				// code...
 			}
 			else{
 				// console.log('g');
 				this.cmtsNUSGraph(this.upstream_raw, category);
 				this.portRow(this.port_active, 'plant');
 				// this.upstreamView('plant', this.port_active);
 			}
			
			return true;
		});

		
	}

	cmtsGraphData;

	getCMTSGraphData(cm_id, type, display, postdata, change_type){
		// console.log('getCMTSGraphData');
		if(!display && type == "ds"){ display = ""; }
		if(display == undefined){
			display = 3;
		}

		if(type == "us"){ var url = "api/centralstream/us/" + cm_id + "."+ display; }
		else if(type == "ds"){ var url = "api/centralstream/ds/"  + cm_id  +"."+ display;}
		else if(type=="summaryds"){ var url = "api/centralstream/ds/" + cm_id +"."+ display + '.summary';console.log('test123');}
		else if(type=="summaryus"){ var url = "api/centralstream/us/" + cm_id +"."+ display + '.summary'}

		if(postdata == undefined){
			var body = [];
		}
 		
 		const input = {port: this.port_array[this.port_active]};
 
    	this.http.post<any>('http://182.18.194.188/nms/authbasic/'+url, input).subscribe(data => {
    		this.cmtsGraphData = data;
    		this.cmtsUSGraph(data);

    		if (change_type == 'port_change') 
    		{

	    		if (data.us_data.length > 0 ) {
	    			this.getHistoricGraph('d', 'view', '', 'core');

	    			const upstream_body = {postData:[]}
	 		
		    		this.http.post<any>('http://182.18.194.188/nms/authbasic/upstream/'+this.cm_id+'.'+display, upstream_body).subscribe(data => {
		    			this.upstream = data.stream_data;
		    		});
	    		}
	    		else 
	    		{
	    			this.historicValueAxes({"freq" : "freq_chart"} , "historic", []);
	    		}

			}

			this.loader = false;
		});
 	
	}

	summary_neighbor;
	tracurrent_ds;
	traaverage_ds;
	tramaximum_ds;

	cmtsNDSGraph(data, category, portds_active){
		var data = this.downstream_raw;
		var selectOptions = [];

		var color = ["#0F0", "#00CF00", "#00BF47", "#00BF47", "#00A348", "#009485" , "#008A6D", 
					"#008A77", "#008A6D", "#007283", "#00694A", "#005D57", "#004359", "#00234B", "#001D61", "#00004D"];
 
		var self = this;
		Object.values(data.stream_data).forEach(function(value, key) {
 
			var length = value['ds_data'].length - 1,c = value['ds_data'].length - 1,average_duration =  value['ds_data'].length - 1,
			temp_ds = 0,max_ds = 0,temp_ds= 0,sizel = (length > 864) ? length - 864 : length;

			for(var counter = average_duration; counter > 0; counter--){
				var curds = parseFloat(value['ds_data'][length].traffic);
				length--;
				temp_ds += curds;
				if(max_ds < curds){ max_ds = curds }
			}

			var max_ds_average = self.getMaxDownstreamData(value['ds_data']);

			Object.values(data.stream_data)[key]['traffic_current'] = (value['ds_data'][c].traffic).toFixed(2);
			Object.values(data.stream_data)[key]['traffic_average'] = (temp_ds / average_duration).toFixed(2);
			Object.values(data.stream_data)[key]['traffic_max'] = (max_ds).toFixed(2);
			var new_max = self.getMaxDS(value['ds_data']);
			new_max = (new_max).toFixed(2);
 
 			var ds_port_threshold
 			var ds_critical
 			var ds_alarming
 			var ds_warning
 			var ds_good

			if (self.status_info.status){
				ds_port_threshold = self.status_info.status.threshold;
	            ds_critical = ds_port_threshold * self.status_info.status.threshold_critical;
	            ds_alarming = ds_port_threshold * self.status_info.status.threshold_alarming;
	            ds_warning = ds_port_threshold * self.status_info.status.threshold_warning;
	            ds_good = ds_port_threshold * self.status_info.status.threshold_good;
			}
			else{
				ds_port_threshold = 37;
	            ds_critical = ds_port_threshold;
	            ds_alarming = ds_port_threshold * .95;
	            ds_warning = ds_port_threshold * .90;
	            ds_good = ds_port_threshold * .70;
			}

			var traout;
            
            if(new_max < ds_good){
            	traout = "good";
            }
            else if(new_max < ds_warning){
                traout = "good";
            }else if(new_max < ds_alarming){
                traout = "alarming";
            }else if(new_max >= ds_critical || new_max <= ds_critical){
                traout = "critical";
            }
            else{
                traout = "good";
            }

			selectOptions.push({
				name : key,
				data : value['ds_data'],
				traout : traout,
				traoutcurrent : Object.values(data.stream_data)[key]['traffic_current'],
				traoutaverage : Object.values(data.stream_data)[key]['traoutaverage'],
				traoutmaximum : (max_ds).toFixed(2) + "(" + new_max + ")"
			});

		});

		// console.log(selectOptions);
		this.ds_ports = selectOptions;

		var ctr = 0;
		var alpha = 2;
		var downstream_neighbor = [];

		Object.values(data.stream_data).forEach(function(value, key) {
			downstream_neighbor.push(
				{ "valueAxis": "v1", "lineColor": color[ctr],"type": "step", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 1, "title": key , "balloonText": key + " [[value]]", "valueField": key, "lineThickness" : 30, "lineAlpha" : 1}
			)
			alpha -= .1;
			ctr++;
		})
		// test
		// console.log(downstream_neighbor);
		this.summary_neighbor = downstream_neighbor;

		// $timeout(function(){
			var valueAxes = [{ "id":"v1", "guides": [{"value": 28,"lineAlpha": 2,"lineThickness" : 2,"lineColor" : "#FF9900", "above": true},{"value": 35,"lineAlpha": 1,"lineThickness" : 1,"lineColor" : "#FF0000", "above": true}] , "position": "left"}]; 
			var graphs = [{ "valueAxis": "v1", "lineColor": "#032D98", "bullet": "round", "bulletBorderThickness": 1, "hideBulletsCount": 30, "title": "Traffic Out", "balloonText": "Traffic Out = [[value]]", "valueField": "traffic", "fillAlphas": 0}];
			var ctr = 0;

			var self = this;
 
			Object.values(data.stream_data).forEach(function(value, key) {
				if (portds_active == key) 
				{
					self.tracurrent_ds = value['traffic_current'];
					self.traaverage_ds = value['traffic_average'];
					self.tramaximum_ds = value['traffic_max'];

					self.createGraph("dsn_chart"+ctr, value['ds_data'], "mm", valueAxes, graphs, "date");
					ctr++;

					if(value[0]){
						self.cmts_dsn_date_srange = moment(value['ds_data'][0].date).format('L');
						self.cmts_dsn_time_srange = moment(value['ds_data'][0].date).format('HH:mm');
					}
 
					if(value[Object.keys(value).length - 1]){
						self.cmts_dsn_date_erange = moment(value[Object.keys(value['ds_data']).length - 1].date).format('L');
						self.cmts_dsn_time_erange = moment(value[Object.keys(value['ds_data']).length - 1].date).format('HH:mm');
					}
				}

			});
		// });
	}

	getMaxDownstreamData(downstream){
		var downstream_bydate = [];
		var dates_max = [];
		var temp_max = 0;
		var length = 0;
		
		for(var i = 0; i< downstream.length - 1 ;i++){
			var date = downstream[i].date.split(" ");
			if(!downstream_bydate[date[0]]){
				downstream_bydate[date[0]] = [ downstream[i] ];
			}else{
				downstream_bydate[date[0]].push(downstream[i]);
			}
		}

		for(var ds_date in downstream_bydate){
			var max_ds = 0;
			length++;
			for(var ic = 0; ic < downstream_bydate[ds_date].length - 1; ic++){
				var current = downstream_bydate[ds_date][ic].traffic;
				if(current > max_ds){ max_ds = current };
			}
			dates_max[ds_date] = max_ds;
			temp_max += max_ds;
		}

		return temp_max / length;
	}


	getMaxDS(data){
		var temp_max;
		var max_ds;
		var count = data.length;
		var percentile = Math.floor(count * .95);
		var temp_data = [];

		data.forEach(function(value, key) {		
			temp_data.push({
				traffic : value.traffic,
			});
		});

		temp_data.sort(function(a, b){
		    var a1 = a.traffic, b1= b.traffic;
		    if(a1== b1) return 0;
		    return a1 > b1? 1: -1;
		});

		temp_max = temp_data.slice(0, percentile);
		max_ds = temp_data[temp_max.length - 1];

		return max_ds.traffic;
	}

	spanDSCore(span)
	{
		this.loader = true;
		const downstream_body = {postData:[]}
		this.http.post<any>('http://182.18.194.188/nms/authbasic/api/downstream/'+this.cm_id+'.'+span+'.list', downstream_body).subscribe(data => {
			this.downstream = data.stream_data;
			this.downstream_summary = data.ds_summary;
			this.downstream_raw = data;

			var typex = span == "1" ? "1" : span == "7" ? "w" : span == "31" ? "m" : "3" ;

			const cpeChannels_body = {cm_id: this.cm_id, type: typex, start: "", end:"" };

    		this.http.post<any>('http://182.18.194.188/nms/authbasic/graph_data', cpeChannels_body).subscribe(data => {
    			this.cmHistoricGraph(data, 'core');
    			this.loader = false;  
    		});


			this.portDS(0, 'core');
			this.loader = false;
		});
	}

	us_toggle = true;
	ds_toggle = false;

	UsDsToggle(toggle)
	{
		if (toggle == "us") {
 			
			this.us_toggle = true;
			this.ds_toggle = false;
			this.portRow(0, 'core');
		} 

		if (toggle == "ds") {
 			
			this.us_toggle = false;
			this.ds_toggle = true;
			this.portRow(0, 'core');
		}
	}


}
