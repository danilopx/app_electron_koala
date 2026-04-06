import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoRTComponent } from './pedidoRT.component';

describe('PedidoRTComponent', () => {
  let component: PedidoRTComponent;
  let fixture: ComponentFixture<PedidoRTComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PedidoRTComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidoRTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
