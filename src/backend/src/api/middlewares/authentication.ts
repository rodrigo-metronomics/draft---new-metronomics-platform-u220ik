import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import { authService } from '../../services/auth/authService'; // src/backend/src/services/auth/authService.ts
import { AuthenticationError } from '../../utils/errors'; // src/backend/src/utils/errors/index.ts
import { errorResponse } from '../../utils/helpers/responseHelper'; // src/backend/src/utils/helpers/responseHelper.ts
import { JWTPayload } from '../../types/auth.types'; // src/backend/src/types/auth.types.ts

/**
 * Express middleware that authenticates requests by verifying JWT tokens from the Authorization header
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction object
 * @returns Promise<void> Resolves when authentication is complete or rejects with an error
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract the Authorization header from the request
    const authHeader = req.headers.authorization;

    // 2. If no Authorization header is present, return 401 Unauthorized error
    if (!authHeader) {
      return errorResponse(res, 'Missing Authorization header', null, 401);
    }

    // 3. Parse the Bearer token from the Authorization header
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return errorResponse(res, 'Invalid token format', null, 401);
    }

    const token = tokenParts[1];

    // 4. If token format is invalid, return 401 Unauthorized error
    if (!token) {
      return errorResponse(res, 'Missing token', null, 401);
    }

    // 5. Call authService.verifyToken to validate the JWT and extract payload
    let decoded: JWTPayload;
    try {
      decoded = await authService.verifyToken(token);
    } catch (err: any) {
      // 6. If token verification fails, catch the error and return appropriate error response
      if (err instanceof AuthenticationError) {
        return errorResponse(res, err.message, err.details, err.statusCode);
      }
      return errorResponse(res, 'Failed to authenticate token', null, 401);
    }

    // 7. Attach the decoded user information to the request object as req.user
    req.user = decoded;

    // 8. Call next() to proceed to the next middleware or route handler
    next();
  } catch (error: any) {
    // Handle unexpected errors during authentication
    console.error('Authentication middleware error:', error);
    return errorResponse(res, 'Internal server error during authentication', null, 500);
  }
};