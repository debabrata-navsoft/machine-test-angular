import { Component, computed, input, signal } from '@angular/core';

/**
 * Product-page style zoom: hovering the image shows a lens, and the magnified
 * region is painted in a pane beside it. Touch devices pan the same lens, and
 * narrow screens show the zoom pane underneath instead of to the side.
 */
@Component({
  selector: 'app-image-magnifier',
  template: `
    <div class="magnifier">
      <div
        class="stage"
        (mouseenter)="active.set(true)"
        (mouseleave)="active.set(false)"
        (mousemove)="trackMouse($event)"
        (touchstart)="active.set(true)"
        (touchmove)="trackTouch($event)"
        (touchend)="active.set(false)"
      >
        <img [src]="src()" [alt]="alt()" draggable="false" />

        @if (active()) {
          <span class="lens" [style.left.%]="x()" [style.top.%]="y()" aria-hidden="true"></span>
        }
      </div>

      @if (active()) {
        <div
          class="zoom"
          role="img"
          [attr.aria-label]="'Magnified view of ' + alt()"
          [style.background-image]="backgroundImage()"
          [style.background-size]="backgroundSize()"
          [style.background-position]="backgroundPosition()"
        ></div>
      } @else {
        <p class="prompt">Hover or touch the image to zoom</p>
      }
    </div>
  `,
  styleUrl: './image-magnifier.css',
})
export class ImageMagnifier {
  readonly src = input.required<string>();
  readonly alt = input('');
  readonly zoom = input(2.5);

  protected readonly active = signal(false);
  protected readonly x = signal(50);
  protected readonly y = signal(50);

  protected readonly backgroundImage = computed(() => `url("${this.src()}")`);
  protected readonly backgroundSize = computed(() => `${this.zoom() * 100}% ${this.zoom() * 100}%`);
  protected readonly backgroundPosition = computed(() => `${this.x()}% ${this.y()}%`);

  protected trackMouse(event: MouseEvent): void {
    this.track(event.currentTarget as HTMLElement, event.clientX, event.clientY);
  }

  protected trackTouch(event: TouchEvent): void {
    const touch = event.touches.item(0);
    if (!touch) return;

    // Stop the page from scrolling while the finger is panning the zoom.
    event.preventDefault();
    this.track(event.currentTarget as HTMLElement, touch.clientX, touch.clientY);
  }

  private track(stage: HTMLElement, clientX: number, clientY: number): void {
    const bounds = stage.getBoundingClientRect();
    this.x.set(clamp(((clientX - bounds.left) / bounds.width) * 100));
    this.y.set(clamp(((clientY - bounds.top) / bounds.height) * 100));
  }
}

const clamp = (value: number): number => Math.min(100, Math.max(0, value));
