export function errorHandler(err, req, res, next) {
  console.error('Unhandled API Error:', err);

  const status = err.statusCode || 500;
  // Never leak internal error text to clients on server errors
  const message = status >= 500 ? 'Internal server error occurred.' : err.message;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default errorHandler;
