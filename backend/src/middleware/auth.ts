import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../modules/auth/auth.service";
import { UnauthenticatedError } from "../utils/errors";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieName = process.env.COOKIE_NAME || "opt_token";

  
  const token = req.cookies?.[cookieName];
  console.log("Token : ", token);

  console.log("Cookies : ", req.cookies);
  console.log("req header :", req);
  

  if (!token) {
    return next(new UnauthenticatedError());
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(new UnauthenticatedError("Session expired or invalid. Please log in again."));
  }
}
