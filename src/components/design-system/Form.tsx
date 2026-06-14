import React, { useEffect } from 'react';

interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  autoFocusFirst?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Form({ onSubmit, autoFocusFirst, children, className = '' }: FormProps) {
  useEffect(() => {
    console.log('[MOUNT] Form');
    return () => console.log('[UNMOUNT] Form');
  }, []);
  console.log('[RENDER] Form');
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

export { Form };
export type { FormProps };
export default Form;