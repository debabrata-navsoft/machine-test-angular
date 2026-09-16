import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, input, linkedSignal, output } from '@angular/core';
import { LucideSearch, LucideX } from '@lucide/angular';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

/** Debounced search box so typing does not fire one request per keystroke. */
@Component({
  selector: 'app-search-input',
  imports: [LucideSearch, LucideX],
  template: `
    <div class="search">
      <svg lucideSearch class="icon" size="16" aria-hidden="true"></svg>

      <input
        class="input"
        type="search"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        [value]="text()"
        (input)="onInput($event)"
      />

      @if (text()) {
        <button type="button" class="clear" aria-label="Clear search" (click)="clear()">
          <svg lucideX size="15"></svg>
        </button>
      }
    </div>
  `,
  styles: `
    .search {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 220px;
      flex: 1 1 220px;
    }

    .icon {
      position: absolute;
      left: 11px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .input {
      padding-left: 34px;
      padding-right: 32px;
    }

    .input::-webkit-search-cancel-button {
      display: none;
    }

    .clear {
      position: absolute;
      right: 8px;
      display: inline-flex;
      border: 0;
      padding: 2px;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }

    .clear:hover {
      color: var(--text);
    }
  `,
})
export class SearchInput {
  readonly placeholder = input('Search…');
  readonly value = input('');
  readonly debounceMs = input(350);

  readonly search = output<string>();

  protected readonly text = linkedSignal(() => this.value());
  private readonly typed = new Subject<string>();

  constructor() {
    this.typed
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => this.search.emit(term));
  }

  protected onInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.text.set(term);
    this.typed.next(term);
  }

  protected clear(): void {
    this.text.set('');
    this.typed.next('');
  }
}
