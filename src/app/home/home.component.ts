import { Component } from '@angular/core';
import { first } from 'rxjs/operators';

import { User } from '@app/_models';
import { UserService, AuthenticationService } from '@app/_services';

import { HttpHeaders, HttpClient } from '@angular/common/http';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent {
    loading = false;
    users: User[];
    postId;
    url_get;
    url_post;

    constructor(private userService: UserService, private http: HttpClient) { }

    ngOnInit() {
        this.loading = true;
        this.userService.getAll().pipe(first()).subscribe(users => {
            this.loading = false;
            this.users = users;
        });
 
        this.url_get = 'http://182.18.194.188/meralcoadvisory/get-by-date-and-city/Nov%2001,%202019/Dec%2031,%202019';
        this.url_post = 'http://182.18.194.188/nms/analytics/get_associated_accounts';

        const headers = { 'Content-Type':  'application/json', 'Cookie': 'auth=1249; token=%2231f227fe13a5dfa5b8aafc7e8ae29c82811517f337ec3ce39c495cc0a5ef6d4a41ba359d1d8d0d12de26e28814264ab9dce4808e4076f4e5b51483914250c96710d057bfd7ae%22; department_id=4' };

        const body = {acct_no: "678422738", type: true};

        this.http.post<any>(this.url_post, body, { headers }).subscribe(data => {
            this.postId = data;
        });
        
        this.http.get<any>(this.url_get).subscribe(data => {
            this.postId = data;
        });

    }
}