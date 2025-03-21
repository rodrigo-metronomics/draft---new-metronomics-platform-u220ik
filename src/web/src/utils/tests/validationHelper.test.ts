import {
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateDate,
  validateDateRange,
  validateMinLength,
  validateMaxLength,
  validateNumericRange,
  validatePattern,
  validateUrl,
  validateColor,
  validateForm,
  formatString
} from '../helpers/validationHelper';
import { VALIDATION_ERRORS } from '../constants/errorMessages';
import { ValidationRules } from '../../types/common.types';

describe('validateRequired', () => {
  it('should return null for valid non-empty values', () => {
    expect(validateRequired('test', 'Field')).toBeNull();
    expect(validateRequired(123, 'Field')).toBeNull();
    expect(validateRequired(true, 'Field')).toBeNull();
    expect(validateRequired({}, 'Field')).toBeNull();
    expect(validateRequired([], 'Field')).toBeNull();
  });

  it('should return error message for undefined values', () => {
    expect(validateRequired(undefined, 'Field')).toEqual('The field \'Field\' is required.');
  });

  it('should return error message for null values', () => {
    expect(validateRequired(null, 'Field')).toEqual('The field \'Field\' is required.');
  });

  it('should return error message for empty string values', () => {
    expect(validateRequired('', 'Field')).toEqual('The field \'Field\' is required.');
  });

  it('should correctly format error message with field name', () => {
    expect(validateRequired('', 'Email')).toEqual('The field \'Email\' is required.');
    expect(validateRequired(null, 'Username')).toEqual('The field \'Username\' is required.');
  });
});

describe('validateEmail', () => {
  it('should return null for valid email addresses', () => {
    expect(validateEmail('test@example.com', 'Email')).toBeNull();
    expect(validateEmail('user.name+tag@domain.co.uk', 'Email')).toBeNull();
    expect(validateEmail('user-name@domain.org', 'Email')).toBeNull();
  });

  it('should return error message for invalid email formats', () => {
    expect(validateEmail('invalid', 'Email')).toEqual('The email \'invalid\' is not a valid email address.');
    expect(validateEmail('invalid@', 'Email')).toEqual('The email \'invalid@\' is not a valid email address.');
    expect(validateEmail('@domain.com', 'Email')).toEqual('The email \'@domain.com\' is not a valid email address.');
  });

  it('should return required field error for empty values', () => {
    expect(validateEmail('', 'Email')).toEqual('The field \'Email\' is required.');
    expect(validateEmail(null as any, 'Email')).toEqual('The field \'Email\' is required.');
    expect(validateEmail(undefined as any, 'Email')).toEqual('The field \'Email\' is required.');
  });

  it('should correctly format error message with the email value', () => {
    expect(validateEmail('test@invalid', 'Email')).toEqual('The email \'test@invalid\' is not a valid email address.');
  });
});

describe('validatePassword', () => {
  it('should return null for valid passwords meeting all requirements', () => {
    expect(validatePassword('Password1!', 'Password')).toBeNull();
    expect(validatePassword('Secure123#', 'Password')).toBeNull();
    expect(validatePassword('Complex$5Password', 'Password')).toBeNull();
  });

  it('should return error message for passwords shorter than 8 characters', () => {
    expect(validatePassword('Pass1!', 'Password')).toEqual(VALIDATION_ERRORS.INVALID_PASSWORD);
  });

  it('should return error message for passwords without uppercase letters', () => {
    expect(validatePassword('password1!', 'Password')).toEqual(VALIDATION_ERRORS.INVALID_PASSWORD);
  });

  it('should return error message for passwords without lowercase letters', () => {
    expect(validatePassword('PASSWORD1!', 'Password')).toEqual(VALIDATION_ERRORS.INVALID_PASSWORD);
  });

  it('should return error message for passwords without numbers', () => {
    expect(validatePassword('Password!', 'Password')).toEqual(VALIDATION_ERRORS.INVALID_PASSWORD);
  });

  it('should return error message for passwords without special characters', () => {
    expect(validatePassword('Password1', 'Password')).toEqual(VALIDATION_ERRORS.INVALID_PASSWORD);
  });

  it('should return required field error for empty values', () => {
    expect(validatePassword('', 'Password')).toEqual('The field \'Password\' is required.');
    expect(validatePassword(null as any, 'Password')).toEqual('The field \'Password\' is required.');
    expect(validatePassword(undefined as any, 'Password')).toEqual('The field \'Password\' is required.');
  });
});

