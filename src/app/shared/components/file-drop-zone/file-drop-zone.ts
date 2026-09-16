import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { LucideUpload } from '@lucide/angular';

import { UiButton } from '../ui-button/ui-button';

/** Click-or-drop file picker used by both the gallery and the drive pages. */
@Component({
  selector: 'app-file-drop-zone',
  imports: [LucideUpload, UiButton],
  template: `
    <div
      class="drop"
      [class.is-over]="isDragging()"
      [class.is-disabled]="disabled()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <svg lucideUpload size="26" class="icon" aria-hidden="true"></svg>

      <p class="title">{{ title() }}</p>
      <p class="hint">{{ hint() }}</p>

      <app-ui-button variant="secondary" size="sm" [disabled]="disabled()" (click)="openPicker()">
        Browse files
      </app-ui-button>

      <input
        #picker
        class="visually-hidden"
        type="file"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="disabled()"
        (change)="onPicked($event)"
      />
    </div>
  `,
  styleUrl: './file-drop-zone.css',
})
export class FileDropZone {
  readonly title = input('Drag files here');
  readonly hint = input('or use the button below');
  readonly accept = input('*/*');
  readonly multiple = input(true);
  readonly disabled = input(false);

  readonly filesSelected = output<File[]>();

  protected readonly isDragging = signal(false);
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  protected openPicker(): void {
    if (!this.disabled()) {
      this.picker().nativeElement.click();
    }
  }

  protected onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emit(input.files);
    // Reset so picking the same file twice still fires a change event.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragging.set(false);
    this.emit(event.dataTransfer?.files ?? null);
  }

  private emit(list: FileList | null): void {
    const files = Array.from(list ?? []);
    if (files.length) {
      this.filesSelected.emit(this.multiple() ? files : files.slice(0, 1));
    }
  }
}
