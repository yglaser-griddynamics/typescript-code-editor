import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RoomListComponent } from './room-list.component';
import { vi } from 'vitest';
describe('RoomListComponent', () => {
  let component: RoomListComponent;
  let fixture: ComponentFixture<RoomListComponent>;

  const MOCK_ROOMS = [
    { id: 'room-1', name: 'Angular Talk', users: 5 },
    { id: 'room-2', name: 'Coffee Break', users: 1 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the list of rooms when input is provided', () => {
    component.rooms = MOCK_ROOMS;
    fixture.detectChanges();

    const roomItems = fixture.debugElement.queryAll(By.css('.list-group-item'));
    expect(roomItems.length).toBe(2);

    const firstRoomText = roomItems[0].nativeElement.textContent;
    expect(firstRoomText).toContain('Angular Talk');
    expect(firstRoomText).toContain('5');
  });

  it('should display empty state message when rooms list is empty', () => {
    component.rooms = [];
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain('No active rooms right now');
  });

  it('should display empty state message when rooms input is null', () => {
    component.rooms = null;
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeTruthy();
  });

  it('should emit roomClicked event with roomId when a room is clicked', () => {
    vi.spyOn(component.roomClicked, 'emit');
    component.rooms = MOCK_ROOMS;
    fixture.detectChanges();

    const firstRoomBtn = fixture.debugElement.query(By.css('.list-group-item'));
    firstRoomBtn.triggerEventHandler('click', null);

    expect(component.roomClicked.emit).toHaveBeenCalledWith('room-1');
  });
});
