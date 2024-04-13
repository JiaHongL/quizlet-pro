import { Routes } from '@angular/router';
import { PopupComponent } from './pages/popup/popup.component';
import { OptionsComponent } from './pages/options/options.component';

export const routes: Routes = [
    { path: 'popup', component: PopupComponent },
    { path: 'options' , component: OptionsComponent },
    { path: '**', redirectTo: 'options', pathMatch: 'full' },
];
