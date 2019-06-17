import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  api = environment.apiUrl;
  constructor(private http: HttpClient) { }

  login(data) {
    return this.http.post<any>(this.api + '/players/loginplayer', data);
  }
}
