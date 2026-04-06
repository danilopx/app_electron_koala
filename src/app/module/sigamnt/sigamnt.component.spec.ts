import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SigamntComponent } from './sigamnt.component';

describe('ProducaoComponent', () => {
  let component: SigamntComponent;
  let fixture: ComponentFixture<SigamntComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SigamntComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SigamntComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
