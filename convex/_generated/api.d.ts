/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chat_ai from "../chat/ai.js";
import type * as chat_messages from "../chat/messages.js";
import type * as chat_sessions from "../chat/sessions.js";
import type * as chat_titles from "../chat/titles.js";
import type * as chat from "../chat.js";
import type * as http from "../http.js";
import type * as router from "../router.js";
import type * as settings from "../settings.js";
import type * as tools from "../tools.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "chat/ai": typeof chat_ai;
  "chat/messages": typeof chat_messages;
  "chat/sessions": typeof chat_sessions;
  "chat/titles": typeof chat_titles;
  chat: typeof chat;
  http: typeof http;
  router: typeof router;
  settings: typeof settings;
  tools: typeof tools;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
