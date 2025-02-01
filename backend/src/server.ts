import app from './app';
import routes from './routes';

const PORT = process.env.PORT || 5001;

app.use(routes);

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
  });
  