import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir);
	console.log(`Carpeta "uploads" creada.`);
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/');
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname));
	},
});

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

app.post('/send-email', upload.single('file'), async (req, res) => {
	try {
		const { errorType, message, ruta } = req.body;
		let attachment = null;

		if (req.file) {
			attachment = {
				filename: req.file.filename,
				path: path.join(__dirname, 'uploads', req.file.filename),
			};
		}

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: process.env.RECIPIENT_EMAIL,
			subject: `Reporte de ${errorType}`,
			text: `Mensaje: ${message}${ruta ? `\nRuta: ${ruta}` : ''}`,
			attachments: attachment ? [attachment] : [],
		};

		const info = await transporter.sendMail(mailOptions);

		if (req.file) {
			fs.unlinkSync(path.join(__dirname, 'uploads', req.file.filename));
		}

		res.status(200).json({ message: 'Reporte enviado correctamente', info });
	} catch (error) {
		console.error('Error al procesar el reporte:', error);
		res.status(500).json({ error: 'Ocurrió un error al enviar el reporte' });
	}
});

app.listen(port, () => {
	console.log(`Servidor Express en el puerto ${port}`);
});

