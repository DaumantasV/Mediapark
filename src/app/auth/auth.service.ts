import { Router } from '@angular/router';

import { Credentials } from './credentials.model';
import { CREDENTIALS } from './credentials';
import { Injectable } from '@angular/core';

@Injectable()
export class AuthService {
  loggedIn = false;

  constructor(private router: Router) {}

  isAuthenticated() {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.getLoggedIn());
      }, 800);
    });
    return promise;
  }

  getLoggedIn(): boolean {
    if (localStorage.getItem('loggedIn') === 'true') {
      return true;
    } else {
      return false;
    }
  }

  setLoggedIn(loggedIn: boolean): void {
    if (loggedIn) {
      localStorage.setItem('loggedIn', 'true');
    } else {
      localStorage.setItem('loggedIn', 'false');
    }
  }

  login(credentials: Credentials) {
    if (
      credentials.email === CREDENTIALS.email &&
      credentials.password === CREDENTIALS.password
    ) {
      this.loggedIn = true;
      this.setLoggedIn(this.loggedIn);
      this.router.navigate(['/list']);
    }
  }

  logout() {
    this.loggedIn = false;
    this.setLoggedIn(this.loggedIn);
    sessionStorage.clear();
    this.router.navigate(['/auth']);
  }
}
