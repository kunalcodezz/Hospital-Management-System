import { Request, Response, NextFunction } from "express";

/**
 * Recursively sanitizes keys starting with '$' or containing '.' to prevent NoSQL/MongoDB Injection.
 */
function sanitizeObject(obj: any): any {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeObject(obj[i]);
    }
  } else if (obj !== null && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        obj[key] = sanitizeObject(obj[key]);
      }
    });
  }
  return obj;
}

export function noSqlSanitizer(req: Request, res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

/**
 * Custom security headers fallback/extension
 */
export function secureHeaders(req: Request, res: Response, next: NextFunction) {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
}
