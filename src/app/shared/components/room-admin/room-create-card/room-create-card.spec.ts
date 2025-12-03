import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { By } from '@angular/platform-browser';
import { RoomCreateCardComponent } from './room-create-card.component';
import { vi } from 'vitest';
describe('RoomCreateCardComponent', () => {
  let component: RoomCreateCardComponent;
  let fixture: ComponentFixture<RoomCreateCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoomCreateCardComponent],
      imports: [FormsModule], // Import FormsModule for [(ngModel)]
    }).compileComponents();

    fixture = TestBed.createComponent(RoomCreateCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT emit roomSelected if input is empty', () => {
    vi.spyOn(component.roomSelected, 'emit');

    component.inputRoomId = '   ';
    component.submit();

    expect(component.roomSelected.emit).not.toHaveBeenCalled();
  });

  it('should emit roomSelected and clear input when valid ID is submitted', () => {
    vi.spyOn(component.roomSelected, 'emit');
    const testId = 'coding-123';
    component.inputRoomId = testId;
    component.submit();

    expect(component.roomSelected.emit).toHaveBeenCalledWith(testId);
    expect(component.inputRoomId).toBe('');
  });

  it('should trigger submit when JOIN button is clicked', () => {
    vi.spyOn(component, 'submit');

    const btn = fixture.debugElement.query(By.css('button'));
    btn.nativeElement.click();

    expect(component.submit).toHaveBeenCalled();
  });

  it('should trigger submit when ENTER key is pressed on input', () => {
    vi.spyOn(component, 'submit');

    const input = fixture.debugElement.query(By.css('input'));
    input.triggerEventHandler('keyup.enter', {});

    expect(component.submit).toHaveBeenCalled();
  });
});
