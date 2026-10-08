import 'dotenv/config';
import { app } from './app';
app.listen(process.env.PORT ?? 3000, () => console.log('AquaSave API en puerto', process.env.PORT ?? 3000));