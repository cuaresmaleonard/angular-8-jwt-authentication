import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { LoginComponent } from './login';
import { AnalyticsComponent } from './analytics/analytics.component';
import { IncidentsComponent } from './incidents/incidents.component';
import { PathtrakComponent } from './pathtrak/pathtrak.component';
import { ProfileComponent } from './profile/profile.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { UserComponent } from './user/user.component';
import { AuthGuard } from './_helpers';

const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard] },
    { path: 'incidents', component: IncidentsComponent, canActivate: [AuthGuard] },
    { path: 'pathtrak', component: PathtrakComponent, canActivate: [AuthGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    { path: 'maintenance', component: MaintenanceComponent, canActivate: [AuthGuard] },
    { path: 'user', component: UserComponent, canActivate: [AuthGuard] },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

export const appRoutingModule = RouterModule.forRoot(routes);