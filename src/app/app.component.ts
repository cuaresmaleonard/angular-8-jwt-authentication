import { Component } from '@angular/core';
import { Router , NavigationEnd } from '@angular/router';

import { AuthenticationService } from './_services';
import { User } from './_models';

import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    currentUser: User;
    route: string;
    public currentUserInfo;

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private location: Location
    ) {
        this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
        this.currentUserInfo = this.authenticationService.currentUser.source['_value'];
        // console.log(this.currentUserInfo);
        this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe(event => { 
            this.route = event.url;
            // console.log(this.route);  
        });
    }
    

    logout() {
        this.authenticationService.logout();
        this.router.navigate(['/login']);
    }
}