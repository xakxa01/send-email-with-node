import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import morgan from 'morgan';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());

const transporter = nodemailer.createTransport({
	service: process.env.SERVICE_EMAIL,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

app.get('/', (req, res) => {
	res.status(200).json('Servidor funcionando correctamente');
});

app.post('/send-email', upload.single('file'), async (req, res) => {
	try {
		const { errorType, message, ruta } = req.body;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: process.env.RECIPIENT_EMAIL,
			subject: `Reporte de ${errorType}`,
			text: `Mensaje: ${message}${ruta ? `\nRuta: ${ruta}` : ''}`,
			attachments: req.file
				? [
					{
						filename: req.file.originalname,
						content: req.file.buffer,
					},
				]
				: [],
		};

		const info = await transporter.sendMail(mailOptions);

		res.status(200).json({ message: 'Reporte enviado correctamente', info });
	} catch (error) {
		console.error('Error al procesar el reporte:', error);
		res.status(500).json({ error: 'Ocurrió un error al enviar el reporte' });
	}
});

app.listen(port, () => {
	console.log(`Servidor Express en el puerto ${port}`);
});

