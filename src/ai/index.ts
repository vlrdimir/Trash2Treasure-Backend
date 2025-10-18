import Elysia, { NotFoundError, t } from "elysia";
import { conversations, messages } from "../db/schema/conversations";
import { db } from "../db/client";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "../middleware/guard";

export const AppForAI = new Elysia({
  prefix: "/v2",
})
  .use(auth())
  .get(
    "/list-conversation",
    async ({ query, user }) => {
      const page = query.page;
      const limit = query.limit;

      const [totalItemResult] = await db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.email, user.email));

      const totalItems = totalItemResult?.count!;

      const conversationsHistories = await db
        .select()
        .from(conversations)
        .where(eq(conversations.email, user.email))
        .limit(limit)
        .orderBy(desc(conversations.updatedAt))
        .offset((page - 1) * limit);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        status: true,
        result: conversationsHistories,
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
  .get(
    "/conversation/:id",
    async ({ params, user }) => {
      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, params.id),
          eq(conversations.email, user.email)
        ),
        with: {
          messages: {
            columns: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundError("Conversation not found");
      }

      const transformedResult = {
        ...conversation,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          parts: (message.content as any).parts,
        })),
      };

      return {
        status: true,
        result: transformedResult,
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
    "/create-conversation",
    async ({ query, user }) => {
      const { imageUrl, label } = query;

      if (!imageUrl || !label) {
        const res = await db
          .insert(conversations)
          .values({
            email: user.email,
            title: "New Conversation",
            initialLabel: "",
            initialImageUrl: "",
          })
          .returning();

        return {
          status: true,
          result: res[0]?.id,
        };
      }

      const res = await db
        .insert(conversations)
        .values({
          email: user.email,
          initialLabel: label,
          initialImageUrl: imageUrl,
        })
        .returning();

      return {
        status: true,
        result: res[0]?.id,
      };
    },
    {
      query: t.Object({
        imageUrl: t.Optional(t.String()),
        label: t.Optional(t.String()),
      }),
      isAuthenticated: true,
    }
  )
  .post(
    "/conversation",
    async ({ body }) => {
      const isExistConversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, body.args[0]?.conversation_id ?? ""),
      });

      console.log(body, "anjay");
      if (!isExistConversation) {
        console.log("not found");
        throw new NotFoundError("Conversation not found");
      }

      const tokenused = body.args.reduce(
        (acc, arg) => acc + arg.tokens_used,
        0
      );

      await db
        .update(conversations)
        .set({
          title: body.title,
          tokenUsage: tokenused + (isExistConversation.tokenUsage ?? 0),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, body.args[0]?.conversation_id ?? ""));

      const createMessage = await db
        .insert(messages)
        .values(
          body.args.map((arg) => ({
            conversationId: arg.conversation_id,
            role: arg.role as any,
            content: arg.content as any,
            tokens_used: arg.tokens_used as any,
          }))
        )

        .returning();

      return {
        status: true,
        result: createMessage,
      };
    },
    {
      body: t.Object({
        title: t.String(),
        args: t.Array(
          t.Object({
            conversation_id: t.String(),
            role: t.String(),
            content: t.Any(),
            tokens_used: t.Number(),
          })
        ),
      }),
    }
  );
