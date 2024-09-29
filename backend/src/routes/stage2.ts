import { Router } from 'express';
import { getHandler, uploadHandler } from '../controllers/stage2';
import multer from 'multer';
const router = Router();

const upload = multer({ dest: 'uploads/' });

router.route('/')
    .get(getHandler)
    .post(upload.single('binary'), uploadHandler);

export default router;