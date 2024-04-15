import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToastModule
  ],
  providers:[
    MessageService
  ],
  template: ` 
    <router-outlet />
    <p-toast
      position="top-center"
    ></p-toast>
  `,
  styles: [],
})
export class AppComponent {}
