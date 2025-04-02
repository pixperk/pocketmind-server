import { Context } from "hono";
import { z } from "zod";
import { getPrisma } from "../util/db";

export async function createNote(c: Context) {
  const body = await c.req.json();
  const schema = z.object({
    title: z.string().min(3),
    content: z.string().min(3),
    tags: z.array(z.string()).optional(),
  });

  const result = schema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.format() }, 400);
  }

  const { title, content, tags } = result.data;
  const prisma = getPrisma(c.env.DATABASE_URL);

  const userId: string = c.get("jwtPayload")?.userId as string;

  console.log("userId:", userId);

  if (!userId) {
    return c.json({ error: "User not found" }, 404);
  }

  try {
    const note = await prisma.$transaction(async (tx) => {
      // Ensure all tags are created before proceeding
      if (tags && tags.length > 0) {
        await Promise.all(
          tags.map((tag) =>
            tx.tag.upsert({
              where: { name: tag },
              update: {},
              create: { name: tag, color: "default" },
            })
          )
        );
      }

      return tx.note.create({
        data: {
          title,
          content,
          userId,
          tags: {
            connect: tags?.map((tag) => ({ name: tag })),
          },
        },
      });
    });

    return c.json(note, 201);
  } catch (error) {
    console.error("Error creating note:", error);
    return c.json({ error: "Failed to create note" }, 500);
  }
}


export async function getUserNotes(c: Context) {
  const userId: string = c.get("jwtPayload")?.userId as string;

  if (!userId) {
    return c.json({ error: "User not found" }, 404);
  }

  const prisma = getPrisma(c.env.DATABASE_URL);

  //applying pagination using query parameters
  const page = parseInt(c.req.query("page") ?? "1");
  const limit = parseInt(c.req.query("limit") ?? "10");
  const skip = (page - 1) * limit;
  const totalNotes = await prisma.note.count({
    where: { userId },
  });
  const totalPages = Math.ceil(totalNotes / limit);
  const notes = await prisma.note.findMany({
    where: { userId },
    include: {
      tags: true,
    },
    skip,
    take: limit,
  });
  return c.json({
    notes,
    pagination: {
      totalNotes,
      totalPages,
      currentPage: page,
      limit,
    },
  });
}

export async function seedNotesInDB(c : Context){
  const prisma = getPrisma(c.env.DATABASE_URL);
  const userId: string = c.get("jwtPayload")?.userId as string;

  if (!userId) {
    return c.json({ error: "User not found" }, 404);
  }

  const notes = [
    {
      title: "Note 1",
      content: "This is the content of note 1",
      userId,
    },
    {
      title: "Note 2",
      content: "This is the content of note 2",
      userId,
    },
    {
      title: "Note 3",
      content: "This is the content of note 3",
      userId,
    },
  ];

  try {
    const createdNotes = await prisma.note.createMany({
      data: notes,
    });
    return c.json(createdNotes, 201);
  } catch (error) {
    console.error("Error seeding notes:", error);
    return c.json({ error: "Failed to seed notes" }, 500);
  }
}

export async function linkNoteFrom(c :Context){
  const body = await c.req.json();
  const schema = z.object({
    fromNoteId : z.string().uuid(),
  })

  //extract toNoteId from params
  const toNoteId = c.req.param("noteId");
  if (!toNoteId) {
    return c.json({ error: "Note ID is required" }, 400);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.format() }, 400);
  }

  const { fromNoteId } = result.data;
  const prisma = getPrisma(c.env.DATABASE_URL);
  
  const note = await prisma.note.update({
    where: {
      id : toNoteId,
    },
    data: {
       linkedNoteId : fromNoteId,
    }
  })

  return c.json(note, 200);
}

export async function deleteNote(c: Context) {
  const noteId = c.req.param("noteId");
  if (!noteId) {
    return c.json({ error: "Note ID is required" }, 400);
  }

  const prisma = getPrisma(c.env.DATABASE_URL);

  try {
    const deletedNote = await prisma.note.delete({
      where: { id: noteId },
    });
    return c.json(deletedNote, 200);
  } catch (error) {
    console.error("Error deleting note:", error);
    return c.json({ error: "Failed to delete note" }, 500);
  }
}