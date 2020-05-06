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

        console.log(this.userService.getAll());
 
 
        this.url_get = 'http://182.18.194.188/nms/cmts/dashboard_drop_list';
        this.url_post = 'http://182.18.194.188/nms/authbasic/get_associated_accounts';

        const body = {acct_no: "678422738", type: true}; 

         // const body = {acct_no: "678422738", type: true};
     
        this.http.post<any>(this.url_post, body).subscribe(data => {
            this.postId = data;
            console.log(this.postId);
        });
         
        // this.http.get<any>(this.url_get, {headers} ).subscribe(data => {
        //     this.postId = data;
        // }); 

        this.loadJSChecker();

    }

    loadJSChecker()
    {
        if (window.addEventListener)
        {
            addEventListener('load', this.loadJSAtOnload, false);
        }
        else if ((<any>window).attachEvent)
        {
            (<any>window).attachEvent('onload', this.loadJSAtOnload);
        }
        else 
        {
            window.onload = this.loadJSAtOnload;
        }
    }

    loadJSAtOnload() {
        var scripts = [
            "/assets/style/vendor/chart.js/Chart.min.js",
            "/assets/style/js/charts-home.js"
        ];

        for (var i = 0; i < scripts.length; i++) {
            console.log('Loading script ' + scripts[i]);
            var scriptType = document.createElement('script');
            scriptType.src = scripts[i];
            document.body.appendChild(scriptType);  
        }

    };



}