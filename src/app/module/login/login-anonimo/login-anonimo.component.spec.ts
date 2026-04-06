import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginAnonimoComponent } from './login-anonimo.component';

describe('LoginAnonimoComponent', () => {
  let component: LoginAnonimoComponent;
  let fixture: ComponentFixture<LoginAnonimoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginAnonimoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginAnonimoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
