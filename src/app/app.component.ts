import { Component } from '@angular/core';
import { Router , NavigationEnd } from '@angular/router';

import { AuthenticationService } from './_services';
import { User } from './_models';

import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';

@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUser: User;
    route: string;
    public currentUserInfo;
    profile;

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private location: Location,
        private http: HttpClient
    ) {
        this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
        this.currentUserInfo = this.authenticationService.currentUser.source['_value'];
        // console.log(this.currentUserInfo);
        this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe(event => { 
            this.route = event.url;
            // console.log(this.route);  
        });
    }
    
    ngOnInit() {
        if (this.currentUserInfo)
        {
            this.viewProfile();
        }
        

    }

    viewProfile() {
        this.http.post<any>('http://182.18.194.188/nms/authbasic/view_profile', []).subscribe(data => {
            if (data.length > 0) 
            {
                this.profile = data[0];
            }

        });
    }

    logout() {
        this.authenticationService.logout();
        this.router.navigate(['/login']);
    }
}