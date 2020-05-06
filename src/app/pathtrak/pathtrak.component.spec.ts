import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PathtrakComponent } from './pathtrak.component';

describe('PathtrakComponent', () => {
  let component: PathtrakComponent;
  let fixture: ComponentFixture<PathtrakComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PathtrakComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PathtrakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
