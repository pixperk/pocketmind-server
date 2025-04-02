import { Hono } from "hono";
import { createTask, deleteTask, getUserTasks, updateTask } from "../controllers/planner_controller";
import { authMiddleware } from "../middlewares/authMiddleware";

export const planner = new Hono();

planner.post("/create",authMiddleware, createTask);
planner.get("/", authMiddleware, getUserTasks);
planner.put("/:taskId", authMiddleware, updateTask); 
planner.delete("/:taskId", authMiddleware, deleteTask);

