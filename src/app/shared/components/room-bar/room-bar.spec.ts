import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomBar } from './room-bar';

describe('RoomBar', () => {
  let component: RoomBar;
  let fixture: ComponentFixture<RoomBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
