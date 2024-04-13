import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ContentAppComponent } from './app/content-app.component';
import { contentAppConfig } from './app/content-app.configs';

const isChromeExtensionUrl = window.location.href.startsWith('chrome-extension://');

if (isChromeExtensionUrl) { // 如果是 Chrome Extension 的話，就用 AppComponent
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
} else { // 如果不是 Chrome Extension 的話，就用 ContentAppComponent (content script 用的)
  bootstrapApplication(ContentAppComponent, contentAppConfig)
    .catch((err) => console.error(err));
}