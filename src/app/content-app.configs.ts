import { ApplicationConfig, NgZone, ɵNoopNgZone } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const contentAppConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    {
      provide: NgZone, 
      useClass: ɵNoopNgZone
    }
  ]
};
