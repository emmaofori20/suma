import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { ThemeService } from './app/services/theme.service';

// Register Chart.js components globally
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideIonicAngular({})
  ]
}).then(appRef => {
  // Initialize theme service
  const themeService = appRef.injector.get(ThemeService);
  themeService.initializeTheme();
});
