import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomCreateCardComponent } from './room-create-card.component';

describe('RoomCreateCard', () => {
  let component: RoomCreateCardComponent;
  let fixture: ComponentFixture<RoomCreateCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomCreateCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomCreateCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
