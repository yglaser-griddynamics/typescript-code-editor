import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomAdmin } from './room-admin';

describe('RoomAdmin', () => {
  let component: RoomAdmin;
  let fixture: ComponentFixture<RoomAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
