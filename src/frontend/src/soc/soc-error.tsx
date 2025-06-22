interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div
      style={{
        padding: '20px',
        background: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        color: '#721c24',
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  );
}
