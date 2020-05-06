import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { AnalyticsComponent } from './analytics/analytics.component';
import { IncidentsComponent } from './incidents/incidents.component';
import { PathtrakComponent } from './pathtrak/pathtrak.component';
import { AuthGuard } from './_helpers';

const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard] },
    { path: 'incidents', component: IncidentsComponent, canActivate: [AuthGuard] },
    { path: 'pathtrak', component: PathtrakComponent, canActivate: [AuthGuard] },
    
    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

export const appRoutingModule = RouterModule.forRoot(routes);