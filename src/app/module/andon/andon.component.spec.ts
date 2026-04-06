import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AndonComponent } from './andon.component';

describe('AndonComponent', () => {
  let component: AndonComponent;
  let fixture: ComponentFixture<AndonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AndonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AndonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
