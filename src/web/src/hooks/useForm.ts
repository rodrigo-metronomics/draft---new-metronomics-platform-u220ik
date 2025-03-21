import { useState, useCallback, FormEvent } from 'react';
import { ValidationRules, FormErrors, FormTouched } from '../types/common.types';
import { validateForm } from '../utils/helpers/validationHelper';

/**
 * Interface defining options for the useForm hook
 */
export interface UseFormOptions {
  /** Initial form values */
  initialValues: Record<string, any>;
  /** Validation rules for form fields */
  validationRules: ValidationRules;
  /** Function to call when form is submitted and valid */
  onSubmit: (values: Record<string, any>) => void | Promise<any>;
  /** Whether to validate fields on blur */
  validateOnBlur?: boolean;
  /** Whether to validate fields on change */
  validateOnChange?: boolean;
}

/**
 * Interface defining the return value of the useForm hook
 */
export interface UseFormReturn {
  /** Current form values */
  values: Record<string, any>;
  /** Current form validation errors */
  errors: FormErrors;
  /** Which fields have been touched by the user */
  touched: FormTouched;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Whether the form has been submitted */
  isSubmitted: boolean;
  /** Handler for input change events */
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  /** Handler for input blur events */
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  /** Handler for form submit events */
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Set a specific field's value */
  setFieldValue: (name: string, value: any) => void;
  /** Set a specific field's error message */
  setFieldError: (name: string, error: string | null) => void;
  /** Mark a specific field as touched */
  setFieldTouched: (name: string, isTouched?: boolean) => void;
  /** Validate a specific field */
  validateField: (name: string) => Promise<boolean>;
  /** Validate all fields */
  validateAllFields: () => Promise<boolean>;
  /** Reset the form to its initial state */
  resetForm: () => void;
}

/**
 * Custom hook for form state management, validation, and submission handling
 * 
 * The useForm hook provides a comprehensive solution for managing form state,
 * validation, and submission in React components. It handles common form operations
 * like tracking input values, validating inputs against rules, tracking which fields
 * have been interacted with, and managing the submission process.
 * 
 * @param options - Configuration options for the form
 * @returns Form state and handlers for managing the form
 */
export const useForm = ({
  initialValues,
  validationRules,
  onSubmit,
  validateOnBlur = true,
  validateOnChange = false
}: UseFormOptions): UseFormReturn => {
  // Form state
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  /**
   * Validates a single field and updates errors state
   */
  const validateField = useCallback(async (name: string): Promise<boolean> => {
    if (!validationRules[name]) return true;
    
    const fieldValidationRule = { [name]: validationRules[name] };
    const fieldErrors = validateForm(values, fieldValidationRule);
    
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name] || null
    }));
    
    return !fieldErrors[name];
  }, [values, validationRules]);

  /**
   * Validates all fields in the form and updates errors state
   */
  const validateAllFields = useCallback(async (): Promise<boolean> => {
    const formErrors = validateForm(values, validationRules);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validationRules]);

  /**
   * Updates a field's value and optionally validates it
   */
  const setFieldValue = useCallback((name: string, value: any): void => {
    setValues(prev => {
      const newValues = {
        ...prev,
        [name]: value
      };
      
      // Validate if needed
      if (validateOnChange && touched[name] && validationRules[name]) {
        const fieldValidationRule = { [name]: validationRules[name] };
        const fieldErrors = validateForm(newValues, fieldValidationRule);
        
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: fieldErrors[name] || null
        }));
      }
      
      return newValues;
    });
  }, [validateOnChange, touched, validationRules]);

  /**
   * Explicitly sets an error message for a field
   */
  const setFieldError = useCallback((name: string, error: string | null): void => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  /**
   * Marks a field as touched and optionally validates it
   */
  const setFieldTouched = useCallback((name: string, isTouched: boolean = true): void => {
    setTouched(prev => ({
      ...prev,
      [name]: isTouched
    }));
    
    if (isTouched && validateOnBlur && validationRules[name]) {
      validateField(name);
    }
  }, [validateOnBlur, validationRules, validateField]);

  /**
   * Handles input change events, updates values, and optionally validates
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => {
      const newValues = {
        ...prev,
        [name]: newValue
      };
      
      // Validate if needed
      if (validateOnChange && validationRules[name]) {
        const fieldValidationRule = { [name]: validationRules[name] };
        const fieldErrors = validateForm(newValues, fieldValidationRule);
        
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: fieldErrors[name] || null
        }));
      }
      
      return newValues;
    });
  }, [validateOnChange, validationRules]);

  /**
   * Handles input blur events, marks field as touched, and optionally validates
   */
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    if (validateOnBlur && validationRules[name]) {
      validateField(name);
    }
  }, [validateOnBlur, validationRules, validateField]);

  /**
   * Resets the form to its initial state
   */
  const resetForm = useCallback((): void => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, [initialValues]);

  /**
   * Handles form submission, validates all fields, and calls onSubmit if valid
   */
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    // Mark all fields with validation rules as touched
    const allTouched = Object.keys(validationRules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as FormTouched);
    
    setTouched(allTouched);
    setIsSubmitted(true);
    
    // Validate all fields
    validateAllFields().then(isValid => {
      if (isValid) {
        setIsSubmitting(true);
        
        Promise.resolve(onSubmit(values))
          .finally(() => {
            setIsSubmitting(false);
          });
      }
    });
  }, [values, validationRules, validateAllFields, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateAllFields,
    resetForm
  };
};