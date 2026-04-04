import { NextFunction, Request, RequestHandler, Response } from "express";
import { AnyZodObject, ZodError, ZodTypeAny } from "zod";

type RequestSegment = "body" | "query" | "params";

const validate =
  <T extends AnyZodObject | ZodTypeAny>(
    schema: T,
    segment: RequestSegment,
  ): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[segment]);
      (req as Request & Record<RequestSegment, unknown>)[segment] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ errors: error.errors });
      }

      return res.status(500).json({ message: req.t("common.unexpected_error") });
    }
  };

export const validateBody = <T extends AnyZodObject | ZodTypeAny>(schema: T) =>
  validate(schema, "body");

export const validateQuery = <T extends AnyZodObject | ZodTypeAny>(schema: T) =>
  validate(schema, "query");

export const validateParams = <T extends AnyZodObject | ZodTypeAny>(schema: T) =>
  validate(schema, "params");
