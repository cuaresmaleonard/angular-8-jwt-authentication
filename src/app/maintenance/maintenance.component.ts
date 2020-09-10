import { Component, OnInit } from '@angular/core';
import { Router , NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../_services';
import { User } from '../_models';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.less']
})
export class MaintenanceComponent implements OnInit {

  constructor(        
 		private router: Router,
        private authenticationService: AuthenticationService,
 		private http: HttpClient
    ) { }

  currentUser: User;
  public currentUserInfo;
  loader = true;
  error;
  
  ngOnInit( ) {

   	this.authenticate();
   	this.viewModulationProfile();
   	this.viewModulationThreshold();
    this.viewPathrakMaintenance();

  }

  authenticate() {

    this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
    this.currentUserInfo = this.authenticationService.currentUser.source['_value'];

    if (this.currentUserInfo.user_type) 
    {
      if (this.currentUserInfo.user_type != "Admin" || this.currentUserInfo.dept_id != '1') 
    	{
    		this.router.navigate(['/login'])
    	}
    }

  }

  modulation_profile = [];
  modulation_profile_length = 0;

  viewModulationProfile() {
  	this.http.post<any>('http://182.18.194.188/nms/authbasic/view_modulation_profile', []).subscribe(data => {
  		this.modulation_profile_length = data.length;
  		if(data.length > 0) {
  			this.modulation_profile = data;
  		}
  	  	this.loader = false;
  	});
  }

  modulation_profile_update = [];

  viewModulationProfileId(data) {
  	this.modulation_profile_update = data;
  }

  updateModulationProfile(data) {
  	this.loader = true;
  	this.http.post<any>('http://182.18.194.188/nms/authbasic/update_modulation_profile', data).subscribe(data => {
  		this.modulation_profile_length = data.length;
  		if(data.length > 0) {
  			this.modulation_profile = data;
  		}
  	  	this.loader = false;
  	}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

  modulation_threshold = [];
  modulation_threshold_length = 0;

  viewModulationThreshold() {
  	this.http.post<any>('http://182.18.194.188/nms/authbasic/view_modulation_threshold', []).subscribe(data => {
  		this.modulation_threshold_length = data.length;
  		if(data.length > 0) {
  			this.modulation_threshold = data;
  		}
  	  	this.loader = false;
  	}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

  modulation_threshold_update = [];

  viewModulationThresholdId(data) {
  	this.modulation_threshold_update = data;
  }

  updateModulationThreshold(data) {
 
  	this.loader = true;
  	this.http.post<any>('http://182.18.194.188/nms/authbasic/update_modulation_threshold', data).subscribe(data => {
  		this.modulation_threshold_length = data.length;
  		if(data.length > 0) {
  			this.modulation_threshold = data;
  		}
  	  	this.loader = false;
  	}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

  pathrak_ip;
  pathrak_api;
  pathrak_api_length;

  viewPathrakMaintenance() {
    this.http.post<any>('http://182.18.194.188/nms/authbasic/pathrak/view_pathrak_maintenance', []).subscribe(data => {
      if ( data != null ) 
      {
        this.pathrak_ip = data.ip;
        this.pathrak_api = data.api_list;
        this.pathrak_api_length = data.api_list.length; 
      }

    }, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

  pathrak_ip_update = [];

  viewPathrakIp(data) {
    this.pathrak_ip_update = data;
  }

  updatePathrakIp(data) {
    this.loader = true;
    this.http.post<any>('http://182.18.194.188/nms/authbasic/pathrak/update_pathrak_ip', {ip: data}).subscribe(data => {
      if ( data != null ) 
      {
        this.pathrak_ip = data.ip;
      }
        this.loader = false;
    }, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

  pathrak_api_update = [];

  viewPathrakApi(data) {
    this.pathrak_api_update = data;
  }

  updatePathrakApi(data) {
    this.loader = true;
    this.http.post<any>('http://182.18.194.188/nms/authbasic/pathrak/update_pathrak_api', data).subscribe(data => {
      if ( data != null ) 
      {
        this.pathrak_api = data.api_list;
        this.pathrak_api_length = data.api_list.length; 
      }
        this.loader = false;
    }, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

}
