import { Response } from "express";
import * as authService from "./auth.service";
import { signupSchema, loginSchema } from "./auth.schema";
import { AuthenticatedRequest } from "../../middleware/auth";

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  console.log("isProd: ", isProd);
  
  return {
    httpOnly: true,
    secure: isProd, // only sent over HTTPS in production
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
    // domain:'https://orders-and-settlements-3.onrender.com'
  };
}

function cookieName() {
  return process.env.COOKIE_NAME || "opt_token";
}

export async function signup(req: AuthenticatedRequest, res: Response) {
  const input = signupSchema.parse(req.body);
  const { token, user } = await authService.signup(input);
  
  res.cookie(cookieName(), token, cookieOptions());
  res.status(201).json({ user });
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const input = loginSchema.parse(req.body);
  const { token, user } = await authService.login(input);

   console.log("req from login ", req);
  
  console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("COOKIE OPTIONS:", cookieOptions());
  res.cookie(cookieName(), token, cookieOptions());
  res.status(200).json({ user });
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  res.clearCookie(cookieName(), { ...cookieOptions(), maxAge: undefined });
  res.status(204).send();
}

export async function me(req: AuthenticatedRequest, res: Response) {
   console.log("req from /me ", req);
  const user = await authService.getUserById(req.userId!);
  res.status(200).json({ user });
}
