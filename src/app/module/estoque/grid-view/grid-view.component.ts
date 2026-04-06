//import { environment } from 'src/environments/environment'
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PoMenuItem, PoModalComponent, PoTableColumn,PoLoadingModule,PoPageModule, PoPageDetailLiterals    } from '@po-ui/ng-components';

import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { PoNotificationService } from '@po-ui/ng-components';
//import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-grid-view',
  templateUrl: './grid-view.component.html'
})
export class GridViewComponent implements OnDestroy, OnInit {

  private readonly url: string = /*environment.api +*/ '/nfe';

  private gridRemoveSub!: Subscription;
  private gridSub!: Subscription;
  private paramsSub!: Subscription;
  private headers!: HttpHeaders;
  action!: string;
  breadcrumb!: '';
  breadcrumbItem: any;
  breadcrumbParams: any;
  customLiterals!: PoPageDetailLiterals;
  literals!: string;
  params!: any;
  title!: string;

  grid: any = {};

  constructor(
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private poNotification: PoNotificationService,
  //  private auth!: AuthService
    
    ) { }

  ngOnInit() {
   // this.headers = new HttpHeaders().set('Authorization', 'Bearer ' + this.auth.getToken());
    this.paramsSub = this.route.params.subscribe(params => this.loadData(params['id']));

    this.restore();
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
    this.gridSub.unsubscribe();

    if (this.gridRemoveSub) {
      this.gridRemoveSub.unsubscribe();
    }
  }

  back() {
    this.router.navigateByUrl('grid');
  }

  edit() {
    this.router.navigateByUrl(`grid/edit/${this.grid.id}`);
  }

  remove() {
  /*  this.gridRemoveSub = this.httpClient.delete(`${this.url}?id=eq.${this.grid.id}`, { headers: this.headers })
      .subscribe(() => {
        this.poNotification.warning('Registro apagado com sucesso.');

        this.back();
      });*/
  }

  private loadData(id: any) {
 /*   this.gridSub = this.httpClient.get(`${this.url}?id=eq.${id}`, { headers: this.headers })
      .pipe(
        map((grid: any) => {
          return grid[0];
        })
      )
      .subscribe(response => this.grid = response);

      */
  }

  restore() {
    this.action = '';
 
    this.breadcrumbItem = { label: undefined, link: undefined };
    this.breadcrumbParams = {};

    this.literals = '';
    this.title = 'PO Page Detail';
  }

}