describe('validatePasswordMatch', () => {
  it('should return null when passwords match', () => {
    expect(validatePasswordMatch('Password1!', 'Password1!')).toBeNull();
  });

  it('should return error message when passwords don\'t match', () => {
    expect(validatePasswordMatch('Password1!', 'Password2!')).toEqual(VALIDATION_ERRORS.PASSWORD_MISMATCH);
  });

  it('should return required field error when either password is empty', () => {
    expect(validatePasswordMatch('', 'Password1!')).toEqual('The field \'Password\' is required.');
    expect(validatePasswordMatch('Password1!', '')).toEqual('The field \'Password\' is required.');
    expect(validatePasswordMatch('', '')).toEqual('The field \'Password\' is required.');
  });
});

describe('validateDate', () => {
  it('should return null for valid Date objects', () => {
    expect(validateDate(new Date(), 'Date')).toBeNull();
  });

  it('should return null for valid date strings', () => {
    expect(validateDate('2023-05-15', 'Date')).toBeNull();
    expect(validateDate('05/15/2023', 'Date')).toBeNull();
  });

  it('should return error message for invalid date formats', () => {
    expect(validateDate('invalid-date', 'Date')).toEqual('The date \'invalid-date\' is not a valid date.');
    expect(validateDate('2023-13-45', 'Date')).toEqual('The date \'2023-13-45\' is not a valid date.');
  });

  it('should return required field error for empty values', () => {
    expect(validateDate('', 'Date')).toEqual('The field \'Date\' is required.');
    expect(validateDate(null as any, 'Date')).toEqual('The field \'Date\' is required.');
    expect(validateDate(undefined as any, 'Date')).toEqual('The field \'Date\' is required.');
  });

  it('should correctly format error message with the field name', () => {
    expect(validateDate('invalid-date', 'Start Date')).toEqual('The date \'invalid-date\' is not a valid date.');
  });
});

describe('validateDateRange', () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  it('should return null for dates within the specified range', () => {
    expect(validateDateRange(today, 'Date', yesterday, tomorrow)).toBeNull();
    expect(validateDateRange(yesterday, 'Date', yesterday, tomorrow)).toBeNull();
    expect(validateDateRange(tomorrow, 'Date', yesterday, tomorrow)).toBeNull();
  });

  it('should return error message for dates before minDate', () => {
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    expect(validateDateRange(dayBeforeYesterday, 'Date', yesterday, tomorrow)).toContain('must be between');
  });

  it('should return error message for dates after maxDate', () => {
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    expect(validateDateRange(dayAfterTomorrow, 'Date', yesterday, tomorrow)).toContain('must be between');
  });

  it('should return error from validateDate for invalid dates', () => {
    expect(validateDateRange('invalid-date', 'Date', yesterday, tomorrow)).toEqual('The date \'invalid-date\' is not a valid date.');
  });

  it('should correctly format error message with the field name and range values', () => {
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    const result = validateDateRange(dayBeforeYesterday, 'Start Date', yesterday, tomorrow);
    expect(result).toContain('Start Date');
    expect(result).toContain(yesterday.toLocaleDateString());
    expect(result).toContain(tomorrow.toLocaleDateString());
  });
});

describe('validateMinLength', () => {
  it('should return null for strings meeting minimum length', () => {
    expect(validateMinLength('12345', 'Field', 5)).toBeNull();
    expect(validateMinLength('123456', 'Field', 5)).toBeNull();
  });

  it('should return error message for strings shorter than minimum length', () => {
    expect(validateMinLength('1234', 'Field', 5)).toContain('must be at least 5 characters');
  });

  it('should return required field error for empty values', () => {
    expect(validateMinLength('', 'Field', 5)).toEqual('The field \'Field\' is required.');
    expect(validateMinLength(null as any, 'Field', 5)).toEqual('The field \'Field\' is required.');
    expect(validateMinLength(undefined as any, 'Field', 5)).toEqual('The field \'Field\' is required.');
  });

  it('should correctly format error message with the field name and minimum length', () => {
    expect(validateMinLength('abc', 'Username', 8)).toContain('Username');
    expect(validateMinLength('abc', 'Username', 8)).toContain('8 characters');
  });
});

describe('validateMaxLength', () => {
  it('should return null for strings not exceeding maximum length', () => {
    expect(validateMaxLength('12345', 'Field', 5)).toBeNull();
    expect(validateMaxLength('1234', 'Field', 5)).toBeNull();
  });

  it('should return error message for strings longer than maximum length', () => {
    expect(validateMaxLength('123456', 'Field', 5)).toContain('cannot exceed 5 characters');
  });

  it('should return required field error for empty values', () => {
    expect(validateMaxLength('', 'Field', 5)).toEqual('The field \'Field\' is required.');
    expect(validateMaxLength(null as any, 'Field', 5)).toEqual('The field \'Field\' is required.');
    expect(validateMaxLength(undefined as any, 'Field', 5)).toEqual('The field \'Field\' is required.');
  });

  it('should correctly format error message with the field name and maximum length', () => {
    expect(validateMaxLength('abcdefghijklmn', 'Bio', 10)).toContain('Bio');
    expect(validateMaxLength('abcdefghijklmn', 'Bio', 10)).toContain('10 characters');
  });
});

