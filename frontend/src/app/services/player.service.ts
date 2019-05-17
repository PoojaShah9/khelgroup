import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PlayerService {

    api = environment.apiUrl;
    constructor(private http: HttpClient) { }

    getPlayer(pageNumber, pagesize) {
        return this.http.get<any>(this.api + '/players/getplayerlist?pg=' + pageNumber + '&pgSize=' + pagesize);
    }

    setFilter(pageNumber, pagesize, data) {
        return this.http.post<any>(this.api + '/players/filterplayerlist?pg=' + pageNumber + '&pgSize=' + pagesize, data);
    }
}
