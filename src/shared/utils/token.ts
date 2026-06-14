import { ITokenPayload } from "../../modules/authentication/auth.interface";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import { Response } from "express";

export function generateAccessToken(payload: ITokenPayload): string {
  return jwt.sign(
    payload,
    env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: env.JWT_EXPIRES_IN as string,
      issuer: "devdesk-api",
      audience: "devdesk-client",
    } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): ITokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "devdesk-api",
    audience: "devdesk-client",
  }) as ITokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto
    .createHmac("sha256", env.REFRESH_TOKEN_SECRET)
    .update(token)
    .digest("hex");
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string
): void {
  res.cookie(env.REFRESH_TOKEN_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: env.REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(env.REFRESH_TOKEN_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}
