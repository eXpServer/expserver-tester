import { Request as Req, Response as Res, NextFunction as NextFn } from "express";
import { Socket as Soc } from "socket.io";


export type Request = Req & {
    user: string,
    file: {
        path: string,
    }
};
export type Response = Res;
export type NextFunction = NextFn;

export type Socket = Soc;