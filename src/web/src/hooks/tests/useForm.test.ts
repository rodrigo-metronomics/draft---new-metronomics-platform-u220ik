import { renderHook, act } from '@testing-library/react-hooks'; // @testing-library/react-hooks@^8.0.0
import { fireEvent } from '@testing-library/react'; // @testing-library/react@^14.0.0
import { useForm } from '../useForm';
import { ValidationRules } from '../../types/common.types';
import { renderHookWithProviders } from '../../../tests/testUtils';

// Mock function to create a mock change event
const createMockChangeEvent = (name: string, value: any) => ({
  target: { name, value },
} as any);

// Mock function to create a mock blur event
const createMockBlurEvent = (name: string) => ({
  target: { name },
} as any);

// Mock function to create a mock submit event
const createMockSubmitEvent = () => ({
  preventDefault: () => {},
} as any);

describe('useForm', () => {
  it('should initialize with provided initial values', () => {
    const initialValues = { name: 'John Doe', email: 'john@example.com' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    expect(result.current.values).toEqual(initialValues);
  });

  it('should update values when handleChange is called', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    act(() => {
      result.current.handleChange(createMockChangeEvent('name', 'Jane Doe'));
    });

    expect(result.current.values.name).toBe('Jane Doe');
  });

  it('should mark fields as touched when handleBlur is called', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    act(() => {
      result.current.handleBlur(createMockBlurEvent('name'));
    });

    expect(result.current.touched.name).toBe(true);
  });

  it('should validate fields according to validation rules', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules: ValidationRules = {
      name: { required: true },
      email: { required: true, email: true },
    };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: () => {}
    }));

    await act(async () => {
      await result.current.validateAllFields();
    });

    expect(result.current.errors.name).toBe('The field \'name\' is required.');
    expect(result.current.errors.email).toBe('The field \'email\' is required.');
  });

  it('should validate on blur when validateOnBlur is true', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules: ValidationRules = {
      name: { required: true },
    };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: () => {},
      validateOnBlur: true,
    }));

    await act(async () => {
      await result.current.handleBlur(createMockBlurEvent('name'));
    });

    expect(result.current.errors.name).toBe('The field \'name\' is required.');
  });

  it('should validate on change when validateOnChange is true', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules: ValidationRules = {
      name: { required: true },
    };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: () => {},
      validateOnChange: true,
    }));

    await act(async () => {
      await result.current.handleChange(createMockChangeEvent('name', ''));
    });

    expect(result.current.errors.name).toBe('The field \'name\' is required.');
  });

  it('should call onSubmit with values when form is valid', async () => {
    const initialValues = { name: 'John Doe', email: 'john@example.com' };
    const onSubmit = jest.fn();
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit
    }));

    await act(async () => {
      await result.current.handleSubmit(createMockSubmitEvent());
    });

    expect(onSubmit).toHaveBeenCalledWith(initialValues);
  });

  it('should not call onSubmit when form is invalid', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules: ValidationRules = {
      name: { required: true },
      email: { required: true, email: true },
    };
    const onSubmit = jest.fn();
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit
    }));

    await act(async () => {
      await result.current.handleSubmit(createMockSubmitEvent());
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should set isSubmitting during form submission', async () => {
    const initialValues = { name: 'John Doe', email: 'john@example.com' };
    let resolvePromise: (value: any) => void = () => {};
    const onSubmit = jest.fn(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit
    }));

    const submitPromise = act(async () => {
      result.current.handleSubmit(createMockSubmitEvent());
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolvePromise(true);
      await submitPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should set field value directly with setFieldValue', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    act(() => {
      result.current.setFieldValue('name', 'Jane Doe');
    });

    expect(result.current.values.name).toBe('Jane Doe');
  });

  it('should set field error directly with setFieldError', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    act(() => {
      result.current.setFieldError('name', 'This field is required');
    });

    expect(result.current.errors.name).toBe('This field is required');
  });

  it('should set field touched state with setFieldTouched', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    act(() => {
      result.current.setFieldTouched('name', true);
    });

    expect(result.current.touched.name).toBe(true);
  });

  it('should reset form to initial values', () => {
    const initialValues = { name: 'John Doe', email: 'john@example.com' };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules: {},
      onSubmit: () => {}
    }));

    act(() => {
      result.current.setFieldValue('name', 'Jane Doe');
      result.current.setFieldError('name', 'This field is required');
      result.current.setFieldTouched('name', true);
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should validate a single field with validateField', async () => {
    const initialValues = { name: '', email: '' };
    const validationRules: ValidationRules = {
      name: { required: true },
      email: { required: true, email: true },
    };
    const { result } = renderHook(() => useForm({
      initialValues,
      validationRules,
      onSubmit: () => {}
    }));

    await act(async () => {
      await result.current.validateField('name');
    });

    expect(result.current.errors.name).toBe('The field \'name\' is required.');
    expect(result.current.errors.email).toBe(undefined);
  });
});