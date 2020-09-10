import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
declare var $:any;

@Component({
  selector: 'app-pathtrak',
  templateUrl: './pathtrak.component.html',
  styleUrls: ['./pathtrak.component.less']
})
export class PathtrakComponent implements OnInit {

  loader = true;
  constructor(
	  	private http: HttpClient,
	  	private sanitizer: DomSanitizer
  	) 
  	{}
  pathtrak_label;

  embed_spectrum_raw;
  embed_spectrum_info;
  embed_spectrum_name;

  embed_qamtrak_raw;
  embed_qamtrak_info;
  embed_qamtrak_name;

  embed_mv_raw;
  embed_mv_info;
  embed_mv_name;

  embed_ealarm_raw;
  embed_ealarm_info;
  embed_ealarm_name;

  embed_pv_raw;
  embed_pv_info;
  embed_pv_name;

  recent_searches;
  recent_search_length;
  init1;

  pathrakSearchForm = new FormGroup({
  	node: new FormControl(''),
  });

  ngOnInit() {
  	this.recentSearchInit();
  }

  nodePathrakSearch() {

  	this.loader = true;
  	this.pathtrak_label = null;
  	$('.toast').toast({animation: true, delay: 3000});
  	this.iframeRefresh();

  	const body = {node: this.pathrakSearchForm.value.node.trim()};

  	this.http.post<any>('http://182.18.194.188/nms/authbasic/node_pathrak_info2', body).subscribe(data => {

  		if ( data == null ) 
  		{
  		 	$('.toast').toast('show');
		  }
      else
      {
        var api_list = data.api_list;
        var api_info = data.info;

        this.pathtrak_label = api_info.name;

        // spectrum
        this.embed_spectrum_raw = api_list[0].api;
        this.embed_spectrum_info = this.sanitizer.bypassSecurityTrustResourceUrl(api_list[0].api);
        this.embed_spectrum_name = api_list[0].name;

        // qamtrak
        this.embed_qamtrak_raw = api_list[1].api;
        this.embed_qamtrak_info = this.sanitizer.bypassSecurityTrustResourceUrl(api_list[1].api);
        this.embed_qamtrak_name = api_list[1].name;

        this.embed_mv_raw = api_list[2].api;
        this.embed_mv_info = this.sanitizer.bypassSecurityTrustResourceUrl(api_list[2].api);
        this.embed_mv_name = api_list[2].name;

        this.embed_ealarm_raw = api_list[3].api;
        this.embed_ealarm_info = this.sanitizer.bypassSecurityTrustResourceUrl(api_list[3].api);
        this.embed_ealarm_name = api_list[3].name;

        this.embed_pv_raw = api_list[4].api;
        this.embed_pv_info = this.sanitizer.bypassSecurityTrustResourceUrl(api_list[4].api);
        this.embed_pv_name = api_list[4].name;

        this.recentSearchInit();
      }

		this.loader = false; 

  	});

  }

  newWindowLink(link) {
 
  	var MyWindow = window.open(link,'MyWindow','width=600,height=300'); 
  	return false;
  }

  iframeRefresh() {
  	this.embed_spectrum_info = false;
  	this.embed_qamtrak_info = false;
  	this.embed_mv_info = false;
  	this.embed_ealarm_info = false;
  	this.embed_pv_info = false;
  }

  recentSearchInit() {

  	this.http.post<any>('http://182.18.194.188/nms/authbasic/pathrak/view_search_pathrak', []).subscribe(data => {

  		if( data == null )
  		{
  			console.log("data is null");
  		}
  		else
  		{
  			this.recent_searches = data;
  			this.recent_search_length = data.length;
  			
  		}

  		this.init1 = true;
  		this.oninitLoader();
  	});

  }

	selectPathrakSearch(node)
	{
    	this.pathrakSearchForm.patchValue({
        	node: node
    	});

    	this.nodePathrakSearch();
	}

	oninitLoader()
	{
		var init1 = this.init1;


		if (init1) 
		{
			this.loader = false;
		}
		else 
		{
			this.loader = true;
		}
	}

  showTab;

  navTab(data)
  {
    this.showTab = data;
  }

}
