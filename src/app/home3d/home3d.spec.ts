import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home3d } from './home3d';

describe('Home3d', () => {
  let component: Home3d;
  let fixture: ComponentFixture<Home3d>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home3d]
    }).compileComponents();

    fixture = TestBed.createComponent(Home3d);
    component = fixture.componentInstance;

    // отключаем lifecycle который запускает Three.js
    (component as any).ngAfterViewInit = () => {};

    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
