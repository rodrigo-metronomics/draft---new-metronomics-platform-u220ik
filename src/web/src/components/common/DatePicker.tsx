import React, { useState, useEffect, useRef, forwardRef } from 'react';
import styled from 'styled-components';
import { Calendar } from 'primereact/calendar'; // version ^10.0.0
import { InputText } from 'primereact/inputtext'; // version ^10.0.0
import { colors, neutral, primary, border, statusColors } from '../../styles/colors';
import { focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';
import { Size } from '../../types/common.types';
import { formatDate, parseDate, isValidDate } from '../../utils/helpers/dateTimeHelper';
import Button from './Button';

interface DatePickerProps {
  id?: string;
  name?: string;
  value: Date | null;
  placeholder?: string;
  dateFormat?: string;
  size?: Size;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  showTime?: boolean;
  showButtonBar?: boolean;
  inline?: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
  className?: string;
  style?: object;
  onChange?: (date: Date | null) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
}

const StyledCalendar = styled(Calendar)<{
  size?: Size;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}>`
  ${textStyles.body1}
  width: ${props => (props.fullWidth ? '100%' : 'auto')};
  
  .p-inputtext {
    width: ${props => (props.fullWidth ? '100%' : '220px')};
    ${props => props.size === Size.SMALL && `
      padding: 6px 12px;
      font-size: 0.875rem;
    `}
    ${props => props.size === Size.MEDIUM && `
      padding: 8px 16px;
      font-size: 1rem;
    `}
    ${props => props.size === Size.LARGE && `
      padding: 12px 24px;
      font-size: 1.125rem;
    `}
    background-color: ${props => props.disabled ? neutral[100] : colors.white};
    color: ${props => props.disabled ? neutral[400] : neutral[800]};
    border: 1px solid ${props => props.error ? statusColors.error : props.readOnly ? 'transparent' : border.default};
    border-radius: 4px;
    transition: ${transition('all', 'fast')};
    box-shadow: ${props => props.error ? `0 0 0 1px ${statusColors.error}` : 'none'};
    opacity: ${props => props.disabled ? 0.6 : 1};
    cursor: ${props => (props.disabled ? 'not-allowed' : props.readOnly ? 'default' : 'pointer')};

    &:hover:not(:disabled) {
      border-color: ${props => props.error ? statusColors.error : props.readOnly ? 'transparent' : primary[300]};
    }

    &:focus {
      ${focusOutline}
      border-color: ${props => props.error ? statusColors.error : primary[500]};
      box-shadow: ${props => props.error 
        ? `0 0 0 1px ${statusColors.error}` 
        : `0 0 0 2px ${primary[100]}`};
    }
  }

  .p-datepicker {
    padding: 0.5rem;
    background-color: ${colors.white};
    border: 1px solid ${border.default};
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    .p-datepicker-header {
      padding: 0.5rem;
      background-color: ${colors.white};
      border-bottom: 1px solid ${border.light};

      .p-datepicker-title {
        .p-datepicker-month,
        .p-datepicker-year {
          color: ${neutral[800]};
          font-weight: 500;
          margin: 0 0.25rem;
        }
      }

      .p-datepicker-prev,
      .p-datepicker-next {
        color: ${neutral[600]};
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        transition: ${transition('all', 'fast')};

        &:hover {
          background-color: ${neutral[100]};
          color: ${neutral[800]};
        }

        &:focus {
          ${focusOutline}
        }
      }
    }

    .p-datepicker-calendar {
      margin: 0.5rem 0;
      
      th {
        padding: 0.5rem;
        color: ${neutral[600]};
        font-weight: 500;
        font-size: 0.875rem;
      }

      td {
        padding: 0.1rem;

        .p-datepicker-today > span {
          background-color: ${primary[50]};
          border-color: ${primary[100]};
          color: ${primary[700]};
        }

        .p-highlight {
          background-color: ${primary[500]};
          color: ${colors.white};

          &:hover {
            background-color: ${primary[600]};
          }
        }

        > span {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          transition: ${transition('all', 'fast')};

          &:hover {
            background-color: ${neutral[100]};
          }

          &:focus {
            ${focusOutline}
          }
        }

        &.p-datepicker-other-month {
          > span {
            color: ${neutral[400]};
          }
        }
      }
    }
  }

  .p-timepicker {
    border-top: 1px solid ${border.light};
    padding: 0.5rem;

    span {
      font-size: 1rem;
    }

    button {
      color: ${neutral[600]};
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      transition: ${transition('all', 'fast')};

      &:hover {
        background-color: ${neutral[100]};
        color: ${neutral[800]};
      }

      &:focus {
        ${focusOutline}
      }
    }

    .p-separator {
      color: ${neutral[600]};
    }
  }
`;

const ButtonBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-top: 1px solid ${border.light};
`;

const ErrorMessage = styled.div`
  color: ${statusColors.error};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  id,
  name,
  value,
  placeholder = 'Select Date',
  dateFormat = 'MM/dd/yyyy',
  size = Size.MEDIUM,
  error = false,
  errorMessage,
  disabled = false,
  readOnly = false,
  fullWidth = true,
  showTime = false,
  showButtonBar = false,
  inline = false,
  minDate,
  maxDate,
  className,
  style,
  onChange,
  onBlur,
  onFocus,
  ...rest
}, ref) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  // Handle date selection
  const handleDateChange = (e: { value: Date | Date[] | null | undefined }) => {
    const newDate = Array.isArray(e.value) ? e.value[0] : e.value;
    setSelectedDate(newDate || null);
    
    if (onChange) {
      onChange(newDate || null);
    }
  };

  // Handle manual date input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!inputValue) {
      setSelectedDate(null);
      if (onChange) {
        onChange(null);
      }
      return;
    }
    
    const parsedDate = parseDate(inputValue, dateFormat);
    if (parsedDate && isValidDate(parsedDate)) {
      // Check if date is within min/max constraints
      const isAfterMinDate = !minDate || parsedDate >= minDate;
      const isBeforeMaxDate = !maxDate || parsedDate <= maxDate;
      
      if (isAfterMinDate && isBeforeMaxDate) {
        setSelectedDate(parsedDate);
        if (onChange) {
          onChange(parsedDate);
        }
      }
    }
  };

  // Handle blur event
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  // Handle focus event
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(e);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Escape key to close calendar
    if (e.key === 'Escape') {
      setShowCalendar(false);
      inputRef.current?.blur();
    }
  };

  // Custom button bar with Today and Clear buttons
  const renderButtonBar = () => {
    if (!showButtonBar) return null;
    
    return (
      <ButtonBarContainer>
        <Button 
          variant="tertiary" 
          size={Size.SMALL} 
          onClick={() => {
            const today = new Date();
            setSelectedDate(today);
            if (onChange) {
              onChange(today);
            }
          }}
          label="Today"
        />
        <Button 
          variant="tertiary" 
          size={Size.SMALL} 
          onClick={() => {
            setSelectedDate(null);
            if (onChange) {
              onChange(null);
            }
          }}
          label="Clear"
        />
      </ButtonBarContainer>
    );
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      <StyledCalendar
        id={id}
        name={name}
        value={selectedDate}
        placeholder={placeholder}
        dateFormat={dateFormat}
        showTime={showTime}
        hourFormat="12"
        showIcon
        inline={inline}
        panelClassName="calendar-panel"
        inputClassName={error ? 'p-invalid' : ''}
        size={size}
        error={error}
        disabled={disabled}
        readOnly={readOnly}
        fullWidth={fullWidth}
        className={className}
        style={style}
        onChange={handleDateChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onShow={() => setShowCalendar(true)}
        onHide={() => setShowCalendar(false)}
        minDate={minDate || undefined}
        maxDate={maxDate || undefined}
        inputRef={inputRef}
        ref={calendarContainerRef}
        panelStyle={{ zIndex: 1000 }}
        appendTo={document.body}
        showButtonBar={showButtonBar}
        footerTemplate={showButtonBar ? renderButtonBar : undefined}
        {...rest}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? `${id}-error` : undefined}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      />
      {error && errorMessage && (
        <ErrorMessage id={`${id}-error`}>
          {errorMessage}
        </ErrorMessage>
      )}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;