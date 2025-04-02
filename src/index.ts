import { Hono } from 'hono';
import { Env } from './config';

//routes
import { auth } from './routes/auth';
import { note } from './routes/note';
import { planner } from './routes/planner';

const app = new Hono<{ Bindings: Env }>();


//routes
app.route('/auth', auth)
app.route('/note', note)
app.route('/planner', planner)

app.get('/health',(c)=>{
  return c.json({status : 'ok'})
})




export default app
