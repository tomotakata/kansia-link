interface ErrorMessageProps {
  message?: string
  id?: string
}

export default function ErrorMessage({ message, id }: ErrorMessageProps) {
  if (!message) return null
  return (
    <p role="alert" id={id} className="form-error">
      {message}
    </p>
  )
}
