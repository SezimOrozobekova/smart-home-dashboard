import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Insights } from './insights';

describe('Insights', () => {
  let component: Insights;
  let fixture: ComponentFixture<Insights>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Insights]
    }).compileComponents();

    fixture = TestBed.createComponent(Insights);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Insights data ─────────────────────────────────────────────────────────

  it('should contain 3 insight items', () => {
    expect(component.insights.length).toBe(3);
  });

  it('each insight should have a title, description, level and recommendation', () => {
    component.insights.forEach(insight => {
      expect(insight.title.length).toBeGreaterThan(0);
      expect(insight.description.length).toBeGreaterThan(0);
      expect(insight.level.length).toBeGreaterThan(0);
      expect(insight.recommendation.length).toBeGreaterThan(0);
    });
  });

  it('should have one insight with level "warning"', () => {
    const warnings = component.insights.filter(i => i.level === 'warning');
    expect(warnings.length).toBe(1);
  });

  it('should have one insight with level "info"', () => {
    const infos = component.insights.filter(i => i.level === 'info');
    expect(infos.length).toBe(1);
  });

  it('should have one insight with level "success"', () => {
    const successes = component.insights.filter(i => i.level === 'success');
    expect(successes.length).toBe(1);
  });

  it('"warning" insight should mention energy consumption', () => {
    const warning = component.insights.find(i => i.level === 'warning')!;
    expect(warning.title.toLowerCase()).toContain('energy');
  });

  it('"success" insight recommendation should tell user to maintain patterns', () => {
    const success = component.insights.find(i => i.level === 'success')!;
    expect(success.recommendation.toLowerCase()).toContain('maintain');
  });

  it('"info" insight should be about standby power', () => {
    const info = component.insights.find(i => i.level === 'info')!;
    expect(info.title.toLowerCase()).toContain('standby');
  });

  // ── Template rendering ────────────────────────────────────────────────────

  it('should render all insight titles in the DOM', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    component.insights.forEach(insight => {
      expect(el.textContent).toContain(insight.title);
    });
  });
});
