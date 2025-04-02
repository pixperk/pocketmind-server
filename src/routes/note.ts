import { Hono } from "hono";
import { createNote, deleteNote, getUserNotes, linkNoteFrom, seedNotesInDB } from "../controllers/note_controller";
import { authMiddleware } from "../middlewares/authMiddleware";

export const note = new Hono();

note.post("/create", authMiddleware, createNote);
note.get("/", authMiddleware,  getUserNotes);
note.post("/seed", authMiddleware, seedNotesInDB);
note.patch("/link/:noteId", authMiddleware, linkNoteFrom);
note.delete("/:noteId", authMiddleware, deleteNote);