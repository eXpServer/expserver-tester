import { Request as Req, Response as Res, NextFunction as NextFn } from "express";


export type Request = Req & { user: string };
export type Response = Res;
export type NextFunction = NextFn;