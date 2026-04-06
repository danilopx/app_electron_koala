import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntercompanyComponent } from './intercompany.component';

describe('IntercompanyComponent', () => {
  let component: IntercompanyComponent;
  let fixture: ComponentFixture<IntercompanyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntercompanyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntercompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
