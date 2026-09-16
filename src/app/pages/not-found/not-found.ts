import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <p class="code">404</p>
      <h1>We could not find that page</h1>
      <p class="muted">The link may be out of date, or the page may have moved.</p>
      <a class="home-link" routerLink="/dashboard">Go to the dashboard</a>
    </div>
  `,
  styles: `
    .not-found {
      min-height: 100vh;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 6px;
      padding: 24px;
      text-align: center;
    }

    .code {
      font-size: 56px;
      font-weight: 800;
      color: var(--primary);
      line-height: 1;
    }

    h1 {
      font-size: 20px;
    }

    .home-link {
      margin-top: 14px;
      padding: 9px 16px;
      border-radius: var(--radius-sm);
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      text-decoration: none;
    }
  `,
})
export class NotFound {}
