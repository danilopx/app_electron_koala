import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Component({
    selector: 'google-maps-demo',
    templateUrl: 'google-maps-demo.component.html',
})
export class GoogleMapsDemoComponent {


    apiLoaded: Observable<boolean>;

    constructor(httpClient: HttpClient) {
        // If you're using the `<map-heatmap-layer>` directive, you also have to include the `visualization` library 
        // when loading the Google Maps API. To do so, you can add `&libraries=visualization` to the script URL:
        // https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization

        this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyCgsKsuRS4Zk7TqVIk6PRsCm3O7gJ7y1D4', 'callback')
            .pipe(
                map(() => true),
                catchError(() => of(false)),
            );
    }

  /*  center: google.maps.LatLngLiteral = { lat: -25.4996137704187, lng: -49.32880099708443 };
    zoom = 18;
    markerOptions: google.maps.MarkerOptions = { draggable: false , title : 'wwww'};
    markerPositions: google.maps.LatLngLiteral[] = [{ lat: -25.4996137704187, lng: -49.32880099708443 }];
    mapTypeId = google.maps.MapTypeId.SATELLITE;
*/






}