describe('validateNumericRange', () => {
  it('should return null for numbers within the specified range', () => {
    expect(validateNumericRange(5, 'Field', 1, 10)).toBeNull();
    expect(validateNumericRange(1, 'Field', 1, 10)).toBeNull();
    expect(validateNumericRange(10, 'Field', 1, 10)).toBeNull();
    expect(validateNumericRange('5', 'Field', 1, 10)).toBeNull();
  });

  it('should return error message for numbers below minimum', () => {
    expect(validateNumericRange(0, 'Field', 1, 10)).toContain('must be between');
    expect(validateNumericRange('0', 'Field', 1, 10)).toContain('must be between');
  });

  it('should return error message for numbers above maximum', () => {
    expect(validateNumericRange(11, 'Field', 1, 10)).toContain('must be between');
    expect(validateNumericRange('11', 'Field', 1, 10)).toContain('must be between');
  });

  it('should return error message for non-numeric values', () => {
    expect(validateNumericRange('abc', 'Field', 1, 10)).toContain('invalid format');
  });

  it('should return required field error for empty values', () => {
    expect(validateNumericRange('', 'Field', 1, 10)).toEqual('The field \'Field\' is required.');
    expect(validateNumericRange(null as any, 'Field', 1, 10)).toEqual('The field \'Field\' is required.');
    expect(validateNumericRange(undefined as any, 'Field', 1, 10)).toEqual('The field \'Field\' is required.');
  });

  it('should correctly format error message with the field name and range values', () => {
    const result = validateNumericRange(0, 'Score', 1, 10);
    expect(result).toContain('Score');
    expect(result).toContain('1');
    expect(result).toContain('10');
  });
});

describe('validatePattern', () => {
  it('should return null for strings matching the pattern', () => {
    expect(validatePattern('ABC123', 'Field', /^[A-Z0-9]+$/)).toBeNull();
  });

  it('should return error message for strings not matching the pattern', () => {
    expect(validatePattern('abc123', 'Field', /^[A-Z0-9]+$/)).toContain('invalid format');
  });

  it('should return required field error for empty values', () => {
    expect(validatePattern('', 'Field', /^[A-Z0-9]+$/)).toEqual('The field \'Field\' is required.');
    expect(validatePattern(null as any, 'Field', /^[A-Z0-9]+$/)).toEqual('The field \'Field\' is required.');
    expect(validatePattern(undefined as any, 'Field', /^[A-Z0-9]+$/)).toEqual('The field \'Field\' is required.');
  });

  it('should use custom error message when provided', () => {
    const customError = 'This field must contain uppercase letters and numbers only';
    expect(validatePattern('abc123', 'Field', /^[A-Z0-9]+$/, customError)).toEqual(customError);
  });

  it('should correctly format default error message with the field name', () => {
    expect(validatePattern('abc123', 'Code', /^[A-Z0-9]+$/)).toContain('Code');
  });
});

describe('validateUrl', () => {
  it('should return null for valid URLs', () => {
    expect(validateUrl('https://example.com', 'Field')).toBeNull();
    expect(validateUrl('http://example.co.uk', 'Field')).toBeNull();
    expect(validateUrl('www.example.org', 'Field')).toBeNull();
    expect(validateUrl('example.com/path?query=value', 'Field')).toBeNull();
  });

  it('should return error message for invalid URL formats', () => {
    expect(validateUrl('invalid url', 'Field')).toContain('invalid format');
    expect(validateUrl('http://', 'Field')).toContain('invalid format');
  });

  it('should return required field error for empty values', () => {
    expect(validateUrl('', 'Field')).toEqual('The field \'Field\' is required.');
    expect(validateUrl(null as any, 'Field')).toEqual('The field \'Field\' is required.');
    expect(validateUrl(undefined as any, 'Field')).toEqual('The field \'Field\' is required.');
  });

  it('should correctly format error message with the field name', () => {
    expect(validateUrl('invalid url', 'Website')).toContain('Website');
  });
});

