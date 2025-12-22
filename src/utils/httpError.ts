/**
 * Create an HTTP error with status code
 */
export const createHttpError = (statusCode: number, message: string): Error => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  return error;
};
