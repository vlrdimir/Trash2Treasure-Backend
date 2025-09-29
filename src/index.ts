import { Elysia, t } from "elysia";
import main, { labels } from "./classification-model";
import cors from "@elysiajs/cors";
import { user } from "./db/schema/user";
import { db } from "./db/client";
import { and, eq, count } from "drizzle-orm";
import { auth } from "./middleware/guard";
import { errorPlugin, NotFoundError } from "./lib/error-class";
import { uploadImage } from "./lib/upload-image";
import {
  type ClassesLabel,
  historyPredict,
  type Probabilities,
} from "./db/schema/history-predict";
import { savedTutorial } from "./db/schema/saved-tutorial";

const app = new Elysia()
  .use(cors())
  .use(errorPlugin)

  .post(
    "/signup",
    async ({ body }) => {
      const findUser = await db
        .select()
        .from(user)
        .where(eq(user.email, body.email));

      if (findUser.length > 0) {
        return {
          status: false,
          message: "User already exists",
        };
      }

      const result = await db.insert(user).values(body);
      return {
        status: true,
        result: result,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        image: t.String(),
      }),
    }
  )
  .use(auth())
  .get(
    "/",
    ({ user }) => {
      return "Hello Elysia";
    },
    {
      isAuthenticated: true,
    }
  )
  .post(
    "/predict",
    async ({ body, user }) => {
      const imageBuffer = Buffer.from(await body.image.arrayBuffer());

      const imageUrl = await uploadImage(
        imageBuffer,
        body.image.name,
        body.image.type
      );

      const result = await main(imageBuffer);

      const probabilities = labels.reduce((acc, label, index) => {
        acc[label] = Number((result.probs?.[index]! * 100).toFixed(2));
        return acc;
      }, {} as Record<string, number>);

      const create = await db
        .insert(historyPredict)
        .values({
          email: user.email,
          imageUrl,
          label: result.label as ClassesLabel,
          percentage: probabilities[result.label]?.toString(),
          probabilities: probabilities as Probabilities,
        })
        .returning();

      return {
        status: true,
        result: {
          id: create[0]?.id,
          label: result.label,
          percentage: probabilities[result.label],
          probabilities,
          imageUrl,
        },
      };
    },
    {
      body: t.Object({
        image: t.File(),
      }),
      isAuthenticated: true,
    }
  )
  .get(
    "/history/:id",
    async ({ params, user }) => {
      const history = await db
        .select()
        .from(historyPredict)
        .where(
          and(
            eq(historyPredict.id, Number(params.id)),
            eq(historyPredict.email, user.email)
          )
        );

      if (history.length === 0) {
        throw new NotFoundError("History not found");
      }

      return {
        status: true,
        result: history[0],
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      isAuthenticated: true,
    }
  )
  .get(
    "/history",
    async ({ query, user }) => {
      const page = query.page;
      const limit = query.limit;

      const [totalItemsResult] = await db
        .select({ count: count() })
        .from(historyPredict)
        .where(eq(historyPredict.email, user.email));

      const totalItems = totalItemsResult?.count!;

      const histories = await db
        .select()
        .from(historyPredict)
        .where(eq(historyPredict.email, user.email))
        .limit(limit)
        .offset((page - 1) * limit);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        status: true,
        result: histories,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    },
    {
      query: t.Object({
        page: t.Numeric({ default: 1, minimum: 1 }),
        limit: t.Numeric({ default: 10, minimum: 1 }),
      }),
      isAuthenticated: true,
    }
  )
  .post(
    "/saved",
    async ({ body, user }) => {
      const { slugContent } = body;

      const [newSavedTutorial] = await db
        .insert(savedTutorial)
        .values({
          email: user.email,
          slugContent: slugContent,
        })
        .returning();

      return {
        status: true,
        result: newSavedTutorial,
      };
    },
    {
      body: t.Object({
        slugContent: t.String(),
      }),
      isAuthenticated: true,
    }
  )
  .get(
    "/list-saved",
    async ({ query, user }) => {
      const page = query.page;
      const limit = query.limit;

      const [totalItemsResult] = await db
        .select({ count: count() })
        .from(savedTutorial)
        .where(eq(savedTutorial.email, user.email));

      const totalItems = totalItemsResult?.count!;

      const savedTutorials = await db
        .select()
        .from(savedTutorial)
        .where(eq(savedTutorial.email, user.email))
        .limit(limit)
        .offset((page - 1) * limit);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        status: true,
        result: savedTutorials,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    },
    {
      query: t.Object({
        page: t.Numeric({ default: 1, minimum: 1 }),
        limit: t.Numeric({ default: 10, minimum: 1 }),
      }),
      isAuthenticated: true,
    }
  )
  .delete(
    "/remove-saved/:id",
    async ({ params, user }) => {
      const savedId = Number(params.id);

      const existing = await db
        .select()
        .from(savedTutorial)
        .where(
          and(
            eq(savedTutorial.id, savedId),
            eq(savedTutorial.email, user.email)
          )
        );

      if (existing.length === 0) {
        throw new NotFoundError("Saved tutorial not found");
      }

      await db
        .delete(savedTutorial)
        .where(
          and(
            eq(savedTutorial.id, savedId),
            eq(savedTutorial.email, user.email)
          )
        );

      return {
        status: true,
        message: "Saved tutorial removed successfully",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      isAuthenticated: true,
    }
  )
  .listen(process.env.PORT || 3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
