import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements OnInit {

 
	profile_avatar;
  pinned_list = [];
  loader = true;
  constructor(private http: HttpClient) { }

  ngOnInit() {

  	this.viewProfileAvatar()
    this.viewPinnedAnalytics();
  }

  pinned_list_page = 0;
  pinned_list_paginated;
  pinned_list_length = 0;

  viewPinnedAnalytics() {
    this.http.post<any>('http://182.18.194.188/nms/authbasic/view_pinned_analytics', []).subscribe(data => {
      if (data.paginated) 
      {
        this.pinned_list = data.paginated[this.pinned_list_page];
        this.pinned_list_paginated = data.paginated;
        this.pinned_list_length = data.paginated.length;
 
      }

 
      this.loader = false;
    });
  }

  insertPinnedAnalytics(data) {
    this.loader = true;
    const body = {account_number: data};

    this.http.post<any>('http://182.18.194.188/nms/authbasic/insert_pinned_analytics', body).subscribe(data => {
      this.viewPinnedAnalytics()  
      this.loader = false;
    });
  }

  deletePinnedAnalytics(data) {
    this.loader = true;
    const body = {account_number: data.account_number};

    this.http.post<any>('http://182.18.194.188/nms/authbasic/delete_pinned_analytics', body).subscribe(data => {
      this.viewPinnedAnalytics()  
      this.loader = false;
    });
  }

  viewProfile() {
  	this.http.post<any>('http://182.18.194.188/nms/authbasic/view_profile', []).subscribe(data => {
  		// this.profile = data;
  	});
  }

  viewProfileAvatar() {
	this.http.post<any>('http://182.18.194.188/nms/authbasic/view_profile_avatar', []).subscribe(data => {
      this.loader = false;
  		this.profile_avatar = data;
  	});
  }

  avatarSelect(data) {
  	this.updateProfileAvatar(data);
  }

  updateProfileAvatar(data) {
    this.loader = true;
  	const body = {gender: data.gender};

	this.http.post<any>('http://182.18.194.188/nms/authbasic/update_profile_avatar', body).subscribe(data => {
		this.profile_avatar = data;
    this.loader = false;
  	});
  }

  paginateNum(page){
 
    this.pinned_list_page = page;
    this.pinned_list = this.pinned_list_paginated[page];


  }

}