describe('validateColor', () => {
  it('should return null for valid hex color codes', () => {
    expect(validateColor('#FFF', 'Field')).toBeNull();
    expect(validateColor('#FFFFFF', 'Field')).toBeNull();
    expect(validateColor('FFF', 'Field')).toBeNull();
    expect(validateColor('FFFFFF', 'Field')).toBeNull();
  });

  it('should return null for valid rgb color values', () => {
    expect(validateColor('rgb(255, 0, 0)', 'Field')).toBeNull();
    expect(validateColor('rgb(255,0,0)', 'Field')).toBeNull();
    expect(validateColor('rgb(100, 200, 150)', 'Field')).toBeNull();
  });

  it('should return null for valid rgba color values', () => {
    expect(validateColor('rgba(255, 0, 0, 1)', 'Field')).toBeNull();
    expect(validateColor('rgba(255,0,0,0.5)', 'Field')).toBeNull();
    expect(validateColor('rgba(100, 200, 150, 0.8)', 'Field')).toBeNull();
  });

  it('should return error message for invalid color formats', () => {
    expect(validateColor('invalid', 'Field')).toContain('invalid format');
    expect(validateColor('#GGHHII', 'Field')).toContain('invalid format');
    expect(validateColor('rgb(300, 0, 0)', 'Field')).toContain('invalid format');
  });

  it('should return required field error for empty values', () => {
    expect(validateColor('', 'Field')).toEqual('The field \'Field\' is required.');
    expect(validateColor(null as any, 'Field')).toEqual('The field \'Field\' is required.');
    expect(validateColor(undefined as any, 'Field')).toEqual('The field \'Field\' is required.');
  });

  it('should correctly format error message with the field name', () => {
    expect(validateColor('invalid', 'Color')).toContain('Color');
  });
});

describe('formatString', () => {
  it('should correctly replace placeholders with provided values', () => {
    expect(formatString('Hello, {0}!', ['World'])).toEqual('Hello, World!');
  });

  it('should handle multiple placeholders', () => {
    expect(formatString('The {0} is {1}', ['sky', 'blue'])).toEqual('The sky is blue');
  });

  it('should return the original string when no placeholders exist', () => {
    expect(formatString('Hello, World!', ['Test'])).toEqual('Hello, World!');
  });

  it('should handle missing replacement values', () => {
    expect(formatString('Hello, {0} and {1}!', ['World'])).toEqual('Hello, World and {1}!');
  });
});

describe('validateForm', () => {
  it('should return empty object for valid form values', () => {
    const values = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };
    
    const rules: ValidationRules = {
      name: { required: true, minLength: 3 },
      email: { required: true, email: true },
      age: { required: true, min: 18, max: 100 }
    };
    
    expect(validateForm(values, rules)).toEqual({});
  });

  it('should return errors for invalid form values', () => {
    const values = {
      name: 'Jo',
      email: 'invalid-email',
      age: 15
    };
    
    const rules: ValidationRules = {
      name: { required: true, minLength: 3 },
      email: { required: true, email: true },
      age: { required: true, min: 18, max: 100 }
    };
    
    const errors = validateForm(values, rules);
    expect(Object.keys(errors).length).toBe(3);
    expect(errors.name).toContain('must be at least 3 characters');
    expect(errors.email).toContain('not a valid email');
    expect(errors.age).toContain('must be between');
  });

  it('should apply multiple validation rules in sequence', () => {
    const values = {
      password: 'short'
    };
    
    const rules: ValidationRules = {
      password: { 
        required: true, 
        minLength: 8,
        pattern: /[A-Z]/,
        custom: (value) => value.includes('!') ? null : 'Password must include an exclamation mark'
      }
    };
    
    const errors = validateForm(values, rules);
    expect(errors.password).toContain('must be at least 8 characters');
    // It should stop at the first error for each field
    expect(errors.password).not.toContain('invalid format');
    expect(errors.password).not.toContain('must include an exclamation mark');
  });

  it('should stop at first validation failure for a field', () => {
    const values = {
      name: ''
    };
    
    const rules: ValidationRules = {
      name: { 
        required: true, 
        minLength: 3,
        maxLength: 50
      }
    };
    
    const errors = validateForm(values, rules);
    expect(errors.name).toEqual('The field \'name\' is required.');
    expect(errors.name).not.toContain('must be at least 3 characters');
  });

  it('should handle custom validation functions', () => {
    const values = {
      zipCode: '12345'
    };
    
    const rules: ValidationRules = {
      zipCode: { 
        required: true,
        custom: (value) => /^\d{5}(-\d{4})?$/.test(value) ? null : 'Invalid ZIP code format'
      }
    };
    
    expect(validateForm(values, rules)).toEqual({});
    
    const invalidValues = {
      zipCode: '1234'
    };
    
    const errors = validateForm(invalidValues, rules);
    expect(errors.zipCode).toEqual('Invalid ZIP code format');
  });

  it('should correctly validate fields with dependencies (e.g., password confirmation)', () => {
    const values = {
      password: 'Password1!',
      confirmPassword: 'Password1!'
    };
    
    const rules: ValidationRules = {
      password: { required: true },
      confirmPassword: { required: true, match: 'password' }
    };
    
    expect(validateForm(values, rules)).toEqual({});
    
    const invalidValues = {
      password: 'Password1!',
      confirmPassword: 'DifferentPassword1!'
    };
    
    const errors = validateForm(invalidValues, rules);
    expect(errors.confirmPassword).toEqual(VALIDATION_ERRORS.PASSWORD_MISMATCH);
  });
});