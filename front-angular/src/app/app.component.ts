import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.development';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  apiResponse: any = null;
  connectionFailed = false;
  isApiUp = false;
  isDbConnected = false;
  
  healthEndpoint = `${environment.apiUrl}/health`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef, // <-- Helps force UI updates
    @Inject(PLATFORM_ID) private platformId: Object // <-- Helps check if we are in the browser
  ) {}

  ngOnInit() {
    // In Angular 17+, we must ensure this only runs in the user's browser, 
    // not during the server-side pre-rendering process.
    if (isPlatformBrowser(this.platformId)) {
      this.checkSystemStatus();
    }
  }

  checkSystemStatus() {
    this.http.get(this.healthEndpoint).subscribe({
      next: (res: any) => {
        console.log("Success! Angular received:", res); // Check your browser console
        
        this.apiResponse = res;
        this.isApiUp = res?.server === 'up';
        this.isDbConnected = res?.database === 'connected';
        this.connectionFailed = false;

        // Force Angular to update the HTML right now
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Angular Error:", err);
        
        this.connectionFailed = true;
        this.isApiUp = false;
        this.isDbConnected = false;
        this.apiResponse = { 
          error: "API Server is offline or blocked by CORS", 
          attempted_url: this.healthEndpoint,
          details: err.message
        };

        // Force Angular to update the HTML right now
        this.cdr.detectChanges();
      }
    });
  }
}