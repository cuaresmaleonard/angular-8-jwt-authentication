import { Component, OnInit } from '@angular/core';
import { Router , NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../_services';
import { User } from '../_models';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.less']
})
export class UserComponent implements OnInit {

  constructor(
		private router: Router,
		private authenticationService: AuthenticationService,
		private http: HttpClient
  	) { }
  
  currentUser: User;
  public currentUserInfo;
  loader = true;
  error;

  ngOnInit() {
  	this.authenticate();
  	this.viewGroup();

  	// this.loader = false;
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

  user_group;
  user_group_length;

  viewGroup() {
  	this.loader = true;
  	this.http.post<any>('http://182.18.194.188/nms/authbasic/user/view_user_group', []).subscribe(data => {
  		if (data != null) 
  		{
  			this.user_group_length = data.length;
  			if(data.length > 0) {
  				this.user_group = data;
  			}
  		}
 
  	  	this.loader = false;
  	}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  }

	users;
	users_length = 0;
	page_index;
	dept_id;
	page_length;
	page_num;

	selectGroupChange(data, index) 
	{
	  	this.dept_id = data;
	  	var body;
	  	var page_index;

	  	if (index == 0) 
	  	{	
 			page_index = index;
	  	}
	  	else
	  	{
 			page_index = this.page_index - 1;
	  	}
	  	
 

	  	if ( this.dept_id ) 
	  	{	
	  		if ( this.dept_id.trim() != "null" ) 
	  		{

			  	if ( this.search ) 
			  	{
			  		if ( this.search.trim() ) 
			  		{
			  			body = { dept_id:this.dept_id, search:this.search.trim(), index:page_index };
			  		}
			  		else
			  		{
			  			body = { dept_id:this.dept_id, index:page_index };
			  		}
			  	}
			  	else
			  	{
			  		body = { dept_id:this.dept_id, index:page_index };
			  	}

			  	this.loader = true;
			  	this.http.post<any>('http://182.18.194.188/nms/authbasic/user/view_users_dept', body).subscribe(data => {
					if (data.data != null) 
					{
						this.users_length = data.data.length;
						if(data.data.length > 0) {
							this.users = data.data;
							this.page_length = data.pagination.page_length;
							this.page_num = data.pagination.page_num;
							this.page_index = data.pagination.page_index;
						}
					}
					else
					{
						this.users_length = 0;
						this.page_length = 0;
						this.users = [];
					}
				
				  	this.loader = false;
				}, error => { this.error = error; console.log(this.error) });

		  	}

	  	}
	  	else
	  	{
	  		this.searchUsers(this.search, this.page_index);
	  	}

  	}

  	search;

  	searchUsers(data, index) 
  	{
	  	this.search = data;

	  	var body;
	  	var page_index;

	  	if (index == 0) 
	  	{
	  		page_index = index;
	  	}
	  	else
	  	{
	  		page_index = this.page_index - 1;
	  	}

	  	if ( this.search ) 
	  	{
	  		if ( this.search.trim() ) 
	  		{
	  			if ( this.dept_id ) 
	  			{
	  				if ( this.dept_id.trim() != "null" ) 
	  				{
	  					body = { search:this.search, dept_id:this.dept_id.trim(), index:page_index };
	  				}
	  				else
	  				{
	  					body = { search:this.search, index:page_index };
	  				}
	  			}
	  			else
	  			{
	  				body = { search:this.search, index:page_index };
	  			}

	  			this.loader = true;
 
	  			this.http.post<any>('http://182.18.194.188/nms/authbasic/user/search_users', body).subscribe(data => {
	  				if (data.data != null) 
	  				{
	  					this.users_length = data.data.length;
	  					if(data.data.length > 0) {
	  						this.users = data.data;
	  						this.page_length = data.pagination.page_length;
	  						this.page_num = data.pagination.page_num;
	  						this.page_index = data.pagination.page_index;
	  					}
	  				}
	  				else
	  				{
	  					this.users_length = 0;
	  					this.page_length = 0;
	  					this.users = [];
	  				}
	  			
	  			  	this.loader = false;
	  			}, error => { this.error = error; this.loader = false; alert("an error has occured") });
	  		}

	  	}
	  	else
	  	{
	  		this.selectGroupChange(this.dept_id, this.page_index);
	  	}

  	}

  	paginateNum(data) {
  		this.page_index = data;
  		
  		// either searchUsers() or selectGroupChange() should work
  		this.searchUsers(this.search, this.page_index);
  	}

  	user_update;

  	viewUserId(data) {
  		this.user_update = data;
  	}

  	updateUser(data) {
  		this.loader = true;

  		this.http.post<any>('http://182.18.194.188/nms/authbasic/user/update_user', data).subscribe(data => {
  		  if ( data.status == "success" ) 
  		  {
  		    this.searchUsers(this.search, this.page_index);
  		  }
  		    this.loader = false;
  		}, error => { this.error = error; this.loader = false; alert("an error has occured") });
  	}

}
