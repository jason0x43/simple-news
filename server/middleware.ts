import type { Middleware } from "oak";
import type { AppState } from "./types.ts";

export const requireUser: Middleware<AppState> = async (
  { response, state },
  next,
) => {
  if (state.userId === undefined) {
    response.type = "application/json";
    response.status = 403;
    response.body = { error: "Must be logged in" };
  } else {
    await next();
  }
};

export const requireLocal: Middleware<AppState> = async (
  { request, response },
  next,
) => {
  if (request.ip !== "127.0.0.1") {
    response.type = "application/json";
    response.status = 403;
    response.body = { error: "Must be running locally" };
  } else {
    await next();
  }
};

export const requireUserOrLocal: Middleware<AppState> = async (
  { request, response, state },
  next,
) => {
  if (state.userId === undefined && request.ip !== "127.0.0.1") {
    response.type = "application/json";
    response.status = 403;
    response.body = { error: "Must be logged in or running locally" };
  } else {
    await next();
  }
};
