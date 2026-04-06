import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemessaComponent } from './remessa.component';

describe('RemessaComponent', () => {
  let component: RemessaComponent;
  let fixture: ComponentFixture<RemessaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemessaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemessaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
