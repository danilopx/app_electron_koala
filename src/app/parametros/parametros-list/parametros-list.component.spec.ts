import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametrosListComponent } from './parametros-list.component';

describe('ParametrosListComponent', () => {
  let component: ParametrosListComponent;
  let fixture: ComponentFixture<ParametrosListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametrosListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParametrosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
