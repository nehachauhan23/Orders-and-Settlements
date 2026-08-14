import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./auth.model";
import { SignupInput, LoginInput } from "./auth.schema";
import { ConflictError, UnauthenticatedError } from "../../utils/errors";

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

export function signToken(userId: string): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, getJwtSecret()) as { sub: string };
}

export async function signup(input: SignupInput) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError("EMAIL_IN_USE", "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  const token = signToken(user._id.toString());
  return { token, user: { id: user._id.toString(), email: user.email, name: user.name } };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!user) {
    throw new UnauthenticatedError("Invalid email or password.");
  }

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) {
    throw new UnauthenticatedError("Invalid email or password.");
  }

  const token = signToken(user._id.toString());
  return { token, user: { id: user._id.toString(), email: user.email, name: user.name } };
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthenticatedError("User no longer exists.");
  }
  return { id: user._id.toString(), email: user.email, name: user.name };
}
