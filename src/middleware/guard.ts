import Elysia, { t } from "elysia";
import { verifyTokenGoogle } from "../lib/verify-token-google";
import { Unauthorized } from "../lib/error-class";

export const auth = () =>
  new Elysia({ name: "auth" })
    .guard({
      headers: t.Object({
        authorization: t.TemplateLiteral("Bearer ${string}"),
      }),
    })
    .macro({
      isAuthenticated: {
        resolve: async ({ headers: { authorization } }) => {
          const [_, token] = authorization?.split(" ") ?? [];
          const payload = await verifyTokenGoogle(token);

          if (!payload) throw new Unauthorized("Unauthorized");

          const name = payload.name as string;
          const email = payload.email as string;
          const iss = payload.iss as string;

          return {
            user: {
              email,
              name,
              iss,
            },
          };
        },
      },
    });
// .as("global");
