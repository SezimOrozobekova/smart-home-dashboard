import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  twinkleSpeed: number;
  drift: number;
}

@Component({
  selector: 'app-starfield-parallax-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './starfield-parallax-background.html',
  styleUrls: ['./starfield-parallax-background.css']
})
export class StarfieldParallaxBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('layer1', { static: true }) layer1Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('layer2', { static: true }) layer2Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('layer3', { static: true }) layer3Ref!: ElementRef<HTMLCanvasElement>;

  private animationId = 0;
  private isBrowser = false;

  private layer1Stars: Star[] = [];
  private layer2Stars: Star[] = [];
  private layer3Stars: Star[] = [];

  private readonly layer1Count = 90;
  private readonly layer2Count = 60;
  private readonly layer3Count = 35;

  private scrollY = 0;
  private mouseX = 0;
  private mouseY = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.setupCanvas(this.layer1Ref.nativeElement);
    this.setupCanvas(this.layer2Ref.nativeElement);
    this.setupCanvas(this.layer3Ref.nativeElement);

    this.layer1Stars = this.createStars(this.layer1Ref.nativeElement, this.layer1Count, 0.15, 1.2);
    this.layer2Stars = this.createStars(this.layer2Ref.nativeElement, this.layer2Count, 0.08, 1.8);
    this.layer3Stars = this.createStars(this.layer3Ref.nativeElement, this.layer3Count, 0.04, 2.4);

    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser) return;

    const canvases = [
      this.layer1Ref.nativeElement,
      this.layer2Ref.nativeElement,
      this.layer3Ref.nativeElement
    ];

    canvases.forEach((canvas) => this.setupCanvas(canvas));

    this.layer1Stars = this.createStars(this.layer1Ref.nativeElement, this.layer1Count, 0.15, 1.2);
    this.layer2Stars = this.createStars(this.layer2Ref.nativeElement, this.layer2Count, 0.08, 1.8);
    this.layer3Stars = this.createStars(this.layer3Ref.nativeElement, this.layer3Count, 0.04, 2.4);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.isBrowser) return;
    this.scrollY = window.scrollY || 0;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isBrowser) return;

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;

    this.mouseX = (event.clientX / width - 0.5) * 2;
    this.mouseY = (event.clientY / height - 0.5) * 2;
  }

  private setupCanvas(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private createStars(
    canvas: HTMLCanvasElement,
    count: number,
    minSize: number,
    maxSize: number
  ): Star[] {
    const stars: Star[] = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: minSize + Math.random() * (maxSize - minSize),
        speed: 0.03 + Math.random() * 0.18,
        alpha: 0.25 + Math.random() * 0.75,
        twinkleSpeed: 0.003 + Math.random() * 0.02,
        drift: (Math.random() - 0.5) * 0.08
      });
    }

    return stars;
  }

  private animate = (): void => {
    this.renderLayer(
      this.layer1Ref.nativeElement,
      this.layer1Stars,
      0.12,
      12,
      'rgba(255,255,255,0.95)'
    );

    this.renderLayer(
      this.layer2Ref.nativeElement,
      this.layer2Stars,
      0.22,
      22,
      'rgba(191,219,254,0.9)'
    );

    this.renderLayer(
      this.layer3Ref.nativeElement,
      this.layer3Stars,
      0.35,
      34,
      'rgba(147,197,253,0.85)'
    );

    this.animationId = requestAnimationFrame(this.animate);
  };

  private renderLayer(
    canvas: HTMLCanvasElement,
    stars: Star[],
    scrollFactor: number,
    mouseFactor: number,
    color: string
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.clearRect(0, 0, width, height);

    const offsetY = this.scrollY * scrollFactor;
    const offsetX = this.mouseX * mouseFactor;
    const offsetMouseY = this.mouseY * (mouseFactor * 0.35);

    for (const star of stars) {
      star.y += star.speed;
      star.x += star.drift;

      if (star.y > height + 20) {
        star.y = -10;
        star.x = Math.random() * width;
      }

      if (star.x < -20) {
        star.x = width + 10;
      }

      if (star.x > width + 20) {
        star.x = -10;
      }

      star.alpha += Math.sin(performance.now() * star.twinkleSpeed) * 0.0025;
      if (star.alpha < 0.2) star.alpha = 0.2;
      if (star.alpha > 1) star.alpha = 1;

      const drawX = star.x + offsetX;
      const drawY = ((star.y + offsetY + offsetMouseY) % (height + 40)) - 20;

      ctx.beginPath();
      ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
      ctx.fillStyle = this.applyAlpha(color, star.alpha);
      ctx.shadowBlur = star.size * 6;
      ctx.shadowColor = this.applyAlpha(color, 0.35);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  private applyAlpha(color: string, alpha: number): string {
    if (color.startsWith('rgba(')) {
      const parts = color
        .replace('rgba(', '')
        .replace(')', '')
        .split(',')
        .slice(0, 3)
        .map((part) => part.trim());

      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }

    return color;
  }
}
