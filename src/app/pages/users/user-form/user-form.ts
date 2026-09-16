import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { first, map, Observable, of, switchMap, timer } from 'rxjs';

import { DEPARTMENTS, User, UserPayload, USER_ROLES, USER_STATUSES } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { Modal } from '../../../shared/components/modal/modal';
import { UiButton } from '../../../shared/components/ui-button/ui-button';

/** Create/edit form. The parent owns the request, this owns the validation. */
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, Modal, UiButton],
  templateUrl: './user-form.html',
})
export class UserForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly users = inject(UserService);

  /** `null` means "create", otherwise the form edits this user. */
  readonly user = input<User | null>(null);
  readonly saving = input(false);

  readonly save = output<UserPayload>();
  readonly cancelled = output<void>();

  protected readonly roles = USER_ROLES;
  protected readonly statuses = USER_STATUSES;
  protected readonly departments = DEPARTMENTS;
  protected readonly isEdit = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    email: ['', { validators: [Validators.required, Validators.email], asyncValidators: [this.uniqueEmail()] }],
    phone: ['', [Validators.pattern(/^[0-9+\-\s()]{6,20}$/)]],
    role: ['viewer', [Validators.required]],
    department: ['Engineering', [Validators.required]],
    status: ['active', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      this.isEdit.set(user !== null);

      if (user) {
        this.form.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          status: user.status,
        });
      }
    });
  }

  protected isInvalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected submit(): void {
    if (this.saving() || this.form.pending) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.getRawValue() as UserPayload);
  }

  /** Checks the API for the address, skipping the user being edited. */
  private uniqueEmail(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = String(control.value ?? '').trim();
      if (!email || control.hasError('email')) {
        return of(null);
      }

      return timer(400).pipe(
        switchMap(() => this.users.isEmailTaken(email, this.user()?.id)),
        map((taken) => (taken ? { emailTaken: true } : null)),
        first(),
      );
    };
  }
}
