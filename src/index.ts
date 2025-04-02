import { Hono } from 'hono'
import {auth} from './routes/auth'
import { Env } from './config';
import { note } from './routes/note';

const app = new Hono<{ Bindings: Env }>();
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

//routes
app.route('/auth', auth)
app.route('/note', note)

app.get('/health',(c)=>{
  return c.json({status : 'ok'})
})




export default app
