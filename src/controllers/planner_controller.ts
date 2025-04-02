import { Context } from "hono";
import { z } from "zod";
import { getPrisma } from "../util/db";

export async function createTask (c : Context){
    const body = await c.req.json();
    const schema = z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        dueDate: z.coerce.date().optional(),
        recurrencePattern: z.enum(['days', 'weeks', 'months', 'years']).optional(),
        recurrenceInterval: z.number().optional(),
        priority: z.enum(['low', 'normal', 'high']),
        tags: z.array(z.string()).optional(),
        noteIds : z.array(z.string()).optional(),
        status: z.enum(['pending', 'completed']),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

    //if recurrence is provided, calculate due date from there
    let calculatedDueDate = null;
    const { recurrencePattern, recurrenceInterval } = parsed.data;
    const currentDate = new Date();
    if (recurrencePattern && recurrenceInterval) {
        const dueDate = new Date(currentDate);
        switch (recurrencePattern) {
            case 'days':
                dueDate.setDate(currentDate.getDate() + recurrenceInterval);
                break;
            case 'weeks':
                dueDate.setDate(currentDate.getDate() + (recurrenceInterval * 7));
                break;
            case 'months':
                dueDate.setMonth(currentDate.getMonth() + recurrenceInterval);
                break;
            case 'years':
                dueDate.setFullYear(currentDate.getFullYear() + recurrenceInterval);
                break;
        }
        calculatedDueDate = dueDate;
    }
    //else if due date is provided, use it
    else if (parsed.data.dueDate) {
        calculatedDueDate = parsed.data.dueDate;
    }
    //else throw error
    else {
        return c.json({ error: "Either due date or recurrence pattern is required" }, 400);
    }

    //tx to upsert tags first and then the task
    const { title, description, priority, tags, noteIds, status } = parsed.data;
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId: string = c.get("jwtPayload")?.userId as string;

    if (!userId) {
        return c.json({ error: "User not found" }, 404);
    }
    try {
        const task = await prisma.$transaction(async (tx) => {
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

            return tx.task.create({
                data: {
                    title,
                    description,
                    dueDate : calculatedDueDate,
                    recurrencePattern,
                    recurrenceInterval,
                    priority,
                    status,
                    userId,
                    tags: {
                        connect: tags?.map((tag) => ({ name: tag })),
                    },
                    notes: {
                        connect: noteIds?.map((noteId: string) => ({ id: noteId })),
                    },
                },
            });
        });

        return c.json(task, 201);
    } catch (error) {
        console.error("Error creating task:", error);
        return c.json({ error: "Failed to create task" }, 500);
    }
}

export async function getUserTasks (c : Context){
    const userId: string = c.get("jwtPayload")?.userId as string;

    if (!userId) {
        return c.json({ error: "User not found" }, 404);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    //pagination
    const page = parseInt(c.req.query("page") ?? "1");
    const pageSize = parseInt(c.req.query("pageSize") ?? "10");
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    const totalTasks = await prisma.task.count({
        where: {
            userId,
        },
    });

    const tasks = await prisma.task.findMany({
        where: {
            userId,
        },
        skip: offset,
        take: limit,
        include: {
            tags: true,
            notes: true,
        },
    });
    const totalPages = Math.ceil(totalTasks / limit);
    return c.json({
        tasks,
        pagination: {
            totalTasks,
            totalPages,
            currentPage: page,
            pageSize: limit,
        },
    });
}

//update task
export async function updateTask (c : Context){
    const body = await c.req.json();
    const schema = z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        dueDate: z.coerce.date().optional(),
        recurrencePattern: z.enum(['days', 'weeks', 'months', 'years']).optional(),
        recurrenceInterval: z.number().optional(),
        priority: z.enum(['low', 'normal', 'high']),
        tags: z.array(z.string()).optional(),
        noteIds : z.array(z.string()).optional(),
        status: z.enum(['pending', 'completed']),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

    //if recurrence is provided, calculate due date from there
    let calculatedDueDate = null;
    const { recurrencePattern, recurrenceInterval } = parsed.data;
    const currentDate = new Date();
    if (recurrencePattern && recurrenceInterval) {
        const dueDate = new Date(currentDate);
        switch (recurrencePattern) {
            case 'days':
                dueDate.setDate(currentDate.getDate() + recurrenceInterval);
                break;
            case 'weeks':
                dueDate.setDate(currentDate.getDate() + (recurrenceInterval * 7));
                break;
            case 'months':
                dueDate.setMonth(currentDate.getMonth() + recurrenceInterval);
                break;
            case 'years':
                dueDate.setFullYear(currentDate.getFullYear() + recurrenceInterval);
                break;
        }
        calculatedDueDate = dueDate;
    }
    //else if due date is provided, use it
    else if (parsed.data.dueDate) {
        calculatedDueDate = parsed.data.dueDate;
    }
    //else throw error
    else {
        return c.json({ error: "Either due date or recurrence pattern is required" }, 400);
    }

    //tx to upsert tags first and then the task
    const { title, description, priority, tags, noteIds, status } = parsed.data;
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId: string = c.get("jwtPayload")?.userId as string;

    if (!userId) {
        return c.json({ error: "User not found" }, 404);
    }
    
    try {
        const task = await prisma.$transaction(async (tx) => {
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

            const taskId = c.req.param("taskId");
            if (!taskId) return c.json({ error: "Task ID is required" }, 400);

            return tx.task.update({
                where: {
                    id: taskId,
                },
                data: {
                    title,
                    description,
                    dueDate : calculatedDueDate,
                    recurrencePattern,
                    recurrenceInterval,
                    priority,
                    status,
                    userId,
                    tags: {
                        connect: tags?.map((tag) => ({ name: tag })),
                    },
                    notes: {
                        connect: noteIds?.map((noteId: string) => ({ id: noteId })),
                    },
                },
            });
        });

        return c.json(task, 201);
    } catch (error) {
        console.error("Error updating task:", error);
        return c.json({ error: "Failed to update task" }, 500);
    }
}

//delete task
export async function deleteTask (c : Context){
    const taskId = c.req.param("taskId");
    if (!taskId) return c.json({ error: "Task ID is required" }, 400);

    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId: string = c.get("jwtPayload")?.userId as string;

    if (!userId) {
        return c.json({ error: "User not found" }, 404);
    }

    try {
        const task = await prisma.task.delete({
            where: {
                id: taskId,
            },
        });

        return c.json(task, 200);
    } catch (error) {
        console.error("Error deleting task:", error);
        return c.json({ error: "Failed to delete task" }, 500);
    }
}