import {
  Component,
  Input,
  Output,
  EventEmitter,
  Optional,
  Self,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription } from 'rxjs';

type InputValue = string | number | null;
type MatInputWithStateChanges = MatInput & { stateChanges?: Subject<void> };

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class InputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy, DoCheck {
  @Input() label = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() placeholder = '';
  @Input() appearance: 'outline' | 'fill' = 'outline';
  @Input() minlength?: number;
  @Input() maxlength?: number;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() pattern?: string;
  @Input() iconPath?: string; // For image icon
  @Input() icon?: string; // For Material icon name
  @Output() iconClick = new EventEmitter<void>();
  @Input() customErrorMessage?: string;
  @Input() subscriptSizing: 'fixed' | 'dynamic' = 'fixed';
  @ViewChild(MatInput) matInput!: MatInput;

  value: InputValue = '';
  disabled = false;
  private subscription = new Subscription();
  private wasTouched = false;

  onChange: (val: InputValue) => void = () => {};
  onTouched = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngDoCheck(): void {
    const isTouched = !!this.ngControl?.control?.touched;
    if (isTouched !== this.wasTouched) {
      this.wasTouched = isTouched;
      (this.matInput as MatInputWithStateChanges)?.stateChanges?.next(); // tell MatFormField to re-render
    }
  }

  ngAfterViewInit() {
    if (this.ngControl?.control && this.matInput) {
      // Whenever the outer FormControl status changes, tell MatInput to re-check
      this.subscription.add(
        this.ngControl.control.statusChanges.subscribe(() => {
          // Emit on MatInput's stateChanges so MatFormField re-renders mat-error
          (this.matInput as MatInputWithStateChanges).stateChanges?.next();
        }),
      );

      Object.defineProperty(this.matInput, 'errorState', {
        get: () => {
          const control = this.ngControl?.control;
          const isInteracted = !!(control && (control.touched || control.dirty));
          const hasControlErrors = !!(control && control.invalid && isInteracted);
          const hasCustomError = !!(this.customErrorMessage && isInteracted);

          return hasControlErrors || hasCustomError;
        },
      });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  writeValue(value: InputValue): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: InputValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(value: string): void {
    let processedValue: InputValue = value;

    if (this.type == 'number' && value != '' && value != null) {
      let num = parseFloat(value);
      if (!isNaN(num)) {
        if (this.step != undefined) {
          const decimal = (this.step.toString().split('.')[1] ?? '').length;
          num = parseFloat(num.toFixed(decimal));
        }
        processedValue = num;
      }
    }
    this.value = processedValue;
    this.onChange(processedValue);

    if (this.ngControl?.control) {
      this.ngControl.control.markAsDirty();
      this.ngControl.control.updateValueAndValidity();
      // Manually notify MatInput that state may have changed
      (this.matInput as MatInputWithStateChanges)?.stateChanges?.next();
    }
  }

  handleInputEvent(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.handleInput(target?.value ?? '');
  }

  markTouched() {
    if (this.ngControl?.control) {
      // Trim on blur so UX isn't disrupted while typing
      if (typeof this.value === 'string') {
        const trimmed = this.value.trim();
        if (trimmed != this.value) {
          this.value = trimmed;
          this.onChange(trimmed);
          this.ngControl.control.setValue(trimmed, { emitEvent: false });
        }
      }
      this.ngControl.control.markAsTouched();
      // Notify MatInput so mat-error shows after blur
      (this.matInput as MatInputWithStateChanges)?.stateChanges?.next();
    }
  }

  handleIconClick() {
    this.iconClick.emit();
  }

  get errorMessage(): string {
    const control = this.ngControl?.control;
    if (!control) return '';
    // Prefer explicit messages from parent form logic (including form-level errors).
    if (this.customErrorMessage && (control.touched || control.dirty)) {
      return this.customErrorMessage;
    }

    if (!control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'This field is required';
    if (errors['whitespace']) return 'This field can not be empty or spaces only';
    if (errors['email']) return 'Invalid email format';
    if (errors['minlength'])
      return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['maxlength'])
      return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['pattern']) return 'Invalid format';

    return 'Invalid field';
  }
}
