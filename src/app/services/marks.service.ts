import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Marksheet } from "../marksheet.model";

@Injectable({
  providedIn: 'root'
})
export class MarksService {

  constructor(private http: HttpClient) { }

  // url = 'http://localhost:3000/marksheet';
  url= '/marksheet'

  updateMarks(markData : Marksheet) {
    return this.http.post<any>(this.url + '/update', markData);
  }

  fetchMarks(subData: Marksheet) {
    return this.http.post<any>(this.url + '/fetch', subData);
  }
}
