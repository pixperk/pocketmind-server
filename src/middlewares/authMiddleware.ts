import { MiddlewareHandler } from 'hono';
import { verifyToken } from '../util/token';



export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

  try {
    if (!authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Invalid token format' }, 401);
    }
    // Extract the token from the header
    const token = authHeader.split(' ')[1];
    if (!token) return c.json({ error: 'Unauthorized' }, 401);
    const decoded = await verifyToken(token, c);
    if(!decoded) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('jwtPayload', decoded);
   
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
