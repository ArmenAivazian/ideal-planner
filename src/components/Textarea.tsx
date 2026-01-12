import React from 'react';
import './Textarea.css';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <div className="textarea-wrapper">
      {label && <label className="textarea-label">{label}</label>}
      <textarea className={`textarea ${className}`} {...props} />
    </div>
  );
};
