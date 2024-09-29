import { NextFunction, Request, Response } from "../types";

import { ErrorVals } from '../constants';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    switch (statusCode) {
        case ErrorVals.VALIDATION_ERROR:
            res.json({
                title: "Validation Error",
                message: err.message,
                stackTrace: err.stack
            })
            break;

        case ErrorVals.UNAUTHORIZED:
            res.json({
                title: "Unathorized",
                message: err.message,
                stackTrace: err.stack
            })
            break;

        case ErrorVals.FORBIDDEN:
            res.json({
                title: "Forbidden",
                message: err.message,
                stackTrace: err.stack
            })
            break;

        case ErrorVals.NOT_FOUND:
            res.json({
                title: "Not Found",
                message: err.message,
                stackTrace: err.stack
            })
            break;

        case ErrorVals.SERVER_ERROR:
            res.json({
                title: "Server Error",
                message: err.message,
                stackTrace: err.stack
            })
            break;

        default:
            break;
    }
};

export errorHandler;