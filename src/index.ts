import 'dotenv/config';
import app from './app';

const port = parseInt(process.env.PORT || "3000", 10);

app.listen(port, () => {
    console.log(`Server started at port ${port}.`);
});