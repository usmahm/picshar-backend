exports.throwError = (message, statusCode, data) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (data) {
    error.data = data;
  }
  throw error;
};
